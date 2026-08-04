import { GoogleGenAI, Type } from '@google/genai';
import { supabaseAdmin } from '../../database/client.js';
import { AppError } from '../../middleware/errorHandler.js'
import type { StudyInsight } from '@prepwise/types';
 
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = 'gemini-3.6-flash';
 
const COOLDOWN_HOURS = 24;
const MAX_SESSIONS_ANALYZED = 40;
 
// Maps the raw Supabase row (snake_case) to the shared StudyInsight type (camelCase),
// matching how every other module returns its API responses.
function toStudyInsight(row: any): StudyInsight {
  return {
    id: row.id,
    summary: row.summary,
    strengths: row.strengths,
    weaknesses: row.weaknesses,
    studyPlan: row.study_plan,
    quizSessionsUsed: row.quiz_sessions_used,
    model: row.model,
    generatedAt: row.generated_at,
  };
}
 
// ---- Structured output schema (Gemini controlled generation) ----
const studyPlanSchema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: 'A 2-3 sentence encouraging overview of the student\'s current standing across subjects.',
    },
    strengths: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          subject: { type: Type.STRING },
          note: { type: Type.STRING, description: 'Why this is a strength, referencing accuracy or consistency.' },
        },
        required: ['subject', 'note'],
      },
    },
    weaknesses: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          subject: { type: Type.STRING },
          topic: { type: Type.STRING, description: 'Specific weak topic within the subject, if identifiable.' },
          note: { type: Type.STRING },
        },
        required: ['subject', 'note'],
      },
    },
    studyPlan: {
      type: Type.ARRAY,
      description: 'A 7-day forward-looking study plan.',
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.STRING, description: 'e.g. "Day 1"' },
          focus: { type: Type.STRING, description: 'Main subject/topic focus for the day.' },
          tasks: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['day', 'focus', 'tasks'],
      },
    },
  },
  required: ['summary', 'strengths', 'weaknesses', 'studyPlan'],
};
 
interface QuizHistoryRow {
  subject: string;
  score: number;
  total_questions: number;
  created_at: string;
  topic: string | null;
}
 
async function fetchQuizHistory(userId: string): Promise<QuizHistoryRow[]> {
  
  const { data, error } = await supabaseAdmin
    .from('quiz_sessions')
    .select(`
      score,
      total_questions,
      created_at,
      subject:subjects(name),
      user_answers ( is_correct, questions ( topic ) )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(MAX_SESSIONS_ANALYZED);
 
  if (error) throw new AppError('Failed to load quiz history', 500, 'DB_ERROR');
  if (!data || data.length === 0) return [];
 
  // Flatten into a simple shape the prompt builder can use directly
  return data.map((session: any) => ({
    subject: session.subject?.name ?? 'Unknown',
    score: session.score,
    total_questions: session.total_questions,
    created_at: session.created_at,
    topic: session.user_answers?.[0]?.questions?.topic ?? null,
  }));
}
 
function buildPrompt(history: QuizHistoryRow[]): string {
  const subjectSummary = history.reduce<Record<string, { correct: number; total: number }>>((acc, row) => {
    acc[row.subject] ??= { correct: 0, total: 0 };
    acc[row.subject].correct += row.score;
    acc[row.subject].total += row.total_questions;
    return acc;
  }, {});
 
  const lines = Object.entries(subjectSummary).map(
    ([subject, s]) => `- ${subject}: ${s.correct}/${s.total} correct (${Math.round((s.correct / s.total) * 100)}%)`
  );
 
  return `You are an academic coach for a Nigerian WAEC/NECO student using the PrepWise exam prep app.
Analyze this student's recent quiz performance and produce a personalized, encouraging, practical study plan.
 
Recent performance by subject (last ${history.length} quiz sessions):
${lines.join('\n')}
 
Guidelines:
- Be specific and actionable, not generic. Reference actual subjects from the data above.
- Keep tone supportive, never discouraging.
- The study plan should be realistic for a secondary school student studying part-time (1-2 hours/day).
- Only include subjects present in the data.`;
}
 
export async function generateStudyInsights(userId: string) {
  // Cooldown check
  const { data: existing } = await supabaseAdmin
    .from('study_insights')
    .select('generated_at')
    .eq('user_id', userId)
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
 
  if (existing) {
    const hoursSince = (Date.now() - new Date(existing.generated_at).getTime()) / (1000 * 60 * 60);
    if (hoursSince < COOLDOWN_HOURS) {
      throw new AppError(
        `Study insights can be regenerated once every ${COOLDOWN_HOURS} hours. Try again later.`,
        429,
        'COOLDOWN_ACTIVE'
      );
    }
  }
 
  const history = await fetchQuizHistory(userId);
  if (history.length === 0) {
    throw new AppError('Complete at least one quiz before generating study insights.', 400, 'NO_QUIZ_HISTORY');
  }
 
  const prompt = buildPrompt(history);
 
  const response = await genAI.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: studyPlanSchema,
    },
  });
 
  let parsed: { summary: string; strengths: any[]; weaknesses: any[]; studyPlan: any[] };
  try {
    parsed = JSON.parse(response.text ?? '{}');
  } catch {
    throw new AppError('AI response could not be parsed', 502, 'AI_PARSE_ERROR');
  }
 
  const { data: saved, error: saveError } = await supabaseAdmin
    .from('study_insights')
    .insert({
      user_id: userId,
      summary: parsed.summary,
      strengths: parsed.strengths,
      weaknesses: parsed.weaknesses,
      study_plan: parsed.studyPlan,
      quiz_sessions_used: history.length,
      model: MODEL,
    })
    .select()
    .single();
 
  if (saveError) throw new AppError('Failed to save study insights', 500, 'DB_ERROR');
  return toStudyInsight(saved);
}
 
export async function getLatestStudyInsights(userId: string): Promise<StudyInsight | null> {
  const { data, error } = await supabaseAdmin
    .from('study_insights')
    .select('*')
    .eq('user_id', userId)
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
 
  if (error) throw new AppError('Failed to fetch study insights', 500, 'DB_ERROR');
  return data ? toStudyInsight(data) : null;
}