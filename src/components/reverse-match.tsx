"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Icon } from "./icons";
import { GroupBadge, RangeBar, pct } from "./ui";
import type { Match } from "@/lib/scoring";

type R = { jobId: string; title: string; team: string; match: Match; criteria: number };

export function ReverseMatch({ candidateId, canQuery, autoRun }: { candidateId: string; canQuery: boolean; autoRun?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<{ rows: R[]; jobsWithoutRubric: number } | null>(null);
  const [err, setErr] = useState("");
  const auto = useRef(false);
  const run = async () => {
    setBusy(true);
    setErr("");
    const r = await fetch(`/api/candidates/${candidateId}/reverse`, { method: "POST" });
    const j = await r.json();
    setBusy(false);
    if (!r.ok) setErr(j.error);
    else setRes(j);
  };
  useEffect(() => {
    if (!autoRun || !canQuery || auto.current) return;
    auto.current = true;
     
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun, canQuery]);
  return (
    <section data-tour="reverse" className="card relative overflow-hidden">
      {busy && <div className="shimmer absolute inset-x-0 top-0 h-0.5" />}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div>
          <h2 className="text-[14px] font-semibold">Reverse match</h2>
          <p className="text-[12px] text-muted">Which open jobs does this person fit? One evaluator call per job, same criteria as the job’s runs.</p>
        </div>
        <button
          className="btn-primary"
          disabled={!canQuery || busy}
          onClick={run}
        >
          <Icon name="target" className="size-3.5" /> {busy ? "Matching…" : "Match to open jobs"}
        </button>
      </div>
      {err && <p className="px-4 py-3 text-[12.5px] text-bad">{err}</p>}
      {res && (
        <ul>
          {res.rows.map((r, i) => (
            <motion.li key={r.jobId} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="border-b border-line last:border-0">
              <Link href={`/jobs/${r.jobId}`} className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-hover/50">
                <span>
                  <span className="font-medium">{r.title}</span> <span className="text-[12px] text-faint">· {r.team}</span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="tnum w-7 text-right font-semibold">{pct(r.match.lower)}</span>
                  <RangeBar lower={r.match.lower} upper={r.match.upper} />
                  <GroupBadge group={r.match.group} />
                </span>
              </Link>
            </motion.li>
          ))}
          {res.jobsWithoutRubric > 0 && <li className="px-4 py-2.5 text-[12px] text-faint">{res.jobsWithoutRubric} open jobs skipped — criteria not approved yet.</li>}
        </ul>
      )}
    </section>
  );
}
