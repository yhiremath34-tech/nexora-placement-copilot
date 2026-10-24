import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import { Sparkles, Mail, Lock, User, ArrowLeft, ShieldCheck, Check } from 'lucide-react';

interface AuthPageProps {
  onBack: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onBack }) => {
  const { signInWithEmail, signUpWithEmail, signInDemoStudent, error, isLoading, isCloudSupabase } =
    useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email || !password) {
      setFormError('Please fill in all required fields.');
      return;
    }

    if (mode === 'signup') {
      if (!fullName) {
        setFormError('Please enter your full student name.');
        return;
      }
      const success = await signUpWithEmail(email, fullName, password);
      if (!success && !error) {
        setFormError('Could not complete registration. Please try again.');
      }
    } else {
      const success = await signInWithEmail(email, password);
      if (!success && !error) {
        setFormError('Invalid credentials. Check your email and password.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative">
      {/* Top back button */}
      <div className="absolute top-6 left-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 text-white shadow-xl shadow-blue-600/30 mb-2">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {mode === 'signin' ? 'Welcome back to Nexora' : 'Create your student account'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            {mode === 'signin'
              ? 'Access your saved career profile, matched jobs, and application workflows'
              : 'Join Nexora to turn your resume into explainable job matches and verified drafts'}
          </p>
        </div>

        {/* Auth Card */}
        <Card variant="elevated" className="p-6 sm:p-8 space-y-6 border-slate-700/80">
          {/* Quick Demo Student shortcut */}
          <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-500/25 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="space-y-0.5 text-center sm:text-left">
              <span className="text-xs font-semibold text-blue-200">Instant Evaluator Access</span>
              <p className="text-[11px] text-slate-400">Jump right into pre-loaded profile & agent</p>
            </div>
            <Button
              size="sm"
              variant="primary"
              onClick={signInDemoStudent}
              className="w-full sm:w-auto text-xs py-1.5 whitespace-nowrap"
            >
              Demo Login
            </Button>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-[#151f38] px-3 text-[11px] text-slate-400 uppercase tracking-wider absolute">
              Or with credentials
            </span>
          </div>

          {/* Error alerts */}
          {(formError || error) && (
            <Alert variant="error" title="Authentication Notice">
              {formError || error}
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alex Chen"
                    className="w-full bg-[#090d16] border border-slate-700/80 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Student Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex.chen@university.edu"
                  required
                  className="w-full bg-[#090d16] border border-slate-700/80 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#090d16] border border-slate-700/80 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              isLoading={isLoading}
            >
              {mode === 'signin' ? 'Sign In to Co-Pilot' : 'Create My Account'}
            </Button>
          </form>

          {/* Toggle mode */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setFormError(null);
              }}
              className="text-xs text-slate-400 hover:text-blue-400 transition-colors"
            >
              {mode === 'signin'
                ? "Don't have an account yet? Register here"
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </Card>

        {/* Supabase status badge footer */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          <span>
            {isCloudSupabase
              ? 'Connected to Supabase Project (RLS Active)'
              : 'Development Mode (Local Storage Encrypted)'}
          </span>
        </div>
      </div>
    </div>
  );
};
