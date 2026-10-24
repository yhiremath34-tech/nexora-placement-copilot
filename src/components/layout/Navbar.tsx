import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, Bell, Shield, LogOut, Menu } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface NavbarProps {
  onToggleMobileMenu?: () => void;
  activeView: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu, activeView }) => {
  const { user, profile, isCloudSupabase, signOut, signInDemoStudent } = useAuth();

  const getPageTitle = (view: string) => {
    switch (view) {
      case 'dashboard':
        return 'Placement Command Center';
      case 'resume':
        return 'Resume Intelligence & Skill Gap Radar';
      case 'jobs':
        return 'Job Discovery & Explainable Matching';
      case 'applications':
        return 'Application Workspace & Human Approvals';
      case 'interview':
        return 'AI Interview Preparation';
      case 'settings':
        return 'Profile, Data Privacy & Security';
      case 'onboarding':
        return 'Career Onboarding';
      default:
        return 'Nexora Placement Co-Pilot';
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#090d16]/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {user && onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20 font-bold text-white text-base">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-blue-300 bg-clip-text text-transparent">
                NEXORA
              </span>
              <Badge variant="blue" size="sm" className="hidden sm:inline-flex">
                PS-06 CO-PILOT
              </Badge>
            </div>
            {user && (
              <p className="text-xs text-slate-400 hidden md:block">
                {getPageTitle(activeView)}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Supabase status indicator */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              isCloudSupabase ? 'bg-emerald-400 animate-pulse' : 'bg-blue-400'
            }`}
          />
          <span className="text-slate-400">
            {isCloudSupabase ? 'Supabase Cloud' : 'Local Dev Store'}
          </span>
        </div>

        {user ? (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-slate-200">
                {profile?.full_name || user.email.split('@')[0]}
              </span>
              <span className="text-[10px] text-slate-400">
                {profile?.university || 'Verified Student'}
              </span>
            </div>

            <button
              onClick={() => signOut()}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition-colors"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={signInDemoStudent}
              className="text-xs px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-medium transition-colors"
            >
              Quick Demo Login
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
