# STAR Maker — AI-Powered Career Story Builder

## Overview
STAR Maker helps students and early-career professionals turn their resume and experiences into polished STAR-format interview answers using AI. Users can upload a resume (PDF/DOCX), paste text, or manually enter experiences, then generate AI-powered STAR answers and customize them for specific companies.

Each user gets a private workspace via a shareable link — no sign-up required.

## Tech Stack
- **Frontend:** React + Vite + Tailwind CSS + Shadcn UI + Wouter (routing) + TanStack Query
- **Backend:** Express (Node.js/TypeScript)
- **Database:** PostgreSQL via Drizzle ORM
- **AI:** Anthropic Claude (via Replit AI Integrations) for resume parsing, STAR generation, and company customization
- **File Processing:** multer (uploads), pdftotext system tool (PDF), mammoth (DOCX)
- **Color Scheme:** Blue Eclipse palette (#272757, #8686AC, #505081, #0F0E47)

## Project Structure
```
client/src/
  pages/
    home.tsx              - Landing page, creates workspace on "Get Started"
    workspace-shell.tsx   - Wraps workspace-scoped pages with WorkspaceProvider
    experiences.tsx        - List experiences, upload/parse resume, add manually
    experience-detail.tsx  - View experience, generate STAR answers
    answer-bank.tsx        - Central library of all STAR answers (searchable)
  hooks/
    use-experiences.ts    - Experience CRUD + resume upload/parse hooks
    use-star-answers.ts   - STAR answer CRUD + generate/customize hooks
    use-companies.ts      - Company scrape hooks
  lib/
    workspace.tsx         - WorkspaceContext, useWorkspaceId hook, localStorage utils
    queryClient.ts        - TanStack Query client setup
  components/
    app-sidebar.tsx       - Navigation sidebar with "Copy Share Link" button
    layout.tsx            - Page layout wrapper
    star-answer-card.tsx  - STAR answer display with edit/delete/tailor

server/
  routes.ts    - All API endpoints with workspace middleware
  storage.ts   - Database storage layer (workspace-scoped queries)
  db.ts        - Database connection

shared/
  schema.ts    - Drizzle table definitions + Zod schemas + types
  routes.ts    - API contract (paths, input/output schemas)
```

## Workspace System
- Home page (/) creates a new workspace via POST /api/workspaces
- Workspace ID stored in localStorage for returning users
- All data scoped to workspace via `workspaceId` column
- Routes: /w/{workspaceId}/experiences, /w/{workspaceId}/answer-bank
- All API calls include X-Workspace-Id header
- "Copy Share Link" in sidebar lets users share their private workspace

## Key API Endpoints
- `POST /api/workspaces` - Create a new private workspace
- `GET /api/workspaces/:id` - Verify workspace exists
- `POST /api/experiences/upload` - Upload PDF/DOCX resume file
- `POST /api/experiences/parse` - Parse pasted resume text
- `POST /api/star-answers/generate` - AI-generate STAR answers for an experience
- `POST /api/star-answers/:id/customize` - Customize a STAR answer for a company
- `POST /api/companies/scrape` - AI-powered company profile research

## Database Tables
- `workspaces` - Private workspace containers (id varchar PK)
- `experiences` - User work/project/academic experiences (scoped to workspace)
- `star_answers` - Generated STAR format answers linked to experiences (scoped to workspace)
- `companies` - Target companies for answer customization (scoped to workspace)
