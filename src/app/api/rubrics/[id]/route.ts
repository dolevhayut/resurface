import { assignStages, criterionFromLine, protectedFlag, rubricHash } from "@/lib/rubric";
import { db, save, TENANT, audit } from "@/lib/store";
import { handle, requireCan } from "@/lib/session";
import type { Criterion } from "@/lib/types";

// Edit a draft rubric. Approved versions are locked; duplicate to change them.
export const PATCH = handle(async (req: Request, ctx: RouteContext<"/api/rubrics/[id]">) => {
  const s = await requireCan("editRubric");
  const { id } = await ctx.params;
  const r = db().rubrics.find((x) => x.id === id && x.tenantId === TENANT);
  if (!r) throw new Error("Not found");
  if (r.status === "approved") throw new Error("Approved rubric versions are locked. Duplicate to edit.");
  const b = (await req.json()) as { criteria?: Criterion[]; add?: { text: string; requirement: "must" | "nice" } };
  let criteria = b.criteria ?? r.criteria;
  if (b.add?.text?.trim()) {
    const c = criterionFromLine(b.add.text.trim(), b.add.requirement, null);
    while (criteria.some((x) => x.id === c.id)) c.id += "_x";
    criteria = [...criteria, c];
  }
  criteria = criteria.map((c) => ({
    ...c,
    weight: Math.max(1, Math.min(5, Math.round(Number(c.weight) || 1))),
    flagged: c.sourceJobSpan === null ? "Added manually — not found in the job description." : protectedFlag(c.question),
  }));
  if (criteria.length > 15) throw new Error("Keep the rubric to 15 criteria or fewer.");
  r.criteria = assignStages(criteria);
  r.hash = rubricHash(r.criteria);
  audit(s.email, "rubric.edited", r.id);
  save();
  return Response.json(r);
});
