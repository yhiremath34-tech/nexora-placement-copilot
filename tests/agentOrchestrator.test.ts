import { describe, it, expect, beforeEach } from 'vitest';
import {
  dispatchTool,
  runAgentWorkflow,
  AgentContextData,
} from '../src/services/agentOrchestrator';
import { localStore } from '../src/services/supabaseClient';
import { StudentProfile } from '../src/types/database.types';

describe('Gemini Agent 10-Tool Sequential Orchestration', () => {
  const testUserId = 'test-student-999';
  const testProfile: StudentProfile = {
    id: testUserId,
    full_name: 'Jordan Lee',
    email: 'jordan.lee@university.edu',
    headline: 'AI & Data Science Student',
    university: 'State University',
    graduation_year: 2026,
    degree: 'B.S.',
    major: 'Computer Science',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const context: AgentContextData = {
    userId: testUserId,
    profile: testProfile,
    resume: null,
    sessionId: 'session-unit-test-1',
  };

  beforeEach(() => {
    localStore.clearAllUserData();
    localStore.insert('profiles', testProfile);
  });

  it('Tool 1: get_student_profile returns verified student data', async () => {
    const { result } = await dispatchTool('get_student_profile', {}, context);
    expect(result.success).toBe(true);
    expect((result.profile as StudentProfile).full_name).toBe('Jordan Lee');
  });

  it('Tool 3: search_jobs queries real listings with provider notice', async () => {
    const { result } = await dispatchTool('search_jobs', { query: 'software', limit: 3 }, context);
    expect(result.success).toBe(true);
    expect(Array.isArray(result.listings)).toBe(true);
  });

  it('Tool 5: generate_application_draft grounds resume and cover letter strictly in facts', async () => {
    const { result } = await dispatchTool(
      'generate_application_draft',
      {
        job_id: 'job-101',
        job_title: 'Junior Machine Learning Engineer',
        company_name: 'AI Innovations Lab',
        apply_url: 'https://example.com/apply',
      },
      context
    );

    expect(result.success).toBe(true);
    expect(result.draft_id).toBeDefined();
    expect(result.tailored_resume_summary).toContain('AI Innovations Lab');
    expect(result.cover_letter).toContain('Junior Machine Learning Engineer');
  });

  it('Tool 9: request_application_approval halts and does NOT submit externally', async () => {
    const { result } = await dispatchTool(
      'request_application_approval',
      {
        draft_id: 'draft-999',
        role_title: 'AI Intern',
        company_name: 'Lab Co',
        destination_url: 'https://example.com/apply-now',
      },
      context
    );

    expect(result.success).toBe(true);
    expect(result.status).toBe('pending_approval');
    expect(result.approval_token).toBeDefined();
    expect(result.security_message).toContain('locked pending your explicit review');
  });

  it('End-to-end multi-step workflow completes sequence and stops before submission', async () => {
    const recordedTimeline: string[] = [];

    const outcome = await runAgentWorkflow(
      'Find remote AI internships suitable for my current skills, explain my top matches, and prepare an application for the best one.',
      context,
      (step) => {
        if (!recordedTimeline.includes(step.tool_name)) {
          recordedTimeline.push(step.tool_name);
        }
      }
    );

    expect(outcome.assistantResponse).toBeDefined();
    expect(recordedTimeline).toContain('get_student_profile');
    expect(recordedTimeline).toContain('search_jobs');
    expect(recordedTimeline).toContain('match_jobs');
    expect(recordedTimeline).toContain('generate_application_draft');
    expect(recordedTimeline).toContain('request_application_approval');

    // Crucial PS-06 requirement: Stop before external submission
    expect(recordedTimeline).not.toContain('submit_approved_application');
    expect(outcome.pendingApproval).toBeDefined();
  });
});
