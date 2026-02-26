# Product Requirements Document
## STAR Interview Coach — AI-Powered Career Story Builder

**Version:** 1.0  
**Date:** February 26, 2026  
**Stack:** Python (Backend + AI logic), Web Frontend

---

## 1. Product Overview

### 1.1 Problem Statement
Students and early-career professionals struggle to translate their work history and experiences into compelling, structured interview answers. They have the raw material — internships, projects, coursework, activities — but lack the framework and coaching to present it effectively, especially when tailored to a specific company or role.

### 1.2 Solution
STAR Interview Coach is a web application that ingests a student's resume and career experiences, uses AI to extract and structure them into best-in-class STAR format answers (Situation, Task, Action, Result), and then customizes those answers to align with a target company's values, culture, and priorities by scraping the company's website.

### 1.3 Target Users
- Undergraduate and graduate students preparing for internship or full-time interviews
- Early-career professionals transitioning roles
- University career center advisors (future phase)

---

## 2. Goals & Success Metrics

| Goal | Metric | Target |
|---|---|---|
| Help users generate quality STAR answers | Avg STAR answers generated per session | ≥ 5 |
| Drive company-specific customization | % of users who use the company customization feature | ≥ 60% |
| Ensure quality output | User satisfaction rating on generated answers | ≥ 4/5 stars |
| Retention | Users returning for a second company customization | ≥ 40% |

---

## 3. Core Features

### 3.1 Resume & Experience Ingestion

**Description:** Users upload their resume and optionally provide supplemental career context in free text (e.g., a project they want to highlight that isn't on the resume).

**Requirements:**
- Accept PDF and DOCX resume uploads
- Parse resume text using `pdfplumber` (PDF) and `python-docx` (DOCX)
- Display a parsed preview so the user can confirm extraction was accurate
- Allow users to manually add, edit, or remove experiences before STAR generation
- Support a free-text "career stories" input box for experiences not captured in the resume (e.g., a tough team situation, a leadership moment)

**Data Model — Experience:**
```
{
  id: uuid,
  type: "work" | "project" | "academic" | "leadership" | "other",
  title: str,
  organization: str,
  date_range: str,
  description: str,  # raw bullet points from resume or user input
  source: "resume_parsed" | "user_added"
}
```

---

### 3.2 AI-Powered STAR Generation

**Description:** For each experience, the AI generates one or more STAR format answers. Each STAR answer must adhere to industry best practices.

**Requirements:**

**STAR Structure Standards (enforce in prompt):**
- **Situation:** 2–3 sentences. Sets context. Specific, not generic. Includes the scale/stakes (team size, timeline, business context).
- **Task:** 1–2 sentences. Clearly states the student's specific responsibility or challenge — not the team's.
- **Action:** 3–5 sentences. First-person "I" (not "we"). Specific actions taken, methods used, tools employed. Demonstrates competencies (leadership, problem-solving, communication, etc.).
- **Result:** 2–3 sentences. Quantified where possible (%, $, time saved, users reached). States both immediate outcome and broader impact. If no hard metric, describes qualitative impact credibly.

**Quality Rules (enforce in prompt):**
- No vague language ("I helped the team," "we worked together")
- No passive voice in the Action section
- Results must be specific — flag if result is unquantified and prompt user to add a number
- Each answer targets a specific competency or behavioral theme (e.g., "Leadership," "Conflict Resolution," "Data Analysis," "Dealing with Ambiguity")
- Aim for 90–150 words per STAR answer (spoken in ~60–90 seconds)

**AI Behavior:**
- Use Claude API (claude-sonnet-4-6 or claude-haiku-4-5) for generation
- System prompt establishes the role: "You are an expert interview coach with 15+ years of experience coaching students at top universities for Fortune 500 and startup interviews."
- Generate 2–3 STAR answer variations per experience with different competency angles
- Label each answer with the competency it demonstrates
- Flag weak or unquantified results with an inline suggestion to strengthen them

**User Controls:**
- Regenerate individual STAR answers with feedback ("Make the result more quantified," "Make this more concise," "Focus on leadership angle")
- Edit any section of a STAR answer inline
- Save answers to a personal Answer Bank

---

### 3.3 Company Customization Engine

**Description:** Users search for a target company by name or URL. The app scrapes publicly available information about the company and uses it to tailor STAR answers to resonate with that company's values and culture.

**Requirements:**

**Company Entry — Two Input Methods:**
- **Search by name (primary):** A type-ahead search box where users type a company name (e.g., "Google", "McKinsey", "Stripe"). The app uses the Google Places API or Clearbit's free company logo/domain API to resolve the company's primary domain automatically. Display results as a dropdown with company name, logo, and industry so users can confirm the right company.
- **Enter URL manually (fallback):** For smaller or less-known companies not found via search, users can paste a URL directly. This is also the default if the name lookup fails.
- Once a company is selected either way, display the resolved URL and allow the user to override it (e.g., point directly to the careers page instead of the homepage) before scraping begins.

**Company Research (Backend):**
- Accept a resolved company website URL
- Scrape the following pages using `requests` + `BeautifulSoup`:
  - Homepage
  - About / Mission / Values page
  - Careers / Culture page
  - Recent news or blog posts (optional, best-effort)
- Extract: company mission statement, core values, culture keywords, product/service focus areas, recent initiatives
- Fall back gracefully if pages are inaccessible (robots.txt, JS-rendered content) — notify user and allow manual input
- For JS-heavy sites, use `playwright` (Python) as a fallback scraper

**Customization AI Logic:**
- After scraping, send company context + user's STAR answers to Claude API
- Prompt instructs the AI to:
  - Reframe the Situation to reference industry/domain relevant to the company
  - Adjust Action language to echo the company's stated values and competency language
  - Align Results framing to what the company cares about (e.g., scale for a startup vs. process for a large corp)
  - Suggest which 3–5 STAR answers from the Answer Bank are strongest for this specific company and why

**Output:**
- Side-by-side view: Original STAR answer vs. Company-Customized version
- "Why this works for [Company]" explanation — a 2-sentence rationale
- A recommended "Top 5 Stories for [Company]" shortlist

**Data Model — Company Profile:**
```
{
  id: uuid,
  name: str,
  url: str,
  scraped_at: datetime,
  mission: str,
  values: list[str],
  culture_keywords: list[str],
  industry: str,
  raw_text_summary: str  # truncated for prompt use
}
```

---

### 3.4 Answer Bank & Interview Prep View

**Description:** A central library of all saved STAR answers, organized by competency and company.

**Requirements:**
- Filter answers by: competency, company, experience source
- Each answer shows: competency tag, word count, quality score (AI-generated 1–5), company customizations applied
- "Interview Mode" — presents one STAR question at a time, hides the answer, lets user practice recall, then reveals the full answer
- Export to PDF — a clean, formatted PDF of selected STAR answers for offline review
- Export to DOCX — formatted answer sheet suitable for printing

---

### 3.5 STAR Question Suggester

**Description:** Given a target company and role, suggest the most likely behavioral interview questions and map them to the user's strongest STAR answers.

**Requirements:**
- User inputs: company name + job title/role
- AI generates 10–15 likely behavioral questions based on role and company research
- Each question is mapped to the best-fit STAR answer from the user's Answer Bank
- Gaps identified: questions that don't have a strong answer yet → prompts user to generate a new one

---

## 4. User Flow

```
1. Onboarding
   └── Upload resume OR paste text → Parse & review experiences

2. STAR Generation
   └── Select experience → Generate STAR answers → Review & edit → Save to Answer Bank

3. Company Customization
   └── Enter company URL → Scrape & build company profile → Customize saved answers → View tailored answers

4. Interview Prep
   └── Review Answer Bank → Use Interview Mode to practice → Export PDF/DOCX
```

---

## 5. Technical Architecture

### 5.1 Tech Stack

| Layer | Technology |
|---|---|
| Language | Python 3.11+ (all backend logic) |
| Web Framework | FastAPI |
| Frontend | Jinja2 templates + HTMX (or simple React if preferred) |
| AI | Anthropic Claude API (`anthropic` Python SDK) |
| Resume Parsing | `pdfplumber` (PDF), `python-docx` (DOCX) |
| Web Scraping | `requests` + `BeautifulSoup4`, `playwright` (fallback) |
| Database | SQLite (dev) → PostgreSQL (prod) via `SQLAlchemy` |
| PDF Export | `reportlab` or `weasyprint` |
| DOCX Export | `python-docx` |
| Auth | Simple email/password via `passlib` + `JWT` (or OAuth via Google) |
| Deployment | Replit (dev) → Railway or Render (prod) |

### 5.2 Key Python Modules

```
app/
├── main.py                  # FastAPI app entry point
├── routers/
│   ├── resume.py            # Upload & parse resume
│   ├── star.py              # STAR generation endpoints
│   ├── company.py           # Company scraping & customization
│   ├── bank.py              # Answer bank CRUD
│   └── export.py            # PDF/DOCX export
├── services/
│   ├── resume_parser.py     # pdfplumber + python-docx logic
│   ├── star_generator.py    # Claude API calls for STAR generation
│   ├── company_scraper.py   # BeautifulSoup + Playwright scraper
│   ├── customizer.py        # Claude API calls for customization
│   └── exporter.py          # PDF/DOCX generation
├── models/
│   ├── experience.py        # SQLAlchemy models
│   ├── star_answer.py
│   └── company.py
├── prompts/
│   ├── star_generation.txt  # System + user prompt templates
│   ├── customization.txt
│   └── question_suggester.txt
└── utils/
    ├── text_cleaner.py
    └── scraper_helpers.py
```

### 5.3 Claude API Usage Pattern

```python
# services/star_generator.py (illustrative)
import anthropic

client = anthropic.Anthropic()

def generate_star_answers(experience: dict, company_context: dict = None) -> list[dict]:
    system_prompt = open("prompts/star_generation.txt").read()
    user_message = f"""
    Experience:
    {experience['description']}
    
    {"Company Context: " + str(company_context) if company_context else ""}
    
    Generate 3 STAR format answers for this experience, each targeting a different competency.
    Return JSON array with keys: competency, situation, task, action, result, word_count, quality_notes.
    """
    
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2000,
        system=system_prompt,
        messages=[{"role": "user", "content": user_message}]
    )
    return parse_star_response(response.content[0].text)
```

---

## 6. Prompts (Core Logic)

### 6.1 STAR Generation System Prompt (Key Elements)
- Role: Expert interview coach, 15+ years experience
- Audience: Students targeting competitive internships and full-time roles
- Standards: McKinsey/Google/Goldman interview prep quality
- Rules: First-person, quantified results, no vague language, 90–150 words per answer
- Output: Structured JSON

### 6.2 Customization System Prompt (Key Elements)
- Incorporate company values and culture vocabulary naturally (not robotically)
- Preserve factual accuracy — do not fabricate or embellish results
- Adjust framing and emphasis, not the facts
- Explain customization rationale briefly

---

## 7. UI/UX Requirements

### Key Screens:
1. **Dashboard** — Resume upload, experience list, recent STAR answers
2. **Experience Detail** — View parsed experience, manage STAR answers for it
3. **STAR Editor** — Side-by-side STAR sections with inline editing and regenerate controls
4. **Company Customizer** — URL input, scraped profile preview, customized answer view
5. **Answer Bank** — Filterable library of all answers with company tags
6. **Interview Mode** — Full-screen practice view, question-first reveal
7. **Export** — Select answers, choose format (PDF/DOCX), download

### UX Principles:
- Every AI generation must show a loading state with estimated wait time
- Users can always edit AI output — nothing is locked
- Quality flags (unquantified results, vague language) shown as inline yellow highlights, not blocking errors
- Mobile-friendly for on-the-go prep

---

## 8. Out of Scope (V1)

- Mock interview video/audio recording
- Peer review or sharing features
- ATS resume optimization
- Integration with LinkedIn
- Multi-language support
- Career advisor / admin dashboard

---

## 9. Phased Rollout

### Phase 1 — MVP (Weeks 1–4)
- Resume upload and parsing
- STAR generation for individual experiences
- Answer bank with save/edit/delete
- Basic PDF export

### Phase 2 — Company Customization (Weeks 5–7)
- Company URL scraper
- Customized STAR answer generation
- Top 5 story recommendations

### Phase 3 — Practice & Polish (Weeks 8–10)
- Interview Mode
- STAR Question Suggester
- DOCX export
- Quality scoring and improvement suggestions

---

## 10. Open Questions for Builder

1. **Auth:** Should we use Google OAuth for simplicity, or is email/password sufficient for MVP?
2. **Scraping reliability:** Some company career pages are heavily JS-rendered (Workday, Greenhouse). Should we include `playwright` from day one or add it in Phase 2?
3. **Rate limiting:** Claude API calls can add up. Should we add per-user daily generation limits in MVP?
4. **Storage:** Are resume files stored server-side, or processed in-memory and discarded for privacy?
5. **Streaming:** Should Claude responses stream to the UI for a better UX, or is a loading spinner acceptable for MVP?
6. **Company search API:** Clearbit's domain lookup is free for low volume; Google Places API requires a key but is more reliable. Which should be the default for company name → URL resolution?

---

## 11. Environment Variables Required

```
ANTHROPIC_API_KEY=
DATABASE_URL=
SECRET_KEY=          # JWT signing
MAX_RESUME_SIZE_MB=5
SCRAPER_TIMEOUT_SECONDS=15
CLEARBIT_API_KEY=    # optional, for company name → domain lookup
GOOGLE_PLACES_API_KEY=  # optional fallback for company search
```

---

*This PRD is intended for a developer building in Python on Replit or Claude Cowork. All AI calls use the Anthropic Python SDK. The app should be fully functional as a single-developer MVP build.*
