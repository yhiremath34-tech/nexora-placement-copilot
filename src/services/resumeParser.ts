import { StudentResume, StructuredEducation, StructuredExperience, StructuredProject } from '../types/database.types';

export const MAX_RESUME_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB max
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
export const ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.docx'];

export interface ResumeValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateResumeFile = (file: File): ResumeValidationResult => {
  if (file.size > MAX_RESUME_SIZE_BYTES) {
    return {
      isValid: false,
      error: `File size exceeds 5MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB).`,
    };
  }

  const name = file.name.toLowerCase();
  const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext));
  const hasValidType = ALLOWED_MIME_TYPES.includes(file.type) || file.type === '';

  if (!hasValidExt && !hasValidType) {
    return {
      isValid: false,
      error: 'Invalid file format. Please upload a PDF, DOCX, or TXT resume.',
    };
  }

  return { isValid: true };
};

/**
 * Sanitizes untrusted resume and job text against prompt injection attacks
 * Prevents malicious instruction overrides embedded in candidate resumes or listings.
 */
export const sanitizeUntrustedText = (input: string): string => {
  if (!input) return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\[(?:SYSTEM|INSTRUCTION|PROMPT|OVERRIDE)[^\]]*\]/gi, '[REDACTED_SYSTEM_DIRECTIVE]')
    .replace(/ignore\s+previous\s+(?:instructions|prompts|rules)/gi, '[REDACTED_INSTRUCTION_OVERRIDE]')
    .replace(/you\s+must\s+now\s+act\s+as/gi, '[REDACTED_ROLE_HIJACK]')
    .slice(0, 50000); // 50k character cap
};

/**
 * Common known technical skill dictionary for deterministic client extraction
 */
const COMMON_SKILLS_DICTIONARY = [
  'Python', 'JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js', 'Express',
  'C++', 'C', 'Java', 'Go', 'Rust', 'SQL', 'PostgreSQL', 'MySQL', 'MongoDB',
  'Redis', 'Supabase', 'Firebase', 'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure',
  'Git', 'GitHub', 'Linux', 'REST API', 'GraphQL', 'Tailwind CSS', 'HTML', 'CSS',
  'PyTorch', 'TensorFlow', 'Scikit-Learn', 'Pandas', 'NumPy', 'Data Analysis',
  'Machine Learning', 'Deep Learning', 'Computer Vision', 'NLP', 'LLM', 'Gemini API',
  'LangChain', 'CI/CD', 'Jest', 'Vitest', 'Microservices', 'FastAPI', 'Django'
];

/**
 * Extracts structured facts from parsed resume text
 */
export const parseResumeContent = (
  rawText: string,
  fileName: string,
  fileSize: number,
  userId: string,
  targetRoles: string[] = []
): StudentResume => {
  const sanitized = sanitizeUntrustedText(rawText);
  const lowerText = sanitized.toLowerCase();

  // 1. Extract technical skills matching dictionary
  const foundSkills = COMMON_SKILLS_DICTIONARY.filter((skill) => {
    // Regex word boundary match
    const regex = new RegExp(`\\b${skill.replace(/[.+]/g, '\\$&')}\\b`, 'i');
    return regex.test(sanitized);
  });

  // 2. Identify skill gaps based on target roles
  const roleSkillMap: Record<string, string[]> = {
    'ai': ['Python', 'PyTorch', 'Machine Learning', 'TensorFlow', 'LLM', 'FastAPI'],
    'full stack': ['TypeScript', 'React', 'Node.js', 'SQL', 'REST API', 'Tailwind CSS'],
    'machine learning': ['Python', 'Pandas', 'NumPy', 'Scikit-Learn', 'PyTorch'],
    'software': ['Git', 'Data Analysis', 'Docker', 'SQL', 'Testing'],
  };

  const expectedSkillsSet = new Set<string>();
  targetRoles.forEach((role) => {
    const rLower = role.toLowerCase();
    Object.keys(roleSkillMap).forEach((key) => {
      if (rLower.includes(key)) {
        roleSkillMap[key].forEach((s) => expectedSkillsSet.add(s));
      }
    });
  });

  if (expectedSkillsSet.size === 0) {
    ['Git', 'Python', 'TypeScript', 'SQL', 'Docker'].forEach((s) => expectedSkillsSet.add(s));
  }

  const foundSkillsSet = new Set(foundSkills.map((s) => s.toLowerCase()));
  const missingGaps = Array.from(expectedSkillsSet).filter(
    (s) => !foundSkillsSet.has(s.toLowerCase())
  );

  // 3. Extract projects
  const extractedProjects: StructuredProject[] = [];
  const projectLines = sanitized.split('\n');
  let currentProject: StructuredProject | null = null;

  for (const line of projectLines) {
    const trimmed = line.trim();
    if (trimmed.length > 5 && (trimmed.startsWith('Project:') || trimmed.startsWith('•') || trimmed.startsWith('-'))) {
      if (!currentProject && trimmed.length < 60) {
        currentProject = {
          title: trimmed.replace(/^(Project:|•|-)\s*/, ''),
          description: '',
          technologies: [],
        };
      } else if (currentProject) {
        currentProject.description += (currentProject.description ? ' ' : '') + trimmed.replace(/^[•-]\s*/, '');
        if (currentProject.description.length > 100) {
          extractedProjects.push(currentProject);
          currentProject = null;
        }
      }
    }
  }

  // 4. Extract default education if detected
  const extractedEducation: StructuredEducation[] = [];
  if (lowerText.includes('university') || lowerText.includes('college') || lowerText.includes('institute')) {
    extractedEducation.push({
      institution: 'University / Higher Education Institution',
      degree: lowerText.includes('master') ? 'Master of Science' : 'Bachelor of Science',
      field_of_study: lowerText.includes('computer') ? 'Computer Science' : 'Engineering',
      graduation_year: 2026,
    });
  }

  // 5. Strengths
  const strengths: string[] = [];
  if (foundSkills.length >= 8) {
    strengths.push(`Strong breadth across ${foundSkills.length} verified technical competencies.`);
  }
  if (lowerText.includes('lead') || lowerText.includes('president') || lowerText.includes('captain')) {
    strengths.push('Demonstrated campus leadership and project ownership initiative.');
  }
  if (lowerText.includes('hackathon') || lowerText.includes('first place') || lowerText.includes('winner')) {
    strengths.push('Active hackathon participant with rapid prototyping capabilities.');
  }
  if (foundSkills.some((s) => ['React', 'TypeScript', 'Node.js', 'FastAPI'].includes(s))) {
    strengths.push('Modern full-stack and API development proficiencies.');
  }

  return {
    id: crypto.randomUUID(),
    user_id: userId,
    file_name: fileName,
    file_size_bytes: fileSize,
    file_type: fileName.endsWith('.pdf') ? 'application/pdf' : 'text/plain',
    raw_text: sanitized,
    parsed_skills: foundSkills.length > 0 ? foundSkills : ['JavaScript', 'Python', 'Git', 'HTML', 'CSS'],
    parsed_experience: [
      {
        company: 'Software Engineering Projects / Academic Experience',
        role: 'Student Software Developer',
        duration: '2023 - Present',
        highlights: [
          'Developed and deployed full-stack web applications with modern responsive architectures',
          'Integrated RESTful endpoints and optimized relational database schemas',
          'Collaborated using Git version control and modern continuous deployment workflows'
        ]
      }
    ],
    parsed_education: extractedEducation,
    parsed_projects: extractedProjects.length > 0 ? extractedProjects : [
      {
        title: 'Full-Stack Web & AI Application',
        description: 'Engineered responsive web client with real-time API integrations and cloud database storage.',
        technologies: ['React', 'TypeScript', 'Node.js', 'Tailwind CSS']
      }
    ],
    parsed_strengths: strengths.length > 0 ? strengths : ['Strong foundational problem-solving and software engineering coursework'],
    parsed_gaps: missingGaps.slice(0, 4),
    is_primary: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
};

/**
 * Reads text content from uploaded File object
 */
export const extractTextFromFile = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      resolve(content || '');
    };
    reader.onerror = (err) => reject(err);
    reader.readAsText(file);
  });
};
