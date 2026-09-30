import Link from "next/link";
import { notFound } from "next/navigation";
import { Page, PageHeader, DemoTag, GroupBadge, RangeBar, pct, ago } from "@/components/ui";
import { ReverseMatch } from "@/components/reverse-match";
import { DeleteCandidate } from "@/components/delete-candidate";
import { db, TENANT } from "@/lib/store";
import { runResults } from "@/lib/runner";
import { session } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function CandidatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = db();
  const c = d.candidates.find((x) => x.id === id && x.tenantId === TENANT && !x.deletedAt);
  if (!c) notFound();
  const s = await session();
  const matches = d.runs
    .filter((r) => r.snapshot.some((x) => x.candidateId === id))
    .map((run) => ({ run, job: d.jobs.find((j) => j.id === run.jobId)!, row: runResults(run).find((r) => r.candidate.id === id) }))
    .filter((m) => m.row && m.row.results.length)
    .sort((a, b) => b.row!.match.lower - a.row!.match.lower);
  const evidence = new Set(matches.flatMap((m) => m.row!.results.map((r) => r.evidenceLineId)));
  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/candidates" className="hover:text-fg">
            Candidates
          </Link>
        }
        title={
          <span className="flex items-center gap-2" dir="auto">
            {c.name} {c.demo && <DemoTag />}
          </span>
        }
        subtitle={
          <span dir="auto">
            {c.headline} · {c.location} · CV updated {ago(c.updatedAt)} · v{c.version}
          </span>
        }
        actions={s.can("delete") ? <DeleteCandidate id={c.id} /> : null}
      />
      <Page>
        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <div className="space-y-6">
            <ReverseMatch candidateId={c.id} canQuery={s.can("query")} />
            <section className="card overflow-hidden">
              <h2 className="border-b border-line px-4 py-3 text-[14px] font-semibold">Evaluated in runs</h2>
              {matches.length === 0 && <p className="px-4 py-6 text-muted">Not evaluated yet. Run a job or use “Match to open jobs”.</p>}
              {matches.map(({ run, job, row }) => (
                <Link key={run.id} href={`/runs/${run.id}`} className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 last:border-0 hover:bg-hover/50">
                  <div>
                    <div className="font-medium">{job.title}</div>
                    <div className="text-[12px] text-faint">
                      {row!.match.supported} supported · coverage {Math.round(row!.match.coverage * 100)}% · {ago(run.createdAt)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="tnum text-[15px] font-semibold">{pct(row!.match.lower)}</span>
                    <RangeBar lower={row!.match.lower} upper={row!.match.upper} />
                    <GroupBadge group={row!.match.group} />
                  </div>
                </Link>
              ))}
            </section>
          </div>
          <section className="card self-start overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h2 className="text-[14px] font-semibold">Resume</h2>
              <span className="font-mono text-[11px] text-faint">{c.source}</span>
            </div>
            <ol className="max-h-[70vh] overflow-y-auto px-3 py-3 text-[12.5px] leading-[1.7]" dir={c.language === "he" ? "rtl" : "ltr"}>
              {c.lines.map((l) => (
                <li key={l.id} className={`flex gap-3 rounded px-1.5 ${evidence.has(l.id) ? "bg-lemon-soft" : ""}`}>
                  <span className="w-9 shrink-0 select-none font-mono text-[11px] leading-[21px] text-faint" dir="ltr">
                    {l.id}
                  </span>
                  <span className="min-w-0 whitespace-pre-wrap">{l.text}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </Page>
    </>
  );
}
