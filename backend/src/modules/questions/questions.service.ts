// ============================================================
// PrepWise — Questions: Service
// ============================================================

import { AppError } from '../../middleware/errorHandler';
import { questionsRepository, QuestionFilters } from './questions.repository';
import { cacheGet, cacheSet } from '../../database/redis';
import type { Question } from '@prepwise/types';
import { supabaseAdmin } from '../../database/client';

const CACHE_TTL = 3600; // 1 hour

export const questionsService = {
  async list(filters: QuestionFilters) {
    const cacheKey = `questions:${JSON.stringify(filters)}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const result = await questionsRepository.findMany(filters);
    await cacheSet(cacheKey, result, CACHE_TTL);
    return result;
  },

  async getById(id: string): Promise<Question> {
    const cacheKey = `question:${id}`;
    const cached = await cacheGet<Question>(cacheKey);
    if (cached) return cached;

    const question = await questionsRepository.findById(id);
    if (!question) throw new AppError('Question not found', 404);
    await cacheSet(cacheKey, question, CACHE_TTL);
    return question;
  },

  async getSubjects() {
    const cached = await cacheGet<string[]>('subjects:all');
    if (cached) return cached;
    const subjects = await questionsRepository.getSubjects();
    await cacheSet('subjects:all', subjects, 86400); // 24h
    return subjects;
  },

  async getYears(subject: string, examType: string) {
    const cacheKey = `years:${subject}:${examType}`;
    const cached = await cacheGet<number[]>(cacheKey);
    if (cached) return cached;
    const years = await questionsRepository.getYears(subject, examType);
    await cacheSet(cacheKey, years, 86400);
    return years;
  },

  // Replace the existing flagQuestion method in questions.service.ts with this:

  async flagQuestion(questionId: string, userId: string, reason: string): Promise<void> {
    const question = await questionsRepository.findById(questionId);
    if (!question) throw new AppError('Question not found', 404);

    const { error } = await supabaseAdmin
      .from('flagged_questions')
      .insert({
        question_id: questionId,
        user_id: userId,
        reason,
      });

    if (error) {
      if (error.code === '23505') {
        throw new AppError('Already reported this question.', 409, 'ALREADY_FLAGGED');
      }
      throw error;
    }
  },
  async adminCreate(data: Omit<Question, 'id' | 'createdAt' | 'updatedAt' | 'aiExplanation'>) {
    return questionsRepository.create(data);
  },

  async adminUpdate(id: string, fields: Partial<Record<string, unknown>>) {
    const question = await questionsRepository.findById(id);
    if (!question) throw new AppError('Question not found', 404);
    return questionsRepository.update(id, fields);
  },

  async adminDelete(id: string): Promise<void> {
    const question = await questionsRepository.findById(id);
    if (!question) throw new AppError('Question not found', 404);
    await questionsRepository.softDelete(id);
  },

  async adminBulkCreate(questions: Omit<Question, 'id' | 'createdAt' | 'updatedAt' | 'aiExplanation'>[]) {
    const inserted = await questionsRepository.bulkCreate(questions);
    return { inserted };
  },
};
