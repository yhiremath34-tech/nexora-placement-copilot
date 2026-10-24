import { describe, it, expect, beforeEach } from 'vitest';
import {
  createApprovalRequestRecord,
  computeDocumentVerificationHash,
  verifyApprovalToken,
  approveRequestByHuman,
  rejectRequestByHuman,
  consumeApprovalTokenAndRecordApplication,
} from '../src/services/approvalStateMachine';
import { localStore } from '../src/services/supabaseClient';

describe('Human Approval State Machine & Security Gating', () => {
  const userId = 'student-test-user-001';
  const role = 'AI Engineer Intern';
  const employer = 'Anthropic Partner Labs';
  const destUrl = 'https://remotive.com/apply-123';
  const resumeSummary = 'Motivated CS senior with PyTorch and Python experience';
  const coverLetter = 'Dear Hiring Manager, I am applying for the AI internship...';

  beforeEach(() => {
    localStore.clearAllUserData();
  });

  it('generates pending approval request with unique token and document hash', () => {
    const docHash = computeDocumentVerificationHash(
      role,
      employer,
      destUrl,
      resumeSummary,
      coverLetter
    );

    const req = createApprovalRequestRecord(
      userId,
      'draft-123',
      role,
      employer,
      destUrl,
      docHash,
      15
    );

    expect(req.status).toBe('pending_approval');
    expect(req.approval_token.startsWith('apr_')).toBe(true);
    expect(req.is_used).toBe(false);
  });

  it('rejects external action attempts when status is still pending_approval', () => {
    const docHash = computeDocumentVerificationHash(
      role,
      employer,
      destUrl,
      resumeSummary,
      coverLetter
    );

    const req = createApprovalRequestRecord(
      userId,
      'draft-123',
      role,
      employer,
      destUrl,
      docHash,
      15
    );

    const verification = verifyApprovalToken({
      approval_token: req.approval_token,
      user_id: userId,
      expected_destination_url: destUrl,
      expected_role_title: role,
      expected_employer_name: employer,
      document_hash: docHash,
    });

    expect(verification.isApproved).toBe(false);
    expect(verification.error).toContain('Action blocked: Request status is \'pending_approval\'');
  });

  it('permits submission only after explicit human approval and consumes single-use token', () => {
    const docHash = computeDocumentVerificationHash(
      role,
      employer,
      destUrl,
      resumeSummary,
      coverLetter
    );

    const req = createApprovalRequestRecord(
      userId,
      'draft-123',
      role,
      employer,
      destUrl,
      docHash,
      15
    );

    // Human explicitly approves
    const approveOutcome = approveRequestByHuman(req.id, userId);
    expect(approveOutcome.success).toBe(true);

    // Backend verifies approval
    const verification = verifyApprovalToken({
      approval_token: req.approval_token,
      user_id: userId,
      expected_destination_url: destUrl,
      expected_role_title: role,
      expected_employer_name: employer,
      document_hash: docHash,
    });

    expect(verification.isApproved).toBe(true);
    expect(verification.approvalRequest?.status).toBe('approved');

    // Execution consumes token
    const application = consumeApprovalTokenAndRecordApplication(verification.approvalRequest!);
    expect(application.status).toBe('applied');

    // Attempting to reuse the exact same token must fail (Single-use idempotency)
    const secondVerification = verifyApprovalToken({
      approval_token: req.approval_token,
      user_id: userId,
      expected_destination_url: destUrl,
      expected_role_title: role,
      expected_employer_name: employer,
      document_hash: docHash,
    });

    expect(secondVerification.isApproved).toBe(false);
    expect(secondVerification.error).toContain('Approval token has already been consumed');
  });

  it('rejects approval attempts if document hash or destination URL is tampered', () => {
    const docHash = computeDocumentVerificationHash(
      role,
      employer,
      destUrl,
      resumeSummary,
      coverLetter
    );

    const req = createApprovalRequestRecord(
      userId,
      'draft-123',
      role,
      employer,
      destUrl,
      docHash,
      15
    );

    approveRequestByHuman(req.id, userId);

    // Attacker modifies destination URL
    const tamperedVerification = verifyApprovalToken({
      approval_token: req.approval_token,
      user_id: userId,
      expected_destination_url: 'https://malicious-phishing-site.com',
      expected_role_title: role,
      expected_employer_name: employer,
      document_hash: docHash,
    });

    expect(tamperedVerification.isApproved).toBe(false);
    expect(tamperedVerification.error).toContain('Destination URL mismatch');
  });

  it('rejects approval requests belonging to a different user (Cross-tenant security)', () => {
    const docHash = computeDocumentVerificationHash(
      role,
      employer,
      destUrl,
      resumeSummary,
      coverLetter
    );

    const req = createApprovalRequestRecord(
      userId,
      'draft-123',
      role,
      employer,
      destUrl,
      docHash,
      15
    );

    approveRequestByHuman(req.id, userId);

    const crossUserVerification = verifyApprovalToken({
      approval_token: req.approval_token,
      user_id: 'different-unauthorized-user',
      expected_destination_url: destUrl,
      expected_role_title: role,
      expected_employer_name: employer,
      document_hash: docHash,
    });

    expect(crossUserVerification.isApproved).toBe(false);
    expect(crossUserVerification.error).toContain('Unauthorized');
  });
});
