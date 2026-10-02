---
name: resurface-api
description: Score resumes against job descriptions with the Resurface API (getresurface.dev), which returns a 0–100 score, a verdict for each screening question and the verbatim resume line that proves it, for PDF, DOCX, HTML or TXT resumes. Use when writing or debugging code that calls the Resurface API, or when the user wants to screen, rank or rediscover candidates against a job with it.
---

# Resurface API

Resurface is a resume scoring API. Send a job description and a resume file (PDF, DOCX, HTML or TXT) and get back a 0–100 score, a verdict for every screening question, and the exact resume line that proves each answer. An LLM writes 6–8 screening questions once per job; a classification model (TypeSafe Jev) answers them for every resume and selects the evidence line, so quotes are copied from the resume, never generated. The first 50 scores are free, then $0.10 per resume.

## How to integrate
- Read the API key from the `RESURFACE_API_KEY` environment variable and call the API only from server-side code. Never send the key to a browser, commit it or log it. Keys are created in the dashboard (https://getresurface.dev/dashboard).
- Score with `POST https://getresurface.dev/api/v1/score`: the resume file as the multipart field `resume` (PDF, DOCX, HTML or TXT) and the job as the text field `job_description`, plus an optional `job_title`.
- The first call for a job returns `rubric.id`. Store it and send it as `rubric_id` for every other resume of that job: no drafting, about 0.25 s per call, and scores stay comparable.
- Show people the evidence, not just the number: each question's `verdict` and `evidence.text` (a verbatim resume line). `INSUFFICIENT_EVIDENCE` means unknown, not failed; use `range` and `coverage` to show uncertainty. Scores support a human decision and must not be the only reason to reject a candidate.
- Errors are JSON `{ "error": { "code", "message" } }`. On 429, back off and retry. On 502, retry once (the free credit was refunded). On 402, stop and report that the free scores are used up.
- When scoring many resumes, limit concurrency and stay under 60 scores per minute per account.

# Resurface API reference

Base URL: https://getresurface.dev/api/v1 · OpenAPI: https://getresurface.dev/api/v1/openapi.json · Human docs: https://getresurface.dev/docs

## Authentication
Send your API key as `Authorization: Bearer rs_live_…`. Create keys in the dashboard (https://getresurface.dev/dashboard) after signing up (https://getresurface.dev/sign-up). Keys are shown once and stored only as a hash.

## POST /v1/score
Score one resume against a job. Accepts `multipart/form-data` (for files) or JSON.

| Field | Type | Description |
|---|---|---|
| resume | file | PDF, DOCX, HTML or TXT, up to 5 MB (multipart). Or send resume_text. |
| resume_text | string | Plain-text resume, instead of a file. |
| job_description | string | Full job description (at least 40 characters). Questions are drafted and cached. |
| job_title | string | Optional; improves question drafting. |
| rubric_id | string | Reuse the questions of a previous score or of POST /v1/rubrics. |
| questions | array | Bring your own questions: strings, or objects { question, requirement: "must" or "nice", weight, min_years }. Max 12. |

Example:

```bash
curl https://getresurface.dev/api/v1/score \
  -H "Authorization: Bearer $RESURFACE_API_KEY" \
  -F job_title="Senior Full Stack Engineer" \
  -F "job_description=<job.txt" \
  -F resume=@candidate.pdf
```

Response fields:

| Field | Type | Description |
|---|---|---|
| score | 0–100 | Share of question weight backed by a quoted resume line. Missing information stays unknown, not contradicted: it lowers this score and widens `range`. |
| match | enum | strong_evidence, needs_verification or lower_evidence. |
| coverage | 0–1 | Share of question weight with a definite answer. |
| range | object | { lower, upper }: lower = score; upper if every unanswered question turned out true. |
| must_have_gaps | string[] | Must-have questions without evidence. |
| must_have_contradicted | string[] | Must-have questions the resume rules out. |
| questions[].verdict | enum | SUPPORTED, CONTRADICTED or INSUFFICIENT_EVIDENCE. |
| questions[].evidence | object or null | { line, text }: a verbatim resume line (ids start at L000). Present for SUPPORTED and CONTRADICTED. |
| questions[].computed | string | For years-of-experience questions: how the years were computed. |
| questions[].probabilities | object | Calibrated probability per verdict. |
| rubric | object | { id, source, questions }. Reuse rubric.id to score more resumes for the same job. |
| resume | object | { lines, language }. |
| billing | object | { billable, price_usd, free_remaining }. Also in the X-Resurface-Free-Remaining header. |
| latency_ms | number | Server time for this call. A new job description adds a few seconds for drafting; reused rubrics take about 0.25 s. |

## POST /v1/rubrics
Draft screening questions from { job_title, job_description } (JSON) without scoring a resume. Not charged; cached per job text; at most 30 new job descriptions per hour.

## GET /v1/rubrics/{id}
Return a rubric's questions.

## GET /v1/usage
Free scores remaining, totals and amount due.

## Errors
Errors are JSON: { "error": { "code", "message" } }.

| Status | Code | Meaning |
|---|---|---|
| 400 | invalid_request | Missing job or resume, or an unreadable file. |
| 401 | missing_api_key / invalid_api_key | Missing, invalid or revoked key. |
| 402 | free_tier_exhausted | The 50 free scores are used up and billing isn't enabled. |
| 404 | not_found | Unknown rubric_id. |
| 413 / 415 | invalid_request | File over 5 MB, or an unsupported type such as legacy .doc. |
| 429 | rate_limited / draft_rate_limited | Over 60 scores per minute, or over 30 new job descriptions per hour. |
| 502 | evaluator_unavailable | Scoring failed; the free credit is refunded automatically. |

## Pricing and limits
50 free scores per account, then $0.10 per scored resume. Drafting questions is free. 60 scores per minute per developer.
