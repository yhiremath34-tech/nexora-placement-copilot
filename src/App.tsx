import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { LandingPage } from './views/LandingPage';
import { AuthPage } from './views/AuthPage';
import { DashboardPage } from './views/DashboardPage';
import { ResumeAnalysisPage } from './views/ResumeAnalysisPage';
import { JobDiscoveryPage } from './views/JobDiscoveryPage';
import { ApplicationWorkspacePage } from './views/ApplicationWorkspacePage';
import { InterviewPrepPage } from './views/InterviewPrepPage';
import { OnboardingPage } from './views/OnboardingPage';
import { SettingsPage } from './views/SettingsPage';
import { JobListing } from './types/job.types';

const MainAppContent: React.FC = () => {
  const { user, isLoading } = useAuth();

  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [showAuthPage, setShowAuthPage] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // If initial auth check is loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-xs font-mono text-slate-500">Initializing Nexora Co-Pilot...</span>
        </div>
      </div>
    );
  }

  // Unauthenticated user states
  if (!user) {
    if (showAuthPage) {
      return <AuthPage onBack={() => setShowAuthPage(false)} />;
    }
    return <LandingPage onGetStarted={() => setShowAuthPage(true)} />;
  }

  // Authenticated Dashboard Layout
  const renderViewContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardPage onNavigate={(v) => setCurrentView(v)} />;
      case 'resume':
        return <ResumeAnalysisPage />;
      case 'jobs':
        return (
          <JobDiscoveryPage
            onDraftApplication={(job: JobListing) => {
              setCurrentView('applications');
            }}
          />
        );
      case 'applications':
        return <ApplicationWorkspacePage />;
      case 'interview':
        return <InterviewPrepPage />;
      case 'onboarding':
        return <OnboardingPage onComplete={() => setCurrentView('dashboard')} />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage onNavigate={(v) => setCurrentView(v)} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <Navbar
        activeView={currentView}
        onToggleMobileMenu={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />

      {/* Main Workspace Frame with Sidebar */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          activeView={currentView}
          onSelectView={(v) => setCurrentView(v)}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Content View Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {renderViewContent()}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
};

export default App;
