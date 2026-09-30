import "server-only";
import type { Candidate, Criterion, CriterionResult, Evaluation, Run, RubricVersion, Task } from "./types";
import { provider, ProviderError, usd, USD_PER_TOKEN } from "./providers";
import { audit, db, now, save, sha, TENANT, uid } from "./store";
import { mergedYears, periodsFrom } from "./dates";
import { computeMatch, sortMatches, type Match } from "./scoring";

// Durable-ish orchestration (PRD §9) at MVP scale: tasks are (candidate × stage) with
// explicit states, leases, idempotency keys, bounded retries with backoff + jitter,
// per-task checkpoints, pause/resume/cancel and a budget cap checked before dispatch.

// Global in-flight cap shared fairly (round-robin) across concurrent runs / tenants.
const CONCURRENCY = Number(process.env.EVAL_CONCURRENCY || 16);
const LEASE_MS = 60_000;
const MAX_ATTEMPTS = 3;
const TICK_MS = 200;

type G = typeof globalThis & { __cvleapWorker?: NodeJS.Timeout; __cvleapInflight?: Map<string, number>; __cvleapTick?: () => void };
const g = globalThis as G;
const inflight = () => (g.__cvleapInflight ??= new Map<string, number>()); // taskId → estimated usd
const lastDispatch = new Map<string, number>(); // runId → ms, for paced demo runs

// ---------- helpers ----------

export function experienceLines(c: Candidate) {
  const out: typeof c.lines = [];
  let inExp = false;
  for (const l of c.lines) {
    const t = l.text.trim();
    const header = /^[A-Z][A-Z &/]{3,}$/.test(t) || /^[^\s].{0,30}:$/.test(t) || /^(ניסיון|השכלה|כישורים)/.test(t);
    if (header) inExp = /experience|employment|work history|ניסיון/i.test(t);
    else if (inExp) out.push(l);
  }
  return out;
}

function yearsResult(c: Candidate, crit: Criterion): CriterionResult {
  const periods = periodsFrom(experienceLines(c));
  const base = { criterionId: crit.id, probabilities: {}, confidence: 1, evidenceProbability: null };
  if (!periods.length)
    return { ...base, verdict: "INSUFFICIENT_EVIDENCE", evidenceStatus: "not_established", evidenceLineId: null, evidenceText: null, computed: "No dated roles found in the experience section." };
  const years = mergedYears(periods);
  const first = periods.sort((a, b) => a.start - b.start)[0];
  const line = c.lines.find((l) => l.id === first.lineId)!;
  const ok = years >= (crit.minYears ?? 0);
  return {
    ...base,
    verdict: ok ? "SUPPORTED" : "CONTRADICTED",
    evidenceStatus: ok ? "supported" : "contradicted",
    evidenceLineId: line.id,
    evidenceText: line.text,
    computed: `${years} years across ${periods.length} dated role${periods.length > 1 ? "s" : ""} (overlaps merged); requirement ${crit.minYears}+.`,
  };
}

// Calibrated on real JEV usage: each criterion costs a verdict + an evidence Choice over line ids.
export const estimateTokens = (chars: number, lines: number, n: number) => chars / 3.5 + 250 + n * (600 + lines * 12);
const estimateUsd = (c: Candidate, n: number) =>
  estimateTokens(c.lines.reduce((s, l) => s + l.text.length + 6, 0), c.lines.length, n) * USD_PER_TOKEN;

const keyFor = (run: Run, c: { candidateId: string; version: number }, stage: number) =>
  sha([run.tenantId, run.id, c.candidateId, c.version, run.rubricHash, stage, run.provider, run.model].join("|"));

function rubricOf(run: Run) {
  return db().rubrics.find((r) => r.id === run.rubricId)!;
}

// ---------- run lifecycle ----------

export function createRun(opts: {
  jobId: string;
  rubricId: string;
  budgetUsd: number;
  pruneContradicted: boolean;
  actor: string;
  candidateIds?: string[];
  paceMs?: number;
}): Run {
  const d = db();
  const rubric = d.rubrics.find((r) => r.id === opts.rubricId && r.tenantId === TENANT);
  if (!rubric || rubric.status !== "approved") throw new Error("Only an approved rubric version can run.");
  if (!(opts.budgetUsd > 0)) throw new Error("A budget cap is required.");
  const scope = d.candidates
    .filter((c) => c.tenantId === TENANT && !c.deletedAt && (!opts.candidateIds || opts.candidateIds.includes(c.id)))
    .sort((a, b) => a.id.localeCompare(b.id));
  const p = provider();
  const run: Run = {
    id: uid("run"),
    tenantId: TENANT,
    jobId: opts.jobId,
    rubricId: rubric.id,
    rubricHash: rubric.hash,
    snapshot: scope.map((c) => ({ candidateId: c.id, version: c.version })),
    provider: p.name,
    model: p.model,
    status: "running",
    budgetUsd: opts.budgetUsd,
    spentUsd: 0,
    inputTokens: 0,
    outputTokens: 0,
    calls: 0,
    pruneContradicted: opts.pruneContradicted,
    auditSampleRate: 0.1,
    paceMs: opts.paceMs,
    createdAt: now(),
    createdBy: opts.actor,
  };
  d.runs.push(run);
  for (const s of run.snapshot) {
    const c = scope.find((x) => x.id === s.candidateId)!;
    if (c.parseStatus !== "ok") continue; // unreadable ≠ unsuitable: shown as "Not evaluated"
    d.tasks.push(newTask(run, s, 1));
  }
  const job = d.jobs.find((j) => j.id === run.jobId);
  audit(opts.actor, "run.started", job?.title ?? run.jobId, `${run.snapshot.length} candidates · rubric v${rubric.version} · cap $${opts.budgetUsd}`);
  save();
  ensureWorker();
  return run;
}

function newTask(run: Run, s: { candidateId: string; version: number }, stage: 1 | 2): Task {
  return {
    id: uid("tsk"),
    runId: run.id,
    candidateId: s.candidateId,
    candidateVersion: s.version,
    stage,
    state: "queued",
    attempts: 0,
    idempotencyKey: keyFor(run, s, stage),
  };
}

export function controlRun(runId: string, action: "pause" | "resume" | "cancel" | "retry_failed", actor: string) {
  const d = db();
  const run = d.runs.find((r) => r.id === runId && r.tenantId === TENANT);
  if (!run) throw new Error("Run not found");
  const tasks = d.tasks.filter((t) => t.runId === runId);
  if (action === "pause" && run.status === "running") run.status = "paused";
  if (action === "resume" && (run.status === "paused" || run.status === "budget_stopped")) run.status = "running";
  if (action === "cancel" && run.status !== "completed") {
    run.status = "cancelled";
    run.finishedAt = now();
    tasks.forEach((t) => ["queued", "retry_wait"].includes(t.state) && (t.state = "cancelled"));
  }
  if (action === "retry_failed") {
    tasks.filter((t) => t.state === "failed").forEach((t) => Object.assign(t, { state: "queued", attempts: 0, error: undefined }));
    if (run.status !== "cancelled") {
      run.status = "running";
      run.finishedAt = undefined;
    }
  }
  audit(actor, `run.${action}`, runId);
  save();
  ensureWorker();
  return run;
}

// ---------- worker ----------

export function ensureWorker() {
  if (g.__cvleapWorker) return;
  // Recover leases from a crashed/restarted process: in-flight work is re-queued; the
  // idempotency key prevents a duplicate evaluation if the provider call had completed.
  const t = Date.now();
  for (const task of db().tasks)
    if ((task.state === "leased" || task.state === "running") && !inflight().has(task.id) && (task.leaseUntil ?? 0) < t + LEASE_MS)
      task.state = "queued";
  // Indirect call so a hot-reloaded module swaps in its new tick without restarting the timer.
  g.__cvleapWorker = setInterval(() => g.__cvleapTick?.(), TICK_MS);
}

function tick() {
  const d = db();
  const t = Date.now();
  const active: { run: Run; ready: Task[] }[] = [];
  for (const run of d.runs) {
    if (run.status !== "running") continue;
    const tasks = d.tasks.filter((x) => x.runId === run.id);
    tasks.forEach((x) => {
      if ((x.state === "leased" || x.state === "running") && (x.leaseUntil ?? 0) < t && !inflight().has(x.id)) x.state = "queued";
    });
    if (!tasks.some((x) => ["queued", "retry_wait", "leased", "running"].includes(x.state))) {
      run.status = "completed";
      run.finishedAt = now();
      audit("system", "run.completed", run.id, `$${run.spentUsd.toFixed(6)} · ${run.calls} calls`);
      save();
      continue;
    }
    active.push({ run, ready: tasks.filter((x) => x.state === "queued" || (x.state === "retry_wait" && (x.notBefore ?? 0) <= t)) });
  }
  let slots = CONCURRENCY - inflight().size;
  // Round-robin: one task per run per pass so a big run cannot starve the others.
  while (slots > 0 && active.some((a) => a.ready.length)) {
    for (const a of active) {
      if (slots <= 0) break;
      if (a.run.paceMs) {
        const busy = [...inflight().keys()].some((id) => d.tasks.find((x) => x.id === id)?.runId === a.run.id);
        if (busy || t - (lastDispatch.get(a.run.id) ?? 0) < a.run.paceMs) {
          a.ready = [];
          continue;
        }
        lastDispatch.set(a.run.id, t);
      }
      const task = a.ready.shift();
      if (!task || a.run.status !== "running") continue;
      const cand = d.candidates.find((c) => c.id === task.candidateId);
      const crit = rubricOf(a.run).criteria.filter((c) => c.stage === task.stage);
      const est = cand ? estimateUsd(cand, crit.length) : 0;
      const committed = [...inflight().entries()].filter(([id]) => d.tasks.find((x) => x.id === id)?.runId === a.run.id).reduce((s, [, v]) => s + v, 0);
      if (a.run.spentUsd + committed + est > a.run.budgetUsd) {
        a.run.status = "budget_stopped";
        a.ready = [];
        audit("system", "run.budget_stopped", a.run.id, `spent $${a.run.spentUsd.toFixed(6)} of $${a.run.budgetUsd}`);
        save();
        continue;
      }
      task.state = "leased";
      task.leaseUntil = t + LEASE_MS;
      inflight().set(task.id, est);
      slots--;
      void execute(a.run, task).finally(() => inflight().delete(task.id));
    }
  }
}

async function execute(run: Run, task: Task) {
  const d = db();
  task.state = "running";
  task.attempts++;
  const cand = d.candidates.find((c) => c.id === task.candidateId);
  try {
    if (!cand || cand.deletedAt) throw new ProviderError("Candidate deleted before evaluation", false);
    if (cand.version !== task.candidateVersion) throw new ProviderError("Resume changed after the run snapshot", false);
    if (!cand.lines.length || cand.parseStatus !== "ok") throw new ProviderError("No parsed text — not sent for evaluation", false);
    const rubric = rubricOf(run);
    const crit = rubric.criteria.filter((c) => c.stage === task.stage);
    const semantic = crit.filter((c) => c.kind === "semantic");
    let results: CriterionResult[] = [];
    let usage = { input: 0, output: 0 };
    let model = run.model;
    if (semantic.length) {
      const p = provider();
      const r = await p.assess(
        cand.lines,
        semantic.map((c) => ({ id: c.id, question: c.question, evidenceRule: c.evidenceRule })),
      );
      usage = r.usage;
      model = r.model;
      const lineById = new Map(cand.lines.map((l) => [l.id, l.text]));
      results = r.answers.map((a) => {
        // Exact-source validation: evidence is only ever a verbatim copy of an existing line.
        const text = a.evidenceLineId ? lineById.get(a.evidenceLineId) ?? null : null;
        const status =
          a.verdict === "INSUFFICIENT_EVIDENCE"
            ? "not_established"
            : text
              ? a.verdict === "SUPPORTED"
                ? "supported"
                : "contradicted"
              : "needs_verification";
        return {
          criterionId: a.id,
          verdict: a.verdict,
          probabilities: a.probabilities,
          confidence: a.confidence,
          evidenceStatus: status,
          evidenceLineId: text ? a.evidenceLineId : null,
          evidenceText: text,
          evidenceProbability: a.evidenceProbability,
        } satisfies CriterionResult;
      });
    }
    for (const c of crit.filter((c) => c.kind === "computed_years")) results.push(yearsResult(cand, c));

    // Tombstone check before commit: never write results for a deleted source.
    const fresh = d.candidates.find((c) => c.id === task.candidateId);
    if (!fresh || fresh.deletedAt) throw new ProviderError("Candidate deleted during evaluation", false);

    const cost = usd(usage);
    run.spentUsd += cost;
    run.inputTokens += usage.input;
    run.outputTokens += usage.output;
    if (semantic.length) run.calls++;
    d.usage.push({ id: uid("use"), tenantId: run.tenantId, at: now(), runId: run.id, purpose: "evaluation", provider: run.provider, model, input: usage.input, output: usage.output, usd: cost });

    if (!d.evaluations.some((e) => e.idempotencyKey === task.idempotencyKey)) {
      const ev: Evaluation = {
        id: uid("evl"),
        tenantId: run.tenantId,
        runId: run.id,
        candidateId: cand.id,
        candidateVersion: cand.version,
        stage: task.stage,
        idempotencyKey: task.idempotencyKey,
        provider: run.provider,
        model,
        results,
        usage,
        createdAt: now(),
      };
      d.evaluations.push(ev);
    }
    task.state = "completed";
    task.error = undefined;
    if (task.stage === 1) scheduleStage2(run, task, results);
  } catch (e) {
    const err = e instanceof ProviderError ? e : new ProviderError((e as Error).message, true);
    task.error = err.message;
    if (err.retryable && task.attempts < MAX_ATTEMPTS) {
      const backoff = Math.min(30_000, 1000 * 2 ** (task.attempts - 1));
      task.state = "retry_wait";
      task.notBefore = Date.now() + Math.max(err.retryAfterMs ?? 0, backoff * (0.75 + Math.random() * 0.5));
    } else task.state = "failed";
  }
  save();
}

function scheduleStage2(run: Run, task: Task, stage1: CriterionResult[]) {
  const d = db();
  const rubric = rubricOf(run);
  if (!rubric.criteria.some((c) => c.stage === 2)) return;
  const key = keyFor(run, { candidateId: task.candidateId, version: task.candidateVersion }, 2);
  if (d.tasks.some((t) => t.idempotencyKey === key)) return;
  const t2 = newTask(run, { candidateId: task.candidateId, version: task.candidateVersion }, 2);
  // SUPPORTED and INSUFFICIENT advance. A must-have CONTRADICTED with verified evidence may be
  // deprioritised only if the recruiter enabled that rule — and an audit sample still runs.
  const contradictedMust = stage1.some(
    (r) => r.evidenceStatus === "contradicted" && rubric.criteria.find((c) => c.id === r.criterionId)?.requirement === "must",
  );
  if (run.pruneContradicted && contradictedMust) {
    const inSample = parseInt(sha(run.id + task.candidateId).slice(0, 4), 16) / 0xffff < run.auditSampleRate;
    if (!inSample) {
      t2.state = "completed";
      t2.skipped = "Deprioritised: verified contradiction on a must-have";
    } else t2.skipped = undefined;
  }
  d.tasks.push(t2);
}

// ---------- read models ----------

export type CandidateStatus = "pending" | "partial" | "done" | "failed" | "not_evaluated" | "pruned";

export interface ResultRow {
  candidate: Candidate;
  results: CriterionResult[];
  match: Match;
  status: CandidateStatus;
  error?: string;
}

export function runProgress(run: Run) {
  const tasks = db().tasks.filter((t) => t.runId === run.id);
  const by = (s: number) => tasks.filter((t) => t.stage === s);
  const count = (arr: Task[], st: Task["state"][]) => arr.filter((t) => st.includes(t.state)).length;
  const stage = (s: 1 | 2) => ({
    total: by(s).length,
    completed: count(by(s), ["completed"]),
    skipped: by(s).filter((t) => t.skipped).length,
    running: count(by(s), ["leased", "running"]),
    retrying: count(by(s), ["retry_wait"]),
    failed: count(by(s), ["failed"]),
    queued: count(by(s), ["queued"]),
    cancelled: count(by(s), ["cancelled"]),
  });
  const eligible = run.snapshot.length;
  const notReadable = eligible - by(1).length;
  return { eligible, notReadable, stage1: stage(1), stage2: stage(2) };
}

export function runResults(run: Run, weights?: Record<string, number>): ResultRow[] {
  const d = db();
  const rubric: RubricVersion = rubricOf(run);
  const evals = d.evaluations.filter((e) => e.runId === run.id);
  const tasks = d.tasks.filter((t) => t.runId === run.id);
  const rows: ResultRow[] = [];
  for (const s of run.snapshot) {
    const cand = d.candidates.find((c) => c.id === s.candidateId);
    if (!cand || cand.deletedAt) continue; // deleted source → derived results hidden
    const mine = evals.filter((e) => e.candidateId === cand.id);
    const results = mine.flatMap((e) => e.results);
    const tk = tasks.filter((t) => t.candidateId === cand.id);
    let status: CandidateStatus;
    if (cand.parseStatus !== "ok") status = "not_evaluated";
    else if (tk.some((t) => t.state === "failed")) status = "failed";
    else if (tk.some((t) => t.skipped)) status = "pruned";
    else if (!mine.length) status = "pending";
    else if (tk.every((t) => t.state === "completed") && !rubric.criteria.some((c) => c.stage === 2 && !results.find((r) => r.criterionId === c.id)))
      status = "done";
    else status = "partial";
    const match = computeMatch(rubric.criteria, results, weights);
    if (status === "failed" || status === "not_evaluated") match.group = "not_evaluated";
    rows.push({ candidate: cand, results, match, status, error: tk.find((t) => t.error)?.error ?? cand.parseError });
  }
  return sortMatches(rows);
}

g.__cvleapTick = tick;
