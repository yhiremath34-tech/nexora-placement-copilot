import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  FileCheck2,
  HelpCircle,
  Settings,
  Bot,
  UserCheck,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { clsx } from 'clsx';

interface SidebarProps {
  activeView: string;
  onSelectView: (view: string) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Command Center',
      icon: LayoutDashboard,
      badge: 'Live',
    },
    {
      id: 'resume',
      label: 'Resume Intelligence',
      icon: FileText,
    },
    {
      id: 'jobs',
      label: 'Job Discovery & Matches',
      icon: Briefcase,
    },
    {
      id: 'applications',
      label: 'Application Workspace',
      icon: FileCheck2,
    },
    {
      id: 'interview',
      label: 'Interview Prep',
      icon: HelpCircle,
    },
    {
      id: 'onboarding',
      label: 'Career Profile',
      icon: UserCheck,
    },
    {
      id: 'settings',
      label: 'Settings & Security',
      icon: Settings,
    },
  ];

  const handleItemClick = (id: string) => {
    onSelectView(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={clsx(
          'fixed md:static inset-y-0 left-0 z-40 w-64 bg-[#090d16] border-r border-slate-800/80 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="p-4 space-y-6">
          {/* Agent Co-Pilot Status Pill */}
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-950/40 to-[#0e1526] border border-blue-500/20 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
              <Bot className="w-4 h-4 animate-pulse-subtle" />
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-200">Gemini Agent</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
              <p className="text-[11px] text-slate-400 truncate">Function-Calling Ready</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={clsx(
                    'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group',
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm shadow-blue-500/10'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={clsx(
                        'w-4 h-4 transition-colors',
                        isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'
                      )}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge ? (
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {item.badge}
                    </span>
                  ) : isActive ? (
                    <ChevronRight className="w-3.5 h-3.5 text-blue-400" />
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Security & Human-in-the-Loop Guarantee Footer */}
        <div className="p-4 border-t border-slate-800/60">
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Human-In-The-Loop</span>
            </div>
            <p className="leading-tight text-slate-400">
              Zero unauthorized submissions. Every external action requires single-use cryptographic approval.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
