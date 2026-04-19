const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env');
  if (!fs.existsSync(envPath)) { console.error('ERROR: .env not found at', envPath); process.exit(1); }
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const [key, ...rest] = line.split('=');
    if (key && rest.length && !key.startsWith('#')) process.env[key.trim()] = rest.join('=').trim();
  });
}

loadEnv();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

function clean(text) {
  if (!text) return '';
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code === 8212 || code === 8211) { result += '-'; }
    else if (code === 8216 || code === 8217) { result += "'"; }
    else if (code === 8220 || code === 8221) { result += '"'; }
    else if (code === 8230) { result += '...'; }
    else if (code === 160) { result += ' '; }
    else if (code === 8722) { result += '-'; }   // minus sign −
    else if (code === 8730) { result += 'sqrt'; } // √
    else if (code === 8756) { result += 'therefore'; } // ∴
    else if (code === 952)  { result += 'theta'; }     // θ
    else if (code === 10233){ result += '=>'; }         // ⟹
    else if (code <= 255) { result += text[i]; }
    else { result += ' '; }
  }
  return result.replace(/\s+/g, ' ').trim();
}

function validate(q) {
  const e = [];
  const cleanedText = clean(q.questionText || '');
  if (!cleanedText || cleanedText.length < 15) e.push('short question');
  if (!q.options?.A || !q.options?.B || !q.options?.C || !q.options?.D) e.push('missing options');
  if (!q.correctAnswer || !['A','B','C','D','E'].includes(q.correctAnswer)) e.push('bad answer');
  if (!q.subject) e.push('no subject');
  if (!q.year || q.year < 1988 || q.year > 2025) e.push('bad year');
  if (!['WAEC','NECO'].includes(q.examType)) e.push('bad exam type');
  return e;
}


async function run() {
  const { count } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true });
  console.log(`Already in DB: ${count}`);


  const inputFile = path.join(__dirname, 'output', 'all_questions.json');
  if (!fs.existsSync(inputFile)) { console.error('No all_questions.json found'); process.exit(1); }

  const raw = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
  console.log('\nPrepWise Importer\n=================');
  console.log(`Loaded ${raw.length} questions\n`);

  const valid = raw.filter(q => validate(q).length === 0);
  const invalid = raw.length - valid.length;
  console.log(`Valid: ${valid.length} | Invalid: ${invalid}`);

  let inserted = 0, skipped = 0, errors = 0;
  const BATCH = 25; // was 50;

  console.log(`\nImporting in batches of ${BATCH}...\n`);

  for (let i = 0; i < valid.length; i += BATCH) {
    const batch = valid.slice(i, i + BATCH);

    const rows = batch.map(q => ({
      exam_type: q.examType,
      exam_session: q.examType === 'WAEC' ? 'MAY_JUNE' : 'JUNE_JULY',
      subject: q.subject,
      year: q.year,
      question_text: clean(q.questionText),
      options: {
        A: clean(q.options.A),
        B: clean(q.options.B),
        C: clean(q.options.C),
        D: clean(q.options.D),
        ...(q.options.E ? { E: clean(q.options.E) } : {}),
      },
      correct_answer: q.correctAnswer,
      difficulty: 'MEDIUM',
      source_url: q.sourceUrl ?? null,
      ai_explanation: q.aiExplanation ? clean(q.aiExplanation) : null,
      is_verified: false,
      is_active: true,
    }));

    const { data, error } = await supabase
      .from('questions')
      .upsert(rows, { onConflict: 'subject,year,question_text', ignoreDuplicates: true })
      .select('id');

    if (error) {
        // Fall back to row-by-row
      for (const row of rows) {
        const { error: rowError } = await supabase.from('questions').insert(row);
        if (!rowError) inserted++;
        else if (rowError.code === '23505') skipped++;
        else errors++;
      }
    } else {
      inserted += data?.length ?? 0;
      skipped += rows.length - (data?.length ?? 0);
    }

    const pct = Math.round((Math.min(i + BATCH, valid.length) / valid.length) * 100);
    process.stdout.write(`\r  Progress: ${Math.min(i+BATCH, valid.length)}/${valid.length} (${pct}%)`);

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n\n=================');
  console.log(`Inserted: ${inserted}`);
  console.log(`Skipped:  ${skipped}`);
  console.log(`Errors:   ${errors}`);
}

run().catch(err => { console.error('\nFatal:', err); process.exit(1); });