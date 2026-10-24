import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { ProgressBar } from '../components/ui/ProgressBar';
import {
  validateResumeFile,
  parseResumeContent,
  extractTextFromFile,
} from '../services/resumeParser';
import { localStore } from '../services/supabaseClient';
import { StudentResume } from '../types/database.types';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Zap,
  Target,
  Award,
  Layers,
  Code2,
} from 'lucide-react';

const SAMPLE_STUDENT_RESUME_TEXT = `
ALEX CHEN
San Francisco, CA | alex.chen@university.edu | (555) 382-9102
github.com/alexchen-demo | linkedin.com/in/alexchen-demo

EDUCATION
Tech University, Bachelor of Science in Computer Science & AI
Graduation: May 2026 | GPA: 3.85 / 4.0
Relevant Coursework: Data Structures & Algorithms, Machine Learning Systems, Distributed Systems, Database Management.

TECHNICAL SKILLS
Languages: Python, JavaScript, TypeScript, C++, SQL
Frameworks & Libraries: React, Node.js, Express, PyTorch, Scikit-Learn, Pandas, NumPy, FastAPI, Tailwind CSS
Developer Tools: Git, GitHub, Docker, Supabase, PostgreSQL, Linux, REST API

PROJECTS
• AI Agent Placement Co-Pilot (2026)
  Engineered multi-turn placement agent integrating Gemini function calling with Remotive public job API.
  Implemented cryptographic single-use human approval state machine and AST-based resume parsing.
  Technologies: TypeScript, React, Tailwind CSS, Supabase, Gemini API, Vitest.

• Distributed Vector Search Engine (2025)
  Developed approximate nearest neighbor search index in Python and C++ for semantic document retrieval.
  Optimized cosine similarity computations using NumPy and vector quantization, cutting latency by 45%.
  Technologies: Python, C++, NumPy, Docker.

• Campus Peer Tutoring Portal (2024)
  Built full-stack student tutoring marketplace with real-time slot scheduling and authentication.
  Integrated relational PostgreSQL database with Row Level Security policies.
  Technologies: React, Node.js, Express, PostgreSQL, REST API.

LEADERSHIP & ACHIEVEMENTS
• President, University AI & Machine Learning Society (2024 - Present)
• 1st Place Winner, Bay Area Student Hackathon 2025 (AI Track)
`;

export const ResumeAnalysisPage: React.FC = () => {
  const { user, preferences } = useAuth();

  const [activeResume, setActiveResume] = useState<StudentResume | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const resumes = localStore.get<StudentResume>('resumes').filter((r) => r.user_id === user.id);
      if (resumes.length > 0) {
        setActiveResume(resumes[0]);
      } else {
        // Automatically initialize default demo resume
        loadSampleResume();
      }
    }
  }, [user]);

  const loadSampleResume = () => {
    if (!user) return;
    const parsed = parseResumeContent(
      SAMPLE_STUDENT_RESUME_TEXT,
      'Alex_Chen_CS_Resume_2026.pdf',
      42500,
      user.id,
      preferences?.target_roles || ['AI Engineer Intern', 'Full Stack Developer']
    );
    localStore.insert('resumes', parsed);
    setActiveResume(parsed);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadError(null);
    setUploadSuccess(null);

    const validation = validateResumeFile(file);
    if (!validation.isValid) {
      setUploadError(validation.error || 'Invalid file uploaded');
      return;
    }

    setIsUploading(true);
    try {
      const text = await extractTextFromFile(file);
      const parsed = parseResumeContent(
        text,
        file.name,
        file.size,
        user.id,
        preferences?.target_roles || []
      );

      localStore.insert('resumes', parsed);
      setActiveResume(parsed);
      setUploadSuccess(`Successfully parsed ${file.name}. Extracted ${parsed.parsed_skills.length} verified skills.`);
    } catch (err: unknown) {
      setUploadError('Failed to read or parse resume content.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
              Resume Grounding & Intelligence
            </span>
            <Badge variant="blue" size="sm">Fact-Grounded</Badge>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
            ATS Extraction & Skill Gap Radar
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Extracts verifiable competencies, projects, and academic background from your resume. The AI co-pilot grounds all tailored applications strictly in this verified dataset.
          </p>
        </div>

        <Button
          size="sm"
          variant="secondary"
          onClick={loadSampleResume}
          leftIcon={<Sparkles className="w-4 h-4 text-blue-400" />}
        >
          Load Verified Demo Resume
        </Button>
      </div>

      {uploadError && (
        <Alert variant="error" title="Upload Validation Error" onClose={() => setUploadError(null)}>
          {uploadError}
        </Alert>
      )}

      {uploadSuccess && (
        <Alert variant="success" title="Parsing Complete" onClose={() => setUploadSuccess(null)}>
          {uploadSuccess}
        </Alert>
      )}

      {/* Upload Dropzone */}
      <Card variant="glass" className="p-8 border-dashed border-2 border-slate-700 hover:border-blue-500/50 transition-colors text-center">
        <input
          type="file"
          id="resume-file-input"
          accept=".pdf,.docx,.txt"
          onChange={handleFileUpload}
          className="hidden"
          disabled={isUploading}
        />
        <label
          htmlFor="resume-file-input"
          className="cursor-pointer flex flex-col items-center justify-center space-y-3"
        >
          <div className="w-14 h-14 rounded-2xl bg-blue-600/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/10">
            <UploadCloud className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-semibold text-slate-200">
              {isUploading ? 'Extracting & Validating Resume...' : 'Click or drag resume to upload'}
            </h4>
            <p className="text-xs text-slate-400">
              PDF, DOCX, or TXT up to 5MB. Automatic anti-prompt-injection sanitization applied.
            </p>
          </div>
          <div className="pt-2">
            <Button size="sm" variant="primary" disabled={isUploading} className="pointer-events-none">
              Select Document
            </Button>
          </div>
        </label>
      </Card>

      {/* Structured Resume Facts & Gap Radar */}
      {activeResume && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Skills & Gap Radar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Extracted Skills */}
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-blue-400" />
                  <h4 className="text-sm font-bold text-slate-200">
                    Verified Technical Skills
                  </h4>
                </div>
                <span className="text-xs font-mono text-blue-400">
                  {activeResume.parsed_skills.length} found
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {activeResume.parsed_skills.map((skill) => (
                  <Badge key={skill} variant="blue" size="sm" className="font-mono text-[11px]">
                    {skill}
                  </Badge>
                ))}
              </div>
            </Card>

            {/* Target Role Skill Gap Radar */}
            <Card className="p-5 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <Target className="w-4 h-4 text-cyan-400" />
                <h4 className="text-sm font-bold text-slate-200">
                  Target Role Skill Gap Radar
                </h4>
              </div>

              <p className="text-xs text-slate-400">
                Skills highly requested for {preferences?.target_roles?.[0] || 'AI & Software Roles'} not yet emphasized on your resume:
              </p>

              {activeResume.parsed_gaps.length === 0 ? (
                <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>No critical gaps detected for target roles!</span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {activeResume.parsed_gaps.map((gap) => (
                    <div
                      key={gap}
                      className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <span className="text-slate-300 font-medium">{gap}</span>
                      <Badge variant="amber" size="sm">
                        Recommended Addition
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right Column: Projects, Experience & Fact Grounding */}
          <div className="lg:col-span-2 space-y-6">
            {/* Extracted Projects */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-400" />
                  <h4 className="text-base font-bold text-slate-100">
                    Verified Projects & Systems
                  </h4>
                </div>
                <Badge variant="purple" size="sm">
                  {activeResume.parsed_projects.length} Verified
                </Badge>
              </div>

              <div className="space-y-4">
                {activeResume.parsed_projects.map((proj, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-[#090d16] border border-slate-800/80 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <h5 className="text-sm font-bold text-slate-200">{proj.title}</h5>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {proj.description}
                    </p>
                    {proj.technologies?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {proj.technologies.map((t) => (
                          <span
                            key={t}
                            className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Candidate Strengths */}
            <Card className="p-6 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <Award className="w-5 h-5 text-emerald-400" />
                <h4 className="text-base font-bold text-slate-100">
                  Candidate Strengths & Profile Assets
                </h4>
              </div>

              <div className="space-y-2">
                {activeResume.parsed_strengths.map((str, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{str}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
