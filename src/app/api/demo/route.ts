import { createRun, runResults } from "@/lib/runner";
import { draftRubric, latestRubric } from "@/lib/rubric";
import { audit, candidatesOf, db, jobsOf, now, save, TENANT } from "@/lib/store";
import { handle, requireCan } from "@/lib/session";

// Server side of the guided demo: each action performs a real step and returns where to go next.
const FULL_JOB = "job_01"; // full-pool run (100 resumes)
const LIVE_JOB = "job_20"; // starts with no questions: drafted live, then 10 resumes streamed through JEV

function latestRun(jobId: string) {
  return db()
    .runs.filter((r) => r.jobId === jobId && r.tenantId === TENANT)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

/** 10 resumes for the live run: every sales/solutions-engineering profile plus a spread of others. */
function liveSample() {
  const pool = candidatesOf().filter((c) => c.parseStatus === "ok");
  const pick: string[] = [];
  const add = (re: RegExp, n: number) => pool.filter((c) => re.test(c.headline) && !pick.includes(c.id)).slice(0, n).forEach((c) => pick.push(c.id));
  add(/Solutions Engineer|Support Engineer/, 3);
  add(/Full Stack|Backend/, 2);
  add(/Account Executive|Sales/, 1);
  add(/Customer Success/, 1);
  add(/Technical Writer/, 1);
  add(/QA/, 1);
  add(/Product Manager/, 1);
  return pick.slice(0, 10);
}

export const POST = handle(async (req: Request) => {
  const s = await requireCan("run");
  const { action } = (await req.json()) as { action: string };
  const d = db();

  if (action === "draft_live") {
    await draftRubric(LIVE_JOB, s.email);
    return Response.json({ url: `/jobs/${LIVE_JOB}` });
  }
  if (action === "run_live") {
    let rubric = latestRubric(LIVE_JOB);
    if (!rubric) rubric = await draftRubric(LIVE_JOB, s.email);
    if (rubric.status !== "approved") {
      rubric.status = "approved";
      rubric.approvedAt = now();
      rubric.approvedBy = s.email;
      audit(s.email, "rubric.approved", rubric.id, `v${rubric.version} · ${rubric.criteria.length} criteria (guided demo)`);
      save();
    }
    const run = createRun({ jobId: LIVE_JOB, rubricId: rubric.id, budgetUsd: 0.25, pruneContradicted: false, actor: s.email, candidateIds: liveSample(), paceMs: 650 });
    return Response.json({ url: `/runs/${run.id}` });
  }
  if (action === "latest_live_run") {
    const run = latestRun(LIVE_JOB);
    if (!run) throw new Error("Run the previous step first.");
    return Response.json({ url: `/runs/${run.id}` });
  }

  const startFull = () => {
    const rubric = latestRubric(FULL_JOB);
    if (rubric?.status !== "approved") throw new Error("Demo job criteria are not approved.");
    return createRun({ jobId: FULL_JOB, rubricId: rubric.id, budgetUsd: 1, pruneContradicted: true, actor: s.email });
  };
  if (action === "run_job") return Response.json({ url: `/runs/${startFull().id}` });
  if (action === "open_top" || action === "reverse") {
    const run = latestRun(LIVE_JOB) ?? latestRun(FULL_JOB) ?? startFull();
    const top = runResults(run).find((r) => r.results.length)?.candidate.id ?? run.snapshot[0].candidateId;
    return Response.json({ url: action === "open_top" ? `/runs/${run.id}?open=${top}` : `/candidates/${top}?reverse=1` });
  }
  if (action === "run_all") {
    const ids = jobsOf()
      .filter((j) => j.status === "open")
      .map((j) => ({ j, r: latestRubric(j.id) }))
      .filter(({ r }) => r?.status === "approved")
      .map(({ j, r }) => createRun({ jobId: j.id, rubricId: r!.id, budgetUsd: 0.5, pruneContradicted: true, actor: s.email }).id);
    return Response.json({ url: "/jobs?live=1", runs: ids.length });
  }
  void d;
  throw new Error("Unknown demo action");
});
