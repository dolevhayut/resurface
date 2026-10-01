# Product Hunt launch copy: Resurface

**Name:** Resurface
**Tagline (≤60):** Score any resume against any job, with quoted evidence
**Link:** https://getresurface.dev
**Also:** https://github.com/dolevhayut/resurface (open source demo)
**Topics:** Human Resources · Developer Tools · Artificial Intelligence · API
**Pricing:** Paid with a free plan (50 free scores, then $0.10 per resume)

**Description (≤260):**
An API for recruiting tools. Send a job description and a resume (PDF, DOCX, HTML or TXT); get a 0–100 score, a verdict for each screening question and the exact resume line behind it. 50 free scores, then $0.10.

**Maker comment:**
Hi Product Hunt 👋

Most companies have tens of thousands of resumes in their ATS that nobody searches again. I wanted to rescore them for every new role without paying LLM prices for every resume, and without trusting summaries a model wrote.

Resurface splits the work in two:
1. An LLM reads the job description once and writes 6–8 atomic screening questions.
2. A classification model (TypeSafe Jev) answers them for every resume and selects the line that proves each answer. The evidence is a quote from the resume, never generated text.

In my benchmark against Claude Sonnet 5.5 (20 resumes × 5 questions, list prices) it was 8× faster and 31× cheaper, with 99% of verdicts the same. The script is in the repo, so you can check the numbers.

• API: 50 free scores, then $0.10 per resume
• PDF, DOCX, HTML, TXT, in Hebrew and English
• Open-source demo with 100 fictional resumes: github.com/dolevhayut/resurface

Next: ATS integrations (Greenhouse, Ashby, JobAdder). Which one would you connect first?

**Gallery (1270×760, rendered @2x):** gallery/01-hero … 06-pricing · **Thumbnail:** gallery/00-thumbnail-240.png
