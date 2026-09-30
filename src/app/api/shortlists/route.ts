import { audit, db, now, save, TENANT, uid } from "@/lib/store";
import { handle, requireCan } from "@/lib/session";

// Shortlist = "Saved for review", never "Recommended hire".
export const POST = handle(async (req: Request) => {
  const s = await requireCan("shortlist");
  const b = (await req.json()) as { jobId: string; runId: string; candidateId: string; remove?: boolean; note?: string };
  const d = db();
  let sl = d.shortlists.find((x) => x.jobId === b.jobId && x.tenantId === TENANT);
  if (!sl) {
    const job = d.jobs.find((j) => j.id === b.jobId);
    sl = { id: uid("sl"), tenantId: TENANT, jobId: b.jobId, name: job?.title ?? "Shortlist", createdAt: now(), members: [] };
    d.shortlists.push(sl);
  }
  const existing = sl.members.find((m) => m.candidateId === b.candidateId);
  if (b.remove) sl.members = sl.members.filter((m) => m.candidateId !== b.candidateId);
  else if (existing) existing.note = b.note ?? existing.note;
  else sl.members.push({ candidateId: b.candidateId, runId: b.runId, addedAt: now(), addedBy: s.email, note: b.note });
  audit(s.email, b.remove ? "shortlist.removed" : "shortlist.added", sl.name, b.candidateId);
  save();
  return Response.json(sl);
});
