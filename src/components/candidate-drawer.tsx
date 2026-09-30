"use client";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import type { Criterion, ResumeLine } from "@/lib/types";
import { GroupBadge, RangeBar, pct } from "./ui";
import { CriterionEvidence, type Row } from "./run-view";
import { Icon } from "./icons";
import { motion } from "motion/react";

const REASONS = ["Missing a must-have skill", "Experience level mismatch", "Different domain", "Location / work model", "Already in process", "Other professional reason"];

export function CandidateDrawer(props: {
  row: Row;
  criteria: Criterion[];
  runId: string;
  shortlisted: boolean;
  canShortlist: boolean;
  onShortlist: () => void;
  onClose: () => void;
}) {
  const { row, criteria } = props;
  const [doc, setDoc] = useState<{ lines: ResumeLine[]; source: string; version: number; language: string } | null>(null);
  const [focus, setFocus] = useState<string | null>(null);
  const [tab, setTab] = useState<"evidence" | "resume">("evidence");
  const [fb, setFb] = useState<string>("");
  const [sent, setSent] = useState(false);
  const refs = useRef<Record<string, HTMLLIElement | null>>({});

  useEffect(() => {
    fetch(`/api/candidates/${row.candidate.id}`)
      .then((r) => r.json())
      .then(setDoc);
  }, [row.candidate.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && props.onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [props]);

  const showSource = (id: string) => {
    setTab("resume");
    setFocus(id);
    setTimeout(() => refs.current[id]?.scrollIntoView({ block: "center", behavior: "smooth" }), 60);
  };

  const byId = new Map(row.results.map((r) => [r.criterionId, r]));
  const evidenceLines = new Set(row.results.map((r) => r.evidenceLineId).filter(Boolean));
  const checks = criteria.filter((c) => {
    const s = byId.get(c.id)?.evidenceStatus;
    return !s || s === "not_established" || s === "needs_verification";
  });

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]" onClick={props.onClose} />
      <motion.aside
        initial={{ x: 48, opacity: 0, scale: 0.98 }}
        animate={{ x: 0, opacity: 1, scale: 1 }}
        exit={{ x: 48, opacity: 0, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 380, damping: 36 }}
        role="dialog"
        aria-label={`${row.candidate.name} details`}
        className="fixed inset-y-2 right-2 z-50 flex w-[min(620px,calc(100vw-16px))] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow)]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-line p-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-[17px] font-semibold tracking-tight" dir="auto">
                {row.candidate.name}
              </h2>
              <GroupBadge group={row.match.group} />
            </div>
            <div className="mt-0.5 truncate text-[12.5px] text-muted" dir="auto">
              {row.candidate.headline} · {row.candidate.location}
            </div>
            <div className="mt-3 flex items-center gap-4 text-[12px] text-muted">
              <span>
                Score <b className="tnum text-[15px] text-fg">{pct(row.match.lower)}</b>
              </span>
              <RangeBar lower={row.match.lower} upper={row.match.upper} />
              <span className="tnum">Coverage {Math.round(row.match.coverage * 100)}%</span>
              <span className="tnum">
                {row.match.supported}/{criteria.length} supported
              </span>
            </div>
          </div>
          <button className="btn-ghost size-8 justify-center px-0" onClick={props.onClose} aria-label="Close">
            <Icon name="close" className="size-4" />
          </button>
        </div>

        <div className="flex gap-1 border-b border-line px-5">
          {(["evidence", "resume"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={clsx("relative h-10 px-2 text-[13px]", tab === t ? "font-medium text-fg" : "text-muted hover:text-fg")}>
              {t === "evidence" ? "Criteria & evidence" : "Source resume"}
              {tab === t && <motion.span layoutId="drawer-tab" className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-pine" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5">
          {tab === "evidence" ? (
            <>
              <div className="divide-y divide-line">
                {criteria.map((c, i) => (
                  <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.035, type: "spring", stiffness: 320, damping: 30 }}>
                    <CriterionEvidence c={c} r={byId.get(c.id)} onSource={showSource} />
                  </motion.div>
                ))}
              </div>
              {checks.length > 0 && (
                <div className="my-4 rounded-xl bg-subtle p-4">
                  <div className="text-[12.5px] font-medium">Interview checks</div>
                  <ul className="mt-2 space-y-1.5 text-[12.5px] text-muted">
                    {checks.map((c) => (
                      <li key={c.id} className="flex gap-2">
                        <span className="text-warn">→</span> Verify: {c.question.replace(/^(Has|Does|Is|Can) the candidate /i, "").replace(/\?$/, "")}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : !doc ? (
            <div className="space-y-2 py-5">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-3.5 animate-pulse rounded bg-subtle" style={{ width: `${40 + ((i * 37) % 55)}%` }} />
              ))}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between py-3 text-[11.5px] text-faint">
                <span className="font-mono">
                  {doc.source} · v{doc.version}
                </span>
                <span>Highlighted lines are cited as evidence</span>
              </div>
              <ol className="pb-6 font-mono text-[12px] leading-[1.7]" dir={doc.language === "he" ? "rtl" : "ltr"}>
                {doc.lines.map((l) => (
                  <li
                    key={l.id}
                    ref={(el) => {
                      refs.current[l.id] = el;
                    }}
                    className={clsx(
                      "flex gap-3 rounded px-1.5 transition-colors duration-500",
                      focus === l.id ? "bg-lemon text-[#15201b]" : evidenceLines.has(l.id) ? "bg-lemon-soft" : "",
                    )}
                  >
                    <span className="w-9 shrink-0 select-none text-faint" dir="ltr">
                      {l.id}
                    </span>
                    <span className="min-w-0 whitespace-pre-wrap font-sans text-[12.5px]">{l.text}</span>
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-line bg-subtle/40 p-4">
          {props.canShortlist && (
            <button className={props.shortlisted ? "btn-secondary" : "btn-primary"} onClick={props.onShortlist}>
              <Icon name={props.shortlisted ? "bookmarkFilled" : "bookmark"} className="size-3.5" />
              {props.shortlisted ? "Saved for review" : "Add to shortlist"}
            </button>
          )}
          {props.canShortlist && !sent && (
            <div className="ml-auto flex items-center gap-2">
              <select className="input h-8 w-52" value={fb} onChange={(e) => setFb(e.target.value)} aria-label="Not a match reason">
                <option value="">Not a match because…</option>
                {REASONS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
              <button
                className="btn-secondary"
                disabled={!fb}
                onClick={async () => {
                  await fetch("/api/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ runId: props.runId, candidateId: row.candidate.id, reason: fb }) });
                  setSent(true);
                }}
              >
                Mark
              </button>
            </div>
          )}
          {sent && <span className="ml-auto text-[12px] text-muted">Feedback recorded for manual review (not used to auto-train).</span>}
        </div>
      </motion.aside>
    </>
  );
}
