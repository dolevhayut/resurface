"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import type { Criterion, CriterionResult, Run } from "@/lib/types";
import type { Group, Match } from "@/lib/scoring";
import { EvidenceBadge, GroupBadge, Meter, RangeBar, money, pct, ago, tokens } from "./ui";
import { CandidateDrawer } from "./candidate-drawer";
import { CompareDialog } from "./compare-dialog";
import { AnimatePresence, motion } from "motion/react";
import { AnimatedNumber } from "./motion";
import { Icon } from "./icons";

export interface Row {
  candidate: { id: string; name: string; headline: string; location: string; updatedAt: string; language: string };
  results: CriterionResult[];
  match: Match;
  status: "pending" | "partial" | "done" | "failed" | "not_evaluated" | "pruned";
  error?: string;
}
interface Progress {
  eligible: number;
  notReadable: number;
  stage1: { total: number; completed: number; skipped: number; running: number; retrying: number; failed: number; queued: number; cancelled: number };
  stage2: Progress["stage1"];
}

const GROUPS: Group[] = ["strong", "verify", "lower", "not_evaluated"];

export function RunView(props: {
  runId: string;
  job: { id: string; title: string; team: string; location: string };
  rubric: { version: number; criteria: Criterion[] };
  initialShortlist: string[];
  can: { run: boolean; export: boolean; shortlist: boolean };
}) {
  const { criteria } = props.rubric;
  const [data, setData] = useState<{ run: Run; progress: Progress; rows: Row[] } | null>(null);
  const [weights, setWeights] = useState<Record<string, number>>(() => Object.fromEntries(criteria.map((c) => [c.id, c.weight])));
  const [showWeights, setShowWeights] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [shortlist, setShortlist] = useState<Set<string>>(new Set(props.initialShortlist));
  const [compare, setCompare] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [err, setErr] = useState("");
  const changed = criteria.some((c) => weights[c.id] !== c.weight);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    const url = `/api/runs/${props.runId}/results${changed ? `?weights=${encodeURIComponent(JSON.stringify(weights))}` : ""}`;
    const r = await fetch(url, { cache: "no-store" });
    if (r.ok) setData(await r.json());
  }, [props.runId, weights, changed]);

  useEffect(() => {
    let alive = true;
    const loop = async () => {
      await load();
      if (!alive) return;
      timer.current = setTimeout(loop, 1200);
    };
    loop();
    return () => {
      alive = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [load]);

  const control = async (action: string) => {
    setErr("");
    const r = await fetch(`/api/runs/${props.runId}/${action}`, { method: "POST" });
    if (!r.ok) setErr((await r.json()).error);
    load();
  };

  const toggleShortlist = async (candidateId: string) => {
    const remove = shortlist.has(candidateId);
    const r = await fetch("/api/shortlists", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobId: props.job.id, runId: props.runId, candidateId, remove }) });
    if (!r.ok) return setErr((await r.json()).error);
    setShortlist((s) => {
      const n = new Set(s);
      if (remove) n.delete(candidateId);
      else n.add(candidateId);
      return n;
    });
  };

  const rows = useMemo(() => (data?.rows ?? []).filter((r) => !q || `${r.candidate.name} ${r.candidate.headline}`.toLowerCase().includes(q.toLowerCase())), [data, q]);
  const run = data?.run;
  const p = data?.progress;
  const live = run?.status === "running" || run?.status === "paused";
  const processed = p ? p.stage1.completed : 0;
  const evalTotal = p ? p.stage1.total : 0;
  const counts = Object.fromEntries(GROUPS.map((g) => [g, (data?.rows ?? []).filter((r) => r.match.group === g).length])) as Record<Group, number>;
  const openRow = data?.rows.find((r) => r.candidate.id === open);

  return (
    <>
      <header className="border-b border-line px-4 pb-5 pt-6 md:px-8 md:pt-8">
        <div className="mb-1.5 text-[12px] text-muted">
          <Link href="/jobs" className="hover:text-fg">
            Jobs
          </Link>{" "}
          /{" "}
          <Link href={`/jobs/${props.job.id}`} className="hover:text-fg">
            {props.job.title}
          </Link>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-semibold tracking-[-0.02em]">{props.job.title}</h1>
            <p className="mt-1 text-[13px] text-muted" aria-live="polite">
              {!run ? (
                "Loading…"
              ) : run.status === "completed" ? (
                <>Evaluation complete · {processed} / {evalTotal} processed</>
              ) : (
                <>
                  <span className="font-medium text-warn">Partial results</span> · {processed} / {evalTotal} processed — ranking is provisional until the scan completes
                </>
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {props.can.run && run?.status === "running" && (
              <button className="btn-secondary" onClick={() => control("pause")}>
                <Icon name="pause" className="size-3.5" /> Pause
              </button>
            )}
            {props.can.run && (run?.status === "paused" || run?.status === "budget_stopped") && (
              <button className="btn-primary" onClick={() => control("resume")}>
                <Icon name="play" className="size-3.5" /> Resume evaluation
              </button>
            )}
            {props.can.run && live && (
              <button className="btn-ghost" onClick={() => control("cancel")}>
                <Icon name="stop" className="size-3.5" /> Cancel
              </button>
            )}
            {props.can.run && p && p.stage1.failed + p.stage2.failed > 0 && (
              <button className="btn-secondary" onClick={() => control("retry_failed")}>
                <Icon name="retry" className="size-3.5" /> Retry {p.stage1.failed + p.stage2.failed} failed
              </button>
            )}
            <button className={clsx("btn-secondary", showWeights && "bg-hover")} onClick={() => setShowWeights((v) => !v)}>
              <Icon name="sliders" className="size-3.5" /> Weights
            </button>
            {props.can.export && (
              <a className="btn-secondary" href={`/api/exports?runId=${props.runId}`}>
                <Icon name="download" className="size-3.5" /> Export CSV
              </a>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-4 py-6 pb-24 md:px-8 md:pb-10">
        {run && p && <ProgressPanel run={run} p={p} rubricVersion={props.rubric.version} />}
        {err && <p className="mt-3 text-[12.5px] text-bad">{err}</p>}

        {showWeights && (
          <section className="card mt-4 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[14px] font-semibold">Re-weight criteria</h2>
                <p className="text-[12px] text-muted">Reranks the stored judgments instantly — no re-evaluation, no extra cost. Changing a question requires a new rubric version.</p>
              </div>
              {changed && (
                <button className="btn-ghost" onClick={() => setWeights(Object.fromEntries(criteria.map((c) => [c.id, c.weight])))}>
                  Reset
                </button>
              )}
            </div>
            <div className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
              {criteria.map((c) => (
                <label key={c.id} className="block">
                  <div className="flex justify-between text-[12px]">
                    <span className="truncate pr-2">{c.label}</span>
                    <span className="tnum text-muted">{weights[c.id]}</span>
                  </div>
                  <input type="range" min={0} max={5} value={weights[c.id]} onChange={(e) => setWeights({ ...weights, [c.id]: Number(e.target.value) })} className="w-full accent-[var(--pine)]" />
                </label>
              ))}
            </div>
          </section>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5 text-[12px]">
            {GROUPS.map((g) => (
              <a key={g} href={`#g-${g}`} className="chip border border-line bg-surface text-muted hover:text-fg">
                <span className={clsx("size-1.5 rounded-full", g === "strong" ? "bg-ok" : g === "verify" ? "bg-warn" : g === "lower" ? "bg-faint" : "bg-bad")} />
                {g === "strong" ? "Strong evidence" : g === "verify" ? "Needs verification" : g === "lower" ? "Lower evidence" : "Not evaluated"} <AnimatedNumber value={counts[g]} className="text-fg" />
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {compare.length > 0 && (
              <button className="btn-secondary" onClick={() => setShowCompare(true)} disabled={compare.length < 2}>
                <Icon name="columns" className="size-3.5" /> Compare {compare.length}/3
              </button>
            )}
            <label className="relative">
              <Icon name="search" className="pointer-events-none absolute left-2.5 top-2.5 size-3.5 text-faint" />
              <input className="input h-8 w-56 pl-8" placeholder="Filter by name or title" value={q} onChange={(e) => setQ(e.target.value)} />
            </label>
          </div>
        </div>

        {GROUPS.map((g) => {
          const full = rows.filter((r) => r.match.group === g);
          if (!full.length) return null;
          const limit = g === "lower" && !expanded[g] && !q ? 8 : Infinity;
          const list = full.slice(0, limit);
          return (
            <section key={g} id={`g-${g}`} className="card mt-4 overflow-hidden">
              <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <GroupBadge group={g} />
                  <span className="tnum text-[12px] text-muted">{full.length}</span>
                </div>
                <span className="hidden text-[11.5px] text-faint sm:block">
                  {g === "strong" && "All must-haves supported with quoted evidence"}
                  {g === "verify" && "Promising, but key criteria are not established in the resume"}
                  {g === "lower" && "Evidence contradicts a must-have or most criteria are unsupported"}
                  {g === "not_evaluated" && "Unreadable file or failed task — not the same as a poor match"}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px]">
                  <thead className="border-b border-line bg-subtle/50">
                    <tr>
                      <th className="th w-8" />
                      <th className="th">Candidate</th>
                      <th className="th" title="Evidence score: weight of criteria supported by quoted evidence ÷ total weight">Score</th>
                      <th className="th">Coverage</th>
                      {criteria.map((c) => (
                        <th key={c.id} className="th w-9 px-1 text-center" title={`${c.label} (${c.requirement === "must" ? "must" : "nice"})`}>
                          <span className={clsx("inline-block max-w-[72px] truncate text-[10.5px] leading-3", c.requirement === "must" && "text-fg")}>{c.label.split(" ")[0]}</span>
                        </th>
                      ))}
                      <th className="th">Must-have gaps</th>
                      <th className="th">CV updated</th>
                      <th className="th w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((r) => {
                      const byId = new Map(r.results.map((x) => [x.criterionId, x]));
                      return (
                        <motion.tr layout="position" transition={{ type: "spring", stiffness: 400, damping: 40 }} key={r.candidate.id} className={clsx("cursor-pointer border-b border-line last:border-0 hover:bg-hover/50", open === r.candidate.id && "bg-pine-soft/60")} onClick={() => setOpen(r.candidate.id)}>
                          <td className="td pr-0" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              aria-label={`Compare ${r.candidate.name}`}
                              checked={compare.includes(r.candidate.id)}
                              disabled={!compare.includes(r.candidate.id) && compare.length >= 3}
                              onChange={(e) => setCompare((c) => (e.target.checked ? [...c, r.candidate.id] : c.filter((x) => x !== r.candidate.id)))}
                              className="accent-[var(--pine)]"
                            />
                          </td>
                          <td className="td max-w-[240px]">
                            <div className="truncate font-medium" dir="auto">
                              {r.candidate.name}
                            </div>
                            <div className="truncate text-[12px] text-faint" dir="auto">
                              {r.candidate.headline}
                            </div>
                          </td>
                          <td className="td">
                            {r.status === "pending" ? (
                              <span className="text-[12px] text-faint">Queued</span>
                            ) : r.status === "failed" || r.status === "not_evaluated" ? (
                              <span className="text-[12px] text-bad" title={r.error}>
                                {r.status === "failed" ? "Failed" : "Unreadable"}
                              </span>
                            ) : (
                              <div className="flex items-center gap-2.5">
                                <span className="w-7 text-[15px] font-semibold tracking-tight" title={`Known-criteria match ${pct(r.match.known)} · possible ${pct(r.match.lower)}–${pct(r.match.upper)}`}><AnimatedNumber value={Math.round(r.match.lower * 100)} /></span>
                                <RangeBar lower={r.match.lower} upper={r.match.upper} />
                              </div>
                            )}
                          </td>
                          <td className="td">
                            <span className="tnum text-[12px] text-muted">{Math.round(r.match.coverage * 100)}%</span>
                          </td>
                          {criteria.map((c) => {
                            const x = byId.get(c.id);
                            return (
                              <td key={c.id} className="px-1 text-center">
                                <EvidenceBadge status={x ? x.evidenceStatus : "pending"} compact />
                              </td>
                            );
                          })}
                          <td className="td max-w-[200px]">
                            <span className="line-clamp-1 text-[12px] text-muted">{r.match.mustContradicted.length ? <span className="text-bad">✕ {r.match.mustContradicted[0]}</span> : r.match.mustGaps.join(", ") || "—"}</span>
                          </td>
                          <td className="td text-[12px] text-faint">{ago(r.candidate.updatedAt)}</td>
                          <td className="td" onClick={(e) => e.stopPropagation()}>
                            {props.can.shortlist && (
                              <button className="btn-ghost size-8 justify-center px-0" aria-label={shortlist.has(r.candidate.id) ? "Remove from shortlist" : "Add to shortlist"} onClick={() => toggleShortlist(r.candidate.id)}>
                                {shortlist.has(r.candidate.id) ? <Icon name="bookmarkFilled" className="size-4 text-pine" /> : <Icon name="bookmark" className="size-4" />}
                              </button>
                            )}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {full.length > list.length && (
                <button onClick={() => setExpanded({ ...expanded, [g]: true })} className="w-full border-t border-line py-2.5 text-[12.5px] text-muted hover:bg-hover/50 hover:text-fg">
                  Show all {full.length}
                </button>
              )}
            </section>
          );
        })}
        <p className="mt-4 text-[11.5px] leading-5 text-faint">
          Score = share of rubric weight backed by a quoted resume line (the lower bound). Bar: solid = score, light = the upper bound if every criterion not established in the resume turned out true. Coverage = share of
          rubric weight with a definite answer; missing information is never treated as a failure. This is a fit-to-criteria measure, not a probability of hire. Evaluator confidence is shown only in candidate details.
        </p>
      </div>

      <AnimatePresence>
      {openRow && (
        <CandidateDrawer
          key={openRow.candidate.id}
          row={openRow}
          criteria={criteria}
          runId={props.runId}
          shortlisted={shortlist.has(openRow.candidate.id)}
          canShortlist={props.can.shortlist}
          onShortlist={() => toggleShortlist(openRow.candidate.id)}
          onClose={() => setOpen(null)}
        />
      )}
      </AnimatePresence>
      {showCompare && data && <CompareDialog rows={data.rows.filter((r) => compare.includes(r.candidate.id))} criteria={criteria} onClose={() => setShowCompare(false)} />}
    </>
  );
}

function ProgressPanel({ run, p, rubricVersion }: { run: Run; p: Progress; rubricVersion: number }) {
  const s1 = p.stage1;
  const s2 = p.stage2;
  const done1 = s1.completed / Math.max(1, s1.total);
  const statusTone = run.status === "completed" ? "text-ok" : run.status === "running" ? "text-pine" : run.status === "budget_stopped" || run.status === "cancelled" ? "text-bad" : "text-warn";
  return (
    <section className="card grid gap-4 p-4 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
      <div>
        <div className="flex items-center gap-2 text-[12px]">
          <span className={clsx("flex items-center gap-1.5 font-medium capitalize", statusTone)}>
            {run.status === "running" && <span className="size-1.5 animate-pulse rounded-full bg-pine" />}
            {run.status.replace("_", " ")}
          </span>
          <span className="text-faint">·</span>
          <span className="font-mono text-faint">{run.id}</span>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <Meter value={done1} className="flex-1" />
          <span className="tnum text-[12px] font-medium">{Math.round(done1 * 100)}%</span>
        </div>
        <div className="mt-1.5 text-[11.5px] text-faint">
          {s1.running > 0 && `${s1.running} in flight · `}
          {s1.retrying > 0 && <span className="text-warn">{s1.retrying} retrying · </span>}
          {s1.failed > 0 && <span className="text-bad">{s1.failed} failed · </span>}
          {s1.queued} queued{s2.total > 0 && ` · stage 2: ${s2.completed}/${s2.total}${s2.skipped ? ` (${s2.skipped} deprioritised)` : ""}`}
          {p.notReadable > 0 && ` · ${p.notReadable} unreadable`}
        </div>
        {run.status === "budget_stopped" && <div className="mt-2 text-[12px] text-bad">Stopped before new tasks: budget cap reached. Raise the cap in a new run or resume after review.</div>}
      </div>
      <Mini label="Snapshot" value={`${run.snapshot.length} resumes`} hint={`rubric v${rubricVersion} frozen · ${ago(run.createdAt)}`} />
      <Mini label="Evaluator" value={run.provider === "jev" ? "TypeSafe JEV" : "Offline heuristic"} hint={`${run.model} · ${run.calls} calls`} />
      <Mini label="Cost so far" value={money(run.spentUsd)} hint={`cap ${money(run.budgetUsd)} · ${tokens(run.inputTokens + run.outputTokens)} tokens`} />
    </section>
  );
}

function Mini({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="border-line md:border-l md:pl-4">
      <div className="text-[12px] text-muted">{label}</div>
      <div className="tnum mt-0.5 text-[14px] font-semibold">{value}</div>
      <div className="mt-0.5 truncate text-[11.5px] text-faint">{hint}</div>
    </div>
  );
}

export function CriterionEvidence({ c, r, onSource }: { c: Criterion; r?: CriterionResult; onSource?: (lineId: string) => void }) {
  return (
    <div className="py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[13px] font-medium">
            {c.label}
            <span className={clsx("chip h-[18px] px-1.5 text-[10.5px]", c.requirement === "must" ? "bg-fg text-bg" : "bg-subtle text-muted")}>{c.requirement}</span>
          </div>
          <div className="mt-0.5 text-[12px] text-faint">{c.question}</div>
        </div>
        <EvidenceBadge status={r ? r.evidenceStatus : "pending"} />
      </div>
      {r?.evidenceText && (
        <button
          onClick={() => r.evidenceLineId && onSource?.(r.evidenceLineId)}
          className="mt-2 flex w-full items-start gap-2 rounded-lg border-l-2 border-lemon bg-lemon-soft/60 px-3 py-2 text-left text-[12.5px] leading-5 hover:bg-lemon-soft"
          dir="auto"
        >
          <Icon name="quote" className="mt-0.5 size-3 shrink-0 text-lemon-text" />
          <span className="min-w-0 flex-1">{r.evidenceText}</span>
          <span className="shrink-0 font-mono text-[10.5px] text-faint">{r.evidenceLineId}</span>
        </button>
      )}
      {r?.computed && (
        <div className="mt-1.5 flex items-center gap-1.5 text-[12px] text-muted">
          <Icon name="calculator" className="size-3" /> {r.computed}
        </div>
      )}
      {r && r.evidenceStatus === "not_established" && <div className="mt-1.5 text-[12px] text-muted">Not established in this resume — ask in screening.</div>}
      {r && r.evidenceStatus === "needs_verification" && <div className="mt-1.5 text-[12px] text-warn">The evaluator leaned {r.verdict.toLowerCase()} but no source line could be validated.</div>}
      {r && Object.keys(r.probabilities).length > 0 && (
        <details className="mt-1.5 text-[11.5px] text-faint">
          <summary className="cursor-pointer select-none">Evaluator details</summary>
          <div className="mt-1 font-mono">
            {Object.entries(r.probabilities)
              .map(([k, v]) => `${k} ${(v * 100).toFixed(0)}%`)
              .join(" · ")}{" "}
            · confidence {(r.confidence * 100).toFixed(0)}%{r.evidenceProbability !== null && ` · source line p=${(r.evidenceProbability * 100).toFixed(0)}%`}
          </div>
        </details>
      )}
    </div>
  );
}

