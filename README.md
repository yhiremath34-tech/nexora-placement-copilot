# NEXORA — AI Placement Co-Pilot for Students (PS-06)
> Built for the AGENTX Hackathon 2026. An autonomous, fact-grounded career co-pilot that turns student resumes into personalized job-search workflows, explainable match intelligence, and human-verified application packages.

---

## 🌟 Overview & Key Innovations

Nexora solves the critical friction points facing college students entering the workforce: generic resumes, noisy job boards, black-box ATS algorithms, and the danger of AI-generated hallucinations.

1. **Fact-Grounded Resume ATS Parser**: Extracts technical competencies, coursework, and projects from PDF/DOCX resumes. Strictly sanitizes untrusted input against prompt-injection attacks.
2. **Genuine Job Discovery**: Connects directly to the live public Remotive API for verified remote roles. Features a deterministic demo fixture fallback mode when offline.
3. **Explainable Match Intelligence**: Generates an honest 0–100 compatibility score with matched evidence citations, missing skills, and uncertainty disclosures.
4. **Zero-Hallucination Tailored Applications**: Generates role-specific resume bullet points and cover letters grounded strictly in verified student profile facts.
5. **Strict Human-in-the-Loop State Machine**: Enforces `draft → pending_approval → approved → submitted` with single-use cryptographic tokens and SHA-256 document parity checks. Stops before external submission.
6. **User-Scoped Persistent Memory**: Full multi-tenant data isolation governed by PostgreSQL Row-Level Security (RLS) policies. Includes user data inspection and one-click data purging.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS v4.
- **Component System & Icons**: Custom Dark Charcoal & Navy design tokens, Lucide Icons, Glassmorphism panels.
- **Backend & Database**: Supabase (PostgreSQL with RLS), Supabase Edge Function (`career-agent`).
- **AI Engine**: Google Gen AI SDK (`@google/genai`), multi-turn Gemini function calling with 10 typed tools.
- **Job Data Source**: Remotive Public API (`https://remotive.com/api/remote-jobs`).
- **Testing**: Vitest with unit & integration test coverage for parsers, security gating, and agent tools.
- **Deployment**: Vercel ready (`vercel.json`), zero client-side credential exposure.

---

## 🗄️ Database Architecture (10 Supabase Tables)

The complete SQL migration is located in [`supabase/migrations/20261024000000_create_nexora_schema.sql`](file:///c:/Users/hp/AGENT%20X/supabase/migrations/20261024000000_create_nexora_schema.sql):

1. `profiles`: Full name, degree, major, university, GPA, bio, LinkedIn, GitHub, portfolio.
2. `resumes`: Original document, parsed raw text, extracted skills, projects, strengths, and skill gaps.
3. `career_preferences`: Target roles, preferred locations, remote preference, minimum compensation.
4. `agent_sessions`: Multi-turn conversational sessions and goal state.
5. `agent_messages`: Message history (user, assistant, tool_call, tool_result).
6. `saved_jobs`: Bookmarked opportunities with compatibility scores and match explanations.
7. `application_drafts`: Grounded tailored resume summaries, bullet points, and cover letters.
8. `approval_requests`: Human approval records with single-use tokens, document hashes, and expiration timestamps.
9. `applications`: Pipeline tracker (`saved`, `applied`, `screening`, `interviewing`, `offer`, `rejected`).
10. `agent_tool_logs`: Execution audit log with latency and sanitized input/output parameters.

---

## 🚀 Quick Start Guide (Beginner Friendly)

### 1. Prerequisites
- **Node.js**: v18.0.0 or later (Tested on Node v22)
- **npm**: v9.0.0 or later

### 2. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/nexora-placement-copilot.git
cd nexora-placement-copilot
npm install
```

### 3. Environment Setup
Copy the example environment configuration:
```bash
cp .env.example .env
```

Configure your variables in `.env` (optional for local evaluation):
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
GEMINI_API_KEY=your-gemini-api-key-here
```
> **Note**: Nexora includes a zero-config local persistent store. You can run and test the full application immediately without signing up for third-party cloud services!

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5. Run Automated Tests
```bash
npm test
```
Executes all 19 unit & integration tests across parsers, matching algorithms, security gating, and agent tool execution.

### 6. Production Build
```bash
npm run build
```

---

## 🤖 The 10 Backend Agent Tools

Nexora implements real server-side tool schemas for Gemini function calling:

| Tool Name | Purpose | Consequential / External |
| :--- | :--- | :--- |
| `get_student_profile` | Loads authenticated candidate's verified profile facts | No |
| `analyze_resume` | Extracts structured skills, projects, and target role gaps | No |
| `search_jobs` | Queries genuine listings from Remotive public API | No |
| `match_jobs` | Calculates 0–100 compatibility score & missing skills | No |
| `generate_application_draft` | Synthesizes tailored summary & cover letter from facts only | No |
| `save_job` | Saves verified listing into candidate dashboard | No |
| `save_application_draft` | Persists tailored application draft for human inspection | No |
| `get_application_status` | Queries application tracker and pending approval count | No |
| `request_application_approval` | Registers single-use approval request; halts submission | No |
| `submit_approved_application` | Executes submission only after verifying human signature | **Yes (Protected)** |

---

## 🛡️ Human-in-the-Loop Approval State Machine

To prevent autonomous AI agents from submitting unauthorized applications or hallucinating credentials:

```
[ Tailored Draft Created ]
           │
           ▼
[ request_application_approval ] ──> Status: pending_approval (Single-Use Token Issued)
           │
           ├── (Explicit Student Review & Confirmation) ──> Status: approved
           │
           ▼
[ submit_approved_application ]
           │
           ├─ 1. Verify token exists & matches authenticated user
           ├─ 2. Verify token is NOT expired (< 15 mins)
           ├─ 3. Verify single-use flag (is_used === false)
           ├─ 4. Verify document hash parity (prevents tampering)
           │
           ▼
[ Token Consumed (is_used = true) ] ──> Status: submitted ──> Added to Application Tracker
```

---

## 🎬 3-Minute Repeatable Demo Script

1. **Instant Evaluator Login**: On the landing page or login screen, click **"Quick Demo Login"** to enter as pre-loaded student candidate *Alex Chen* (CS Senior, 3.85 GPA).
2. **Resume Radar**: Navigate to **Resume Intelligence** tab. Review verified technical skills, extracted projects, and the Target Role Gap Radar.
3. **Execute Agent Co-Pilot**: Go to the **Command Center** dashboard. In the agent prompt bar, click the pre-filled prompt:
   > *"Find remote AI internships suitable for my current skills, explain my top matches, and prepare an application for the best one."*
4. **Watch Step-by-Step Tool Trace**: Observe real backend execution across tools: `get_student_profile` → `analyze_resume` → `search_jobs` (Remotive API) → `match_jobs` → `generate_application_draft` → `request_application_approval`.
5. **Human Approval Modal**: Notice the agent halts before external submission and opens the **Human Review & Approval Modal** featuring the single-use token and verified facts grounding.
6. **Authorize Submission**: Click **"Authorize & Register Submission"**. Watch the state machine transition to `submitted` and record the application in the **Application Workspace** tracker!
7. **Inspect & Purge Memory**: Navigate to **Settings & Security**. View the active memory record counts and test the data purge guarantee.

---

## 🚢 Deployment Instructions (Vercel & Supabase)

### Deploying to Vercel
1. Push your repository to GitHub.
2. In Vercel, click **"Add New Project"** and import the repository.
3. In **Environment Variables**, configure:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`
4. Click **Deploy**. Vercel will automatically build the Vite production bundle and serve the app on global edge CDN.

### Deploying Supabase Database & Edge Function
1. Log into Supabase Dashboard and create a new project.
2. In SQL Editor, paste and run [`supabase/migrations/20261024000000_create_nexora_schema.sql`](file:///c:/Users/hp/AGENT%20X/supabase/migrations/20261024000000_create_nexora_schema.sql).
3. Deploy the Edge Function using Supabase CLI:
   ```bash
   supabase functions deploy career-agent
   supabase secrets set GEMINI_API_KEY=your_key_here
   ```

---

## 📋 Hackathon Feature Checklist

- [x] Phase A: React + TypeScript + Vite frontend with Tailwind v4 dark charcoal/navy styling.
- [x] Phase A: Supabase 10-table SQL schema with UUID PKs, indexes, and user-scoped RLS policies.
- [x] Phase A: Authentication provider with cloud Supabase and offline persistent store fallback.
- [x] Phase B: ATS resume parser with file size/type validation and anti-prompt injection sanitization.
- [x] Phase B: Genuine Remotive API integration with live listings and deterministic fixture fallback mode.
- [x] Phase B: Explainable Match Engine (0–100 compatibility rating, matching evidence, missing skills).
- [x] Phase C: Gemini function calling orchestrator with 10 real backend tools and tool execution timeline.
- [x] Phase C: Persistent multi-turn agent sessions.
- [x] Phase D: Zero-hallucination tailored resume & cover letter drafting grounded in verified profile facts.
- [x] Phase D: Human approval state machine (`draft → pending_approval → approved → submitted`).
- [x] Phase D: Application pipeline tracker (Saved, Applied, Interviewing, Offer).
- [x] Phase E: 19 unit & integration tests covering parsers, match scoring, security gating, and tool sequence.
- [x] Phase E: Memory inspection and user data purge compliance (Section 4).
- [x] Phase E: Production build verified (zero TypeScript/Vite bundle errors).

---

## ⚖️ Ethics & Data Attribution
- **Remotive.com**: Live remote listings provided via Remotive public API. Attributed in compliance with Remotive terms of service.
- **Match Disclaimer**: Compatibility ratings are algorithmic estimates based on extracted skills, not hiring predictions or legal guarantees.
- **Fact Grounding**: The AI co-pilot is constrained to never invent degrees, employers, metrics, or achievements.
