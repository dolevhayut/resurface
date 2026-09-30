import { audit, db, now, save, TENANT, uid } from "@/lib/store";
import { handle, requireCan } from "@/lib/session";

export const POST = handle(async (req: Request) => {
  const s = await requireCan("shortlist");
  const b = await req.json();
  if (!b.reason) throw new Error("Pick a professional reason");
  db().feedback.push({ id: uid("fb"), tenantId: TENANT, runId: b.runId, candidateId: b.candidateId, reason: b.reason, createdAt: now(), by: s.email });
  audit(s.email, "feedback.not_a_match", b.candidateId, b.reason);
  save();
  return Response.json({ ok: true });
});
