import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { Modal } from '../components/ui/Modal';
import { localStore } from '../services/supabaseClient';
import {
  createApprovalRequestRecord,
  computeDocumentVerificationHash,
  verifyApprovalToken,
  approveRequestByHuman,
  rejectRequestByHuman,
  consumeApprovalTokenAndRecordApplication,
} from '../services/approvalStateMachine';
import {
  ApplicationDraft,
  ApprovalRequest,
  TrackedApplication,
  SavedJob,
} from '../types/database.types';
import {
  FileCheck2,
  ShieldCheck,
  Send,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  FileText,
  AlertTriangle,
  Lock,
  Layers,
} from 'lucide-react';

export const ApplicationWorkspacePage: React.FC = () => {
  const { user, profile } = useAuth();

  const [drafts, setDrafts] = useState<ApplicationDraft[]>([]);
  const [selectedDraft, setSelectedDraft] = useState<ApplicationDraft | null>(null);
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([]);
  const [trackedApplications, setTrackedApplications] = useState<TrackedApplication[]>([]);
  const [activeTab, setActiveTab] = useState<'drafts' | 'approvals' | 'tracker'>('drafts');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  useEffect(() => {
    loadWorkspaceData();
  }, [user]);

  const loadWorkspaceData = () => {
    if (!user) return;
    const userDrafts = localStore.get<ApplicationDraft>('application_drafts').filter((d) => d.user_id === user.id);
    const userApprovals = localStore.get<ApprovalRequest>('approval_requests').filter((a) => a.user_id === user.id);
    const userApps = localStore.get<TrackedApplication>('applications').filter((app) => app.user_id === user.id);

    setDrafts(userDrafts);
    setApprovalRequests(userApprovals);
    setTrackedApplications(userApps);

    if (userDrafts.length > 0 && !selectedDraft) {
      setSelectedDraft(userDrafts[0]);
    }
  };

  const handleRequestApproval = (draft: ApplicationDraft) => {
    if (!user) return;

    const docHash = computeDocumentVerificationHash(
      draft.role_title,
      draft.company_name,
      'https://remotive.com/apply-demo',
      draft.tailored_resume_summary,
      draft.cover_letter
    );

    const req = createApprovalRequestRecord(
      user.id,
      draft.id,
      draft.role_title,
      draft.company_name,
      'https://remotive.com/apply-demo',
      docHash,
      15
    );

    setActionNotice(`Registered Human Approval Request ${req.approval_token.slice(0, 12)}... Submission is safely locked.`);
    loadWorkspaceData();
    setActiveTab('approvals');
  };

  const handleApprove = (approvalId: string) => {
    if (!user) return;
    const res = approveRequestByHuman(approvalId, user.id);
    if (res.success) {
      setActionNotice('Explicit human approval granted! The submission is now verified for candidate dispatch.');
      loadWorkspaceData();
    }
  };

  const handleReject = (approvalId: string) => {
    if (!user) return;
    const res = rejectRequestByHuman(approvalId, user.id, 'Candidate canceled draft submission');
    if (res.success) {
      setActionNotice('Request rejected. No submission or external connection was made.');
      loadWorkspaceData();
    }
  };

  const handleFinalSubmit = (approval: ApprovalRequest) => {
    if (!user) return;

    // Strict verification
    const verification = verifyApprovalToken({
      approval_token: approval.approval_token,
      user_id: user.id,
      expected_destination_url: approval.destination_url,
      expected_role_title: approval.role_title,
      expected_employer_name: approval.employer_name,
      document_hash: approval.document_hash,
    });

    if (!verification.isApproved || !verification.approvalRequest) {
      setActionNotice(`Verification rejected: ${verification.error}`);
      return;
    }

    // Consume single-use token and record application
    const application = consumeApprovalTokenAndRecordApplication(
      verification.approvalRequest,
      'manual_confirmed'
    );

    setActionNotice(`Application successfully confirmed and added to pipeline for ${approval.employer_name}!`);
    loadWorkspaceData();
    setActiveTab('tracker');
  };

  return (
    <div className="space-y-8 pb-12 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
            Verified Applications & Governance
          </span>
          <Badge variant="purple" size="sm">Human-in-the-Loop</Badge>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
          Application Workspace & Approval Engine
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
          Review role-tailored resume summaries and cover letters grounded strictly in your verified facts. Enforces backend approval tokens before any external dispatch.
        </p>
      </div>

      {actionNotice && (
        <Alert variant="info" onClose={() => setActionNotice(null)}>
          {actionNotice}
        </Alert>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('drafts')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
            activeTab === 'drafts'
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Tailored Drafts ({drafts.length})
        </button>

        <button
          onClick={() => setActiveTab('approvals')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 ${
            activeTab === 'approvals'
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>Approval State Machine</span>
          {approvalRequests.filter((a) => a.status === 'pending_approval').length > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('tracker')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
            activeTab === 'tracker'
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Application Tracker ({trackedApplications.length})
        </button>
      </div>

      {/* Tab 1: Drafts */}
      {activeTab === 'drafts' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Drafts List sidebar */}
          <div className="lg:col-span-1 space-y-3">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Saved Drafts
            </h4>
            {drafts.length === 0 ? (
              <Card className="p-6 text-center text-xs text-slate-400">
                No tailored application drafts yet. Use the Placement Co-Pilot to generate drafts for verified jobs.
              </Card>
            ) : (
              drafts.map((d) => (
                <div
                  key={d.id}
                  onClick={() => setSelectedDraft(d)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    selectedDraft?.id === d.id
                      ? 'bg-[#151f38] border-blue-500/40 shadow-lg'
                      : 'bg-[#090d16] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <h5 className="text-sm font-semibold text-slate-100">{d.role_title}</h5>
                  <p className="text-xs text-blue-400 font-medium">{d.company_name}</p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                    <span>v{d.version}</span>
                    <Badge variant="blue" size="sm">
                      {d.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Selected Draft Viewer */}
          <div className="lg:col-span-2 space-y-6">
            {selectedDraft ? (
              <Card className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                  <div>
                    <h3 className="text-lg font-bold text-slate-100">
                      {selectedDraft.role_title}
                    </h3>
                    <p className="text-xs text-blue-400 font-medium">
                      Tailored for {selectedDraft.company_name}
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleRequestApproval(selectedDraft)}
                    leftIcon={<Lock className="w-4 h-4" />}
                  >
                    Initiate Approval Workflow
                  </Button>
                </div>

                {/* Grounding Facts Notice */}
                <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-500/20 space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center gap-1.5 font-semibold text-blue-300">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Fact Grounding Citations</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
                    {selectedDraft.source_facts_grounding?.map((fact, i) => (
                      <li key={i}>{fact}</li>
                    ))}
                  </ul>
                </div>

                {/* Tailored Summary */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Role-Specific Resume Summary
                  </h4>
                  <div className="p-3.5 rounded-lg bg-[#090d16] border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed">
                    {selectedDraft.tailored_resume_summary}
                  </div>
                </div>

                {/* Tailored Bullets */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Targeted Bullet Points
                  </h4>
                  <div className="space-y-2">
                    {selectedDraft.tailored_bullet_points?.map((bullet, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-[#090d16] border border-slate-800/80 text-xs sm:text-sm text-slate-300 flex items-start gap-2"
                      >
                        <span className="text-blue-400 font-bold">•</span>
                        <span>{bullet}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cover Letter */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Custom Cover Letter
                  </h4>
                  <div className="p-4 rounded-lg bg-[#090d16] border border-slate-800 text-xs sm:text-sm text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">
                    {selectedDraft.cover_letter}
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-12 text-center text-xs text-slate-400">
                Select a draft to inspect tailored content and fact grounding.
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Approval State Machine */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>State Machine: <strong className="text-slate-200">draft → pending_approval → approved → submitted</strong></span>
            <span>Single-use cryptographic validation</span>
          </div>

          {approvalRequests.length === 0 ? (
            <Card className="p-12 text-center text-xs text-slate-400">
              No approval requests yet. Initiate an approval from any draft above.
            </Card>
          ) : (
            <div className="space-y-3">
              {approvalRequests.map((req) => (
                <Card key={req.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-100">{req.role_title}</h4>
                      <Badge
                        variant={
                          req.status === 'approved'
                            ? 'emerald'
                            : req.status === 'pending_approval'
                            ? 'amber'
                            : req.status === 'submitted'
                            ? 'blue'
                            : 'rose'
                        }
                        size="sm"
                      >
                        {req.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-blue-400">{req.employer_name}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono pt-1">
                      <span>Token: {req.approval_token.slice(0, 16)}...</span>
                      <span>Hash: {req.document_hash}</span>
                    </div>
                  </div>

                  {/* Actions according to status */}
                  <div className="flex items-center gap-2">
                    {req.status === 'pending_approval' && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleReject(req.id)}>
                          Reject
                        </Button>
                        <Button size="sm" variant="primary" onClick={() => handleApprove(req.id)}>
                          Approve Request
                        </Button>
                      </>
                    )}

                    {req.status === 'approved' && !req.is_used && (
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => handleFinalSubmit(req)}
                        leftIcon={<Send className="w-3.5 h-3.5" />}
                      >
                        Execute Submission
                      </Button>
                    )}

                    {req.status === 'submitted' && (
                      <Badge variant="blue" size="md">
                        Confirmed & Logged
                      </Badge>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Application Tracker */}
      {activeTab === 'tracker' && (
        <div className="space-y-4">
          {trackedApplications.length === 0 ? (
            <Card className="p-12 text-center text-xs text-slate-400">
              No applications tracked yet. Complete an approved submission to monitor stage progression.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trackedApplications.map((app) => (
                <Card key={app.id} className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-100">{app.role_title}</h4>
                      <p className="text-xs text-blue-400">{app.company_name}</p>
                    </div>
                    <Badge variant="blue" size="sm">
                      {app.status.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="text-xs text-slate-400 space-y-1">
                    <p>Submission method: {app.submission_method}</p>
                    <p>Applied date: {app.applied_at.split('T')[0]}</p>
                    {app.notes && <p className="text-slate-300 italic">{app.notes}</p>}
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex justify-end">
                    <a
                      href={app.apply_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 underline"
                    >
                      <span>Destination URL</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
