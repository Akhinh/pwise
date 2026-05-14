// ============================================================
// PrepWise — Import Theory Questions to Supabase
// Run AFTER theory_scraper.js finishes

// Usage: node import_theory_to_supabase.js
// ============================================================

const { createClient } = require('@supabase/supabase-js');
const fs   = require('fs');
const path = require('path');

// ── Hardcode credentials (avoid .env em-dash corruption) ──────
const SUPABASE_URL              = 'YOUR_SUPABASE_URL';
const SUPABASE_SERVICE_ROLE_KEY = 'YOUR_SERVICE_ROLE_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const BATCH_SIZE = 25;
const DELAY_MS   = 100;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function toSnakeCase(q) {
  return {
    exam_type:          q.examType,
    exam_session:       q.examSession  ?? null,
    subject:            q.subject,
    year:               q.year,
    question_number:    q.questionNumber ?? null,
    question_text:      q.questionText,
    sub_questions:      q.subQuestions  ?? [],
    answer:             q.answer        ?? null,
    question_image_url: q.questionImageUrl ?? null,
    source_url:         q.sourceUrl     ?? null,
    topic:              q.topic         ?? null,
    is_verified:        q.isVerified    ?? false,
    difficulty:         q.difficulty    ?? 'MEDIUM',
  };
}

function validate(q) {
  if (!q.questionText || q.questionText.length < 10) return false;
  if (!['WAEC', 'NECO'].includes(q.examType))        return false;
  if (!q.subject || !q.year)                          return false;
  return true;
}

async function main() {
  const inputPath = path.join('./output', 'theory_questions.json');
  if (!fs.existsSync(inputPath)) {
    console.error('theory_questions.json not found. Run theory_scraper.js first.');
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
  console.log(`\nLoaded ${raw.length} theory questions from JSON`);

  const valid   = raw.filter(validate);
  const invalid = raw.length - valid.length;
  console.log(`Valid: ${valid.length} | Invalid/skipped: ${invalid}`);

  const rows = valid.map(toSnakeCase);

  let inserted = 0;
  let skipped  = 0;
  let errors   = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    process.stdout.write(`Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(rows.length / BATCH_SIZE)}... `);

    const { error } = await supabase
      .from('theory_questions')
      .insert(batch);

    if (error) {
      // Duplicate key errors are expected on re-runs — skip silently
      if (error.code === '23505') {
        console.log(`skipped (duplicates)`);
        skipped += batch.length;
      } else {
        console.log(`ERROR: ${error.message}`);
        errors += batch.length;
      }
    } else {
      console.log(`OK`);
      inserted += batch.length;
    }

    await sleep(DELAY_MS);
  }

  console.log('\n======================================');
  console.log(`Inserted/updated: ${inserted}`);
  console.log(`Skipped dupes:    ${skipped}`);
  console.log(`Errors:           ${errors}`);
  console.log('Import complete.');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});