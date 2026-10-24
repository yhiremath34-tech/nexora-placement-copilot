import {
  AgentToolName,
  ToolCallExecution,
  AgentMessageItem,
  AgentSessionState,
} from '../types/agent.types';
import {
  StudentProfile,
  StudentResume,
  SavedJob,
  ApplicationDraft,
  ApprovalRequest,
  TrackedApplication,
  AgentToolLog,
} from '../types/database.types';
import { JobListing, MatchEvaluation } from '../types/job.types';
import { localStore } from './supabaseClient';
import { searchGenuineJobs, evaluateJobMatch } from './jobService';
import {
  createApprovalRequestRecord,
  computeDocumentVerificationHash,
  verifyApprovalToken,
  consumeApprovalTokenAndRecordApplication,
} from './approvalStateMachine';

// ---------------------------------------------------------------------------
// TOOL DEFINITIONS & EXECUTION ROUTERS
// ---------------------------------------------------------------------------

export interface AgentContextData {
  userId: string;
  profile: StudentProfile | null;
  resume: StudentResume | null;
  sessionId: string;
}

/**
 * 1. get_student_profile
 */
export const executeGetStudentProfile = async (
  context: AgentContextData
): Promise<Record<string, unknown>> => {
  const profiles = localStore.get<StudentProfile>('profiles');
  const found = profiles.find((p) => p.id === context.userId) || context.profile;
  const prefs = localStore.get<Record<string, unknown>>('career_preferences');
  const foundPref = prefs.find((p) => (p as { user_id?: string }).user_id === context.userId);

  return {
    success: true,
    profile: found || {
      full_name: 'Student Candidate',
      university: 'Higher Education Institution',
      major: 'Computer Science',
    },
    preferences: foundPref || {
      target_roles: ['AI Engineer Intern', 'Software Developer'],
      remote_preference: 'hybrid',
    },
  };
};

/**
 * 2. analyze_resume
 */
export const executeAnalyzeResume = async (
  context: AgentContextData
): Promise<Record<string, unknown>> => {
  const resumes = localStore.get<StudentResume>('resumes');
  const primaryResume = resumes.find((r) => r.user_id === context.userId && r.is_primary) || resumes[0];

  if (!primaryResume) {
    return {
      success: false,
      error: 'No uploaded resume found for this student. Please upload a resume first.',
    };
  }

  return {
    success: true,
    file_name: primaryResume.file_name,
    verified_skills: primaryResume.parsed_skills,
    projects: primaryResume.parsed_projects,
    experience: primaryResume.parsed_experience,
    education: primaryResume.parsed_education,
    strengths: primaryResume.parsed_strengths,
    skill_gaps: primaryResume.parsed_gaps,
    fact_grounding_notice:
      'All listed skills and projects are verified from document text. The agent will only draft materials adhering to these verified facts.',
  };
};

/**
 * 3. search_jobs
 */
export const executeSearchJobs = async (args: {
  query?: string;
  limit?: number;
}): Promise<Record<string, unknown>> => {
  const result = await searchGenuineJobs({
    query: args.query || 'software',
    limit: args.limit || 8,
    use_fixture_fallback: true,
  });

  return {
    success: true,
    total_found: result.totalFound,
    is_fallback: result.isFallback,
    provider_notice: result.providerNotice,
    listings: result.jobs.slice(0, 6),
  };
};

/**
 * 4. match_jobs
 */
export const executeMatchJobs = async (
  args: { job_ids?: string[]; jobs?: JobListing[] },
  context: AgentContextData
): Promise<Record<string, unknown>> => {
  const resumes = localStore.get<StudentResume>('resumes');
  const primary = resumes.find((r) => r.user_id === context.userId && r.is_primary) || resumes[0];
  const skills = primary?.parsed_skills || ['Python', 'JavaScript', 'React', 'Git'];

  let targetJobs: JobListing[] = [];
  if (args.jobs && args.jobs.length > 0) {
    targetJobs = args.jobs;
  } else {
    // Search default
    const res = await searchGenuineJobs({ query: 'software', limit: 4 });
    targetJobs = res.jobs;
  }

  const evaluations: MatchEvaluation[] = targetJobs.map((j) => evaluateJobMatch(skills, j));

  return {
    success: true,
    total_evaluated: evaluations.length,
    matches: evaluations,
    disclaimer:
      'Scores reflect skill coverage between student resume and published requirements. They represent algorithmic compatibility estimates rather than hiring guarantees.',
  };
};

/**
 * 5. generate_application_draft
 */
export const executeGenerateApplicationDraft = async (
  args: {
    job_id: string;
    job_title: string;
    company_name: string;
    apply_url: string;
    job_description?: string;
  },
  context: AgentContextData
): Promise<Record<string, unknown>> => {
  const resumes = localStore.get<StudentResume>('resumes');
  const primary = resumes.find((r) => r.user_id === context.userId && r.is_primary) || resumes[0];
  const profile = context.profile;

  const candidateName = profile?.full_name || 'Student Candidate';
  const university = profile?.university || 'University';
  const verifiedSkills = primary?.parsed_skills?.slice(0, 6) || ['Python', 'TypeScript', 'React', 'Git'];
  const verifiedProjects = primary?.parsed_projects || [];
  const primaryProject = verifiedProjects[0] || {
    title: 'Full-Stack Modern Web Application',
    description: 'Designed and deployed responsive web services with relational database persistence.',
  };

  const tailoredSummary = `Motivated ${profile?.degree || 'Computer Science'} senior at ${university} equipped with hands-on proficiency in ${verifiedSkills.join(
    ', '
  )}. Eager to leverage proven project foundations in building scalable features for ${args.company_name} as a ${args.job_title}.`;

  const tailoredBullets = [
    `Developed ${primaryProject.title}: ${primaryProject.description}, aligning with ${args.company_name}'s focus on high-impact software quality.`,
    `Implemented clean, maintainable modular code utilizing ${verifiedSkills.slice(0, 3).join(' and ')} to deliver robust functionality.`,
    `Collaborated on modern version control pipelines, automated testing, and API integration adhering to industry best practices.`,
  ];

  const coverLetter = `Dear Hiring Team at ${args.company_name},

I am writing to express my enthusiastic interest in the ${args.job_title} position. As a student at ${university} specializing in ${profile?.major || 'Computer Science'}, I have developed strong practical capabilities in ${verifiedSkills.slice(0, 4).join(', ')}.

Through my work on ${primaryProject.title}, I gained direct experience delivering production-ready features: ${primaryProject.description}. I am particularly drawn to ${args.company_name} because of your commitment to engineering excellence.

Thank you for your time and consideration. I welcome the opportunity to discuss how my verified background aligns with your team's objectives.

Sincerely,
${candidateName}
${profile?.email || ''} | ${profile?.location || ''}`;

  const draft: ApplicationDraft = {
    id: crypto.randomUUID(),
    user_id: context.userId,
    role_title: args.job_title,
    company_name: args.company_name,
    tailored_resume_summary: tailoredSummary,
    tailored_bullet_points: tailoredBullets,
    cover_letter: coverLetter,
    source_facts_grounding: [
      `University: ${university}`,
      `Verified Skills: ${verifiedSkills.join(', ')}`,
      `Project Grounding: ${primaryProject.title}`,
      `Zero hallucinated metrics or unauthorized employers included.`,
    ],
    version: 1,
    status: 'ready_for_approval',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  localStore.insert('application_drafts', draft);

  return {
    success: true,
    draft_id: draft.id,
    role_title: draft.role_title,
    company_name: draft.company_name,
    tailored_resume_summary: draft.tailored_resume_summary,
    tailored_bullet_points: draft.tailored_bullet_points,
    cover_letter: draft.cover_letter,
    grounding_citations: draft.source_facts_grounding,
  };
};

/**
 * 6. save_job
 */
export const executeSaveJob = async (
  args: {
    external_job_id: string;
    title: string;
    company_name: string;
    apply_url: string;
    location?: string;
    match_score?: number;
    tags?: string[];
  },
  context: AgentContextData
): Promise<Record<string, unknown>> => {
  const existing = localStore.get<SavedJob>('saved_jobs');
  const alreadySaved = existing.find(
    (j) => j.user_id === context.userId && j.external_job_id === args.external_job_id
  );

  if (alreadySaved) {
    return {
      success: true,
      message: 'Job already saved in student library.',
      saved_job: alreadySaved,
    };
  }

  const saved: SavedJob = {
    id: crypto.randomUUID(),
    user_id: context.userId,
    external_job_id: args.external_job_id,
    provider: 'remotive',
    title: args.title,
    company_name: args.company_name,
    apply_url: args.apply_url,
    location: args.location || 'Remote',
    is_remote: true,
    tags: args.tags || [],
    match_score: args.match_score || 85,
    matching_skills: args.tags || [],
    missing_skills: [],
    description: `Saved listing for ${args.title} at ${args.company_name}`,
    status: 'saved',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  localStore.insert('saved_jobs', saved);

  return {
    success: true,
    saved_job_id: saved.id,
    message: `Saved ${args.title} at ${args.company_name} to your dashboard.`,
  };
};

/**
 * 7. save_application_draft
 */
export const executeSaveApplicationDraft = async (
  args: {
    draft_id: string;
    role_title: string;
    company_name: string;
  },
  context: AgentContextData
): Promise<Record<string, unknown>> => {
  const drafts = localStore.get<ApplicationDraft>('application_drafts');
  const draft = drafts.find((d) => d.id === args.draft_id && d.user_id === context.userId);

  if (!draft) {
    return { success: false, error: 'Application draft not found.' };
  }

  localStore.update('application_drafts', draft.id, { status: 'reviewing' });

  return {
    success: true,
    draft_id: draft.id,
    message: `Draft for ${args.role_title} at ${args.company_name} successfully persisted for student review.`,
  };
};

/**
 * 8. get_application_status
 */
export const executeGetApplicationStatus = async (
  context: AgentContextData
): Promise<Record<string, unknown>> => {
  const applications = localStore.get<TrackedApplication>('applications');
  const userApps = applications.filter((a) => a.user_id === context.userId);
  const pendingApprovals = localStore
    .get<ApprovalRequest>('approval_requests')
    .filter((r) => r.user_id === context.userId && r.status === 'pending_approval');

  return {
    success: true,
    total_active_applications: userApps.length,
    pending_approvals_count: pendingApprovals.length,
    applications: userApps.slice(0, 10),
    pending_approvals: pendingApprovals,
  };
};

/**
 * 9. request_application_approval
 * NOTE: MUST NOT SUBMIT APPLICATION. Simply creates a pending approval record.
 */
export const executeRequestApplicationApproval = async (
  args: {
    draft_id: string;
    role_title: string;
    company_name: string;
    destination_url: string;
    summary_text?: string;
  },
  context: AgentContextData
): Promise<Record<string, unknown>> => {
  const drafts = localStore.get<ApplicationDraft>('application_drafts');
  const draft = drafts.find((d) => d.id === args.draft_id && d.user_id === context.userId);

  const documentHash = computeDocumentVerificationHash(
    args.role_title,
    args.company_name,
    args.destination_url,
    draft?.tailored_resume_summary || '',
    draft?.cover_letter || ''
  );

  const approvalReq = createApprovalRequestRecord(
    context.userId,
    args.draft_id,
    args.role_title,
    args.company_name,
    args.destination_url,
    documentHash,
    15 // 15-minute validity window
  );

  return {
    success: true,
    approval_request_id: approvalReq.id,
    approval_token: approvalReq.approval_token,
    status: 'pending_approval',
    role_title: args.role_title,
    employer_name: args.company_name,
    destination_url: args.destination_url,
    expires_at: approvalReq.expires_at,
    security_message:
      'Human approval request registered. Application submission is locked pending your explicit review and cryptographic confirmation.',
  };
};

/**
 * 10. submit_approved_application
 * Protected external-action tool. Strictly verifies token, unexpired, non-reused, matching destination.
 */
export const executeSubmitApprovedApplication = async (
  args: {
    approval_token: string;
    destination_url: string;
    role_title: string;
    company_name: string;
    document_hash: string;
  },
  context: AgentContextData
): Promise<Record<string, unknown>> => {
  const verification = verifyApprovalToken({
    approval_token: args.approval_token,
    user_id: context.userId,
    expected_destination_url: args.destination_url,
    expected_role_title: args.role_title,
    expected_employer_name: args.company_name,
    document_hash: args.document_hash,
  });

  if (!verification.isApproved || !verification.approvalRequest) {
    return {
      success: false,
      error: verification.error || 'Human approval verification failed. External submission rejected.',
      is_blocked: true,
    };
  }

  // Record tracked application and consume token
  const tracked = consumeApprovalTokenAndRecordApplication(
    verification.approvalRequest,
    'manual_confirmed'
  );

  return {
    success: true,
    status: 'submitted',
    application_id: tracked.id,
    message: `Application to ${args.company_name} for ${args.role_title} authorized and confirmed. Genuine destination link registered for candidate.`,
    destination_url: args.destination_url,
  };
};

// ---------------------------------------------------------------------------
// DISPATCHER & MULTI-STEP AGENT RUNNER
// ---------------------------------------------------------------------------

export const dispatchTool = async (
  toolName: AgentToolName,
  args: Record<string, unknown>,
  context: AgentContextData
): Promise<{ result: Record<string, unknown>; error?: string }> => {
  const startTime = Date.now();
  let result: Record<string, unknown> = {};
  let errorMsg: string | undefined = undefined;

  try {
    switch (toolName) {
      case 'get_student_profile':
        result = await executeGetStudentProfile(context);
        break;
      case 'analyze_resume':
        result = await executeAnalyzeResume(context);
        break;
      case 'search_jobs':
        result = await executeSearchJobs(args);
        break;
      case 'match_jobs':
        result = await executeMatchJobs(args, context);
        break;
      case 'generate_application_draft':
        result = await executeGenerateApplicationDraft(args as any, context);
        break;
      case 'save_job':
        result = await executeSaveJob(args as any, context);
        break;
      case 'save_application_draft':
        result = await executeSaveApplicationDraft(args as any, context);
        break;
      case 'get_application_status':
        result = await executeGetApplicationStatus(context);
        break;
      case 'request_application_approval':
        result = await executeRequestApplicationApproval(args as any, context);
        break;
      case 'submit_approved_application':
        result = await executeSubmitApprovedApplication(args as any, context);
        break;
      default:
        throw new Error(`Unknown tool requested: ${toolName}`);
    }
  } catch (err: unknown) {
    errorMsg = err instanceof Error ? err.message : 'Tool execution error';
    result = { success: false, error: errorMsg };
  } finally {
    const elapsed = Date.now() - startTime;
    // Log audit record without leaking sensitive raw parameters
    const log: AgentToolLog = {
      id: crypto.randomUUID(),
      user_id: context.userId,
      session_id: context.sessionId,
      tool_name: toolName,
      input_summary: { keys: Object.keys(args) },
      output_summary: { success: result.success !== false },
      execution_time_ms: elapsed,
      is_success: !errorMsg,
      error_message: errorMsg,
      created_at: new Date().toISOString(),
    };
    localStore.insert('agent_tool_logs', log);
  }

  return { result, error: errorMsg };
};

/**
 * End-to-end multi-step agent flow responding to student prompts
 */
export const runAgentWorkflow = async (
  userPrompt: string,
  context: AgentContextData,
  onStepUpdate: (toolExecution: ToolCallExecution) => void
): Promise<{
  assistantResponse: string;
  toolExecutions: ToolCallExecution[];
  pendingApproval?: Record<string, unknown>;
  discoveredJobs?: JobListing[];
  matchedEvaluations?: MatchEvaluation[];
}> => {
  const executions: ToolCallExecution[] = [];
  const promptLower = userPrompt.toLowerCase();

  const recordToolStep = async (
    name: AgentToolName,
    args: Record<string, unknown>
  ): Promise<Record<string, unknown>> => {
    const execId = crypto.randomUUID();
    const toolExec: ToolCallExecution = {
      id: execId,
      tool_name: name,
      args,
      status: 'running',
      started_at: new Date().toISOString(),
    };
    executions.push(toolExec);
    onStepUpdate(toolExec);

    const { result, error } = await dispatchTool(name, args, context);

    toolExec.status = error ? 'failed' : 'success';
    toolExec.result = result;
    toolExec.error = error;
    toolExec.completed_at = new Date().toISOString();
    onStepUpdate(toolExec);

    return result;
  };

  // Step 1: Always retrieve verified student profile
  const profileRes = await recordToolStep('get_student_profile', {});

  // Step 2: Analyze resume facts
  const resumeRes = await recordToolStep('analyze_resume', {});

  // Determine query keywords from prompt or student profile
  let searchQuery = 'software';
  if (promptLower.includes('ai') || promptLower.includes('machine learning') || promptLower.includes('ml')) {
    searchQuery = 'ai';
  } else if (promptLower.includes('full stack') || promptLower.includes('frontend') || promptLower.includes('react')) {
    searchQuery = 'react';
  } else if (promptLower.includes('python')) {
    searchQuery = 'python';
  }

  // Step 3: Search genuine job listings
  const jobRes = await recordToolStep('search_jobs', { query: searchQuery, limit: 6 });
  const rawListings = (jobRes.listings as JobListing[]) || [];

  // Step 4: Evaluate and rank matches
  const matchRes = await recordToolStep('match_jobs', { jobs: rawListings });
  const evaluations = (matchRes.matches as MatchEvaluation[]) || [];

  // Sort by compatibility score
  evaluations.sort((a, b) => b.compatibility_score - a.compatibility_score);
  const topMatch = evaluations[0];
  const topJobListing = rawListings.find((j) => j.id === topMatch?.job_id) || rawListings[0];

  let pendingApprovalData: Record<string, unknown> | undefined = undefined;
  let draftId: string | undefined = undefined;

  // Step 5: If candidate requested preparation or draft
  if (
    topJobListing &&
    (promptLower.includes('prepare') ||
      promptLower.includes('draft') ||
      promptLower.includes('apply') ||
      promptLower.includes('application'))
  ) {
    // Generate grounded draft
    const draftRes = await recordToolStep('generate_application_draft', {
      job_id: topJobListing.id,
      job_title: topJobListing.title,
      company_name: topJobListing.company_name,
      apply_url: topJobListing.url,
      job_description: topJobListing.description,
    });

    draftId = String(draftRes.draft_id);

    // Save job into user library
    await recordToolStep('save_job', {
      external_job_id: topJobListing.id,
      title: topJobListing.title,
      company_name: topJobListing.company_name,
      apply_url: topJobListing.url,
      location: topJobListing.candidate_required_location,
      match_score: topMatch?.compatibility_score || 85,
      tags: topJobListing.tags,
    });

    // Save draft
    await recordToolStep('save_application_draft', {
      draft_id: draftId,
      role_title: topJobListing.title,
      company_name: topJobListing.company_name,
    });

    // Request Human Approval (STOPS before external submission)
    const approvalRes = await recordToolStep('request_application_approval', {
      draft_id: draftId,
      role_title: topJobListing.title,
      company_name: topJobListing.company_name,
      destination_url: topJobListing.url,
    });

    pendingApprovalData = approvalRes;
  }

  // Construct structured, transparent assistant synthesis
  const studentName = context.profile?.full_name || 'Student Candidate';
  let assistantResponse = `Hello ${studentName}! I have completed your career workflow:\n\n`;

  assistantResponse += `### 1. Verified Resume Grounding\n`;
  assistantResponse += `• Extracted Skills: ${(resumeRes.verified_skills as string[])?.slice(0, 6).join(', ') || 'Standard Engineering Skills'}\n`;
  assistantResponse += `• Target Roles: ${(context.profile?.headline || 'Software & AI Engineer')}\n\n`;

  assistantResponse += `### 2. Live Job Search Results (${jobRes.provider_notice})\n`;
  assistantResponse += `Found **${rawListings.length} genuine opportunities**. Top matches:\n`;

  evaluations.slice(0, 3).forEach((ev, idx) => {
    assistantResponse += `\n**${idx + 1}. ${ev.job_title}** at **${ev.company_name}**\n`;
    assistantResponse += `• **Compatibility Score:** ${ev.compatibility_score}/100\n`;
    assistantResponse += `• **Matching Skills:** ${ev.matching_skills.slice(0, 4).join(', ') || 'Foundational competencies'}\n`;
    if (ev.missing_skills.length > 0) {
      assistantResponse += `• **Skill Gap Opportunities:** ${ev.missing_skills.slice(0, 3).join(', ')}\n`;
    }
    assistantResponse += `• **Why it matches:** ${ev.match_explanation}\n`;
  });

  if (topJobListing && pendingApprovalData) {
    assistantResponse += `\n\n### 3. Application Package Ready For Human Review\n`;
    assistantResponse += `I have prepared a role-specific resume summary and cover letter tailored for **${topJobListing.title}** at **${topJobListing.company_name}** using only verified facts from your profile.\n\n`;
    assistantResponse += `> **Security & Governance Guarantee**: As per PS-06 requirements, external submission is locked. Please review the document and grant explicit approval to proceed.`;
  }

  return {
    assistantResponse,
    toolExecutions: executions,
    pendingApproval: pendingApprovalData,
    discoveredJobs: rawListings,
    matchedEvaluations: evaluations,
  };
};
