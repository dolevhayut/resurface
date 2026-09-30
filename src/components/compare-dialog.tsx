"use client";
import type { Criterion } from "@/lib/types";
import { EvidenceBadge, pct } from "./ui";
import type { Row } from "./run-view";
import { Icon } from "./icons";

export function CompareDialog({ rows, criteria, onClose }: { rows: Row[]; criteria: Criterion[]; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px] animate-[fade_.2s_ease-out]" onClick={onClose} />
      <div role="dialog" aria-label="Compare candidates" className="fixed inset-x-2 top-[6vh] z-50 mx-auto max-h-[88vh] max-w-5xl overflow-auto rounded-2xl border border-line bg-surface shadow-[var(--shadow)] animate-[pop_.22s_cubic-bezier(.2,.8,.2,1)]">
        <div className="sticky top-0 flex items-center justify-between border-b border-line bg-surface px-5 py-3">
          <h2 className="text-[15px] font-semibold">Compare candidates</h2>
          <button className="btn-ghost size-8 justify-center px-0" onClick={onClose} aria-label="Close">
            <Icon name="close" className="size-4" />
          </button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-line">
              <th className="th w-56">Criterion</th>
              {rows.map((r) => (
                <th key={r.candidate.id} className="th align-bottom">
                  <div className="text-[13px] font-semibold text-fg" dir="auto">
                    {r.candidate.name}
                  </div>
                  <div className="text-[12px] font-normal">
                    Score {pct(r.match.lower)} · coverage {Math.round(r.match.coverage * 100)}%
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {criteria.map((c) => (
              <tr key={c.id} className="border-b border-line align-top last:border-0">
                <td className="td text-[12.5px] font-medium">
                  {c.label}
                  <div className="text-[11px] font-normal text-faint">{c.requirement === "must" ? "Must-have" : "Nice-to-have"}</div>
                </td>
                {rows.map((r) => {
                  const x = r.results.find((y) => y.criterionId === c.id);
                  return (
                    <td key={r.candidate.id} className="td">
                      <EvidenceBadge status={x ? x.evidenceStatus : "pending"} />
                      {x?.evidenceText && (
                        <p className="mt-1.5 line-clamp-3 text-[12px] text-muted" dir="auto">
                          “{x.evidenceText.replace(/^- /, "")}”
                        </p>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
