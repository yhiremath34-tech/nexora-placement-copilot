import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import {
  Sparkles,
  ShieldCheck,
  Briefcase,
  Search,
  FileCheck,
  CheckCircle,
  TrendingUp,
  Cpu,
  ArrowRight,
  Lock,
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const { signInDemoStudent } = useAuth();

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Banner / Announcement */}
      <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-blue-900/40 border-b border-blue-500/20 py-2.5 px-4 text-center">
        <div className="inline-flex items-center gap-2 text-xs font-medium text-blue-200">
          <Badge variant="blue" size="sm">AGENTX HACKATHON 2026</Badge>
          <span>PS-06: Autonomous Placement Co-Pilot with Strict Human-in-the-Loop Governance</span>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-20 pb-24 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Ambient subtle glow background */}
        <div className="absolute top-1/4 -translate-y-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -translate-y-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/80 text-xs text-slate-300 mb-8 backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span>Gemini-Powered Multi-Step Placement Agent</span>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          <span className="text-blue-400 font-semibold">10 Verified Tools</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl leading-[1.1]">
          Turn your student resume into{' '}
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
            verified job applications
          </span>{' '}
          with zero hallucinations.
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl leading-relaxed">
          Nexora is the student placement co-pilot that scans genuine remote and tech listings, calculates explainable match scores, drafts grounded application documents, and enforces strict human approval before any external action.
        </p>

        {/* Call to action buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Button
            size="lg"
            onClick={onGetStarted}
            rightIcon={<ArrowRight className="w-5 h-5" />}
            className="w-full sm:w-auto"
          >
            Launch Placement Co-Pilot
          </Button>

          <Button
            size="lg"
            variant="secondary"
            onClick={signInDemoStudent}
            leftIcon={<Cpu className="w-5 h-5 text-blue-400" />}
            className="w-full sm:w-auto"
          >
            Explore Pre-loaded Student Profile
          </Button>
        </div>

        {/* Real-time stats / trust points */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-4xl text-left">
          <Card padding="sm" className="bg-[#0e1526]/80 border-slate-800">
            <div className="p-3">
              <span className="text-2xl font-bold text-slate-100 font-mono">100%</span>
              <p className="text-xs text-slate-400 mt-1">Fact Grounding (No Fake Work Exp)</p>
            </div>
          </Card>

          <Card padding="sm" className="bg-[#0e1526]/80 border-slate-800">
            <div className="p-3">
              <span className="text-2xl font-bold text-blue-400 font-mono">0–100%</span>
              <p className="text-xs text-slate-400 mt-1">Explainable Skill Match Score</p>
            </div>
          </Card>

          <Card padding="sm" className="bg-[#0e1526]/80 border-slate-800">
            <div className="p-3">
              <span className="text-2xl font-bold text-emerald-400 font-mono">Live API</span>
              <p className="text-xs text-slate-400 mt-1">Genuine Remotive & Tech Listings</p>
            </div>
          </Card>

          <Card padding="sm" className="bg-[#0e1526]/80 border-slate-800">
            <div className="p-3">
              <span className="text-2xl font-bold text-purple-400 font-mono">Single-Use</span>
              <p className="text-xs text-slate-400 mt-1">Cryptographic Human Approvals</p>
            </div>
          </Card>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="blue" className="mb-3">AUTONOMOUS WORKFLOWS WITH SAFETY</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-100">
            Built from the ground up for modern engineering students
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-3">
            Every step is transparent, explainable, and under your command.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <Card variant="interactive" className="p-6 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600/15 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <FileCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">Resume Intelligence & ATS Radar</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Upload your PDF/Word resume. Our extraction engine parses technical skills, coursework, and projects while identifying exact skill gaps for your target roles.
            </p>
          </Card>

          {/* Feature 2 */}
          <Card variant="interactive" className="p-6 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-600/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">Genuine Job Discovery</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Connects directly to genuine public job APIs (Remotive API) for real remote internships and developer roles. Never fabricated listings or placeholder URLs.
            </p>
          </Card>

          {/* Feature 3 */}
          <Card variant="interactive" className="p-6 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-purple-600/15 border border-purple-500/30 text-purple-400 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">Explainable Match Engine</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Understand why an opportunity matches. Get honest match scores, matching evidence citations, missing skills, and uncertainty factors.
            </p>
          </Card>

          {/* Feature 4 */}
          <Card variant="interactive" className="p-6 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-600/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Briefcase className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">Strictly Grounded Drafts</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Generate role-specific resume bullet points and tailored cover letters strictly from verified facts. Zero invented metrics, degrees, or false claims.
            </p>
          </Card>

          {/* Feature 5 */}
          <Card variant="interactive" className="p-6 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-600/15 border border-rose-500/30 text-rose-400 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">Human Approval State Machine</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              `draft → pending_approval → approved → submitted`. The agent is blocked by cryptographic single-use tokens from any external action until you confirm.
            </p>
          </Card>

          {/* Feature 6 */}
          <Card variant="interactive" className="p-6 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">Gemini Function Calling Loop</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Full server-side agent orchestration with typed tools: `get_student_profile`, `search_jobs`, `match_jobs`, `generate_application_draft`, and `save_job`.
            </p>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 py-8 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="font-bold text-slate-200">NEXORA</span>
            <span>• Placement Co-Pilot (PS-06)</span>
          </div>
          <div className="flex items-center gap-6">
            <span>Supabase RLS Protected</span>
            <span>Gemini Function Calling</span>
            <span>Vercel Deployable</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
