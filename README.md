# CVLeap — Talent Engine MVP

**Turn your existing candidate database into your next shortlist.** A search layer that sits on top of an ATS: every job becomes a handful of explicit screening questions, and every resume in the pool is judged against them by TypeSafe **JEV**. Each verdict comes with the exact resume line that supports it.

Built from `Talent-Engine-Handoff/01-PRD.md` (v1.0).

## The demo in 60 seconds
1. `pnpm install && pnpm dev` → http://localhost:3000
2. **Overview → "Evaluate pool for all 20 jobs"**: 20 jobs × 100 resumes ≈ 2,000 JEV evaluations, ~40s, ~$0.46.
3. Open any job → results grouped into *Strong evidence / Needs verification / Lower evidence / Not evaluated*. Click a candidate to see each question's verdict, the quoted source line (click → jumps to it in the resume), and interview checks for anything not established.
4. **Ask the pool**: plain-English request ("an engineer who owned production on-call, even if not titled DevOps") → ranked resumes with the supporting line.
5. **Candidate → Match to open jobs**: reverse search from one resume to every open role.

## Pipeline
```
Job description ──LLM──▶ 6 atomic questions (each tied to a verbatim JD span, reviewed & approved)
                          │  frozen rubric version + candidate snapshot
Resume (lines L000…) ─────┴─JEV─▶ per question: Choice SUPPORTED / CONTRADICTED / INSUFFICIENT_EVIDENCE
                                                + Choice over line ids → exact evidence quote
                             code ▶ years-of-experience computed from dates (overlaps merged)
                             code ▶ score = weight backed by quoted evidence ÷ total, coverage, range
```
- One JEV request per resume answers all questions (verdict + evidence line for each). Larger rubrics (>8) cascade: must-haves for everyone first, the rest for candidates who advance.
- Evidence is *selected*, not generated: it's always a verbatim resume line, so citations can't be hallucinated.
- Missing information never counts as a failure. Evaluator confidence stays in the details view and is never shown as a match %.
- Resumes are untrusted input (a prompt-injection CV is included in the demo set and scores low). Contact details are redacted before evaluation.

## Data
- `data/seed/seed.json`: **100 fictional resumes** (20 job families, with strong, semantic-only, partial and career-changer profiles, plus a Hebrew CV, an undated CV and a prompt-injection CV), **20 job descriptions**, and **6 pre-drafted questions per job** so the demo runs without an LLM key. Regenerate with `pnpm seed`.
- `data/db.json`: local state (runs, evaluations, shortlists, audit). Delete it or use *Settings → Reset demo data* to start over.

## Keys
See `.env.example`. `TYPESAFE_API_KEY` enables JEV (otherwise an offline keyword heuristic is used and labelled as such). `ANTHROPIC_API_KEY` or `AI_GATEWAY_API_KEY` enables live LLM question drafting for new jobs.

## What's implemented from the PRD
Import (PDF/DOCX/TXT/CSV, dedup by content hash, versioning by email, parse failures kept separate) · editable rubric with source spans, must/nice, weights, flagged manual/protected criteria, approve-to-freeze + duplicate-to-edit · run preview with cost estimate and budget cap · durable-style orchestration (task states, leases, idempotency keys, retry with backoff + jitter, per-task checkpoints, pause/resume/cancel/retry-failed, fair global concurrency) · provisional results with coverage counter · re-weighting without re-evaluation · evidence drawer, compare (up to 3), shortlist, "not a match" feedback · CSV export · tombstone deletion · role-based permissions (admin / recruiter / hiring manager) · audit log · usage metering.

**MVP simplifications:** a single-process JSON store plus in-process worker stand in for the planned Postgres + Redis/BullMQ + separate worker (the entity shapes match PRD §10). Auth is a role switcher. There's no OCR and no ATS connector.

## Stack
Next.js 16 (App Router) · React 19 · Tailwind v4 · motion · Phosphor icons · `@typesafe-ai/sdk` · AI SDK. Pine/Lemon palette, Geist + Noto Sans Hebrew, light + dark.
