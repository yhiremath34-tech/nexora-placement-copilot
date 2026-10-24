import { describe, it, expect } from 'vitest';
import {
  evaluateJobMatch,
  DETERMINISTIC_DEMO_FIXTURES,
  searchGenuineJobs,
} from '../src/services/jobService';
import { JobListing } from '../src/types/job.types';

describe('Job Discovery & Explainable Match Engine', () => {
  it('correctly calculates match score and identifies matching skills', () => {
    const studentSkills = ['Python', 'PyTorch', 'Git', 'REST API', 'Docker'];
    const job = DETERMINISTIC_DEMO_FIXTURES[0]; // AI Engineering Intern requiring Python, PyTorch, Git

    const evaluation = evaluateJobMatch(studentSkills, job, ['AI Engineering Intern']);

    expect(evaluation.compatibility_score).toBeGreaterThanOrEqual(70);
    expect(evaluation.matching_skills).toContain('Python');
    expect(evaluation.matching_skills).toContain('PyTorch');
    expect(evaluation.is_estimate_disclaimer).toContain('algorithmic estimate');
  });

  it('identifies missing skills and growth opportunities', () => {
    const limitedSkills = ['HTML', 'CSS'];
    const job = DETERMINISTIC_DEMO_FIXTURES[1]; // Junior Full Stack requiring TypeScript, React, PostgreSQL

    const evaluation = evaluateJobMatch(limitedSkills, job);

    expect(evaluation.compatibility_score).toBeLessThan(60);
    expect(evaluation.missing_skills.length).toBeGreaterThan(0);
    expect(evaluation.match_explanation).toContain('skill growth opportunities');
  });

  it('separates deterministic fixtures with explicit is_fixture flag', () => {
    DETERMINISTIC_DEMO_FIXTURES.forEach((fixture) => {
      expect(fixture.is_fixture).toBe(true);
      expect(fixture.provider).toBe('fixture_demo');
    });
  });

  it('returns structured search results with proper provider attribution', async () => {
    const result = await searchGenuineJobs({ query: 'software', limit: 2 });
    expect(result.jobs.length).toBeGreaterThan(0);
    expect(result.providerNotice).toBeDefined();
  });
});
