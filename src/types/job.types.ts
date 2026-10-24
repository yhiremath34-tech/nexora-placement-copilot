export interface JobListing {
  id: string;
  title: string;
  company_name: string;
  company_logo_url?: string;
  category?: string;
  job_type: string;
  publication_date: string;
  candidate_required_location: string;
  salary?: string;
  description: string;
  url: string;
  tags: string[];
  is_remote: boolean;
  provider: 'remotive' | 'arbeitnow' | 'fixture_demo';
  is_fixture?: boolean;
}

export interface MatchEvaluation {
  job_id: string;
  job_title: string;
  company_name: string;
  compatibility_score: number; // 0 - 100
  matching_skills: string[];
  missing_skills: string[];
  match_explanation: string;
  uncertainties: string[];
  evidence_snippets: string[];
  is_estimate_disclaimer: string;
}

export interface JobSearchParams {
  query?: string;
  category?: string;
  tags?: string[];
  location?: string;
  limit?: number;
  use_fixture_fallback?: boolean;
}
