import Link from "next/link";
import { Page, Stat, Meter, ago, money, tokens } from "@/components/ui";
import { RunAllButton } from "@/components/run-all";
import { session } from "@/lib/session";
import { Stagger, StaggerItem } from "@/components/motion";
import { jobSummaries, poolInsights } from "@/lib/insights";
import { db } from "@/lib/store";
import { provider } from "@/lib/providers";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function Overview() {
  const s = await session();
  const p = poolInsights();
  const jobs = jobSummaries();
  const activity = db().audit.slice(0, 8);
  const ran = jobs.filter((j) => j.run);
  const ready = jobs.filter((j) => j.rubric?.status === "approved" && !j.run);
  return (
    <>
      <section className="border-b border-line px-4 pb-8 pt-8 md:px-8 md:pt-12">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-3 flex items-center gap-2 text-[12px] text-muted">
            <span className="chip bg-lemon-soft text-lemon-text">Pilot workspace</span>
            Evaluator: <span className="font-mono">{provider().name === "jev" ? "TypeSafe JEV" : "offline heuristic"}</span>
          </div>
          <h1 className="max-w-3xl text-[34px] font-semibold leading-[1.1] tracking-[-0.035em] md:text-[44px]">
            Your next hire may already be <span className="rounded-md bg-lemon px-1.5 text-[#15201b]">in your database.</span>
          </h1>
          <p className="mt-3 max-w-xl text-[14px] text-muted">
            Turn a dormant candidate pool into evidence-backed shortlists. Every job becomes clear criteria; every resume is evaluated against them — with quotes you can verify.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <RunAllButton jobs={jobs.filter((j) => j.rubric?.status === "approved").length} disabled={!s.can("run")} className="h-9 px-4" />
            <Link href="/jobs" className="btn-secondary h-9 px-4">
              Pick a job <Icon name="arrowRight" className="size-3.5" />
            </Link>
            <Link href="/ask" className="btn-ghost h-9 px-4">
              Ask the pool in plain English
            </Link>
          </div>
        </div>
      </section>
      <Page>
        <Stagger className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StaggerItem><Stat label="Candidates in pool" value={p.total} hint={`${p.imp.files} files imported · ${p.imp.dup} duplicate merged`} /></StaggerItem>
          <StaggerItem><Stat label="Dormant resumes" value={p.dormant} hint={`${Math.round((p.dormant / Math.max(1, p.total)) * 100)}% not updated in 2+ years`} /></StaggerItem>
          <StaggerItem><Stat label="Rediscovered for open roles" value={p.rediscovered} hint={`${p.strongAny} with strong evidence · across ${ran.length} evaluated jobs`} accent /></StaggerItem>
          <StaggerItem><Stat label="Evaluation spend" value={money(p.spend)} hint={`${tokens(p.tokens)} tokens · ${p.runs} runs`} /></StaggerItem>
        </Stagger>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_340px]">
          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h2 className="text-[14px] font-semibold">Open jobs</h2>
              <Link href="/jobs" className="text-[12px] text-muted hover:text-fg">
                All jobs →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="border-b border-line bg-subtle/50">
                  <tr>
                    <th className="th">Job</th>
                    <th className="th">Criteria</th>
                    <th className="th">Pool coverage</th>
                    <th className="th text-right">Strong</th>
                    <th className="th text-right">Verify</th>
                    <th className="th" />
                  </tr>
                </thead>
                <tbody>
                  {[...ran, ...ready, ...jobs.filter((j) => !j.run && j.rubric?.status !== "approved")].slice(0, 9).map(({ job, rubric, run, strong, verify, processed }) => (
                    <tr key={job.id} className="border-b border-line last:border-0 hover:bg-hover/50">
                      <td className="td">
                        <Link href={`/jobs/${job.id}`} className="font-medium hover:underline">
                          {job.title}
                        </Link>
                        <div className="text-[12px] text-faint">{job.team} · {job.location}</div>
                      </td>
                      <td className="td text-[12px] text-muted">
                        {rubric ? (
                          <span className={rubric.status === "approved" ? "text-ok" : "text-warn"}>
                            v{rubric.version} {rubric.status} · {rubric.criteria.length}
                          </span>
                        ) : (
                          "Not drafted"
                        )}
                      </td>
                      <td className="td w-40">
                        {run ? (
                          <div className="flex items-center gap-2">
                            <Meter value={processed / Math.max(1, run.snapshot.length)} className="w-20" />
                            <span className="tnum text-[12px] text-muted">
                              {processed}/{run.snapshot.length}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[12px] text-faint">—</span>
                        )}
                      </td>
                      <td className="td tnum text-right font-medium text-ok">{run ? strong : "—"}</td>
                      <td className="td tnum text-right text-warn">{run ? verify : "—"}</td>
                      <td className="td text-right">
                        <Link href={run ? `/runs/${run.id}` : `/jobs/${job.id}`} className="btn-ghost h-7 px-2 text-[12px]">
                          {run ? "Results" : rubric?.status === "approved" ? "Find matches" : "Review criteria"}
                          <Icon name="arrowUpRight" className="size-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="space-y-6">
            <section className="card p-4">
              <h2 className="text-[14px] font-semibold">Pool health</h2>
              <dl className="mt-3 space-y-2.5 text-[13px]">
                {[
                  ["Readable resumes", `${p.readable}/${p.total}`],
                  ["Extraction failures", `${p.imp.failed} (queued for OCR)`],
                  ["Duplicates merged", p.imp.dup],
                  ["Languages", `EN ${p.langs.en} · HE ${p.langs.he}`],
                ].map(([k, v]) => (
                  <div key={String(k)} className="flex justify-between gap-2">
                    <dt className="text-muted">{k}</dt>
                    <dd className="tnum font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
              <Link href="/candidates" className="btn-secondary mt-4 w-full justify-center">
                Open candidate pool
              </Link>
            </section>
            <section className="card p-4">
              <h2 className="text-[14px] font-semibold">Activity</h2>
              <ol className="mt-3 space-y-3">
                {activity.map((a) => (
                  <li key={a.id} className="text-[12.5px] leading-snug">
                    <span className="font-mono text-[11.5px] text-pine">{a.action}</span> <span className="text-fg">{a.target}</span>
                    <div className="text-[11.5px] text-faint">
                      {a.actor} · {ago(a.at)}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </div>
      </Page>
    </>
  );
}
