import { JobListing, JobSearchParams, MatchEvaluation } from '../types/job.types';

// Genuine Public Remote Jobs API: Remotive
const REMOTIVE_API_ENDPOINT = 'https://remotive.com/api/remote-jobs';

// Clearly labeled deterministic fixture dataset strictly used only when API is unreachable or in offline demo mode
export const DETERMINISTIC_DEMO_FIXTURES: JobListing[] = [
  {
    id: 'fixture-ai-01',
    title: 'AI Engineering Intern (Summer 2026)',
    company_name: 'Anthropic Labs Partner (Demo)',
    company_logo_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop',
    category: 'Software Development',
    job_type: 'internship',
    publication_date: '2026-03-15',
    candidate_required_location: 'Remote (Worldwide)',
    salary: '$45 - $60 / hour',
    description:
      'We are seeking an ambitious AI Engineering Intern to assist in training evaluations, LLM prompt engineering, and building agentic tool-use pipelines. Requirements: Strong Python skills, familiarity with PyTorch or HuggingFace, understanding of REST APIs, Git, and eagerness to build evaluation benchmarks.',
    url: 'https://example.com/careers/demo-ai-intern',
    tags: ['Python', 'PyTorch', 'LLM', 'Machine Learning', 'Git', 'REST API'],
    is_remote: true,
    provider: 'fixture_demo',
    is_fixture: true,
  },
  {
    id: 'fixture-fs-02',
    title: 'Junior Full-Stack Developer',
    company_name: 'CloudScale Technologies (Demo)',
    company_logo_url: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=100&h=100&fit=crop',
    category: 'Software Development',
    job_type: 'full_time',
    publication_date: '2026-03-20',
    candidate_required_location: 'Remote (US / Canada / Europe)',
    salary: '$75,000 - $90,000 / year',
    description:
      'Join our product engineering squad building customer-facing dashboard features. Core stack: TypeScript, React, Node.js, PostgreSQL, Tailwind CSS. We value clean code, automated testing, and collaborative team communication.',
    url: 'https://example.com/careers/demo-junior-fullstack',
    tags: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Tailwind CSS', 'SQL'],
    is_remote: true,
    provider: 'fixture_demo',
    is_fixture: true,
  },
  {
    id: 'fixture-ml-03',
    title: 'Machine Learning Research Assistant',
    company_name: 'NeuralPath Intelligence (Demo)',
    company_logo_url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=100&h=100&fit=crop',
    category: 'Data / AI',
    job_type: 'part_time',
    publication_date: '2026-03-22',
    candidate_required_location: 'Remote (Anywhere)',
    salary: '$35 - $50 / hour',
    description:
      'Looking for a passionate student researcher with skills in Python, Scikit-Learn, Pandas, NumPy, and Data Analysis. Experience with vector embeddings and data cleaning pipelines is a huge plus.',
    url: 'https://example.com/careers/demo-ml-assistant',
    tags: ['Python', 'Data Analysis', 'Pandas', 'NumPy', 'Scikit-Learn', 'Machine Learning'],
    is_remote: true,
    provider: 'fixture_demo',
    is_fixture: true,
  },
];

/**
 * Searches real job opportunities from Remotive API with robust error handling and fallback
 */
export const searchGenuineJobs = async (params: JobSearchParams = {}): Promise<{
  jobs: JobListing[];
  isFallback: boolean;
  totalFound: number;
  providerNotice: string;
}> => {
  const { query = 'software', limit = 15, use_fixture_fallback = true } = params;

  try {
    const url = new URL(REMOTIVE_API_ENDPOINT);
    if (query) url.searchParams.append('search', query);
    url.searchParams.append('limit', String(limit));

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Remotive API responded with HTTP status ${response.status}`);
    }

    const data = await response.json();
    const rawJobs = Array.isArray(data.jobs) ? data.jobs : [];

    const mappedJobs: JobListing[] = rawJobs.map((j: Record<string, unknown>) => ({
      id: String(j.id || crypto.randomUUID()),
      title: String(j.title || 'Untitled Role'),
      company_name: String(j.company_name || 'Hiring Employer'),
      company_logo_url: typeof j.company_logo === 'string' ? j.company_logo : undefined,
      category: typeof j.category === 'string' ? j.category : 'Technology',
      job_type: typeof j.job_type === 'string' ? j.job_type : 'Full Time',
      publication_date: typeof j.publication_date === 'string' ? j.publication_date.split('T')[0] : 'Recent',
      candidate_required_location:
        typeof j.candidate_required_location === 'string' && j.candidate_required_location
          ? j.candidate_required_location
          : 'Remote',
      salary: typeof j.salary === 'string' ? j.salary : undefined,
      description: cleanHtmlDescription(typeof j.description === 'string' ? j.description : ''),
      url: String(j.url || '#'),
      tags: Array.isArray(j.tags) ? (j.tags as string[]) : [],
      is_remote: true,
      provider: 'remotive',
      is_fixture: false,
    }));

    if (mappedJobs.length === 0 && use_fixture_fallback) {
      return {
        jobs: DETERMINISTIC_DEMO_FIXTURES,
        isFallback: true,
        totalFound: DETERMINISTIC_DEMO_FIXTURES.length,
        providerNotice: 'No live jobs matched query; showing deterministic fixtures (clearly labeled).',
      };
    }

    return {
      jobs: mappedJobs,
      isFallback: false,
      totalFound: mappedJobs.length,
      providerNotice: 'Live remote listings delivered via Remotive public API. Attributed to Remotive.com.',
    };
  } catch (error: unknown) {
    console.warn('Live Job API fetch failed, falling back to deterministic fixture mode:', error);

    if (use_fixture_fallback) {
      // Filter fixtures if query matches
      const filtered = DETERMINISTIC_DEMO_FIXTURES.filter(
        (f) =>
          f.title.toLowerCase().includes(query.toLowerCase()) ||
          f.tags.some((t) => t.toLowerCase().includes(query.toLowerCase())) ||
          f.description.toLowerCase().includes(query.toLowerCase())
      );

      return {
        jobs: filtered.length > 0 ? filtered : DETERMINISTIC_DEMO_FIXTURES,
        isFallback: true,
        totalFound: DETERMINISTIC_DEMO_FIXTURES.length,
        providerNotice: 'External API network unavailable. Operating in Deterministic Demo Mode (Demo Fixtures).',
      };
    }

    return {
      jobs: [],
      isFallback: true,
      totalFound: 0,
      providerNotice: error instanceof Error ? error.message : 'Job search API error',
    };
  }
};

/**
 * Strips HTML tags and excessive spacing from raw API job descriptions
 */
const cleanHtmlDescription = (html: string): string => {
  if (!html) return '';
  return html
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Computes explainable compatibility score and breakdown between student skills and job requirements
 */
export const evaluateJobMatch = (
  studentSkills: string[],
  job: JobListing,
  targetRoles: string[] = []
): MatchEvaluation => {
  const normalizedStudentSkills = studentSkills.map((s) => s.toLowerCase().trim());
  const studentSkillSet = new Set(normalizedStudentSkills);

  // Combine job tags and keywords from description
  const combinedJobKeywords = new Set<string>();
  job.tags.forEach((t) => combinedJobKeywords.add(t));

  const knownKeywords = [
    'python', 'javascript', 'typescript', 'react', 'node.js', 'next.js', 'sql',
    'postgresql', 'mongodb', 'docker', 'kubernetes', 'aws', 'gcp', 'git', 'pytorch',
    'machine learning', 'deep learning', 'pandas', 'numpy', 'scikit-learn', 'fastapi',
    'rest api', 'graphql', 'tailwind css', 'ci/cd', 'linux', 'testing'
  ];

  const jobDescLower = (job.title + ' ' + job.description).toLowerCase();
  knownKeywords.forEach((kw) => {
    const regex = new RegExp(`\\b${kw.replace(/[.+]/g, '\\$&')}\\b`, 'i');
    if (regex.test(jobDescLower)) {
      combinedJobKeywords.add(kw);
    }
  });

  const matching: string[] = [];
  const missing: string[] = [];
  const evidenceSnippets: string[] = [];

  combinedJobKeywords.forEach((kw) => {
    const kwLower = kw.toLowerCase();
    const isMatched =
      studentSkillSet.has(kwLower) ||
      normalizedStudentSkills.some((s) => s.includes(kwLower) || kwLower.includes(s));

    if (isMatched) {
      matching.push(kw);
      evidenceSnippets.push(`Student profile contains "${kw}", which directly satisfies the job requirement.`);
    } else {
      missing.push(kw);
    }
  });

  // Calculate score (0 to 100)
  const totalRelevantReqs = Math.max(1, matching.length + missing.length);
  let baseScore = Math.round((matching.length / totalRelevantReqs) * 85);

  // Bonus for title alignment
  const titleMatchesTarget = targetRoles.some((tr) =>
    job.title.toLowerCase().includes(tr.toLowerCase().split(' ')[0])
  );
  if (titleMatchesTarget) {
    baseScore = Math.min(98, baseScore + 15);
  }

  // Ensure minimum baseline if there are matching skills
  if (matching.length > 0 && baseScore < 30) {
    baseScore = 35;
  }

  const uncertainties: string[] = [];
  if (!job.description.toLowerCase().includes('graduation') && !job.description.toLowerCase().includes('intern')) {
    uncertainties.push('Job description does not specify student or graduation year restrictions.');
  }
  if (!job.salary) {
    uncertainties.push('Compensation was not disclosed in the official listing.');
  }
  if (job.candidate_required_location && !job.candidate_required_location.toLowerCase().includes('worldwide')) {
    uncertainties.push(`Geographic restriction: "${job.candidate_required_location}". Verify work authorization.`);
  }

  const matchExplanation =
    matching.length > 0
      ? `Student demonstrates ${matching.length} verified technical capabilities matching this role (${matching.slice(0, 4).join(', ')}). ${
          missing.length > 0
            ? `Identified ${missing.length} skill growth opportunities: ${missing.slice(0, 3).join(', ')}.`
            : 'Exceptional coverage across all required core skills.'
        }`
      : 'Low direct skill overlap detected between your current profile and this listing requirements.';

  return {
    job_id: job.id,
    job_title: job.title,
    company_name: job.company_name,
    compatibility_score: Math.min(100, Math.max(0, baseScore)),
    matching_skills: matching,
    missing_skills: missing,
    match_explanation: matchExplanation,
    uncertainties,
    evidence_snippets: evidenceSnippets,
    is_estimate_disclaimer:
      'This compatibility rating (0-100) is an algorithmic estimate based strictly on verifiable skills, not a hiring prediction or legal guarantee.',
  };
};
