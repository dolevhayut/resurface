import { controlRun } from "@/lib/runner";
import { handle, requireCan } from "@/lib/session";

export const POST = handle(async (_req: Request, ctx: RouteContext<"/api/runs/[id]/[action]">) => {
  const s = await requireCan("run");
  const { id, action } = await ctx.params;
  if (!["pause", "resume", "cancel", "retry_failed"].includes(action)) throw new Error("Unknown action");
  return Response.json(controlRun(id, action as "pause", s.email));
});
