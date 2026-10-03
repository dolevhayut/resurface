# Resurface for Claude

Score resumes against a job description without leaving Claude. For every resume you get a 0–100 score, a verdict for each screening question (SUPPORTED, INSUFFICIENT_EVIDENCE or CONTRADICTED) and the exact resume line behind each verdict, copied word for word, so a recruiter can check every answer.

Resurface is a resume scoring API (https://getresurface.dev). This plugin connects Claude to it.

## What's inside

- **MCP server** `resurface` at `https://getresurface.dev/api/mcp` with three tools:
  - `score_resume`: scores one resume against a job description or a saved rubric. Uses one score.
  - `draft_screening_questions`: turns a job description into 6–8 screening questions and returns a reusable rubric id. Free.
  - `get_usage`: shows your remaining free and prepaid scores. Free.
- **Skill `screen-candidates`**: the workflow for screening and ranking a batch of resumes, with quoted evidence.
- **Skill `resurface-api`**: the API reference and integration rules, for when you're building Resurface into your own HR product.

## Install

In Claude Code:

```
/plugin marketplace add dolevhayut/resurface
/plugin install resurface@resurface
```

In Claude, you can also add it from Customize → Plugins (search for Resurface).

The first time Claude uses a Resurface tool, it asks you to sign in with your Resurface account (Google, GitHub or email; the same account as https://getresurface.dev/dashboard). There is no key to copy. A new account starts with 50 free scores; after that, prepaid packs start at $10 for 100 scores. In Claude Code you can also sign in from `/mcp` → `resurface` → Authenticate.

Prefer an API key, for example in CI or scripts? Skip the plugin's server and add it yourself:

```
claude mcp add --transport http resurface https://getresurface.dev/api/mcp --header "Authorization: Bearer rs_live_…"
```

Then ask, for example: "Rank the resumes in ./candidates against this job description."

## What the plugin sends, and where

- The plugin calls one service: `https://getresurface.dev/api/mcp`. You sign in through OAuth (Resurface uses Clerk for accounts); Claude stores the access token, and the plugin itself holds no credentials.
- When you score, it sends the job description and the resume text (or the file, if you ask for that) to Resurface.
- Resurface reads the resume in memory and does not store the file or its full text. It keeps a hash of the resume and the result, including the short quoted lines. Job descriptions and their questions are saved as a rubric in your account.
- Resurface uses TypeSafe (the Jev model) to answer the questions, Cloudflare Workers AI as an automatic fallback, and Anthropic to draft questions from the job description. Full details: https://getresurface.dev/privacy

The plugin has no hooks and runs no local commands or scripts.

## Use scores responsibly

A score supports a human decision. It should never be the only reason to reject a candidate. `INSUFFICIENT_EVIDENCE` means the resume doesn't say, not that the candidate lacks the skill.

## Links

- Docs: https://getresurface.dev/docs
- Terms: https://getresurface.dev/terms
- Privacy: https://getresurface.dev/privacy
- Support: https://github.com/dolevhayut/resurface/issues

License: MIT
