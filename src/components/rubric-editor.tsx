"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import type { Criterion, RubricVersion, ResumeLine } from "@/lib/types";
import { money } from "./ui";
import { Icon } from "./icons";

async function api(url: string, method: string, body?: unknown) {
  const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || "Request failed");
  return j;
}

export function RubricEditor(props: {
  job: { id: string; title: string };
  jdLines: ResumeLine[];
  rubric: RubricVersion | null;
  canEdit: boolean;
  canRun: boolean;
  provider: string;
  pool: { total: number; readable: number; avgChars: number; avgLines: number; usdPerToken: number };
}) {
  const router = useRouter();
  const { rubric } = props;
  const [criteria, setCriteria] = useState<Criterion[]>(rubric?.criteria ?? []);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [add, setAdd] = useState({ text: "", requirement: "must" as "must" | "nice" });
  const [confirmFlagged, setConfirmFlagged] = useState(false);
  const [budget, setBudget] = useState(1);
  const [prune, setPrune] = useState(true);
  const [hover, setHover] = useState<string | null>(null);
  const locked = rubric?.status === "approved";
  const editable = props.canEdit && !locked;

  const run = async (label: string, fn: () => Promise<void>) => {
    setBusy(label);
    setErr("");
    try {
      await fn();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const update = (id: string, patch: Partial<Criterion>) => {
    setCriteria((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    setDirty(true);
  };

  const est = useMemo(() => {
    const s1 = criteria.filter((c) => c.stage === 1 && c.kind === "semantic").length;
    const s2 = criteria.filter((c) => c.stage === 2 && c.kind === "semantic").length;
    const perCall = (n: number) => (props.pool.avgChars / 3.5 + 250 + n * (600 + props.pool.avgLines * 12)) * props.pool.usdPerToken;
    const n = props.pool.readable;
    const calls1 = s1 ? n : 0;
    const calls2 = s2 ? n : 0; // upper bound: every candidate advances
    return { calls: calls1 + calls2, usd: calls1 * perCall(s1) + calls2 * perCall(s2), s1, s2 };
  }, [criteria, props.pool]);

  const sources = new Set(criteria.map((c) => c.sourceJobSpan).filter(Boolean));
  const flagged = criteria.filter((c) => c.flagged);

  if (!rubric)
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="card grid place-items-center px-6 py-16 text-center">
          <Icon name="sparkle" className="size-5 text-pine" />
          <h2 className="mt-3 text-[15px] font-semibold">Draft criteria from this job description</h2>
          <p className="mt-1 max-w-md text-muted">
            {props.provider === "jev" ? "JEV" : "The offline drafter"} reads each line and marks it as a must-have, a nice-to-have, or not a requirement. You review everything before anything runs.
          </p>
          {err && <p className="mt-3 text-[12.5px] text-bad">{err}</p>}
          <button
            className="btn-primary mt-5"
            disabled={!props.canEdit || !!busy}
            onClick={() =>
              run("draft", async () => {
                await api(`/api/jobs/${props.job.id}/rubric-drafts`, "POST");
                router.refresh();
              })
            }
          >
            <Icon name="sparkle" className="size-3.5" /> {busy ? "Drafting…" : "Draft criteria"}
          </button>
          {!props.canEdit && <p className="mt-2 text-[12px] text-faint">Your role can view jobs but not edit criteria.</p>}
        </div>
        <JobDescription lines={props.jdLines} sources={sources} hover={hover} />
      </div>
    );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="min-w-0 space-y-4">
        <section className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
            <div className="flex items-center gap-2">
              <h2 className="text-[14px] font-semibold">Criteria</h2>
              <span className={clsx("chip", locked ? "bg-pine-soft text-pine" : "bg-warn-bg text-warn")}>
                {locked ? <Icon name="lock" className="size-3" /> : null} v{rubric.version} · {locked ? "approved" : "draft"}
              </span>
              <span className="font-mono text-[11px] text-faint">{rubric.draftedBy}</span>
            </div>
            <div className="flex items-center gap-2">
              {locked && props.canEdit && (
                <button
                  className="btn-secondary"
                  disabled={!!busy}
                  onClick={() =>
                    run("dup", async () => {
                      await api(`/api/rubrics/${rubric.id}/duplicate`, "POST");
                      router.refresh();
                    })
                  }
                >
                  <Icon name="copy" className="size-3.5" /> Duplicate to edit
                </button>
              )}
              {editable && (
                <>
                  <button
                    className="btn-ghost"
                    disabled={!!busy}
                    onClick={() =>
                      run("redraft", async () => {
                        await api(`/api/jobs/${props.job.id}/rubric-drafts`, "POST");
                        router.refresh();
                      })
                    }
                  >
                    <Icon name="sparkle" className="size-3.5" /> Re-draft
                  </button>
                  <button
                    className="btn-secondary"
                    disabled={!dirty || !!busy}
                    onClick={() =>
                      run("save", async () => {
                        const r = await api(`/api/rubrics/${rubric.id}`, "PATCH", { criteria });
                        setCriteria(r.criteria);
                        setDirty(false);
                        router.refresh();
                      })
                    }
                  >
                    {busy === "save" ? "Saving…" : "Save draft"}
                  </button>
                </>
              )}
            </div>
          </div>
          <ul>
            {criteria.map((c) => (
              <li
                key={c.id}
                className="grid gap-3 border-b border-line px-4 py-3 last:border-0 sm:grid-cols-[1fr_auto]"
                onMouseEnter={() => setHover(c.sourceJobSpan)}
                onMouseLeave={() => setHover(null)}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={clsx("chip", c.stage === 1 ? "bg-pine-soft text-pine" : "bg-subtle text-muted")} title={c.stage === 1 ? "Stage 1: broad coverage — every candidate" : "Stage 2: detailed match — candidates that advanced"}>
                      Q{criteria.indexOf(c) + 1}
                    </span>
                    {editable ? (
                      <input className="input h-7 min-w-0 flex-1 border-transparent bg-transparent px-1 font-medium hover:border-line" value={c.label} onChange={(e) => update(c.id, { label: e.target.value })} />
                    ) : (
                      <span className="font-medium">{c.label}</span>
                    )}
                    {c.kind === "computed_years" && (
                      <span className="chip bg-lemon-soft text-lemon-text" title="Computed in code from normalized dates, overlaps merged">
                        <Icon name="calculator" className="size-3" /> computed · {c.minYears}+ yrs
                      </span>
                    )}
                  </div>
                  {editable && c.kind === "semantic" ? (
                    <textarea className="input mt-2 h-14 py-1.5 text-[12.5px]" value={c.question} onChange={(e) => update(c.id, { question: e.target.value })} />
                  ) : (
                    <p className="mt-1 text-[12.5px] text-muted">{c.question}</p>
                  )}
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[12px]">
                    {c.sourceJobSpan ? (
                      <span className="flex items-center gap-1 text-faint">
                        <Icon name="quote" className="size-3" /> From JD: “{c.sourceJobSpan}”
                      </span>
                    ) : null}
                    <span className="text-faint">Evidence: {c.evidenceRule}</span>
                  </div>
                  {c.flagged && (
                    <div className="mt-2 flex items-center gap-1.5 text-[12px] text-warn">
                      <Icon name="warning" className="size-3.5" /> {c.flagged}
                    </div>
                  )}
                </div>
                <div className="flex items-start gap-2">
                  <div className="flex h-8 rounded-lg border border-line p-0.5 text-[12px]" role="radiogroup" aria-label="Requirement">
                    {(["must", "nice"] as const).map((r) => (
                      <button
                        key={r}
                        role="radio"
                        aria-checked={c.requirement === r}
                        disabled={!editable}
                        onClick={() => update(c.id, { requirement: r })}
                        className={clsx("rounded-md px-2.5", c.requirement === r ? "bg-fg text-bg" : "text-muted hover:text-fg", !editable && "cursor-default")}
                      >
                        {r === "must" ? "Must" : "Nice"}
                      </button>
                    ))}
                  </div>
                  <label className="flex h-8 items-center gap-1 rounded-lg border border-line pl-2 text-[12px] text-muted">
                    w
                    <input
                      type="number"
                      min={1}
                      max={5}
                      disabled={!editable}
                      value={c.weight}
                      onChange={(e) => update(c.id, { weight: Number(e.target.value) })}
                      className="tnum h-full w-9 bg-transparent text-center text-fg outline-none"
                      aria-label="Weight"
                    />
                  </label>
                  {editable && (
                    <button
                      className="btn-ghost size-8 justify-center px-0"
                      aria-label={`Remove ${c.label}`}
                      onClick={() => {
                        setCriteria((cs) => cs.filter((x) => x.id !== c.id));
                        setDirty(true);
                      }}
                    >
                      <Icon name="trash" className="size-3.5" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {editable && (
            <form
              className="flex flex-wrap gap-2 border-t border-line bg-subtle/50 px-4 py-3"
              onSubmit={(e) => {
                e.preventDefault();
                run("add", async () => {
                  if (dirty) await api(`/api/rubrics/${rubric.id}`, "PATCH", { criteria });
                  const r = await api(`/api/rubrics/${rubric.id}`, "PATCH", { add });
                  setCriteria(r.criteria);
                  setDirty(false);
                  setAdd({ text: "", requirement: "must" });
                });
              }}
            >
              <input className="input h-8 min-w-60 flex-1" placeholder="Add a criterion not in the JD (will be flagged for confirmation)" value={add.text} onChange={(e) => setAdd({ ...add, text: e.target.value })} />
              <select className="input h-8 w-24" value={add.requirement} onChange={(e) => setAdd({ ...add, requirement: e.target.value as "must" })}>
                <option value="must">Must</option>
                <option value="nice">Nice</option>
              </select>
              <button className="btn-secondary" disabled={!add.text.trim() || !!busy}>
                <Icon name="plus" className="size-3.5" /> Add
              </button>
            </form>
          )}
        </section>

        {editable && (
          <section className="card flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="text-[12.5px] text-muted">
              Approving freezes this version. Runs always use a frozen version; editing later creates v{rubric.version + 1}.
              {flagged.length > 0 && (
                <label className="mt-2 flex items-center gap-2 text-warn">
                  <input type="checkbox" checked={confirmFlagged} onChange={(e) => setConfirmFlagged(e.target.checked)} className="accent-[var(--pine)]" />
                  I reviewed {flagged.length} flagged criteri{flagged.length > 1 ? "a" : "on"}
                </label>
              )}
            </div>
            <button
              className="btn-primary"
              disabled={!!busy}
              onClick={() =>
                run("approve", async () => {
                  if (dirty) await api(`/api/rubrics/${rubric.id}`, "PATCH", { criteria });
                  await api(`/api/rubrics/${rubric.id}/approve`, "POST", { confirmFlagged });
                  setDirty(false);
                  router.refresh();
                })
              }
            >
              <Icon name="lock" className="size-3.5" /> {busy === "approve" ? "Approving…" : "Approve criteria"}
            </button>
          </section>
        )}
        {err && <p className="text-[12.5px] text-bad">{err}</p>}
      </div>

      <div className="space-y-4">
        {locked && (
          <section className="card p-4">
            <h2 className="text-[14px] font-semibold">Run preview</h2>
            <dl className="mt-3 space-y-2 text-[13px]">
              {[
                ["Candidate scope", `${props.pool.readable} readable of ${props.pool.total}`],
                ...(est.s2
                  ? [
                      ["Stage 1 · broad coverage", `${est.s1} must-have checks × ${props.pool.readable}`],
                      ["Stage 2 · detailed match", `${est.s2} checks × candidates that advance`],
                    ]
                  : [["Single pass", `${criteria.length} questions × ${props.pool.readable} resumes`]]),
                ["Evaluator calls (max)", est.calls],
                ["Estimated cost (max)", money(est.usd)],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex justify-between gap-2">
                  <dt className="text-muted">{k}</dt>
                  <dd className="tnum text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-2 text-[11.5px] text-faint">Estimate from list price and average resume length; actual usage is metered per call.</p>
            <div className="mt-4 space-y-3 border-t border-line pt-4">
              <label className="flex items-center justify-between gap-2">
                <span className="label">Budget cap (USD)</span>
                <input type="number" min={0.01} step={0.5} value={budget} onChange={(e) => setBudget(Number(e.target.value))} className="input tnum h-8 w-24 text-right" />
              </label>
              <label className="flex items-start gap-2 text-[12.5px] text-muted">
                <input type="checkbox" checked={prune} onChange={(e) => setPrune(e.target.checked)} className="mt-0.5 accent-[var(--pine)]" />
                <span>Deprioritise candidates whose resume explicitly contradicts a must-have (10% audit sample still gets the full evaluation)</span>
              </label>
            </div>
            <button
              className="btn-primary mt-4 h-10 w-full justify-center text-[14px]"
              disabled={!props.canRun || !!busy || !(budget > 0)}
              onClick={() =>
                run("run", async () => {
                  const r = await api("/api/runs", "POST", { jobId: props.job.id, rubricId: rubric.id, budgetUsd: budget, pruneContradicted: prune });
                  router.push(`/runs/${r.id}`);
                })
              }
            >
              <Icon name="play" className="size-3.5" /> {busy === "run" ? "Starting…" : "Find matches"}
            </button>
            {!props.canRun && <p className="mt-2 text-[12px] text-faint">Hiring managers can review results but not start runs.</p>}
          </section>
        )}
        <JobDescription lines={props.jdLines} sources={sources} hover={hover} />
      </div>
    </div>
  );
}

function JobDescription({ lines, sources, hover }: { lines: ResumeLine[]; sources: Set<string | null>; hover: string | null }) {
  return (
    <section className="card p-4">
      <h2 className="text-[14px] font-semibold">Job description</h2>
      <p className="mt-0.5 text-[12px] text-faint">Highlighted lines became criteria.</p>
      <ol className="mt-3 space-y-1 text-[12.5px] leading-5">
        {lines.map((l) => (
          <li
            key={l.id}
            className={clsx(
              "rounded px-1.5 py-0.5",
              hover === l.text ? "bg-lemon text-[#15201b]" : sources.has(l.text) ? "bg-lemon-soft text-fg" : l.text.endsWith(":") ? "pt-2 font-medium text-fg" : "text-muted",
            )}
          >
            {l.text}
          </li>
        ))}
      </ol>
    </section>
  );
}
