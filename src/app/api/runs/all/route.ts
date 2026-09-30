import { createRun } from "@/lib/runner";
import { latestRubric } from "@/lib/rubric";
import { jobsOf } from "@/lib/store";
import { handle, requireCan } from "@/lib/session";

// Evaluate the pool against every open job that has approved criteria.
export const POST = handle(async (req: Request) => {
  const s = await requireCan("run");
  const b = await req.json().catch(() => ({}));
  const perJob = Number(b.budgetUsd ?? 0.5);
  const runs = jobsOf()
    .filter((j) => j.status === "open")
    .map((j) => ({ j, r: latestRubric(j.id) }))
    .filter(({ r }) => r?.status === "approved")
    .map(({ j, r }) => createRun({ jobId: j.id, rubricId: r!.id, budgetUsd: perJob, pruneContradicted: true, actor: s.email }));
  return Response.json({ runs: runs.map((r) => r.id) });
});
