-- ==============================================================================
-- NEXORA PLACEMENT CO-PILOT SCHEMA MIGRATION
-- Tables: profiles, resumes, career_preferences, agent_sessions, agent_messages,
--         saved_jobs, application_drafts, applications, approval_requests, agent_tool_logs
-- Security: UUID PKs, Timestamps, FKs, Indexes, Row-Level Security (RLS)
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    headline TEXT,
    university TEXT,
    graduation_year INTEGER,
    degree TEXT,
    major TEXT,
    gpa NUMERIC(3, 2),
    bio TEXT,
    phone TEXT,
    location TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    portfolio_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. RESUMES TABLE
CREATE TABLE IF NOT EXISTS public.resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_size_bytes INTEGER NOT NULL,
    file_type TEXT NOT NULL,
    storage_path TEXT,
    raw_text TEXT NOT NULL,
    parsed_skills TEXT[] DEFAULT '{}',
    parsed_experience JSONB DEFAULT '[]'::jsonb,
    parsed_education JSONB DEFAULT '[]'::jsonb,
    parsed_projects JSONB DEFAULT '[]'::jsonb,
    parsed_strengths TEXT[] DEFAULT '{}',
    parsed_gaps TEXT[] DEFAULT '{}',
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. CAREER PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS public.career_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    target_roles TEXT[] NOT NULL DEFAULT '{}',
    preferred_locations TEXT[] NOT NULL DEFAULT '{}',
    remote_preference TEXT NOT NULL DEFAULT 'hybrid' CHECK (remote_preference IN ('remote_only', 'hybrid', 'on_site', 'any')),
    experience_level TEXT NOT NULL DEFAULT 'entry_level' CHECK (experience_level IN ('internship', 'entry_level', 'junior', 'mid')),
    min_salary_usd NUMERIC(10, 2),
    target_industries TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. AGENT SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.agent_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New Career Session',
    objective TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. AGENT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.agent_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.agent_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
    content TEXT NOT NULL,
    tool_calls JSONB DEFAULT '[]'::jsonb,
    tool_results JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. SAVED JOBS TABLE
CREATE TABLE IF NOT EXISTS public.saved_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    external_job_id TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT 'remotive',
    title TEXT NOT NULL,
    company_name TEXT NOT NULL,
    company_logo_url TEXT,
    job_type TEXT,
    location TEXT,
    is_remote BOOLEAN DEFAULT false,
    salary_range TEXT,
    publication_date TEXT,
    apply_url TEXT NOT NULL,
    description TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    match_score INTEGER CHECK (match_score >= 0 AND match_score <= 100),
    match_explanation TEXT,
    matching_skills TEXT[] DEFAULT '{}',
    missing_skills TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'saved' CHECK (status IN ('saved', 'interested', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, external_job_id, provider)
);

-- 7. APPLICATION DRAFTS TABLE
CREATE TABLE IF NOT EXISTS public.application_drafts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    saved_job_id UUID REFERENCES public.saved_jobs(id) ON DELETE SET NULL,
    role_title TEXT NOT NULL,
    company_name TEXT NOT NULL,
    tailored_resume_summary TEXT NOT NULL,
    tailored_bullet_points JSONB NOT NULL DEFAULT '[]'::jsonb,
    cover_letter TEXT NOT NULL,
    source_facts_grounding JSONB NOT NULL DEFAULT '[]'::jsonb,
    version INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'reviewing', 'ready_for_approval', 'approved', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. APPROVAL REQUESTS TABLE (Strict Human-in-the-Loop State Machine)
CREATE TABLE IF NOT EXISTS public.approval_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    draft_id UUID NOT NULL REFERENCES public.application_drafts(id) ON DELETE CASCADE,
    destination_url TEXT NOT NULL,
    employer_name TEXT NOT NULL,
    role_title TEXT NOT NULL,
    document_hash TEXT NOT NULL,
    approval_token TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('draft', 'pending_approval', 'approved', 'submitted', 'rejected', 'expired', 'failed')),
    user_action_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT false,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. APPLICATIONS TABLE (Application Tracker / Pipeline)
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    saved_job_id UUID REFERENCES public.saved_jobs(id) ON DELETE SET NULL,
    approval_request_id UUID REFERENCES public.approval_requests(id) ON DELETE SET NULL,
    company_name TEXT NOT NULL,
    role_title TEXT NOT NULL,
    apply_url TEXT NOT NULL,
    submission_method TEXT NOT NULL CHECK (submission_method IN ('manual_confirmed', 'authorized_api')),
    status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'screening', 'interviewing', 'offer', 'rejected', 'withdrawn')),
    applied_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    notes TEXT,
    deadline TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. AGENT TOOL LOGS TABLE (Audit History without credential leakage)
CREATE TABLE IF NOT EXISTS public.agent_tool_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.agent_sessions(id) ON DELETE SET NULL,
    tool_name TEXT NOT NULL,
    input_summary JSONB DEFAULT '{}'::jsonb,
    output_summary JSONB DEFAULT '{}'::jsonb,
    execution_time_ms INTEGER NOT NULL,
    is_success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- INDEXES FOR HIGH QUERY EFFICIENCY
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_career_pref_user_id ON public.career_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_user_id ON public.agent_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_messages_session_id ON public.agent_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_user_id ON public.saved_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_application_drafts_user_id ON public.application_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_user_id ON public.approval_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_token ON public.approval_requests(approval_token);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON public.applications(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_tool_logs_user_id ON public.agent_tool_logs(user_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict Isolation: users can only view and mutate their own records
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_tool_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: Only the owner can select, insert, update
CREATE POLICY "Users can manage own profile" ON public.profiles
    FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Resumes: Only the owner
CREATE POLICY "Users can manage own resumes" ON public.resumes
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Career Preferences: Only the owner
CREATE POLICY "Users can manage own preferences" ON public.career_preferences
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Agent Sessions: Only the owner
CREATE POLICY "Users can manage own sessions" ON public.agent_sessions
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Agent Messages: Only the owner
CREATE POLICY "Users can manage own messages" ON public.agent_messages
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Saved Jobs: Only the owner
CREATE POLICY "Users can manage own saved jobs" ON public.saved_jobs
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Application Drafts: Only the owner
CREATE POLICY "Users can manage own drafts" ON public.application_drafts
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Approval Requests: Only the owner
CREATE POLICY "Users can manage own approval requests" ON public.approval_requests
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Applications: Only the owner
CREATE POLICY "Users can manage own applications" ON public.applications
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Agent Tool Logs: Only the owner
CREATE POLICY "Users can manage own logs" ON public.agent_tool_logs
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
