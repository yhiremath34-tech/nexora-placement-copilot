import { ApprovalStatus } from './database.types';
import { JobListing, MatchEvaluation } from './job.types';

export type AgentToolName =
  | 'get_student_profile'
  | 'analyze_resume'
  | 'search_jobs'
  | 'match_jobs'
  | 'generate_application_draft'
  | 'save_job'
  | 'save_application_draft'
  | 'get_application_status'
  | 'request_application_approval'
  | 'submit_approved_application';

export interface ToolCallExecution {
  id: string;
  tool_name: AgentToolName;
  args: Record<string, unknown>;
  result?: unknown;
  status: 'pending' | 'running' | 'success' | 'failed' | 'requires_approval';
  error?: string;
  started_at: string;
  completed_at?: string;
  execution_ms?: number;
}

export interface AgentMessageItem {
  id: string;
  role: 'user' | 'assistant' | 'tool' | 'system';
  content: string;
  tool_calls?: ToolCallExecution[];
  timestamp: string;
}

export interface AgentSessionState {
  id: string;
  title: string;
  status: 'idle' | 'thinking' | 'executing_tools' | 'awaiting_approval' | 'error';
  messages: AgentMessageItem[];
  timeline: ToolCallExecution[];
  pending_approval?: {
    approval_request_id: string;
    approval_token: string;
    role_title: string;
    company_name: string;
    destination_url: string;
    draft_id: string;
    status: ApprovalStatus;
  };
  discovered_jobs?: JobListing[];
  matched_evaluations?: MatchEvaluation[];
}
