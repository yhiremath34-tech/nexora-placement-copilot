export interface StudentProfile {
  id: string;
  full_name: string;
  email: string;
  headline?: string;
  university?: string;
  graduation_year?: number;
  degree?: string;
  major?: string;
  gpa?: number;
  bio?: string;
  phone?: string;
  location?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  created_at: string;
  updated_at: string;
}

export interface StructuredExperience {
  company: string;
  role: string;
  duration: string;
  highlights: string[];
}

export interface StructuredEducation {
  institution: string;
  degree: string;
  field_of_study: string;
  graduation_year: number;
}

export interface StructuredProject {
  title: string;
  description: string;
  technologies: string[];
  link?: string;
}

export interface StudentResume {
  id: string;
  user_id: string;
  file_name: string;
  file_size_bytes: number;
  file_type: string;
  storage_path?: string;
  raw_text: string;
  parsed_skills: string[];
  parsed_experience: StructuredExperience[];
  parsed_education: StructuredEducation[];
  parsed_projects: StructuredProject[];
  parsed_strengths: string[];
  parsed_gaps: string[];
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface CareerPreferences {
  id: string;
  user_id: string;
  target_roles: string[];
  preferred_locations: string[];
  remote_preference: 'remote_only' | 'hybrid' | 'on_site' | 'any';
  experience_level: 'internship' | 'entry_level' | 'junior' | 'mid';
  min_salary_usd?: number;
  target_industries: string[];
  created_at: string;
  updated_at: string;
}

export interface SavedJob {
  id: string;
  user_id: string;
  external_job_id: string;
  provider: 'remotive' | 'arbeitnow' | 'fixture_demo';
  title: string;
  company_name: string;
  company_logo_url?: string;
  job_type?: string;
  location?: string;
  is_remote: boolean;
  salary_range?: string;
  publication_date?: string;
  apply_url: string;
  description: string;
  tags: string[];
  match_score?: number;
  match_explanation?: string;
  matching_skills: string[];
  missing_skills: string[];
  status: 'saved' | 'interested' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface ApplicationDraft {
  id: string;
  user_id: string;
  saved_job_id?: string;
  role_title: string;
  company_name: string;
  tailored_resume_summary: string;
  tailored_bullet_points: string[];
  cover_letter: string;
  source_facts_grounding: string[];
  version: number;
  status: 'draft' | 'reviewing' | 'ready_for_approval' | 'approved' | 'archived';
  created_at: string;
  updated_at: string;
}

export type ApprovalStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'submitted'
  | 'rejected'
  | 'expired'
  | 'failed';

export interface ApprovalRequest {
  id: string;
  user_id: string;
  draft_id: string;
  destination_url: string;
  employer_name: string;
  role_title: string;
  document_hash: string;
  approval_token: string;
  status: ApprovalStatus;
  user_action_at?: string;
  expires_at: string;
  is_used: boolean;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface TrackedApplication {
  id: string;
  user_id: string;
  saved_job_id?: string;
  approval_request_id?: string;
  company_name: string;
  role_title: string;
  apply_url: string;
  submission_method: 'manual_confirmed' | 'authorized_api';
  status: 'applied' | 'screening' | 'interviewing' | 'offer' | 'rejected' | 'withdrawn';
  applied_at: string;
  notes?: string;
  deadline?: string;
  created_at: string;
  updated_at: string;
}

export interface AgentToolLog {
  id: string;
  user_id: string;
  session_id?: string;
  tool_name: string;
  input_summary: Record<string, unknown>;
  output_summary: Record<string, unknown>;
  execution_time_ms: number;
  is_success: boolean;
  error_message?: string;
  created_at: string;
}
