import Link from "next/link";
import { Page, PageHeader, DemoTag, ago } from "@/components/ui";
import { jobSummaries } from "@/lib/insights";
import { RunAllButton } from "@/components/run-all";
import { Stagger, StaggerItem, SpringBar } from "@/components/motion";
import { LiveRefresh } from "@/components/live-refresh";
import { session } from "@/lib/session";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function Jobs() {
  const jobs = jobSummaries();
  const s = await session();
  const ready = jobs.filter((j) => j.rubric?.status === "approved").length;
  const live = jobs.some((j) => j.run?.status === "running");
  return (
    <>
      <PageHeader
        title="Jobs & matches"
        subtitle="Pick a job, confirm its criteria, and evaluate the whole pool against them."
        actions={
          <>
            <Link href="/jobs/new" className="btn-secondary">
              <Icon name="plus" className="size-3.5" /> New job
            </Link>
            <RunAllButton jobs={ready} disabled={!s.can("run") || !ready} />
          </>
        }
      />
      <Page>
        {live && <LiveRefresh />}
        <Stagger className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {jobs.map(({ job, rubric, run, strong, verify, shortlisted, processed }) => (
            <StaggerItem key={job.id}>
            <Link href={run ? `/runs/${run.id}` : `/jobs/${job.id}`} className="card group flex h-full flex-col p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-control hover:shadow-[var(--shadow)]">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-medium group-hover:underline">{job.title}</div>
                  <div className="text-[12px] text-faint">
                    {job.team} · {job.location}
                  </div>
                </div>
                {job.demo && <DemoTag />}
              </div>
              <div className="mt-4 flex items-center gap-3 text-[12px]">
                {run ? (
                  <>
                    <span className="chip bg-ok-bg text-ok tnum">{strong} strong</span>
                    <span className="chip bg-warn-bg text-warn tnum">{verify} verify</span>
                    {shortlisted > 0 && <span className="chip bg-lemon-soft text-lemon-text tnum">{shortlisted} saved</span>}
                  </>
                ) : rubric ? (
                  <span className={`chip ${rubric.status === "approved" ? "bg-pine-soft text-pine" : "bg-warn-bg text-warn"}`}>
                    Criteria v{rubric.version} · {rubric.status === "approved" ? "ready to run" : "draft"}
                  </span>
                ) : (
                  <span className="chip bg-subtle text-muted">Criteria not drafted</span>
                )}
              </div>
              {run && run.status !== "completed" && <SpringBar value={processed / Math.max(1, run.snapshot.length)} className="mt-3" />}
              <div className="mt-auto pt-4 text-[11.5px] text-faint">{run ? `Last run ${ago(run.createdAt)} · ${run.status.replace("_", " ")}` : `Opened ${ago(job.createdAt)}`}</div>
            </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </Page>
    </>
  );
}
