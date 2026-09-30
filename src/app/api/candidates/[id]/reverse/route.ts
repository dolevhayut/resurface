import { reverseMatch } from "@/lib/pool";
import { handle, requireCan } from "@/lib/session";

export const POST = handle(async (_req: Request, ctx: RouteContext<"/api/candidates/[id]/reverse">) => {
  const s = await requireCan("query");
  const { id } = await ctx.params;
  return Response.json(await reverseMatch(id, s.email));
});
