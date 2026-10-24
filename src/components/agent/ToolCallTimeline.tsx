import React from 'react';
import { ToolCallExecution } from '../../types/agent.types';
import { CheckCircle2, Clock, AlertCircle, ShieldAlert, Cpu } from 'lucide-react';
import { clsx } from 'clsx';

interface ToolCallTimelineProps {
  timeline: ToolCallExecution[];
}

export const ToolCallTimeline: React.FC<ToolCallTimelineProps> = ({ timeline }) => {
  if (timeline.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-slate-500">
        Agent idle. No tool executions recorded yet.
      </div>
    );
  }

  const getToolDisplayName = (name: string): string => {
    switch (name) {
      case 'get_student_profile':
        return '1. Load Verified Student Profile';
      case 'analyze_resume':
        return '2. Extract & Ground Resume Facts';
      case 'search_jobs':
        return '3. Query Live Remotive Job API';
      case 'match_jobs':
        return '4. Compute Explainable Match Scores';
      case 'generate_application_draft':
        return '5. Synthesize Grounded Application Draft';
      case 'save_job':
        return '6. Save Job into Student Library';
      case 'save_application_draft':
        return '7. Persist Draft in Application Workspace';
      case 'get_application_status':
        return '8. Check Pipeline Statuses';
      case 'request_application_approval':
        return '9. Human Approval Gating (LOCK SUBMISSION)';
      case 'submit_approved_application':
        return '10. Execute Authorized Submission';
      default:
        return name;
    }
  };

  return (
    <div className="space-y-3 font-mono text-xs">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5 font-semibold text-slate-300">
          <Cpu className="w-3.5 h-3.5 text-blue-400" />
          <span>Real Server Tool Execution Trace</span>
        </span>
        <span>{timeline.length} tool calls executed</span>
      </div>

      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
        {timeline.map((item, idx) => {
          const isPendingApproval = item.tool_name === 'request_application_approval';
          const isFailed = item.status === 'failed';
          const isRunning = item.status === 'running';

          return (
            <div key={item.id || idx} className="relative group">
              {/* Timeline marker icon */}
              <div
                className={clsx(
                  'absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center border text-[10px]',
                  isPendingApproval
                    ? 'bg-amber-950/80 border-amber-500 text-amber-400'
                    : isFailed
                    ? 'bg-rose-950/80 border-rose-500 text-rose-400'
                    : isRunning
                    ? 'bg-blue-950/80 border-blue-500 text-blue-400 animate-pulse'
                    : 'bg-emerald-950/80 border-emerald-500/80 text-emerald-400'
                )}
              >
                {isPendingApproval ? (
                  <ShieldAlert className="w-3 h-3" />
                ) : isFailed ? (
                  <AlertCircle className="w-3 h-3" />
                ) : isRunning ? (
                  <Clock className="w-3 h-3 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3 h-3" />
                )}
              </div>

              {/* Tool Card */}
              <div className="p-3 rounded-lg bg-[#090d16] border border-slate-800/90 hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-200">
                    {getToolDisplayName(item.tool_name)}
                  </span>
                  <span
                    className={clsx(
                      'text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold',
                      isPendingApproval
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        : isRunning
                        ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                        : isFailed
                        ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                        : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    )}
                  >
                    {item.status}
                  </span>
                </div>

                {/* Arguments Preview */}
                {Object.keys(item.args).length > 0 && (
                  <div className="mt-1.5 text-[11px] text-slate-400 truncate">
                    <span className="text-slate-500">args: </span>
                    {JSON.stringify(item.args)}
                  </div>
                )}

                {/* Error message if any */}
                {item.error && (
                  <div className="mt-1 text-[11px] text-rose-400">
                    Error: {item.error}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
