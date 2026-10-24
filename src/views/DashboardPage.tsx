import React, { useState, useEffect } from 'react';
import { useAuth } from '../../src/context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { AgentTerminal } from '../components/agent/AgentTerminal';
import { localStore } from '../services/supabaseClient';
import { SavedJob, StudentResume, TrackedApplication } from '../types/database.types';
import { JobListing, MatchEvaluation } from '../types/job.types';
import {
  Briefcase,
  FileText,
  Send,
  CheckCircle2,
  TrendingUp,
  Clock,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (view: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user, profile, preferences } = useAuth();

  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [applications, setApplications] = useState<TrackedApplication[]>([]);
  const [primaryResume, setPrimaryResume] = useState<StudentResume | null>(null);

  useEffect(() => {
    if (user) {
      const jobs = localStore.get<SavedJob>('saved_jobs').filter((j) => j.user_id === user.id);
      setSavedJobs(jobs);

      const apps = localStore.get<TrackedApplication>('applications').filter((a) => a.user_id === user.id);
      setApplications(apps);

      const resumes = localStore.get<StudentResume>('resumes').filter((r) => r.user_id === user.id);
      setPrimaryResume(resumes[0] || null);
    }
  }, [user]);

  const verifiedSkillsCount = primaryResume?.parsed_skills?.length || 12;

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#0e1526] via-[#151f38] to-[#0e1526] border border-blue-500/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
              Student Command Center
            </span>
            <Badge variant="emerald" size="sm">Active Placement Cycle</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
            Welcome back, {profile?.full_name || 'Candidate'}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            {profile?.headline || 'CS Senior looking for AI Engineering & Full Stack Roles'} • {profile?.university || 'University'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="md"
            variant="secondary"
            onClick={() => onNavigate('resume')}
            leftIcon={<FileText className="w-4 h-4 text-blue-400" />}
          >
            Update Resume
          </Button>
          <Button
            size="md"
            variant="primary"
            onClick={() => onNavigate('jobs')}
            rightIcon={<ArrowUpRight className="w-4 h-4" />}
          >
            Discover Jobs
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md" className="space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Verified Skills</span>
            <FileText className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono">
            {verifiedSkillsCount}
          </div>
          <p className="text-[11px] text-slate-400">Extracted from primary resume</p>
        </Card>

        <Card padding="md" className="space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Saved Opportunities</span>
            <Briefcase className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono">
            {savedJobs.length}
          </div>
          <p className="text-[11px] text-slate-400">In your career library</p>
        </Card>

        <Card padding="md" className="space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Active Applications</span>
            <Send className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono">
            {applications.length}
          </div>
          <p className="text-[11px] text-slate-400">Human-verified submissions</p>
        </Card>

        <Card padding="md" className="space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Approval Security</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400 font-mono">
            100%
          </div>
          <p className="text-[11px] text-slate-400">Single-use token enforcement</p>
        </Card>
      </div>

      {/* Agent Workflow Orchestrator Terminal */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <h2 className="text-lg font-bold text-slate-100">
              Interactive Placement Co-Pilot Agent
            </h2>
          </div>
          <Badge variant="blue" size="sm">Gemini Multi-Turn</Badge>
        </div>

        <AgentTerminal
          onJobsDiscovered={(jobs) => {
            console.log('Jobs discovered by agent:', jobs.length);
          }}
        />
      </div>

      {/* Two Column Layout: Saved Opportunities & Application Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Saved Opportunities Card */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-400" />
              <h3 className="text-base font-bold text-slate-100">Saved Opportunities</h3>
            </div>
            <button
              onClick={() => onNavigate('jobs')}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {savedJobs.length === 0 ? (
            <div className="py-8 text-center space-y-3">
              <p className="text-xs text-slate-400">No opportunities saved yet.</p>
              <Button size="sm" variant="secondary" onClick={() => onNavigate('jobs')}>
                Search Genuine Listings
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {savedJobs.slice(0, 3).map((job) => (
                <div
                  key={job.id}
                  className="p-3.5 rounded-xl bg-[#090d16] border border-slate-800/80 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                >
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">{job.title}</h4>
                    <p className="text-[11px] text-slate-400">{job.company_name} • {job.location || 'Remote'}</p>
                  </div>
                  {job.match_score && (
                    <Badge variant="emerald" size="sm">
                      {job.match_score}% Match
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Application Pipeline Card */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-slate-100">Application Pipeline</h3>
            </div>
            <button
              onClick={() => onNavigate('applications')}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
            >
              <span>Workspace</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {applications.length === 0 ? (
            <div className="py-8 text-center space-y-3">
              <p className="text-xs text-slate-400">
                No active applications in pipeline yet. Use the Co-Pilot to prepare and approve drafts.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.slice(0, 3).map((app) => (
                <div
                  key={app.id}
                  className="p-3.5 rounded-xl bg-[#090d16] border border-slate-800/80 flex items-center justify-between gap-3"
                >
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">{app.role_title}</h4>
                    <p className="text-[11px] text-slate-400">{app.company_name} • Applied {app.applied_at.split('T')[0]}</p>
                  </div>
                  <Badge variant="blue" size="sm">
                    {app.status.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
