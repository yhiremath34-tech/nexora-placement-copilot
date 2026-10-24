import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Alert } from '../components/ui/Alert';
import {
  searchGenuineJobs,
  evaluateJobMatch,
  DETERMINISTIC_DEMO_FIXTURES,
} from '../services/jobService';
import { localStore } from '../services/supabaseClient';
import { JobListing, MatchEvaluation } from '../types/job.types';
import { StudentResume, SavedJob } from '../types/database.types';
import {
  Search,
  Briefcase,
  MapPin,
  Calendar,
  DollarSign,
  ExternalLink,
  Bookmark,
  CheckCircle2,
  Sparkles,
  Info,
  Filter,
  Layers,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface JobDiscoveryPageProps {
  onDraftApplication?: (job: JobListing) => void;
}

export const JobDiscoveryPage: React.FC<JobDiscoveryPageProps> = ({ onDraftApplication }) => {
  const { user, preferences } = useAuth();

  const [query, setQuery] = useState('software');
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFallback, setIsFallback] = useState(false);
  const [providerNotice, setProviderNotice] = useState('');
  const [selectedMatch, setSelectedMatch] = useState<{
    job: JobListing;
    evaluation: MatchEvaluation;
  } | null>(null);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Load student skills for real-time match evaluation
  const [studentSkills, setStudentSkills] = useState<string[]>([
    'Python', 'JavaScript', 'TypeScript', 'React', 'Git', 'SQL', 'Node.js', 'PyTorch'
  ]);

  useEffect(() => {
    if (user) {
      const resumes = localStore.get<StudentResume>('resumes').filter((r) => r.user_id === user.id);
      if (resumes[0]?.parsed_skills?.length) {
        setStudentSkills(resumes[0].parsed_skills);
      }
      const saved = localStore.get<SavedJob>('saved_jobs').filter((j) => j.user_id === user.id);
      setSavedJobIds(new Set(saved.map((s) => s.external_job_id)));
    }
    handleSearch('software');
  }, [user]);

  const handleSearch = async (searchQuery = query) => {
    setIsLoading(true);
    try {
      const res = await searchGenuineJobs({
        query: searchQuery,
        limit: 12,
        use_fixture_fallback: true,
      });
      setJobs(res.jobs);
      setIsFallback(res.isFallback);
      setProviderNotice(res.providerNotice);
    } catch {
      setJobs(DETERMINISTIC_DEMO_FIXTURES);
      setIsFallback(true);
      setProviderNotice('External network unavailable. Showing deterministic demo fixtures.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveJob = (job: JobListing, evaluation: MatchEvaluation) => {
    if (!user) return;

    const savedRecord: SavedJob = {
      id: crypto.randomUUID(),
      user_id: user.id,
      external_job_id: job.id,
      provider: job.provider,
      title: job.title,
      company_name: job.company_name,
      company_logo_url: job.company_logo_url,
      job_type: job.job_type,
      location: job.candidate_required_location,
      is_remote: job.is_remote,
      salary_range: job.salary,
      publication_date: job.publication_date,
      apply_url: job.url,
      description: job.description,
      tags: job.tags,
      match_score: evaluation.compatibility_score,
      match_explanation: evaluation.match_explanation,
      matching_skills: evaluation.matching_skills,
      missing_skills: evaluation.missing_skills,
      status: 'saved',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    localStore.insert('saved_jobs', savedRecord);
    setSavedJobIds(new Set([...savedJobIds, job.id]));
    setSaveToast(`Saved "${job.title}" to your career dashboard.`);
    setTimeout(() => setSaveToast(null), 3000);
  };

  return (
    <div className="space-y-8 pb-12 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
            Live Opportunity Intelligence
          </span>
          {isFallback ? (
            <Badge variant="amber" size="sm">Deterministic Demo Fixtures</Badge>
          ) : (
            <Badge variant="emerald" size="sm">Live Remotive Public API</Badge>
          )}
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
          Genuine Job Discovery & Explainable Matching
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
          Queries genuine remote job openings. Every opportunity is scored against your verified skills with complete breakdown of matching evidence and missing requirements.
        </p>
      </div>

      {/* Provider Attribution Notice */}
      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-400 shrink-0" />
          <span>{providerNotice}</span>
        </div>
        <a
          href="https://remotive.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 font-medium underline inline-flex items-center gap-1 shrink-0"
        >
          <span>Remotive.com</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {saveToast && (
        <Alert variant="success" onClose={() => setSaveToast(null)}>
          {saveToast}
        </Alert>
      )}

      {/* Search Bar & Tag Filters */}
      <div className="space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(query);
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by role or skill (e.g. 'ai', 'react', 'python', 'intern')..."
              className="w-full bg-[#090d16] border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>
          <Button type="submit" size="md" isLoading={isLoading}>
            Search Opportunities
          </Button>
        </form>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400">Popular filters:</span>
          {['ai', 'react', 'python', 'intern', 'full stack'].map((filterTag) => (
            <button
              key={filterTag}
              onClick={() => {
                setQuery(filterTag);
                handleSearch(filterTag);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors uppercase font-mono text-[11px]"
            >
              {filterTag}
            </button>
          ))}
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {jobs.map((job) => {
          const evaluation = evaluateJobMatch(
            studentSkills,
            job,
            preferences?.target_roles || []
          );
          const isSaved = savedJobIds.has(job.id);

          return (
            <Card
              key={job.id}
              variant="interactive"
              className="p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-slate-100 hover:text-blue-400 transition-colors">
                        {job.title}
                      </h4>
                      {job.is_fixture && (
                        <Badge variant="amber" size="sm">FIXTURE</Badge>
                      )}
                    </div>
                    <p className="text-xs text-blue-400 font-medium">
                      {job.company_name}
                    </p>
                  </div>

                  {/* Compatibility Badge */}
                  <div className="text-right shrink-0">
                    <span
                      className={`text-sm font-bold font-mono px-2 py-0.5 rounded-lg border ${
                        evaluation.compatibility_score >= 80
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                          : evaluation.compatibility_score >= 50
                          ? 'bg-blue-950/80 text-blue-300 border-blue-500/40'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {evaluation.compatibility_score}% Match
                    </span>
                  </div>
                </div>

                {/* Location, Salary, Date Meta */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{job.candidate_required_location || 'Remote'}</span>
                  </div>
                  {job.salary && (
                    <div className="flex items-center gap-1 text-slate-300">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{job.salary}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-slate-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{job.publication_date}</span>
                  </div>
                </div>

                {/* Snippet */}
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {job.description}
                </p>

                {/* Tags */}
                {job.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {job.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedMatch({ job, evaluation })}
                  leftIcon={<Info className="w-3.5 h-3.5" />}
                >
                  Explain Match
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={isSaved ? 'secondary' : 'outline'}
                    onClick={() => handleSaveJob(job, evaluation)}
                    disabled={isSaved}
                    leftIcon={<Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'text-blue-400 fill-blue-400' : ''}`} />}
                  >
                    {isSaved ? 'Saved' : 'Save'}
                  </Button>

                  {onDraftApplication && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => onDraftApplication(job)}
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      Draft Application
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Match Explainer Modal */}
      {selectedMatch && (
        <Modal
          isOpen={Boolean(selectedMatch)}
          onClose={() => setSelectedMatch(null)}
          title={`Compatibility Breakdown: ${selectedMatch.job.title}`}
          description={`Algorithmic analysis against ${selectedMatch.job.company_name}`}
          maxWidth="lg"
        >
          <div className="space-y-5">
            {/* Score header */}
            <div className="p-4 rounded-xl bg-[#090d16] border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400">Calculated Compatibility</span>
                <div className="text-2xl font-bold font-mono text-emerald-400">
                  {selectedMatch.evaluation.compatibility_score} / 100
                </div>
              </div>
              <Badge variant="emerald" size="md">
                Verified Skill Grounding
              </Badge>
            </div>

            {/* Explanation paragraph */}
            <div className="space-y-1">
              <h5 className="text-xs font-semibold text-slate-200">Match Rationale</h5>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                {selectedMatch.evaluation.match_explanation}
              </p>
            </div>

            {/* Matching skills */}
            <div className="space-y-2">
              <h5 className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Matching Skills on Your Profile ({selectedMatch.evaluation.matching_skills.length})</span>
              </h5>
              <div className="flex flex-wrap gap-1.5">
                {selectedMatch.evaluation.matching_skills.map((s) => (
                  <Badge key={s} variant="emerald" size="sm">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Missing skills */}
            {selectedMatch.evaluation.missing_skills.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  <span>Missing Requirements / Growth Opportunities</span>
                </h5>
                <div className="flex flex-wrap gap-1.5">
                  {selectedMatch.evaluation.missing_skills.map((s) => (
                    <Badge key={s} variant="amber" size="sm">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Uncertainties */}
            {selectedMatch.evaluation.uncertainties.length > 0 && (
              <div className="space-y-1.5 p-3 rounded-lg bg-slate-900/40 border border-slate-800 text-xs text-slate-400">
                <span className="font-semibold text-slate-300">Uncertainties & Limitations:</span>
                <ul className="list-disc list-inside space-y-1 text-[11px]">
                  {selectedMatch.evaluation.uncertainties.map((u, i) => (
                    <li key={i}>{u}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Legal / Ethical Disclaimer */}
            <p className="text-[10px] text-slate-500 leading-tight">
              {selectedMatch.evaluation.is_estimate_disclaimer}
            </p>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <Button size="sm" variant="secondary" onClick={() => setSelectedMatch(null)}>
                Close Breakdown
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
