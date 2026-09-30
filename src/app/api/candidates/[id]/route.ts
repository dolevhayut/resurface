import { audit, db, now, save, TENANT } from "@/lib/store";
import { handle, requireCan, session } from "@/lib/session";

// Deletion tombstones the resume and hides every derived result (PRD §11).
export const DELETE = handle(async (_req: Request, ctx: RouteContext<"/api/candidates/[id]">) => {
  const s = await requireCan("delete");
  const { id } = await ctx.params;
  const d = db();
  const c = d.candidates.find((x) => x.id === id && x.tenantId === TENANT);
  if (!c) throw new Error("Not found");
  c.deletedAt = now();
  c.lines = [];
  c.email = undefined;
  d.evaluations = d.evaluations.filter((e) => e.candidateId !== id);
  d.shortlists.forEach((sl) => (sl.members = sl.members.filter((m) => m.candidateId !== id)));
  d.tasks.filter((t) => t.candidateId === id && ["queued", "retry_wait"].includes(t.state)).forEach((t) => (t.state = "cancelled"));
  audit(s.email, "candidate.deleted", id, "Resume text, evidence and derived results removed");
  save();
  return Response.json({ ok: true });
});

// Document text is served only to authenticated roles in this tenant, and every open is audited.
export const GET = handle(async (_req: Request, ctx: RouteContext<"/api/candidates/[id]">) => {
  const s = await session();
  const { id } = await ctx.params;
  const c = db().candidates.find((x) => x.id === id && x.tenantId === TENANT && !x.deletedAt);
  if (!c) throw new Error("Not found");
  audit(s.email, "candidate.viewed", c.id);
  return Response.json({ id: c.id, name: c.name, headline: c.headline, location: c.location, language: c.language, lines: c.lines, source: c.source, version: c.version, updatedAt: c.updatedAt });
});
