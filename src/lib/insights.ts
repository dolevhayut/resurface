import "server-only";
import { candidatesOf, db, jobsOf, TENANT } from "./store";
import { latestRubric } from "./rubric";
import { runResults, runProgress } from "./runner";
import type { Run } from "./types";

export function latestRun(jobId: string): Run | undefined {
  return db()
    .runs.filter((r) => r.jobId === jobId && r.tenantId === TENANT)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

export function jobSummaries() {
  return jobsOf().map((job) => {
    const rubric = latestRubric(job.id);
    const run = latestRun(job.id);
    let strong = 0,
      verify = 0,
      processed = 0;
    if (run) {
      const rows = runResults(run);
      strong = rows.filter((r) => r.match.group === "strong").length;
      verify = rows.filter((r) => r.match.group === "verify").length;
      const p = runProgress(run);
      processed = p.stage1.completed;
    }
    const shortlisted = db().shortlists.find((s) => s.jobId === job.id)?.members.length ?? 0;
    return { job, rubric, run, strong, verify, processed, shortlisted };
  });
}

export function poolInsights() {
  const cands = candidatesOf();
  const d = db();
  const staleCutoff = new Date("2026-09-30");
  staleCutoff.setFullYear(staleCutoff.getFullYear() - 2);
  const dormant = cands.filter((c) => new Date(c.updatedAt) < staleCutoff).length;
  const imp = d.imports.reduce(
    (a, i) => ({ files: a.files + i.files, dup: a.dup + i.duplicates, failed: a.failed + i.failed }),
    { files: 0, dup: 0, failed: 0 },
  );
  const rediscovered = new Set<string>();
  const strongAny = new Set<string>();
  for (const s of jobSummaries()) {
    if (!s.run) continue;
    for (const r of runResults(s.run)) {
      if (r.match.group === "strong" || r.match.group === "verify") rediscovered.add(r.candidate.id);
      if (r.match.group === "strong") strongAny.add(r.candidate.id);
    }
  }
  const langs = { en: cands.filter((c) => c.language === "en").length, he: cands.filter((c) => c.language === "he").length };
  const spend = d.usage.reduce((a, u) => a + u.usd, 0);
  const tokens = d.usage.reduce((a, u) => a + u.input + u.output, 0);
  return {
    total: cands.length,
    readable: cands.filter((c) => c.parseStatus === "ok").length,
    dormant,
    imp,
    rediscovered: rediscovered.size,
    strongAny: strongAny.size,
    langs,
    spend,
    tokens,
    runs: d.runs.length,
  };
}

export const isDormant = (iso: string) => Date.now() - new Date(iso).getTime() > 2 * 365 * 86400000;
