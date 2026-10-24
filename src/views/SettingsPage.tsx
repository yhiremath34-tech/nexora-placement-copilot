import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { Modal } from '../components/ui/Modal';
import { localStore } from '../services/supabaseClient';
import {
  Shield,
  Trash2,
  Database,
  Key,
  CheckCircle2,
  AlertTriangle,
  Info,
  Server,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, profile, isCloudSupabase, deleteAccountAndData, signOut } = useAuth();

  const [memoryStats, setMemoryStats] = useState({
    resumes: 0,
    savedJobs: 0,
    drafts: 0,
    applications: 0,
    approvalRequests: 0,
    toolLogs: 0,
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    loadMemoryStats();
  }, [user]);

  const loadMemoryStats = () => {
    if (!user) return;
    setMemoryStats({
      resumes: localStore.get('resumes').filter((r: any) => r.user_id === user.id).length,
      savedJobs: localStore.get('saved_jobs').filter((j: any) => j.user_id === user.id).length,
      drafts: localStore.get('application_drafts').filter((d: any) => d.user_id === user.id).length,
      applications: localStore.get('applications').filter((a: any) => a.user_id === user.id).length,
      approvalRequests: localStore.get('approval_requests').filter((ar: any) => ar.user_id === user.id).length,
      toolLogs: localStore.get('agent_tool_logs').filter((tl: any) => tl.user_id === user.id).length,
    });
  };

  const handleDeleteData = async () => {
    if (deleteConfirmation !== 'DELETE') return;
    setIsDeleting(true);
    try {
      await deleteAccountAndData();
      setIsDeleteModalOpen(false);
      setStatusMessage('All personal career memory and data have been wiped clean.');
    } catch {
      setStatusMessage('Failed to purge data.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
            Governance & Privacy Controls
          </span>
          <Badge variant="blue" size="sm">User-Scoped</Badge>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
          Account Settings & Memory Inspection
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Full data transparency. Inspect all persistent memory, agent tool execution logs, and database connections. You can wipe your data at any time.
        </p>
      </div>

      {statusMessage && (
        <Alert variant="info" onClose={() => setStatusMessage(null)}>
          {statusMessage}
        </Alert>
      )}

      {/* Supabase Connection Status */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-slate-100">
              Supabase Backend Infrastructure
            </h3>
          </div>
          <Badge variant={isCloudSupabase ? 'emerald' : 'blue'} size="sm">
            {isCloudSupabase ? 'Connected to Supabase Cloud' : 'Local Dev Store Active'}
          </Badge>
        </div>

        <div className="text-xs text-slate-400 space-y-2 leading-relaxed">
          <p>
            {isCloudSupabase
              ? 'Your deployment is connected to an active Supabase Cloud instance with Row-Level Security (RLS) active.'
              : 'Operating in Local Persistent Store mode. Database records are persisted in local browser storage across sessions for seamless zero-setup testing.'}
          </p>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300">
            <div>Migration script: supabase/migrations/20261024000000_create_nexora_schema.sql</div>
            <div>Edge function: supabase/functions/career-agent/index.ts</div>
          </div>
        </div>
      </Card>

      {/* Memory Inspection (Section 4 Compliance) */}
      <Card className="p-6 space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <Database className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-bold text-slate-100">
            Inspect User-Scoped Memory
          </h3>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Under PS-06 specification, only your authenticated user records are queried. Review all active records stored in memory:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[#090d16] border border-slate-800">
            <span className="text-slate-400">Resumes</span>
            <div className="text-lg font-bold font-mono text-slate-100 mt-1">
              {memoryStats.resumes}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#090d16] border border-slate-800">
            <span className="text-slate-400">Saved Opportunities</span>
            <div className="text-lg font-bold font-mono text-slate-100 mt-1">
              {memoryStats.savedJobs}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#090d16] border border-slate-800">
            <span className="text-slate-400">Application Drafts</span>
            <div className="text-lg font-bold font-mono text-slate-100 mt-1">
              {memoryStats.drafts}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#090d16] border border-slate-800">
            <span className="text-slate-400">Tracked Applications</span>
            <div className="text-lg font-bold font-mono text-slate-100 mt-1">
              {memoryStats.applications}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#090d16] border border-slate-800">
            <span className="text-slate-400">Approval Tokens</span>
            <div className="text-lg font-bold font-mono text-slate-100 mt-1">
              {memoryStats.approvalRequests}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#090d16] border border-slate-800">
            <span className="text-slate-400">Tool Audit Logs</span>
            <div className="text-lg font-bold font-mono text-slate-100 mt-1">
              {memoryStats.toolLogs}
            </div>
          </div>
        </div>
      </Card>

      {/* Danger Zone: Wipe Data */}
      <Card className="p-6 border-rose-500/30 bg-rose-950/10 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-rose-500/20">
          <Trash2 className="w-5 h-5 text-rose-400" />
          <h3 className="text-base font-bold text-rose-300">
            Purge Career Data & Reset
          </h3>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Permanently delete your profile, resume fact extractions, saved opportunities, drafts, and approval history. This action is irreversible.
        </p>

        <div>
          <Button
            variant="danger"
            size="md"
            onClick={() => setIsDeleteModalOpen(true)}
            leftIcon={<Trash2 className="w-4 h-4" />}
          >
            Delete Saved Career Data
          </Button>
        </div>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Data Erasure"
        description="Are you sure you want to permanently delete your saved career data?"
        maxWidth="md"
      >
        <div className="space-y-4">
          <Alert variant="warning" title="Irreversible Action">
            All stored career data, parsed resumes, drafts, and applications will be erased.
          </Alert>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Type <strong className="text-rose-400">DELETE</strong> to confirm:
            </label>
            <input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="DELETE"
              className="w-full bg-[#090d16] border border-slate-700/80 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button size="sm" variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="danger"
              disabled={deleteConfirmation !== 'DELETE'}
              isLoading={isDeleting}
              onClick={handleDeleteData}
            >
              Confirm Erasure
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
