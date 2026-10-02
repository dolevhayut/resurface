# Product Hunt launch copy: Resurface

**Name:** Resurface
**Tagline (≤60):** Score any resume against any job, with quoted evidence
**Link:** https://getresurface.dev
**Also:** https://github.com/dolevhayut/resurface (open source)
**Topics:** Human Resources · Developer Tools · Artificial Intelligence · API
**Pricing:** Paid with a free plan (50 free scores, 100 for Hunters; then packs from $10 per 100 scores)

**Description (≤500):**
An API for recruiting tools. Send a job description and a resume (PDF, DOCX, HTML or TXT); get a 0–100 score, a verdict for each screening question and the exact resume line behind it. An LLM writes the questions once; a classification model (TypeSafe Jev) answers them for every resume, 8× faster than an LLM, with every quote copied from the resume. Try it in the browser, no code. 50 free scores (100 for Hunters). Open source on GitHub.

**Maker comment:**
Hi Product Hunt 👋

Most companies have tens of thousands of resumes in their ATS that nobody searches again. I wanted to rescore them for every new role, fast, and without trusting summaries a model wrote.

Resurface splits the work in two:
1. An LLM reads the job description once and writes 6–8 atomic screening questions.
2. A classification model (TypeSafe Jev) answers them for every resume and selects the line that proves each answer. The evidence is a quote from the resume, never generated text.

In my benchmark against Claude Sonnet 5.5 (20 resumes × 5 questions) it was 8× faster per resume, with 99% of verdicts the same. The script is in the repo, so you can check the numbers.

• Try it without code: sign up and open "Try it" in the dashboard. Sample resumes are ready.
• Hunters get 100 free scores instead of 50 this week.
• API for PDF, DOCX, HTML or TXT, then packs from $10 per 100 scores.
• Open source with 100 fictional resumes: github.com/dolevhayut/resurface

Next: ATS integrations (Greenhouse, Ashby, JobAdder). Which one would you connect first?

**Gallery (1270×760, rendered @2x):** gallery/01-hero … 06-pricing · **Thumbnail:** gallery/00-thumbnail-240.png
