import "server-only";
import { provider, usd } from "./providers";
import { candidatesOf, db, now, save, TENANT, uid, audit, sha } from "./store";
import { latestRubric } from "./rubric";
import { computeMatch } from "./scoring";
import type { CriterionResult } from "./types";

async function mapLimit<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const k = i++;
        out[k] = await fn(items[k]);
      }
    }),
  );
  return out;
}

type G = typeof globalThis & { __cvleapCache?: Map<string, unknown> };
const cache = () => ((globalThis as G).__cvleapCache ??= new Map());

// "Ask the pool": a free-form request evaluated against every readable resume.
export async function askPool(query: string, actor: string) {
  const key = `q:${sha(query.trim().toLowerCase())}:${provider().name}`;
  if (cache().has(key)) return cache().get(key) as Awaited<ReturnType<typeof run>>;
  const run = async () => {
    const p = provider();
    const cands = candidatesOf().filter((c) => c.parseStatus === "ok");
    let input = 0,
      output = 0;
    const rows = await mapLimit(cands, 10, async (c) => {
      try {
        const r = await p.poolQuery(c.lines, query);
        input += r.usage.input;
        output += r.usage.output;
        const line = r.lineId ? c.lines.find((l) => l.id === r.lineId) : undefined;
        return { candidateId: c.id, name: c.name, headline: c.headline, probability: r.probability, evidence: line?.text ?? null, error: null as string | null };
      } catch (e) {
        return { candidateId: c.id, name: c.name, headline: c.headline, probability: 0, evidence: null, error: (e as Error).message };
      }
    });
    const u = { input, output };
    db().usage.push({ id: uid("use"), tenantId: TENANT, at: now(), purpose: "pool_query", provider: p.name, model: p.model, input, output, usd: usd(u) });
    audit(actor, "pool.query", query.slice(0, 80), `${cands.length} resumes`);
    save();
    return { query, provider: p.name, usd: usd(u), rows: rows.sort((a, b) => b.probability - a.probability) };
  };
  const res = await run();
  cache().set(key, res);
  return res;
}

// Reverse match: one resume against every open job that has an approved rubric.
export async function reverseMatch(candidateId: string, actor: string) {
  const d = db();
  const c = d.candidates.find((x) => x.id === candidateId && x.tenantId === TENANT && !x.deletedAt);
  if (!c) throw new Error("Candidate not found");
  if (c.parseStatus !== "ok") throw new Error("Resume has no parsed text");
  const p = provider();
  const jobs = d.jobs.filter((j) => j.status === "open").map((j) => ({ job: j, rubric: latestRubric(j.id) })).filter((x) => x.rubric?.status === "approved");
  let input = 0,
    output = 0;
  const rows = await mapLimit(jobs, 6, async ({ job, rubric }) => {
    const key = `rm:${c.id}:${c.version}:${rubric!.hash}:${p.name}`;
    let results = cache().get(key) as CriterionResult[] | undefined;
    if (!results) {
      const sem = rubric!.criteria.filter((x) => x.kind === "semantic");
      const r = await p.assess(c.lines, sem.map((x) => ({ id: x.id, question: x.question, evidenceRule: x.evidenceRule })));
      input += r.usage.input;
      output += r.usage.output;
      const byId = new Map(c.lines.map((l) => [l.id, l.text]));
      results = r.answers.map((a) => {
        const text = a.evidenceLineId ? byId.get(a.evidenceLineId) ?? null : null;
        return {
          criterionId: a.id,
          verdict: a.verdict,
          probabilities: a.probabilities,
          confidence: a.confidence,
          evidenceStatus: a.verdict === "INSUFFICIENT_EVIDENCE" ? "not_established" : text ? (a.verdict === "SUPPORTED" ? "supported" : "contradicted") : "needs_verification",
          evidenceLineId: text ? a.evidenceLineId : null,
          evidenceText: text,
          evidenceProbability: a.evidenceProbability,
        } as CriterionResult;
      });
      cache().set(key, results);
    }
    const sem = rubric!.criteria.filter((x) => x.kind === "semantic");
    return { jobId: job.id, title: job.title, team: job.team, match: computeMatch(sem, results), criteria: sem.length };
  });
  if (input + output) {
    d.usage.push({ id: uid("use"), tenantId: TENANT, at: now(), purpose: "reverse_match", provider: p.name, model: p.model, input, output, usd: usd({ input, output }) });
    audit(actor, "candidate.reverse_match", c.name, `${jobs.length} open jobs`);
    save();
  }
  return {
    jobsWithoutRubric: d.jobs.filter((j) => j.status === "open").length - jobs.length,
    rows: rows.sort((a, b) => b.match.lower - a.match.lower || b.match.upper - a.match.upper),
  };
}
