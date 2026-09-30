<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="brand/resurface-logo-white.svg">
    <img src="brand/resurface-logo.svg" alt="Resurface" width="360">
  </picture>
</p>

<p align="center">
  <b>Language models write. Classification models decide.</b><br>
  Turn the candidate database you already have into evidence-backed shortlists.<br>
  An LLM writes the screening questions once per job. A classification model answers them for every resume, and quotes the exact line that proves each answer.
</p>

<p align="center">
  <a href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fdolevhayut%2Fresurface&project-name=resurface&repository-name=resurface"><img src="https://vercel.com/button" alt="Deploy with Vercel"></a>
</p>

<p align="center"><img src="docs/screenshots/landing.png" alt="Resurface landing page" width="100%"></p>

## Why a classifier, not an LLM

Screening a resume against a job is a **decision**, not an essay. We ran the same 20 resumes through the same screening questions twice, with a System One classification model and with two general LLMs (`scripts/benchmark.mts`):

| | **TypeSafe JEV** (classifier) | Claude Sonnet 5.5 | Claude Haiku 4.5 |
|---|---|---|---|
| Median time per resume | **0.29 s** | 2.5 s | 1.7 s |
| Cost per resume | **$0.00018** | $0.0057 (31×) | $0.0019 (10×) |
| Verdicts identical to Sonnet 5.5 | **99%** | — | 93% |
| Same answer on a re-run | **100%** | 100% | 98% |
| 185,000 resumes × 20 jobs | **≈ $680** | ≈ $21,000 | ≈ $7,100 |
| Output | one of *your* options, plus a probability | generated text / JSON | generated text / JSON |
| Evidence | picks a resume line ID, so the quote is copied and can't be invented | writes the quote | writes the quote |

**New challenger:** on 29 Sep 2026 OpenAI announced a *Decisions API* built on GPT-6 Luna (limited preview, ~150 ms claimed). It has no public endpoint, schema or pricing yet, so it isn't in the table. It will be added the day it can be measured with the same script.

On this sample the LLMs were accurate too. The difference is cost, speed, and guarantees that come from the design instead of from verification. LLMs still do the part they're best at here: turning a job post into 6–8 atomic questions, once per job. *A small synthetic benchmark: directional, not a certification.*

## How it works

```
Job description ──LLM (1 call per job)──▶ 6–8 atomic questions, each tied to a verbatim line of the posting
                                          │  recruiter reviews & approves → frozen rubric version
Every resume ──classifier (1 call each)───┴─▶ per question: SUPPORTED / CONTRADICTED / INSUFFICIENT_EVIDENCE
                                              + the resume line that proves it (selected, never generated)
code ▶ years of experience from dates (overlaps merged) · score = weight backed by quotes ÷ total · coverage
```

<table>
  <tr>
    <td><img src="docs/screenshots/results.png" alt="Results grouped by evidence"></td>
    <td><img src="docs/screenshots/evidence.png" alt="Evidence drawer with exact quotes"></td>
  </tr>
</table>

## What's inside

- **Guided demo:** a narrated 10-step tour (Hebrew/English). A job with no candidates gets its questions drafted live, then 10 resumes stream through the classifier, each with a score.
- **Evidence-first results:** candidates are grouped into Strong evidence / Needs verification / Lower / Not evaluated. The evidence drawer jumps to each source line. Anything unproven turns into an interview check, and missing information never counts as a rejection.
- **Ask the pool:** plain-language requests ("owned production on-call, even if not titled DevOps") are run against every resume.
- **Reverse match:** check one resume against every open job.
- **Runs:** frozen rubric versions and candidate snapshots, staged cascade for larger rubrics, retries with backoff, pause/resume/cancel, budget cap, idempotency keys.
- **Import:** PDF, DOCX, TXT and CSV, with de-duplication by content hash and versioning by email.
- **Recruiter tools:** shortlists, compare up to 3, CSV export, roles (admin / recruiter / hiring manager), audit log, usage metering.
- **Safety:** resumes are treated as untrusted input (a prompt-injection CV is included in the demo set), contact details are redacted before evaluation, and questions that touch protected attributes are flagged.
- **Demo data:** 100 fictional resumes and 20 jobs, plus precomputed classifier results so a fresh deploy is never empty.

## Run it

```bash
pnpm install
cp .env.example .env.local   # optional keys, see below
pnpm dev                     # http://localhost:3000 → landing; /overview → app
```

| Variable | What it enables |
|---|---|
| `TYPESAFE_API_KEY` | Live evaluation with TypeSafe **JEV** ([docs](https://docs.typesafe.ai)). Without it, an offline keyword heuristic is used, and labelled as such everywhere. |
| `ANTHROPIC_API_KEY` or `AI_GATEWAY_API_KEY` | Live LLM drafting of questions for new jobs. Without it, the classifier marks each job-description line as must / nice / not a requirement instead. |

No key is required to deploy: the demo ships with real precomputed results for 19 jobs.

**Scripts:** `pnpm seed` regenerates demo data · `pnpm snapshot` bakes completed runs into the seed · `pnpm benchmark` re-runs the model comparison (needs both keys).

### Deploy notes
The Vercel deployment is a **single-instance demo**: state lives in `/tmp` and resets on a cold start, and run progress is driven by the polling requests. For production, swap the JSON store for Postgres and the in-process worker for a durable queue. The store's entity shapes already mirror that design (`src/lib/types.ts`).

## Stack
Next.js 16 · React 19 · Tailwind v4 · motion · Phosphor icons · `@typesafe-ai/sdk` · AI SDK · Anthropic.
Motion primitives adapted from [21st.dev](https://21st.dev) (ibelick, cnippet-dev). Imagery and logo generated with fal (Nano Banana 2).

## License
MIT. All people and companies in the demo data are fictional.
