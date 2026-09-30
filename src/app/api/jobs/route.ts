import { audit, db, now, save, TENANT, uid } from "@/lib/store";
import { handle, requireCan } from "@/lib/session";

export const POST = handle(async (req: Request) => {
  const s = await requireCan("editRubric");
  const b = await req.json();
  if (!b.title?.trim() || !b.description?.trim()) throw new Error("Title and description are required");
  const job = { id: uid("job"), tenantId: TENANT, title: b.title.trim(), team: b.team?.trim() || "", location: b.location?.trim() || "", description: b.description.trim(), status: "open" as const, createdAt: now(), demo: false };
  db().jobs.unshift(job);
  audit(s.email, "job.created", job.title);
  save();
  return Response.json(job);
});
