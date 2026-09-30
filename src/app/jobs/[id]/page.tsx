import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Page, DemoTag, ago } from "@/components/ui";
import { RubricEditor } from "@/components/rubric-editor";
import { candidatesOf, db, TENANT } from "@/lib/store";
import { latestRubric, jobLines } from "@/lib/rubric";
import { USD_PER_TOKEN, provider } from "@/lib/providers";
import { session } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = db();
  const job = d.jobs.find((j) => j.id === id && j.tenantId === TENANT);
  if (!job) notFound();
  const rubric = latestRubric(id);
  const runs = d.runs.filter((r) => r.jobId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const pool = candidatesOf();
  const readable = pool.filter((c) => c.parseStatus === "ok");
  const avgChars = readable.reduce((s, c) => s + c.lines.reduce((n, l) => n + l.text.length + 6, 0), 0) / Math.max(1, readable.length);
  const s = await session();
  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/jobs" className="hover:text-fg">
            Jobs
          </Link>
        }
        title={
          <span className="flex items-center gap-2">
            {job.title} {job.demo && <DemoTag />}
          </span>
        }
        subtitle={`${job.team} · ${job.location}`}
        actions={
          runs[0] && (
            <Link href={`/runs/${runs[0].id}`} className="btn-secondary">
              Latest results
            </Link>
          )
        }
      />
      <Page>
        <RubricEditor
          job={{ id: job.id, title: job.title }}
          jdLines={jobLines(job)}
          rubric={rubric ?? null}
          canEdit={s.can("editRubric")}
          canRun={s.can("run")}
          provider={provider().name}
          pool={{ total: pool.length, readable: readable.length, avgChars: Math.round(avgChars), avgLines: Math.round(readable.reduce((s, c) => s + c.lines.length, 0) / Math.max(1, readable.length)), usdPerToken: USD_PER_TOKEN }}
        />
        {runs.length > 0 && (
          <section className="card mt-6 overflow-hidden">
            <h2 className="border-b border-line px-4 py-3 text-[14px] font-semibold">Runs</h2>
            {runs.map((r) => {
              const rv = d.rubrics.find((x) => x.id === r.rubricId);
              return (
                <Link key={r.id} href={`/runs/${r.id}`} className="flex items-center justify-between border-b border-line px-4 py-2.5 last:border-0 hover:bg-hover/50">
                  <span className="font-mono text-[12px]">{r.id}</span>
                  <span className="text-[12px] text-muted">
                    rubric v{rv?.version} · {r.snapshot.length} candidates · {r.status.replace("_", " ")} · {ago(r.createdAt)}
                  </span>
                </Link>
              );
            })}
          </section>
        )}
      </Page>
    </>
  );
}
