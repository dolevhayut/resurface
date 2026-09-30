import fs from "node:fs";
import path from "node:path";
import { Landing, type Bench } from "@/components/landing/landing";

export const dynamic = "force-dynamic";

// Numbers on this page come from scripts/benchmark.mts (same resumes, same questions, both models).
function loadBench(): Bench {
  const p = path.join(process.cwd(), "data/benchmark.json");
  const raw = JSON.parse(fs.readFileSync(p, "utf8"));
  const by = (k: string) => raw.results.find((r: { key: string }) => r.key === k);
  const pick = (r: Record<string, number | number[] | null>) => ({
    p50ms: r.p50ms as number,
    usdPerResume: r.usdPerResume as number,
    usdPer185kx20: r.usdPer185kx20 as number,
    consistency: r.consistency as number,
    quoteValidity: r.quoteValidity as number,
    agreement: (r.agreementWithSonnet as number) ?? null,
    injection: (r.injectionSupported as number[]) ?? [],
    tokens: r.tokensPerResume as number,
    failures: r.failures as number,
  });
  const jev = by("jev");
  return {
    at: raw.at,
    job: raw.job,
    questions: raw.questions.length,
    resumes: jev.resumes,
    runs: jev.runs,
    jev: pick(jev),
    sonnet: pick(by("claude-sonnet-5-5")),
    haiku: pick(by("claude-haiku-4-5")),
  };
}

export default function Home() {
  return <Landing bench={loadBench()} />;
}
