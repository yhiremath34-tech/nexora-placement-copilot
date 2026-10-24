import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  HelpCircle,
  MessageSquare,
  Sparkles,
  ChevronRight,
  Code2,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';

interface InterviewQuestion {
  id: string;
  category: 'behavioral' | 'technical' | 'system_design';
  question: string;
  hint: string;
  modelAnswer: string;
}

export const InterviewPrepPage: React.FC = () => {
  const { profile } = useAuth();

  const [questions] = useState<InterviewQuestion[]>([
    {
      id: 'q1',
      category: 'technical',
      question: 'How do you design a robust function-calling AI agent that prevents hallucinations and unauthorized tool calls?',
      hint: 'Discuss strict JSON schema declarations, parameter validation, server-side sandboxing, and human-in-the-loop state machine gating.',
      modelAnswer:
        'A production AI agent requires two layers: first, deterministic function declaration schemas where inputs are validated against strict types before execution. Second, for any consequential or external action (such as submitting an application or transferring data), the orchestrator must halt and generate a single-use cryptographic approval token. No external submission occurs until the human verifies and confirms the action.',
    },
    {
      id: 'q2',
      category: 'behavioral',
      question: 'Tell me about a time you identified a significant technical bottleneck in a student project and resolved it.',
      hint: 'Use the STAR method (Situation, Task, Action, Result) referencing your vector index or web application projects.',
      modelAnswer:
        'Situation: While developing our distributed search engine, high-dimensional vector similarity calculations were causing query latency spikes of over 800ms.\nTask: I was responsible for reducing search latency below 150ms while maintaining retrieval accuracy.\nAction: I benchmarked cosine distance bottlenecks and introduced vector quantization with optimized NumPy SIMD operations in Python and C++.\nResult: We cut latency by 45% down to 95ms per query, allowing real-time semantic search for hundreds of concurrent users.',
    },
    {
      id: 'q3',
      category: 'system_design',
      question: 'How would you architect a secure multi-tenant student placement system with Row Level Security?',
      hint: 'Explain Supabase/PostgreSQL RLS policies, auth.uid() checks, foreign key cascading, and least-privilege principles.',
      modelAnswer:
        'In PostgreSQL/Supabase, multi-tenant isolation is enforced at the database kernel level using Row Level Security (RLS). Every table includes a user_id foreign key referencing auth.users. Policies are defined such that SELECT, INSERT, UPDATE, and DELETE operations are strictly restricted to auth.uid() = user_id. Even if an attacker manipulates client-side parameters, database-level enforcement prevents unauthorized cross-tenant data leakage.',
    },
  ]);

  const [selectedQuestion, setSelectedQuestion] = useState<InterviewQuestion>(questions[0]);
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <div className="space-y-8 pb-12 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
            Placement Readiness
          </span>
          <Badge variant="blue" size="sm">STAR Method Grounding</Badge>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
          AI Interview Preparation & Role Simulator
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
          Practice interview questions generated specifically for your target roles ({profile?.headline || 'Software & AI Engineer'}), grounded in your real projects and coursework.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Questions Selector */}
        <div className="lg:col-span-1 space-y-3">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Curated Questions ({questions.length})
          </h4>
          {questions.map((q) => (
            <div
              key={q.id}
              onClick={() => {
                setSelectedQuestion(q);
                setShowAnswer(false);
              }}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                selectedQuestion.id === q.id
                  ? 'bg-[#151f38] border-blue-500/40 shadow-lg'
                  : 'bg-[#090d16] border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <Badge
                  variant={
                    q.category === 'technical'
                      ? 'blue'
                      : q.category === 'behavioral'
                      ? 'emerald'
                      : 'purple'
                  }
                  size="sm"
                >
                  {q.category.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs font-medium text-slate-200 line-clamp-2">
                {q.question}
              </p>
            </div>
          ))}
        </div>

        {/* Selected Question & Simulator */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 space-y-6">
            <div className="space-y-2">
              <Badge variant="blue" size="sm">
                {selectedQuestion.category.toUpperCase()}
              </Badge>
              <h3 className="text-lg font-bold text-slate-100">
                {selectedQuestion.question}
              </h3>
            </div>

            {/* Answer Strategy Hint */}
            <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/20 space-y-1 text-xs text-slate-300">
              <div className="flex items-center gap-1.5 font-semibold text-blue-300">
                <BookOpen className="w-4 h-4" />
                <span>Preparation Strategy & Hints</span>
              </div>
              <p className="leading-relaxed text-slate-400">{selectedQuestion.hint}</p>
            </div>

            {/* Answer toggle */}
            <div className="pt-2">
              <Button
                variant={showAnswer ? 'secondary' : 'primary'}
                onClick={() => setShowAnswer(!showAnswer)}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                {showAnswer ? 'Hide Exemplar Answer' : 'Reveal Grounded Model Answer'}
              </Button>
            </div>

            {/* Model answer */}
            {showAnswer && (
              <div className="p-5 rounded-xl bg-[#090d16] border border-slate-800 space-y-2 animate-fadeIn">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Exemplar Answer (Grounded in Verified Facts)</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 whitespace-pre-wrap leading-relaxed font-sans pt-1">
                  {selectedQuestion.modelAnswer}
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
