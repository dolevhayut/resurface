import "server-only";
import type { Criterion, Job, RubricVersion } from "./types";
import { provider, usd } from "./providers";
import { llmAvailable, llmQuestions, QUESTION_COUNT } from "./llm";
import { db, now, save, sha, TENANT, uid, audit } from "./store";

// Rubric drafting (PRD §5.3, §6): every drafted criterion is anchored to a line of the job
// description. JEV classifies each JD line as MUST / NICE / not a requirement; code turns
// those lines into atomic questions. Manually added criteria are flagged, never auto-approved.

const PROTECTED =
  /\b(age|aged|young|old|gender|male|female|man|woman|married|single|children|religion|ethnic|nationality|native speaker|pregnan|army|military service|photo)\b/i;

export function protectedFlag(text: string): string | undefined {
  return PROTECTED.test(text)
    ? "May reference a protected attribute (age, gender, origin, family status…). Remove or rephrase."
    : undefined;
}

export function jobLines(job: Job) {
  return job.description
    .split("\n")
    .map((t) => t.replace(/^\s*[-•*]\s*/, "").trim())
    .filter(Boolean)
    .map((text, i) => ({ id: `J${String(i).padStart(3, "0")}`, text }));
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40) || "criterion";

function shortLabel(text: string) {
  const t = text.replace(/\.$/, "");
  return t.length > 64 ? t.slice(0, 61).trimEnd() + "…" : t;
}

export function assignStages(criteria: Criterion[]): Criterion[] {
  // Small rubrics (≤8) run in a single pass: one JEV call per resume answers everything.
  // Larger rubrics cascade: Stage 1 = up to 5 must-haves for every candidate, Stage 2 = the rest.
  if (criteria.length <= 8) return criteria.map((c) => ({ ...c, stage: 1 as const }));
  const musts = criteria
    .filter((c) => c.requirement === "must")
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5)
    .map((c) => c.id);
  return criteria.map((c) => ({ ...c, stage: musts.includes(c.id) ? 1 : 2 }));
}

export function rubricHash(criteria: Criterion[]) {
  // Weights are deliberately excluded: re-weighting reranks without re-evaluating (PRD §8).
  return sha(
    JSON.stringify(criteria.map((c) => [c.id, c.question, c.evidenceRule, c.kind, c.minYears ?? null, c.sourceJobSpan])),
  );
}

export function criterionFromLine(text: string, requirement: "must" | "nice", source: string | null): Criterion {
  const years = text.match(/(\d+)\s*\+?\s*(?:years|yrs)/i);
  const base = {
    id: slug(text),
    label: shortLabel(text),
    requirement,
    sourceJobSpan: source,
    stage: 2 as const,
    flagged: source === null ? "Added manually — not found in the job description." : protectedFlag(text),
  };
  if (years) {
    return {
      ...base,
      kind: "computed_years",
      minYears: +years[1],
      weight: requirement === "must" ? 2 : 1,
      question: `Does the candidate have at least ${years[1]} years of professional experience (${text})?`,
      evidenceRule: "Computed from dated roles in the experience section; overlapping periods are merged, missing dates stay unknown.",
    };
  }
  return {
    ...base,
    kind: "semantic",
    weight: requirement === "must" ? 3 : 1,
    question: `Is there explicit evidence in the candidate's documented experience of: ${text.replace(/\.$/, "")}?`,
    evidenceRule: "A work, project or education entry that explicitly describes this. Titles or seniority alone are not evidence.",
  };
}

export async function draftRubric(jobId: string, actor: string): Promise<RubricVersion> {
  const d = db();
  const job = d.jobs.find((j) => j.id === jobId && j.tenantId === TENANT);
  if (!job) throw new Error("Job not found");
  let criteria: Criterion[] = [];
  let draftedBy: string;
  const seen = new Set<string>();
  const uniq = (c: Criterion) => {
    while (seen.has(c.id)) c.id += "_x";
    seen.add(c.id);
    return c;
  };
  if (llmAvailable()) {
    // LLM derives the questions; every source span is checked verbatim against the JD.
    const { questions, model, usage } = await llmQuestions(job.title, job.description);
    d.usage.push({ id: uid("use"), tenantId: TENANT, at: now(), purpose: "rubric_draft", provider: "llm", model, input: usage.input, output: usage.output, usd: 0 });
    const jd = job.description.toLowerCase().replace(/\s+/g, " ");
    for (const q of questions) {
      const found = jd.includes(q.source_span.toLowerCase().replace(/\s+/g, " ").trim());
      const base = criterionFromLine(q.source_span, q.requirement, q.source_span);
      criteria.push(
        uniq({
          ...base,
          id: base.id,
          label: q.label,
          question: base.kind === "computed_years" ? base.question : q.question,
          evidenceRule: base.kind === "computed_years" ? base.evidenceRule : q.evidence_rule,
          weight: q.weight,
          minYears: q.min_years ?? base.minYears,
          kind: q.min_years ? "computed_years" : base.kind,
          flagged: !found ? "Source span not found verbatim in the job description — possibly invented. Review." : protectedFlag(q.question),
        }),
      );
    }
    draftedBy = `llm:${model}`;
  } else {
    // Fallback without an LLM key: JEV classifies each JD line as MUST / NICE / not a requirement.
    const lines = jobLines(job);
    const p = provider();
    const { labels, usage, model } = await p.classifyJobLines(lines, job.title);
    d.usage.push({ id: uid("use"), tenantId: TENANT, at: now(), purpose: "rubric_draft", provider: p.name, model, input: usage.input, output: usage.output, usd: usd(usage) });
    const musts: Criterion[] = [];
    const nices: Criterion[] = [];
    for (const l of lines) {
      const lab = labels[l.id]?.label;
      if (lab === "MUST") musts.push(uniq(criterionFromLine(l.text, "must", l.text)));
      if (lab === "NICE") nices.push(uniq(criterionFromLine(l.text, "nice", l.text)));
    }
    criteria = [...musts, ...nices].slice(0, QUESTION_COUNT);
    draftedBy = `${p.name}:${model}`;
  }
  criteria = assignStages(criteria);

  const prev = d.rubrics.filter((r) => r.jobId === jobId);
  const rubric: RubricVersion = {
    id: uid("rub"),
    tenantId: TENANT,
    jobId,
    version: prev.length + 1,
    status: "draft",
    criteria,
    hash: rubricHash(criteria),
    draftedBy,
    createdAt: now(),
  };
  d.rubrics.push(rubric);
  audit(actor, "rubric.drafted", job.title, `v${rubric.version} · ${criteria.length} criteria · ${draftedBy}`);
  save();
  return rubric;
}

export function latestRubric(jobId: string) {
  return db()
    .rubrics.filter((r) => r.jobId === jobId && r.tenantId === TENANT)
    .sort((a, b) => b.version - a.version)[0];
}
