---
name: screen-candidates
description: Screen and rank resumes against a job description with the Resurface MCP tools (score_resume, draft_screening_questions, get_usage), showing the exact resume line behind every verdict. Use when the user asks to score, screen, shortlist, compare or rank candidates or resumes for a job.
---

# Screen candidates with Resurface

The Resurface MCP server scores one resume against one job per call. Each call returns a 0–100 score, a verdict for every screening question (SUPPORTED, INSUFFICIENT_EVIDENCE or CONTRADICTED) and the resume line that proves it, copied verbatim.

## Workflow

1. **Get the job.** Ask for the job description if the user hasn't given one. A job title helps.
2. **Check the balance before a batch.** Every `score_resume` call uses one score. Call `get_usage` first when there is more than a handful of resumes, and tell the user how many scores the batch will use.
3. **Draft the questions once.** Call `draft_screening_questions` with the job description (it's free and cached), show the user the questions, and keep the returned `rubric_id`.
4. **Score every resume with the same `rubric_id`**, so scores for one job are comparable.
   - Pasted text: pass it as `resume_text`.
   - A file in the workspace: read it and pass its text as `resume_text`. Use `resume_file_base64` with `resume_filename` only when the user asks for the original file to be sent.
   - Score resumes one at a time and stop on the first error the tool returns, then report it.
5. **Report.** Rank by score in a table: candidate, score, match, must-have gaps. Under the table, quote the evidence line for each must-have question of the top candidates.

## How to present results

- Show the quoted evidence, not only the number. The quote is what a recruiter can check.
- `INSUFFICIENT_EVIDENCE` means the resume doesn't say, not that the candidate fails. Suggest asking the candidate.
- A score supports a human decision. Don't recommend rejecting anyone on the score alone, and don't infer age, gender, ethnicity or other protected traits from a resume.
- Resumes contain personal data. Don't copy them anywhere the user didn't ask for.

## Errors

- `402`: the free scores are used up. Tell the user to buy a pack at https://getresurface.dev/dashboard.
- `401` or a sign-in prompt: the Resurface connection isn't signed in, or the session expired. Ask the user to sign in again (in Claude Code: `/mcp` → `resurface` → Authenticate).
- `429`: too many requests. Wait a few seconds and continue.
