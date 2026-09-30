import { notFound } from "next/navigation";
import { db, TENANT } from "@/lib/store";
import { session } from "@/lib/session";
import { RunView } from "@/components/run-view";

export const dynamic = "force-dynamic";

export default async function RunPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ open?: string }> }) {
  const { id } = await params;
  const { open } = await searchParams;
  const d = db();
  const run = d.runs.find((r) => r.id === id && r.tenantId === TENANT);
  if (!run) notFound();
  const job = d.jobs.find((j) => j.id === run.jobId)!;
  const rubric = d.rubrics.find((r) => r.id === run.rubricId)!;
  const shortlist = d.shortlists.find((s) => s.jobId === job.id)?.members.map((m) => m.candidateId) ?? [];
  const s = await session();
  return (
    <RunView
      runId={run.id}
      job={{ id: job.id, title: job.title, team: job.team, location: job.location }}
      rubric={{ version: rubric.version, criteria: rubric.criteria }}
      initialShortlist={shortlist}
      initialOpen={open}
      can={{ run: s.can("run"), export: s.can("export"), shortlist: s.can("shortlist") }}
    />
  );
}
