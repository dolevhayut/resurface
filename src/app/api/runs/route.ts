import { createRun } from "@/lib/runner";
import { handle, requireCan } from "@/lib/session";

export const POST = handle(async (req: Request) => {
  const s = await requireCan("run");
  const b = await req.json();
  return Response.json(createRun({ jobId: b.jobId, rubricId: b.rubricId, budgetUsd: Number(b.budgetUsd), pruneContradicted: Boolean(b.pruneContradicted), actor: s.email }));
});
