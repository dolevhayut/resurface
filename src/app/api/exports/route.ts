import Papa from "papaparse";
import { audit, db, TENANT } from "@/lib/store";
import { runResults } from "@/lib/runner";
import { GROUP_LABEL } from "@/lib/scoring";
import { handle, requireCan } from "@/lib/session";

export const GET = handle(async (req: Request) => {
  const s = await requireCan("export");
  const url = new URL(req.url);
  const run = db().runs.find((r) => r.id === url.searchParams.get("runId") && r.tenantId === TENANT);
  if (!run) throw new Error("Run not found");
  const only = url.searchParams.get("scope") === "shortlist";
  const sl = db().shortlists.find((x) => x.jobId === run.jobId);
  const rubric = db().rubrics.find((r) => r.id === run.rubricId)!;
  const rows = runResults(run)
    .filter((r) => !only || sl?.members.some((m) => m.candidateId === r.candidate.id))
    .map((r) => ({
      candidate_id: r.candidate.id,
      name: r.candidate.name,
      headline: r.candidate.headline,
      group: GROUP_LABEL[r.match.group],
      status: r.status,
      known_match: r.match.known === null ? "" : r.match.known.toFixed(2),
      evidence_coverage: r.match.coverage.toFixed(2),
      range: `${r.match.lower.toFixed(2)}–${r.match.upper.toFixed(2)}`,
      must_have_gaps: r.match.mustGaps.join("; "),
      ...Object.fromEntries(
        rubric.criteria.map((c) => {
          const x = r.results.find((y) => y.criterionId === c.id);
          return [`${c.id}`, x ? `${x.evidenceStatus}${x.evidenceText ? `: "${x.evidenceText}"` : ""}` : "pending"];
        }),
      ),
    }));
  audit(s.email, "export.csv", run.id, `${rows.length} rows${only ? " (shortlist)" : ""}`);
  return new Response(Papa.unparse(rows), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="matches-${run.id}.csv"` },
  });
});
