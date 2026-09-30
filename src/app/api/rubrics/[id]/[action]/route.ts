import { rubricHash } from "@/lib/rubric";
import { db, now, save, TENANT, uid, audit } from "@/lib/store";
import { handle, requireCan } from "@/lib/session";

export const POST = handle(async (req: Request, ctx: RouteContext<"/api/rubrics/[id]/[action]">) => {
  const s = await requireCan("editRubric");
  const { id, action } = await ctx.params;
  const d = db();
  const r = d.rubrics.find((x) => x.id === id && x.tenantId === TENANT);
  if (!r) throw new Error("Not found");
  if (action === "approve") {
    if (r.status === "approved") return Response.json(r);
    if (!r.criteria.length) throw new Error("Add at least one criterion.");
    if (!r.criteria.some((c) => c.requirement === "must")) throw new Error("Mark at least one criterion as must-have.");
    const b = await req.json().catch(() => ({}));
    const manual = r.criteria.filter((c) => c.flagged);
    if (manual.length && !b.confirmFlagged) throw new Error(`${manual.length} flagged criteria need explicit confirmation.`);
    r.status = "approved";
    r.approvedAt = now();
    r.approvedBy = s.email;
    audit(s.email, "rubric.approved", r.id, `v${r.version} · ${r.criteria.length} criteria${manual.length ? ` · ${manual.length} flagged confirmed` : ""}`);
  } else if (action === "duplicate") {
    const versions = d.rubrics.filter((x) => x.jobId === r.jobId).length;
    const copy = { ...structuredClone(r), id: uid("rub"), version: versions + 1, status: "draft" as const, createdAt: now(), approvedAt: undefined, approvedBy: undefined, draftedBy: `copy of v${r.version}` };
    copy.hash = rubricHash(copy.criteria);
    d.rubrics.push(copy);
    audit(s.email, "rubric.duplicated", r.id, `→ v${copy.version}`);
    save();
    return Response.json(copy);
  } else throw new Error("Unknown action");
  save();
  return Response.json(r);
});
