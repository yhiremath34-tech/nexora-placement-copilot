import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ToolCallTimeline } from './ToolCallTimeline';
import { HumanApprovalModal } from './HumanApprovalModal';
import {
  runAgentWorkflow,
  AgentContextData,
} from '../../services/agentOrchestrator';
import {
  approveRequestByHuman,
  rejectRequestByHuman,
} from '../../services/approvalStateMachine';
import { ToolCallExecution } from '../../types/agent.types';
import { JobListing, MatchEvaluation } from '../../types/job.types';
import {
  Sparkles,
  Send,
  Bot,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Clock,
  Briefcase,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface AgentTerminalProps {
  onJobsDiscovered?: (jobs: JobListing[]) => void;
  onMatchesEvaluated?: (matches: MatchEvaluation[]) => void;
}

export const AgentTerminal: React.FC<AgentTerminalProps> = ({
  onJobsDiscovered,
  onMatchesEvaluated,
}) => {
  const { user, profile } = useAuth();

  const [prompt, setPrompt] = useState(
    'Find remote AI internships suitable for my current skills, explain my top matches, and prepare an application for the best one.'
  );
  const [isRunning, setIsRunning] = useState(false);
  const [timeline, setTimeline] = useState<ToolCallExecution[]>([]);
  const [agentResponse, setAgentResponse] = useState<string | null>(null);
  const [pendingApproval, setPendingApproval] = useState<any | null>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [approvalStatusMessage, setApprovalStatusMessage] = useState<string | null>(null);

  const quickPrompts = [
    'Find remote AI internships suitable for my current skills, explain my top matches, and prepare an application for the best one.',
    'Discover junior full-stack developer roles and calculate explainable match scores.',
    'Analyze my resume skills and search for entry-level machine learning positions.',
  ];

  const handleRunAgent = async (promptToRun = prompt) => {
    if (!promptToRun.trim() || isRunning) return;

    setIsRunning(true);
    setTimeline([]);
    setAgentResponse(null);
    setPendingApproval(null);
    setApprovalStatusMessage(null);

    const context: AgentContextData = {
      userId: user?.id || 'demo-user-id',
      profile,
      resume: null,
      sessionId: crypto.randomUUID(),
    };

    try {
      const outcome = await runAgentWorkflow(promptToRun, context, (updatedStep) => {
        setTimeline((prev) => {
          const index = prev.findIndex((s) => s.id === updatedStep.id);
          if (index !== -1) {
            const next = [...prev];
            next[index] = updatedStep;
            return next;
          }
          return [...prev, updatedStep];
        });
      });

      setAgentResponse(outcome.assistantResponse);

      if (outcome.discoveredJobs && onJobsDiscovered) {
        onJobsDiscovered(outcome.discoveredJobs);
      }

      if (outcome.matchedEvaluations && onMatchesEvaluated) {
        onMatchesEvaluated(outcome.matchedEvaluations);
      }

      if (outcome.pendingApproval) {
        setPendingApproval(outcome.pendingApproval);
        setIsApprovalModalOpen(true);
      }
    } catch (err: unknown) {
      console.error('Agent workflow execution error:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleApprove = async (token: string) => {
    if (!pendingApproval?.approval_request_id || !user) return;
    const result = approveRequestByHuman(pendingApproval.approval_request_id, user.id);
    if (result.success) {
      setApprovalStatusMessage(
        'Application authorized and successfully recorded! External submission registered under verified human signature.'
      );
      setIsApprovalModalOpen(false);
      setPendingApproval(null);
    }
  };

  const handleReject = async (token: string, reason: string) => {
    if (!pendingApproval?.approval_request_id || !user) return;
    const result = rejectRequestByHuman(pendingApproval.approval_request_id, user.id, reason);
    if (result.success) {
      setApprovalStatusMessage(`Action rejected: ${reason}. Zero external actions were taken.`);
      setIsApprovalModalOpen(false);
      setPendingApproval(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Terminal Card */}
      <Card variant="elevated" className="border-blue-500/25 shadow-2xl shadow-blue-500/5">
        {/* Terminal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-[#090d16]/70">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100">
                  Nexora Autonomous Career Orchestrator
                </h3>
                <Badge variant="blue" size="sm">
                  10 REAL BACKEND TOOLS
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                Powered by Gemini Function Calling & Live Remotive API
              </p>
            </div>
          </div>

          {/* Real-time status */}
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isRunning ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'
              }`}
            />
            <span className="text-xs font-mono text-slate-300">
              {isRunning ? 'Orchestrating Tool Calls...' : 'Ready for Instructions'}
            </span>
          </div>
        </div>

        {/* Input & Prompt Bar */}
        <div className="p-4 sm:p-5 space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRunAgent();
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask Nexora to find roles, evaluate match scores, and draft applications..."
                disabled={isRunning}
                className="w-full bg-[#090d16] border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              isLoading={isRunning}
              rightIcon={<Send className="w-4 h-4" />}
              className="sm:w-auto"
            >
              Run Co-Pilot
            </Button>
          </form>

          {/* Quick prompt suggestions */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Example Verifiable Student Workflows:
            </span>
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((qp, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setPrompt(qp);
                    handleRunAgent(qp);
                  }}
                  disabled={isRunning}
                  className="text-left text-xs px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors max-w-full truncate"
                >
                  {qp}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Status notification banner if human approval was resolved */}
        {approvalStatusMessage && (
          <div className="px-5 pb-4">
            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-200">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{approvalStatusMessage}</span>
            </div>
          </div>
        )}

        {/* Live Execution Timeline & Results Grid */}
        {(timeline.length > 0 || agentResponse) && (
          <div className="p-4 sm:p-5 border-t border-slate-800/80 bg-[#090d16]/40 space-y-6">
            {/* Step-by-step Tool Timeline */}
            <div>
              <ToolCallTimeline timeline={timeline} />
            </div>

            {/* Structured Synthesis & Grounded Output */}
            {agentResponse && (
              <div className="p-5 rounded-xl bg-[#090d16] border border-slate-800 space-y-4">
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Agent Synthesis & Analysis
                    </span>
                  </div>
                  <Badge variant="blue" size="sm">Grounded in Profile</Badge>
                </div>

                <div className="prose prose-invert prose-sm max-w-none text-slate-300 whitespace-pre-wrap leading-relaxed text-xs sm:text-sm font-sans">
                  {agentResponse}
                </div>

                {/* If awaiting approval banner */}
                {pendingApproval && (
                  <div className="mt-4 p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="space-y-1 text-center sm:text-left">
                      <div className="flex items-center justify-center sm:justify-start gap-1.5 text-amber-300 font-semibold text-xs">
                        <ShieldAlert className="w-4 h-4" />
                        <span>Action Stopped for Human Authorization</span>
                      </div>
                      <p className="text-xs text-slate-300">
                        Application draft generated for {pendingApproval.role_title} at{' '}
                        {pendingApproval.employer_name}.
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => setIsApprovalModalOpen(true)}
                      leftIcon={<ShieldCheck className="w-4 h-4" />}
                      className="whitespace-nowrap"
                    >
                      Review & Approve
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Human Approval Review Modal */}
      <HumanApprovalModal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        approvalData={pendingApproval}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
};
