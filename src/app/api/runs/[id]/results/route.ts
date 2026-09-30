import { db, TENANT } from "@/lib/store";
import { runProgress, runResults } from "@/lib/runner";
import { handle } from "@/lib/session";

// Re-weighting reranks stored judgments without calling the provider again (PRD §8).
export const GET = handle(async (req: Request, ctx: RouteContext<"/api/runs/[id]/results">) => {
  const { id } = await ctx.params;
  const run = db().runs.find((r) => r.id === id && r.tenantId === TENANT);
  if (!run) throw new Error("Not found");
  const w = new URL(req.url).searchParams.get("weights");
  const weights = w ? (JSON.parse(w) as Record<string, number>) : undefined;
  const rows = runResults(run, weights).map((r) => ({
    candidate: { id: r.candidate.id, name: r.candidate.name, headline: r.candidate.headline, location: r.candidate.location, updatedAt: r.candidate.updatedAt, language: r.candidate.language },
    results: r.results,
    match: r.match,
    status: r.status,
    error: r.error,
  }));
  return Response.json({ run, progress: runProgress(run), rows });
});
