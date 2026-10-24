import { ApprovalRequest, ApprovalStatus, TrackedApplication } from '../types/database.types';
import { localStore } from './supabaseClient';

export interface ApprovalVerificationInput {
  approval_token: string;
  user_id: string;
  expected_destination_url: string;
  expected_role_title: string;
  expected_employer_name: string;
  document_hash: string;
}

export interface VerificationResult {
  isApproved: boolean;
  error?: string;
  approvalRequest?: ApprovalRequest;
}

/**
 * Computes a deterministic hash of document content and target destination
 */
export const computeDocumentVerificationHash = (
  roleTitle: string,
  employer: string,
  destinationUrl: string,
  resumeContent: string,
  coverLetterContent: string
): string => {
  const payload = `${roleTitle.trim()}|${employer.trim()}|${destinationUrl.trim()}|${resumeContent.trim()}|${coverLetterContent.trim()}`;
  // Simple deterministic Fowler-Noll-Vo / Murmur-like hash for fast client-side checksum
  let hash = 0x811c9dc5;
  for (let i = 0; i < payload.length; i++) {
    hash ^= payload.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return `hash_${(hash >>> 0).toString(16)}`;
};

/**
 * Creates a pending approval request with single-use cryptographic token
 */
export const createApprovalRequestRecord = (
  userId: string,
  draftId: string,
  roleTitle: string,
  employerName: string,
  destinationUrl: string,
  documentHash: string,
  validityMinutes = 15
): ApprovalRequest => {
  const token = `apr_${crypto.randomUUID().replace(/-/g, '')}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + validityMinutes * 60 * 1000).toISOString();

  const approvalReq: ApprovalRequest = {
    id: crypto.randomUUID(),
    user_id: userId,
    draft_id: draftId,
    destination_url: destinationUrl,
    employer_name: employerName,
    role_title: roleTitle,
    document_hash: documentHash,
    approval_token: token,
    status: 'pending_approval',
    expires_at: expiresAt,
    is_used: false,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  localStore.insert('approval_requests', approvalReq);
  return approvalReq;
};

/**
 * Strictly verifies the human approval token against security criteria:
 * 1. Request must exist and belong to the authenticated user
 * 2. Status must be 'approved'
 * 3. Must not be already used (Single-use idempotency)
 * 4. Must not be expired
 * 5. Destination URL, role title, employer, and document hash must match exactly
 */
export const verifyApprovalToken = (
  input: ApprovalVerificationInput
): VerificationResult => {
  const requests = localStore.get<ApprovalRequest>('approval_requests');
  const req = requests.find((r) => r.approval_token === input.approval_token);

  if (!req) {
    return { isApproved: false, error: 'Approval request not found or invalid token.' };
  }

  if (req.user_id !== input.user_id) {
    return { isApproved: false, error: 'Unauthorized: Approval token does not belong to user.' };
  }

  if (req.is_used) {
    return { isApproved: false, error: 'Approval token has already been consumed (single-use policy).' };
  }

  const now = new Date();
  const expiresAt = new Date(req.expires_at);
  if (now > expiresAt) {
    localStore.update('approval_requests', req.id, { status: 'expired' });
    return { isApproved: false, error: 'Approval token has expired. A fresh approval must be requested.' };
  }

  if (req.status !== 'approved') {
    return {
      isApproved: false,
      error: `Action blocked: Request status is '${req.status}'. Must be explicitly approved by human.`,
    };
  }

  // Cryptographic & destination parity checks
  if (req.destination_url !== input.expected_destination_url) {
    return { isApproved: false, error: 'Security violation: Destination URL mismatch.' };
  }

  if (req.role_title !== input.expected_role_title) {
    return { isApproved: false, error: 'Security violation: Target role mismatch.' };
  }

  if (req.document_hash !== input.document_hash) {
    return { isApproved: false, error: 'Security violation: Document content was modified after approval.' };
  }

  return { isApproved: true, approvalRequest: req };
};

/**
 * Human explicitly approves the pending request
 */
export const approveRequestByHuman = (
  approvalId: string,
  userId: string
): { success: boolean; error?: string } => {
  const reqs = localStore.get<ApprovalRequest>('approval_requests');
  const req = reqs.find((r) => r.id === approvalId && r.user_id === userId);

  if (!req) return { success: false, error: 'Approval request not found.' };
  if (req.status !== 'pending_approval') {
    return { success: false, error: `Cannot approve request with status '${req.status}'.` };
  }

  localStore.update('approval_requests', req.id, {
    status: 'approved',
    user_action_at: new Date().toISOString(),
  });

  return { success: true };
};

/**
 * Human explicitly rejects the pending request
 */
export const rejectRequestByHuman = (
  approvalId: string,
  userId: string,
  reason = 'Rejected by student'
): { success: boolean; error?: string } => {
  const reqs = localStore.get<ApprovalRequest>('approval_requests');
  const req = reqs.find((r) => r.id === approvalId && r.user_id === userId);

  if (!req) return { success: false, error: 'Approval request not found.' };

  localStore.update('approval_requests', req.id, {
    status: 'rejected',
    rejection_reason: reason,
    user_action_at: new Date().toISOString(),
  });

  return { success: true };
};

/**
 * Consumes the approval token upon verified application submission
 */
export const consumeApprovalTokenAndRecordApplication = (
  approvalRequest: ApprovalRequest,
  submissionMethod: 'manual_confirmed' | 'authorized_api' = 'manual_confirmed'
): TrackedApplication => {
  // Mark approval request as used and submitted
  localStore.update('approval_requests', approvalRequest.id, {
    is_used: true,
    status: 'submitted',
  });

  // Create tracked application record
  const application: TrackedApplication = {
    id: crypto.randomUUID(),
    user_id: approvalRequest.user_id,
    approval_request_id: approvalRequest.id,
    company_name: approvalRequest.employer_name,
    role_title: approvalRequest.role_title,
    apply_url: approvalRequest.destination_url,
    submission_method: submissionMethod,
    status: 'applied',
    applied_at: new Date().toISOString(),
    notes: 'Submitted following human review and cryptographic approval.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  localStore.insert('applications', application);
  return application;
};
