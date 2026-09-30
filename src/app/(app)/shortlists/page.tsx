import Link from "next/link";
import { Page, PageHeader, Empty, GroupBadge, pct, ago } from "@/components/ui";
import { db, TENANT } from "@/lib/store";
import { runResults } from "@/lib/runner";
import { session } from "@/lib/session";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function Shortlists() {
  const d = db();
  const s = await session();
  const lists = d.shortlists.filter((x) => x.tenantId === TENANT && x.members.length);
  return (
    <>
      <PageHeader title="Shortlists" subtitle="Saved for review — a recruiter decision, never an automatic recommendation to hire." />
      <Page>
        {lists.length === 0 && <Empty title="No shortlists yet" body="Open a job’s results and bookmark candidates to save them for review." action={<Link href="/jobs" className="btn-primary">Go to jobs</Link>} />}
        <div className="space-y-6">
          {lists.map((sl) => {
            const job = d.jobs.find((j) => j.id === sl.jobId)!;
            return (
              <section key={sl.id} className="card overflow-hidden">
                <div className="flex items-center justify-between border-b border-line px-4 py-3">
                  <div>
                    <h2 className="text-[14px] font-semibold">{job.title}</h2>
                    <div className="text-[12px] text-faint">{sl.members.length} saved for review</div>
                  </div>
                  {s.can("export") && sl.members[0] && (
                    <a className="btn-secondary" href={`/api/exports?runId=${sl.members[0].runId}&scope=shortlist`}>
                      <Icon name="download" className="size-3.5" /> Export
                    </a>
                  )}
                </div>
                {sl.members.map((m) => {
                  const run = d.runs.find((r) => r.id === m.runId);
                  const row = run ? runResults(run).find((r) => r.candidate.id === m.candidateId) : undefined;
                  const c = d.candidates.find((x) => x.id === m.candidateId);
                  if (!c) return null;
                  return (
                    <Link key={m.candidateId} href={run ? `/runs/${run.id}` : `/candidates/${c.id}`} className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 last:border-0 hover:bg-hover/50">
                      <div>
                        <div className="font-medium" dir="auto">
                          {c.name}
                        </div>
                        <div className="text-[12px] text-faint">
                          {c.headline} · saved by {m.addedBy} {ago(m.addedAt)}
                        </div>
                      </div>
                      {row && (
                        <div className="flex items-center gap-3">
                          <span className="tnum font-semibold">{pct(row.match.lower)}</span>
                          <GroupBadge group={row.match.group} />
                        </div>
                      )}
                    </Link>
                  );
                })}
              </section>
            );
          })}
        </div>
      </Page>
    </>
  );
}
