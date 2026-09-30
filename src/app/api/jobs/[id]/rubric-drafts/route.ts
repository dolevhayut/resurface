import { draftRubric } from "@/lib/rubric";
import { handle, requireCan } from "@/lib/session";

export const POST = handle(async (_req: Request, ctx: RouteContext<"/api/jobs/[id]/rubric-drafts">) => {
  const s = await requireCan("editRubric");
  const { id } = await ctx.params;
  return Response.json(await draftRubric(id, s.email));
});
