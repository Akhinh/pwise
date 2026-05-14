// ============================================================
// PrepWise — Theory Question Scraper v5
//
// Answer extraction confirmed:
//   - Answer URL: https://myschool.ng/classroom/mathematics/53460?...
//   - Answer is plain text in body between "Explanation" and "Next"
//   - No CSS class wrapper — extracted via body text regex
//
// Flow per page:
//   1. Load listing page → get 5 questions + their answer URLs
//   2. For each question: visit answer URL → extract "Explanation" text
//   3. Return to listing page → next question
//
// Usage:  node theory_scraper.js
// Output: ./output/theory_questions.json
// ============================================================

const { chromium: stealthChromium } = require('playwright-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
stealthChromium.use(StealthPlugin());

const fs   = require('fs');
const path = require('path');

const CONFIG = {
  baseUrl:              'https://myschool.ng/classroom',
  delayBetweenAnswers:  2000,
  delayBetweenPages:    3000,
  delayBetweenYears:    1000,
  delayBetweenSubjects: 5000,
  pageTimeout:          60000,
  outputDir:            './output',
  headless:             true,
};

const SUBJECTS = [
  { name: 'Mathematics',                 slug: 'mathematics' },
  { name: 'English Language',            slug: 'english-language' },
  { name: 'Chemistry',                   slug: 'chemistry' },
  { name: 'Physics',                     slug: 'physics' },
  { name: 'Biology',                     slug: 'biology' },
  { name: 'Geography',                   slug: 'geography' },
  { name: 'Literature in English',       slug: 'literature-in-english' },
  { name: 'Economics',                   slug: 'economics' },
  { name: 'Commerce',                    slug: 'commerce' },
  { name: 'Financial Accounting',        slug: 'accounts-principles-of-accounts' },
  { name: 'Government',                  slug: 'government' },
  { name: 'Christian Religious Studies', slug: 'christian-religious-knowledge-crk' },
  { name: 'Agricultural Science',        slug: 'agricultural-science' },
  { name: 'Islamic Religious Studies',   slug: 'islamic-religious-knowledge-irk' },
  { name: 'History',                     slug: 'history' },
  { name: 'Fine Arts',                   slug: 'fine-arts' },
  { name: 'Music',                       slug: 'music' },
  { name: 'French',                      slug: 'french' },
  { name: 'Animal Husbandry',            slug: 'animal-husbandry' },
  { name: 'Insurance',                   slug: 'insurance' },
  { name: 'Civic Education',             slug: 'civic-education' },
  { name: 'Further Mathematics',         slug: 'further-mathematics' },
  { name: 'Yoruba',                      slug: 'yoruba' },
  { name: 'Igbo',                        slug: 'igbo' },
  { name: 'Arabic',                      slug: 'arabic' },
  { name: 'Home Economics',              slug: 'home-economics' },
  { name: 'Hausa',                       slug: 'hausa' },
  { name: 'Book Keeping',                slug: 'book-keeping' },
  { name: 'Data Processing',             slug: 'data-processing' },
  { name: 'Catering Craft Practice',     slug: 'catering-craft-practice' },
  { name: 'Computer Studies',            slug: 'computer-studies' },
  { name: 'Marketing',                   slug: 'marketing' },
  { name: 'Physical Education',          slug: 'physical-education' },
  { name: 'Office Practice',             slug: 'office-practice' },
  { name: 'Technical Drawing',           slug: 'technical-drawing' },
  { name: 'Food and Nutrition',          slug: 'food-and-nutrition' },
  { name: 'Home Management',             slug: 'home-management' },
];

const EXAM_TYPES = [
  { name: 'WAEC', param: 'waec', session: 'MAY_JUNE'  },
  { name: 'NECO', param: 'neco', session: 'JUNE_JULY' },
];

const YEARS = Array.from({ length: 26 }, (_, i) => 2000 + i);

// ── Helpers ───────────────────────────────────────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function ensureOutputDir() {
  if (!fs.existsSync(CONFIG.outputDir)) fs.mkdirSync(CONFIG.outputDir, { recursive: true });
}
function saveJSON(data, filename) {
  ensureOutputDir();
  fs.writeFileSync(path.join(CONFIG.outputDir, filename), JSON.stringify(data, null, 2));
}
function loadJSON(filename, def) {
  const fp = path.join(CONFIG.outputDir, filename);
  if (fs.existsSync(fp)) { try { return JSON.parse(fs.readFileSync(fp, 'utf-8')); } catch {} }
  return def;
}
function sanitize(text) {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}
function parseSubQuestions(fullText) {
  const SUB_RE = /(?:([a-e])\(([ivx]+)\)|\(([a-e])\)|\(([ivx]+)\))/gi;
  const splits = [];
  let m;
  while ((m = SUB_RE.exec(fullText)) !== null) {
    let label;
    if (m[1] && m[2]) label = `${m[1]}(${m[2]})`;
    else if (m[3])    label = m[3];
    else if (m[4])    label = m[4];
    if (label) splits.push({ label, start: m.index, end: m.index + m[0].length });
  }
  const result = [];
  for (let i = 0; i < splits.length; i++) {
    const s = splits[i].end;
    const e = i + 1 < splits.length ? splits[i + 1].start : fullText.length;
    const t = fullText.slice(s, e).trim();
    if (t.length > 2) result.push({ label: splits[i].label, text: sanitize(t) });
  }
  return result;
}
function extractMainText(fullText) {
  const m = fullText.match(/(?:[a-e]\([ivx]+\)|\([a-e]\)|\([ivx]+\))/i);
  if (!m) return fullText.trim();
  const idx = fullText.indexOf(m[0]);
  return idx > 5 ? fullText.slice(0, idx).trim() : fullText.trim();
}
async function blockUnneeded(page) {
  await page.route('**/*', route => {
    const type = route.request().resourceType();
    const url  = route.request().url();
    if (['image', 'font', 'media'].includes(type)) return route.abort();
    if (url.includes('googletagmanager') || url.includes('googlesyndication') ||
        url.includes('doubleclick') || url.includes('facebook.net') ||
        url.includes('google-analytics') || url.includes('sharethis'))
      return route.abort();
    return route.continue();
  });
}

// ── Scrape answer from detail page ────────────────────────────
// Confirmed: answer is plain text between "Explanation" and "Next\nGo back"
async function scrapeAnswer(page, answerUrl) {
  try {
    await page.goto(answerUrl, { waitUntil: 'domcontentloaded', timeout: CONFIG.pageTimeout });
    await page.waitForTimeout(3500);

    return await page.evaluate(() => {
      const bodyText = document.body.innerText;

      // Extract text between "Explanation" and the end markers
      const match = bodyText.match(
        /Explanation\s*\n([\s\S]+?)(?:\n(?:Next|Go back|Report an Error|Ask A Question|Download App|Quick Questions)|$)/i
      );

      if (!match) return null;

      let answer = match[1]
        .replace(/\n{3,}/g, '\n\n')
        .replace(/Report an Error[\s\S]*$/i, '')
        .replace(/Ask A Question[\s\S]*$/i, '')
        .replace(/Download App[\s\S]*$/i, '')
        .replace(/Quick Questions[\s\S]*$/i, '')
        .trim();

      return answer.length >= 10 ? answer : null;
    });
  } catch {
    return null;
  }
}

// ── Scrape listing page — get questions + answer URLs ─────────
async function scrapeListingPage(page, url) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: CONFIG.pageTimeout });
    await page.waitForTimeout(3500);

    return await page.evaluate(() => {
      function cleanText(el) {
        if (!el) return '';
        const clone = el.cloneNode(true);
        clone.querySelectorAll('.MathJax_Preview').forEach(preview => {
          const parent = preview.parentNode;
          const sibs   = [...parent.childNodes];
          const idx    = sibs.indexOf(preview);
          let latex    = null;
          for (let i = idx; i < Math.min(idx + 5, sibs.length); i++) {
            if (sibs[i].nodeName === 'SCRIPT' && sibs[i].type?.includes('math/tex')) { latex = sibs[i]; break; }
          }
          latex ? preview.replaceWith(document.createTextNode(`[${latex.textContent.trim()}]`)) : preview.remove();
        });
        clone.querySelectorAll('.MathJax, script[type*="math"], button').forEach(e => e.remove());
        clone.querySelectorAll('a').forEach(a => {
          if ((a.innerText || '').toLowerCase().includes('view answer')) a.remove();
        });
        return clone.innerText.trim().replace(/\s+/g, ' ');
      }

      function tableToText(el) {
        if (!el) return null;
        return [...el.querySelectorAll('tr')]
          .map(r => [...r.querySelectorAll('th,td')].map(c => c.innerText.trim()).filter(Boolean).join(' | '))
          .filter(Boolean).join('\n');
      }

      const items = document.querySelectorAll('.question-item');
      const questions = [];

      items.forEach((item, index) => {
        let qNum = index + 1;
        const nm = item.innerText.trim().match(/^(\d+)\s/);
        if (nm) qNum = parseInt(nm[1]);

        const descEl  = item.querySelector('.question-desc');
        const fullText = descEl ? cleanText(descEl) : cleanText(item);
        if (!fullText || fullText.length < 10) return;

        const tableText = tableToText(item.querySelector('table'));
        const imgEl     = item.querySelector('.question-desc img, .media-body img');
        const imageUrl  = imgEl ? imgEl.src : null;

        // Capture the "View Answer & Discuss" href — confirmed class: btn-outline-danger
        const answerLink = item.querySelector('a.btn-outline-danger, a[href*="/classroom/"][href*="type=theory"]');
        const answerUrl  = answerLink ? answerLink.href : null;

        questions.push({ index, qNum, fullText, tableText, imageUrl, answerUrl });
      });

      const nums = [...document.querySelectorAll('.pagination a[href]')]
        .map(a => a.href).filter(h => h.includes('page='))
        .map(h => { const m = h.match(/page=(\d+)/); return m ? parseInt(m[1]) : 0; })
        .filter(n => n > 0);

      return { questions, totalPages: nums.length > 0 ? Math.max(...nums) : 1, hasContent: questions.length > 0 };
    });
  } catch (err) {
    console.error(`\n  Listing error: ${err.message.slice(0, 80)}`);
    return { questions: [], totalPages: 1, hasContent: false };
  }
}

// ── Main ──────────────────────────────────────────────────────
async function main() {
  ensureOutputDir();
  console.log('\nPrepWise Theory Scraper v5 — myschool.ng');
  console.log('==========================================');
  console.log('Answer source: body text after "Explanation" on detail page\n');

  const allQuestions = loadJSON('theory_questions.json', []);
  const visitedKeys  = new Set(loadJSON('theory_visited_keys.json', []));
  console.log(`Resuming: ${allQuestions.length} questions, ${visitedKeys.size} pages visited\n`);

  let totalNew = 0;

  for (const subject of SUBJECTS) {
    console.log(`\nSubject: ${subject.name}`);
    console.log('─'.repeat(45));

    const browser = await stealthChromium.launch({ headless: CONFIG.headless });
    const page    = await browser.newPage();
    await blockUnneeded(page);

    for (const examType of EXAM_TYPES) {
      console.log(`\n  ${examType.name}`);

      for (const year of YEARS) {
        let currentPage = 1;
        let totalPages  = 1;

        while (currentPage <= Math.min(totalPages, 10)) {
          const pageKey = `theory::${subject.slug}::${examType.param}::${year}::p${currentPage}`;
          if (visitedKeys.has(pageKey)) { currentPage++; continue; }

          const listUrl = `${CONFIG.baseUrl}/${subject.slug}?exam_type=${examType.param}&exam_year=${year}&type=theory&page=${currentPage}`;
          process.stdout.write(`    ${year} p${currentPage}... `);

          const { questions, totalPages: tp, hasContent } = await scrapeListingPage(page, listUrl);
          if (currentPage === 1) totalPages = Math.min(tp, 10);

          if (!hasContent || questions.length === 0) {
            console.log('empty');
            visitedKeys.add(pageKey);
            saveJSON([...visitedKeys], 'theory_visited_keys.json');
            break;
          }

          console.log(`${questions.length} questions — fetching answers...`);

          for (const q of questions) {
            const subQuestions = parseSubQuestions(q.fullText);
            const mainText     = extractMainText(q.fullText);
            const questionText = q.tableText ? `${mainText}\n\n[TABLE]\n${q.tableText}` : mainText;

            // Fetch answer from detail page
            let answer = null;
            if (q.answerUrl) {
              answer = await scrapeAnswer(page, q.answerUrl);
              await sleep(CONFIG.delayBetweenAnswers);
            }

            const hasAns = answer ? '✓ ans' : '✗ no ans';
            console.log(`      Q${q.qNum} [${subQuestions.length} sub ${hasAns}]: ${mainText.slice(0, 50)}...`);

            allQuestions.push({
              examType:        examType.name,
              examSession:     examType.session,
              subject:         subject.name,
              year,
              questionNumber:  q.qNum,
              questionText:    sanitize(questionText),
              subQuestions:    subQuestions.map(s => ({ label: s.label, text: sanitize(s.text) })),
              answer:          answer ? sanitize(answer) : null,
              questionImageUrl: q.imageUrl || null,
              sourceUrl:       listUrl,
              topic:           null,
              isVerified:      false,
              difficulty:      'MEDIUM',
            });

            totalNew++;
          }

          visitedKeys.add(pageKey);
          saveJSON(allQuestions, 'theory_questions.json');
          saveJSON([...visitedKeys], 'theory_visited_keys.json');

          currentPage++;
          if (currentPage <= totalPages) await sleep(CONFIG.delayBetweenPages);
        }

        await sleep(CONFIG.delayBetweenYears);
      }
    }

    await page.close();
    await browser.close();
    console.log(`\n  ✓ Done: ${subject.name}`);
    await sleep(CONFIG.delayBetweenSubjects);
  }

  console.log('\n==========================================');
  console.log(`New this run:  ${totalNew}`);
  console.log(`Total saved:   ${allQuestions.length}`);
  console.log(`\nNext: node import_theory_to_supabase.js`);
}

main().catch(err => { console.error('\nFatal:', err); process.exit(1); });