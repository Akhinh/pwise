// ============================================================
// PrepWise — Questions: Repository
// ============================================================

import { supabaseAdmin } from '../../database/client';
import type { Question } from '@prepwise/types';

export interface QuestionFilters {
  subject?: string;
  year?: number;
  examType?: string;
  topic?: string;
  difficulty?: string;
  isActive?: boolean;
  isVerified?: boolean;
  page?: number;
  limit?: number;
}

export const questionsRepository = {
  async findMany(filters: QuestionFilters) {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 20, 100);
    const offset = (page - 1) * limit;

    let query = supabaseAdmin.from('questions').select('*', { count: 'exact' });

    if (filters.subject)    query = query.eq('subject', filters.subject);
    if (filters.year)       query = query.eq('year', filters.year);
    if (filters.examType)   query = query.eq('exam_type', filters.examType);
    if (filters.topic)      query = query.eq('topic', filters.topic);
    if (filters.difficulty) query = query.eq('difficulty', filters.difficulty);
    if (filters.isVerified !== undefined) query = query.eq('is_verified', filters.isVerified);
    query = query.eq('is_active', filters.isActive ?? true);
    query = query.range(offset, offset + limit - 1).order('year', { ascending: false });

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    return {
      items: (data ?? []).map(mapQuestion),
      total: count ?? 0,
      page,
      limit,
      hasMore: offset + limit < (count ?? 0),
    };
  },

  async findById(id: string): Promise<Question | null> {
    const { data } = await supabaseAdmin.from('questions').select('*').eq('id', id).single();
    return data ? mapQuestion(data) : null;
  },

  async findByIds(ids: string[]): Promise<Question[]> {
    const { data } = await supabaseAdmin.from('questions').select('*').in('id', ids);
    return (data ?? []).map(mapQuestion);
  },

  async create(q: Omit<Question, 'id' | 'createdAt' | 'updatedAt' | 'aiExplanation'>): Promise<Question> {
    const { data, error } = await supabaseAdmin
      .from('questions')
      .insert({
        exam_type: q.examType,
        exam_session: q.examSession,
        subject: q.subject,
        year: q.year,
        question_text: q.questionText,
        question_image_url: q.questionImageUrl,
        options: q.options,
        correct_answer: q.correctAnswer,
        topic: q.topic,
        difficulty: q.difficulty,
        source_url: q.sourceUrl,
        is_verified: q.isVerified,
        is_active: q.isActive,
      })
      .select().single();
    if (error) throw new Error(error.message);
    return mapQuestion(data);
  },

  async update(id: string, fields: Partial<Record<string, unknown>>): Promise<Question> {
    const { data, error } = await supabaseAdmin
      .from('questions').update(fields).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return mapQuestion(data);
  },

  async softDelete(id: string): Promise<void> {
    await supabaseAdmin.from('questions').update({ is_active: false }).eq('id', id);
  },

  async getSubjects(): Promise<string[]> {
    const { data, error } = await supabaseAdmin
      .from('subjects').select('name').eq('is_active', true).order('name');
    if (error) {
      console.error('[getSubjects ERROR]', error);
      throw new Error(error.message);
    }
    return (data ?? []).map((s: { name: string }) => s.name);
  },

  async getYears(subject: string, examType: string): Promise<number[]> {
    const { data } = await supabaseAdmin
      .from('questions')
      .select('year')
      .eq('subject', subject)
      .eq('exam_type', examType)
      .eq('is_active', true)
      .order('year', { ascending: false });
    return [...new Set((data ?? []).map((r: { year: number }) => r.year))];
  },

  async saveAiExplanation(id: string, explanation: string): Promise<void> {
    await supabaseAdmin.from('questions').update({ ai_explanation: explanation }).eq('id', id);
  },

  async createFlag(questionId: string, userId: string, reason: string): Promise<void> {
    await supabaseAdmin.from('flagged_questions').insert({
      question_id: questionId,
      user_id: userId,
      reason,
    });
  },

  async bulkCreate(questions: Omit<Question, 'id' | 'createdAt' | 'updatedAt' | 'aiExplanation'>[]): Promise<number> {
    const rows = questions.map((q) => ({
      exam_type: q.examType,
      exam_session: q.examSession,
      subject: q.subject,
      year: q.year,
      question_text: q.questionText,
      options: q.options,
      correct_answer: q.correctAnswer,
      topic: q.topic,
      difficulty: q.difficulty,
      source_url: q.sourceUrl,
      is_verified: q.isVerified,
    }));
    const { data, error } = await supabaseAdmin.from('questions').upsert(rows, {
      onConflict: 'subject,year,question_text',
      ignoreDuplicates: true,
    }).select();
    if (error) throw new Error(error.message);
    return data?.length ?? 0;
  },
};

function mapQuestion(row: Record<string, unknown>): Question {
  return {
    id: row.id as string,
    examType: row.exam_type as Question['examType'],
    examSession: row.exam_session as Question['examSession'],
    subject: row.subject as string,
    year: row.year as number,
    questionText: row.question_text as string,
    questionImageUrl: (row.question_image_url as string) ?? null,
    options: row.options as Question['options'],
    correctAnswer: row.correct_answer as Question['correctAnswer'],
    aiExplanation: (row.ai_explanation as string) ?? null,
    topic: (row.topic as string) ?? null,
    difficulty: row.difficulty as Question['difficulty'],
    sourceUrl: (row.source_url as string) ?? null,
    isVerified: row.is_verified as boolean,
    isActive: row.is_active as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}