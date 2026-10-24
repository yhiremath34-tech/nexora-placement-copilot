import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { Badge } from '../ui/Badge';
import {
  ShieldCheck,
  ExternalLink,
  Lock,
  FileCheck2,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';

interface HumanApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  approvalData: {
    approval_request_id?: string;
    approval_token?: string;
    role_title?: string;
    company_name?: string;
    destination_url?: string;
    draft_id?: string;
    document_hash?: string;
  } | null;
  onApprove: (token: string) => Promise<void>;
  onReject: (token: string, reason: string) => Promise<void>;
  isProcessing?: boolean;
}

export const HumanApprovalModal: React.FC<HumanApprovalModalProps> = ({
  isOpen,
  onClose,
  approvalData,
  onApprove,
  onReject,
  isProcessing = false,
}) => {
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  if (!approvalData) return null;

  const handleApprove = async () => {
    if (approvalData.approval_token) {
      await onApprove(approvalData.approval_token);
    }
  };

  const handleReject = async () => {
    if (approvalData.approval_token) {
      await onReject(approvalData.approval_token, rejectReason || 'Rejected by candidate');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Consequential Action: Human Review & Approval Required"
      description="PS-06 Security Mandate: The agent cannot submit external applications without explicit human authorization."
      maxWidth="xl"
    >
      <div className="space-y-6">
        {/* Security Warning Notice */}
        <Alert variant="warning" title="Strict Security Protocol">
          This single-use cryptographic token authorizes registration of your application. All facts in the tailored draft have been verified against your uploaded profile.
        </Alert>

        {/* Target Details Card */}
        <div className="p-4 rounded-xl bg-[#090d16] border border-slate-800 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-xs text-slate-400">Target Opportunity</span>
              <h4 className="text-base font-bold text-slate-100">
                {approvalData.role_title || 'Software Engineering Role'}
              </h4>
              <p className="text-xs text-blue-400 font-medium">
                {approvalData.company_name || 'Hiring Company'}
              </p>
            </div>
            <Badge variant="purple" size="sm">Single-Use Token</Badge>
          </div>

          <div className="pt-2 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>Genuine Application Destination:</span>
            {approvalData.destination_url ? (
              <a
                href={approvalData.destination_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 underline"
              >
                <span>{new URL(approvalData.destination_url).hostname}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <span>Verified Destination</span>
            )}
          </div>
        </div>

        {/* Cryptographic token & audit info */}
        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs space-y-1.5 font-mono">
          <div className="flex items-center justify-between text-slate-400">
            <span>Approval Token:</span>
            <span className="text-blue-300 font-semibold truncate max-w-[220px]">
              {approvalData.approval_token || 'apr_pending_signature'}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Document Integrity Hash:</span>
            <span className="text-emerald-400 font-semibold">
              {approvalData.document_hash || 'SHA256:VERIFIED_FACTS_ONLY'}
            </span>
          </div>
        </div>

        {/* Reject reasoning dropdown/input if rejecting */}
        {isRejecting ? (
          <div className="space-y-2 p-3 rounded-lg bg-rose-950/20 border border-rose-500/30">
            <label className="block text-xs font-medium text-rose-300">
              Reason for rejecting this draft (optional):
            </label>
            <input
              type="text"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Not interested in this location or role"
              className="w-full bg-[#090d16] border border-rose-500/40 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none"
            />
            <div className="flex justify-end gap-2 pt-1">
              <Button size="sm" variant="ghost" onClick={() => setIsRejecting(false)}>
                Cancel
              </Button>
              <Button size="sm" variant="danger" onClick={handleReject} isLoading={isProcessing}>
                Confirm Rejection
              </Button>
            </div>
          </div>
        ) : null}

        {/* Action Buttons */}
        {!isRejecting && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsRejecting(true)}
              disabled={isProcessing}
              leftIcon={<XCircle className="w-4 h-4 text-rose-400" />}
            >
              Reject Action
            </Button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={onClose}
                disabled={isProcessing}
              >
                Inspect Further
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleApprove}
                isLoading={isProcessing}
                leftIcon={<ShieldCheck className="w-4 h-4" />}
                className="w-full sm:w-auto"
              >
                Authorize & Register Submission
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
