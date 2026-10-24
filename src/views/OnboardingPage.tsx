import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Badge } from '../components/ui/Badge';
import {
  User,
  GraduationCap,
  Briefcase,
  MapPin,
  DollarSign,
  Link as LinkIcon,
  Save,
  CheckCircle,
  Plus,
  X,
} from 'lucide-react';

interface OnboardingPageProps {
  onComplete?: () => void;
}

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ onComplete }) => {
  const { profile, preferences, updateProfile, updatePreferences } = useAuth();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [headline, setHeadline] = useState(profile?.headline || '');
  const [university, setUniversity] = useState(profile?.university || '');
  const [graduationYear, setGraduationYear] = useState<number>(profile?.graduation_year || 2026);
  const [degree, setDegree] = useState(profile?.degree || 'Bachelor of Science');
  const [major, setMajor] = useState(profile?.major || 'Computer Science');
  const [gpa, setGpa] = useState<number | undefined>(profile?.gpa || 3.8);
  const [bio, setBio] = useState(profile?.bio || '');
  const [location, setLocation] = useState(profile?.location || 'San Francisco, CA');
  const [linkedinUrl, setLinkedinUrl] = useState(profile?.linkedin_url || '');
  const [githubUrl, setGithubUrl] = useState(profile?.github_url || '');
  const [portfolioUrl, setPortfolioUrl] = useState(profile?.portfolio_url || '');

  // Preferences
  const [targetRoles, setTargetRoles] = useState<string[]>(
    preferences?.target_roles?.length
      ? preferences.target_roles
      : ['AI Engineer Intern', 'Full Stack Developer', 'Software Engineer']
  );
  const [newRoleInput, setNewRoleInput] = useState('');

  const [preferredLocations, setPreferredLocations] = useState<string[]>(
    preferences?.preferred_locations?.length
      ? preferences.preferred_locations
      : ['Remote', 'San Francisco, CA', 'New York, NY']
  );
  const [newLocationInput, setNewLocationInput] = useState('');

  const [remotePreference, setRemotePreference] = useState<'remote_only' | 'hybrid' | 'on_site' | 'any'>(
    preferences?.remote_preference || 'hybrid'
  );
  const [experienceLevel, setExperienceLevel] = useState<'internship' | 'entry_level' | 'junior' | 'mid'>(
    preferences?.experience_level || 'entry_level'
  );
  const [minSalary, setMinSalary] = useState<number>(preferences?.min_salary_usd || 80000);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setHeadline(profile.headline || '');
      setUniversity(profile.university || '');
      setGraduationYear(profile.graduation_year || 2026);
      setDegree(profile.degree || 'Bachelor of Science');
      setMajor(profile.major || 'Computer Science');
      setGpa(profile.gpa);
      setBio(profile.bio || '');
      setLocation(profile.location || '');
      setLinkedinUrl(profile.linkedin_url || '');
      setGithubUrl(profile.github_url || '');
      setPortfolioUrl(profile.portfolio_url || '');
    }
  }, [profile]);

  const handleAddRole = () => {
    if (newRoleInput.trim() && !targetRoles.includes(newRoleInput.trim())) {
      setTargetRoles([...targetRoles, newRoleInput.trim()]);
      setNewRoleInput('');
    }
  };

  const handleRemoveRole = (roleToRemove: string) => {
    setTargetRoles(targetRoles.filter((r) => r !== roleToRemove));
  };

  const handleAddLocation = () => {
    if (newLocationInput.trim() && !preferredLocations.includes(newLocationInput.trim())) {
      setPreferredLocations([...preferredLocations, newLocationInput.trim()]);
      setNewLocationInput('');
    }
  };

  const handleRemoveLocation = (locToRemove: string) => {
    setPreferredLocations(preferredLocations.filter((l) => l !== locToRemove));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setStatusMessage(null);

    try {
      const profileResult = await updateProfile({
        full_name: fullName,
        headline,
        university,
        graduation_year: Number(graduationYear),
        degree,
        major,
        gpa: gpa ? Number(gpa) : undefined,
        bio,
        location,
        linkedin_url: linkedinUrl,
        github_url: githubUrl,
        portfolio_url: portfolioUrl,
      });

      const prefResult = await updatePreferences({
        target_roles: targetRoles,
        preferred_locations: preferredLocations,
        remote_preference: remotePreference,
        experience_level: experienceLevel,
        min_salary_usd: Number(minSalary),
      });

      if (profileResult && prefResult) {
        setSaveSuccess(true);
        setStatusMessage('Career profile and preferences saved successfully!');
        if (onComplete) {
          setTimeout(onComplete, 1200);
        }
      } else {
        setStatusMessage('There was a problem updating your profile.');
      }
    } catch {
      setStatusMessage('Unexpected error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Title & subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100">
            Student Career Profile & Preferences
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            This data forms the factual bedrock for the Gemini placement agent. The agent will never fabricate facts outside this profile.
          </p>
        </div>
        <Button
          onClick={handleSave}
          isLoading={isSaving}
          leftIcon={<Save className="w-4 h-4" />}
          className="self-start sm:self-auto"
        >
          Save Profile
        </Button>
      </div>

      {saveSuccess && (
        <Alert variant="success" title="Profile Synchronized">
          {statusMessage}
        </Alert>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Basic Information */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <User className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-slate-100">Personal & Academic Foundation</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full bg-[#090d16] border border-slate-700/80 rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Headline</label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. CS Senior | AI & Distributed Systems"
                className="w-full bg-[#090d16] border border-slate-700/80 rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">University / College</label>
              <input
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder="e.g. Stanford University"
                className="w-full bg-[#090d16] border border-slate-700/80 rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Grad Year</label>
                <input
                  type="number"
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(Number(e.target.value))}
                  min={2024}
                  max={2030}
                  className="w-full bg-[#090d16] border border-slate-700/80 rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">GPA (Optional)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="4.0"
                  value={gpa || ''}
                  onChange={(e) => setGpa(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="3.85"
                  className="w-full bg-[#090d16] border border-slate-700/80 rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Degree</label>
              <input
                type="text"
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                placeholder="B.S. in Computer Science"
                className="w-full bg-[#090d16] border border-slate-700/80 rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="San Francisco, CA"
                className="w-full bg-[#090d16] border border-slate-700/80 rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Student Bio & Career Narrative</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Brief summary of your academic background, core projects, and technical passions..."
              className="w-full bg-[#090d16] border border-slate-700/80 rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>
        </Card>

        {/* Section 2: Portfolio & Links */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <LinkIcon className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-semibold text-slate-100">Profiles & Portfolios</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">GitHub URL</label>
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/username"
                className="w-full bg-[#090d16] border border-slate-700/80 rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">LinkedIn URL</label>
              <input
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/username"
                className="w-full bg-[#090d16] border border-slate-700/80 rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Portfolio / Personal Site</label>
              <input
                type="url"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="https://yourname.dev"
                className="w-full bg-[#090d16] border border-slate-700/80 rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </Card>

        {/* Section 3: Target Placement Preferences */}
        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Briefcase className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-slate-100">Placement Target Preferences</h3>
          </div>

          {/* Target Roles Tags */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Target Job Roles / Titles
            </label>
            <div className="flex flex-wrap gap-2 mb-2.5">
              {targetRoles.map((role) => (
                <Badge key={role} variant="blue" className="gap-1 py-1 px-3 text-xs">
                  <span>{role}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveRole(role)}
                    className="hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newRoleInput}
                onChange={(e) => setNewRoleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddRole();
                  }
                }}
                placeholder="Add role e.g. Machine Learning Intern"
                className="flex-1 bg-[#090d16] border border-slate-700/80 rounded-lg px-3.5 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              />
              <Button type="button" size="sm" variant="secondary" onClick={handleAddRole}>
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>
          </div>

          {/* Preferred Locations */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Preferred Locations
            </label>
            <div className="flex flex-wrap gap-2 mb-2.5">
              {preferredLocations.map((loc) => (
                <Badge key={loc} variant="emerald" className="gap-1 py-1 px-3 text-xs">
                  <span>{loc}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveLocation(loc)}
                    className="hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newLocationInput}
                onChange={(e) => setNewLocationInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddLocation();
                  }
                }}
                placeholder="Add location e.g. Remote, Seattle, WA"
                className="flex-1 bg-[#090d16] border border-slate-700/80 rounded-lg px-3.5 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              />
              <Button type="button" size="sm" variant="secondary" onClick={handleAddLocation}>
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Work Mode Preference
              </label>
              <select
                value={remotePreference}
                onChange={(e) =>
                  setRemotePreference(e.target.value as 'remote_only' | 'hybrid' | 'on_site' | 'any')
                }
                className="w-full bg-[#090d16] border border-slate-700/80 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value="remote_only">Remote Only</option>
                <option value="hybrid">Hybrid (Remote + Office)</option>
                <option value="on_site">On-Site</option>
                <option value="any">Any / Flexible</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Experience Level
              </label>
              <select
                value={experienceLevel}
                onChange={(e) =>
                  setExperienceLevel(
                    e.target.value as 'internship' | 'entry_level' | 'junior' | 'mid'
                  )
                }
                className="w-full bg-[#090d16] border border-slate-700/80 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value="internship">Internship (Summer / Fall)</option>
                <option value="entry_level">Entry Level (0 - 1 years)</option>
                <option value="junior">Junior Associate (1 - 2 years)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Min. Annual Compensation (USD)
              </label>
              <input
                type="number"
                step="5000"
                value={minSalary}
                onChange={(e) => setMinSalary(Number(e.target.value))}
                className="w-full bg-[#090d16] border border-slate-700/80 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </Card>

        {/* Submit action bottom */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="submit"
            size="lg"
            isLoading={isSaving}
            leftIcon={<Save className="w-5 h-5" />}
          >
            Save Career Profile
          </Button>
        </div>
      </form>
    </div>
  );
};
