// ============================================================
// PrepWise — Question Validator
// Validates scraped questions before DB insert
// Usage: ts-node src/validators/validate.ts <input.json>
// ============================================================

import { z } from 'zod';

const QuestionSchema = z.object({
  examType:     z.enum(['WAEC', 'NECO']),
  examSession:  z.enum(['MAY_JUNE', 'GCE', 'JUNE_JULY']).default('MAY_JUNE'),
  subject:      z.string().min(3),
  year:         z.number().int().min(2000).max(2030),
  questionText: z.string().min(15),
  options: z.object({
    A: z.string().min(1),
    B: z.string().min(1),
    C: z.string().min(1),
    D: z.string().min(1),
    E: z.string().optional(),
  }),
  correctAnswer: z.enum(['A', 'B', 'C', 'D', 'E']),
  sourceUrl:     z.string().url().optional(),
});

export type ValidQuestion = z.infer<typeof QuestionSchema>;

export interface ValidationResult {
  valid: ValidQuestion[];
  invalid: Array<{ index: number; errors: string[] }>;
}

export function validateQuestions(raw: unknown[]): ValidationResult {
  const valid: ValidQuestion[] = [];
  const invalid: Array<{ index: number; errors: string[] }> = [];
  const seen = new Set<string>();

  raw.forEach((item, index) => {
    const result = QuestionSchema.safeParse(item);
    if (!result.success) {
      invalid.push({ index, errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`) });
      return;
    }

    // Deduplication check
    const fingerprint = `${result.data.subject}|${result.data.year}|${result.data.questionText.slice(0, 80)}`;
    if (seen.has(fingerprint)) {
      invalid.push({ index, errors: ['Duplicate question detected'] });
      return;
    }
    seen.add(fingerprint);
    valid.push(result.data);
  });

  return { valid, invalid };
}

// ============================================================
// PrepWise — DB Importer
// Imports validated JSON into Supabase
// Usage: ts-node src/validators/import.ts <validated.json>
// ============================================================

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function importToDatabase(questions: ValidQuestion[]): Promise<{ inserted: number; skipped: number }> {
  const BATCH_SIZE = 100;
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    const batch = questions.slice(i, i + BATCH_SIZE);
    const rows = batch.map((q) => ({
      exam_type: q.examType,
      exam_session: q.examSession,
      subject: q.subject,
      year: q.year,
      question_text: q.questionText,
      options: q.options,
      correct_answer: q.correctAnswer,
      source_url: q.sourceUrl ?? null,
      is_verified: false,
      difficulty: 'MEDIUM',
    }));

    const { data, error } = await supabase
      .from('questions')
      .upsert(rows, { onConflict: 'subject,year,question_text', ignoreDuplicates: true })
      .select('id');

    if (error) {
      console.error(`Batch ${i}–${i + BATCH_SIZE} error:`, error.message);
    } else {
      inserted += data?.length ?? 0;
      skipped += batch.length - (data?.length ?? 0);
    }

    console.log(`Progress: ${Math.min(i + BATCH_SIZE, questions.length)} / ${questions.length}`);
  }

  return { inserted, skipped };
}

// CLI runner
async function main() {
  const filePath = process.argv[2];
  if (!filePath) { console.error('Usage: ts-node import.ts <file.json>'); process.exit(1); }

  const fs = await import('fs/promises');
  const raw = JSON.parse(await fs.readFile(filePath, 'utf-8'));

  const { valid, invalid } = validateQuestions(raw);
  console.log(`Validation: ${valid.length} valid, ${invalid.length} invalid`);
  if (invalid.length > 0) {
    console.log('Invalid samples:', invalid.slice(0, 3));
  }

  const { inserted, skipped } = await importToDatabase(valid);
  console.log(`\nInserted: ${inserted}, Skipped (duplicates): ${skipped}`);
}

main().catch(console.error);
