import "server-only";
import { generateText, Output } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

// LLM step of the pipeline: read the job description and derive N atomic screening
// questions, each anchored to a verbatim span of the JD. JEV then answers them per resume.

export const QUESTION_COUNT = 6;

export function llmAvailable() {
  return Boolean(process.env.AI_GATEWAY_API_KEY?.trim() || process.env.ANTHROPIC_API_KEY?.trim());
}

function model() {
  if (process.env.AI_GATEWAY_API_KEY?.trim()) return { model: process.env.LLM_MODEL || "anthropic/claude-sonnet-5-5", name: process.env.LLM_MODEL || "anthropic/claude-sonnet-5-5" };
  const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY, baseURL: "https://api.anthropic.com/v1" });
  const id = process.env.LLM_MODEL || "claude-sonnet-5-5";
  return { model: anthropic(id), name: id };
}

const schema = z.object({
  questions: z
    .array(
      z.object({
        label: z.string().describe("Short criterion title, max 60 chars"),
        question: z.string().describe("One atomic yes/no screening question about documented professional experience"),
        requirement: z.enum(["must", "nice"]),
        weight: z.number().int().min(1).max(3),
        evidence_rule: z.string().describe("What a resume line must explicitly say to count as evidence"),
        source_span: z.string().describe("Verbatim substring copied from the job description that this question comes from"),
        min_years: z.number().int().nullable().describe("Only when the requirement is a number of years of experience; otherwise null"),
      }),
    )
    .length(QUESTION_COUNT),
});

export async function llmQuestions(title: string, description: string) {
  const m = model();
  const { output, usage } = await generateText({
    model: m.model,
    instructions: `You turn a job description into exactly ${QUESTION_COUNT} screening criteria for evaluating resumes.
Rules:
- Each question checks ONE thing and is answerable from documented professional experience in a resume.
- Prefer the job's explicit requirements; mark them "must". Use "nice" for preferred/bonus items.
- Never invent requirements that are not in the job description. source_span must be copied verbatim from it.
- Never use age, gender, origin, family status, religion, health, photos or personality as criteria.
- Do not infer ownership, company size or customer type from job titles; ask for explicit evidence.
- Years-of-experience requirements: set min_years; they are computed from dates in code.
- Weights: 3 = critical must-have, 2 = must-have, 1 = nice-to-have.`,
    prompt: `Job title: ${title}\n\nJob description:\n${description}`,
    output: Output.object({ schema }),
  });
  return { questions: output.questions, model: m.name, usage: { input: usage.inputTokens ?? 0, output: usage.outputTokens ?? 0 } };
}
