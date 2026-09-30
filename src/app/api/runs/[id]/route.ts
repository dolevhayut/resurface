import { db, TENANT } from "@/lib/store";
import { drive, runProgress } from "@/lib/runner";
import { handle } from "@/lib/session";

export const GET = handle(async (_req: Request, ctx: RouteContext<"/api/runs/[id]">) => {
  await drive(2500);
  const { id } = await ctx.params;
  const run = db().runs.find((r) => r.id === id && r.tenantId === TENANT);
  if (!run) throw new Error("Not found");
  return Response.json({ run, progress: runProgress(run) });
});
