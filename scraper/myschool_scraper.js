// ============================================================
// PrepWise — myschool.ng Complete Scraper v2
//
// Strategy:
//   Step 1: Scrape listing pages to collect all question URLs
//   Step 2: Visit each question detail page to get correct answer + explanation
//
// Features:
//   - Full pagination support (all pages per year)
//   - Correct answers extracted from detail pages
//   - Explanations stored (skips Claude API call if explanation exists)
//   - Resumes from where it stopped — never re-scrapes completed questions
//   - Polite delays between every request
//   - Saves progress after every single question
//
// Usage: node myschool_scraper.js
// ============================================================

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// ── Configuration ─────────────────────────────────────────────
const CONFIG = {
  baseUrl: 'https://myschool.ng/classroom',
  delayBetweenPages: 2500,
  delayBetweenQuestions: 2000,
  delayBetweenSubjects: 5000,
  pageTimeout: 60000,
  outputDir: './output',
  headless: true,
};

const ALL_SUBJECT_NAMES = [
  'Mathematics', 'English Language', 'Biology', 'Chemistry', 'Physics',
  'Economics', 'Government', 'Literature in English', 'Geography',
  'Agricultural Science', 'Commerce', 'Christian Religious Studies',
  'Islamic Religious Studies', 'History', 'Fine Arts', 'Music', 'French',
  'Animal Husbandry', 'Insurance', 'Civic Education', 'Yoruba', 'Igbo',
  'Arabic', 'Home Economics', 'Hausa', 'Book Keeping', 'Data Processing',
  'Catering Craft Practice', 'Computer Studies', 'Marketing',
  'Physical Education', 'Financial Accounting', 'Further Mathematics',
  'Christian Religious Knowledge', 'Islamic Religious Knowledge', 'Accounts - Principles of Accounts'
];

// Sort longest first to avoid partial matches
const subjectPattern = ALL_SUBJECT_NAMES
  .sort((a, b) => b.length - a.length)
  .map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  .join('|');

const SUBJECT_PREFIX_REGEX = new RegExp(`^(${subjectPattern})\\s+`, 'i');

const SUBJECTS = [
  { name: 'History',                    slug: 'history' },
  { name: 'Fine Arts',                  slug: 'fine-arts' },
  { name: 'Music',                      slug: 'music' },
  { name: 'French',                     slug: 'french' },
  { name: 'Animal Husbandry',           slug: 'animal-husbandry' },
  { name: 'Insurance',                  slug: 'insurance' },
  { name: 'Civic Education',            slug: 'civic-education' },
  { name: 'Yoruba',                     slug: 'yoruba' },
  { name: 'Igbo',                       slug: 'igbo' },
  { name: 'Arabic',                     slug: 'arabic' },
  { name: 'Home Economics',             slug: 'home-economics' },
  { name: 'Hausa',                      slug: 'hausa' },
  { name: 'Book Keeping',               slug: 'book-keeping' },
  { name: 'Data Processing',            slug: 'data-processing' },
  { name: 'Catering Craft Practice',    slug: 'catering-craft-practice' },
  { name: 'Computer Studies',           slug: 'computer-studies' },
  { name: 'Marketing',                  slug: 'marketing' },
  { name: 'Physical Education',         slug: 'physical-education' },
  { name: 'Islamic Religious Studies',  slug: 'islamic-religious-knowledge-irk' },
  { name: 'Christian Religious Studies',slug: 'christian-religious-knowledge-crk' },
  { name: 'Financial Accounting',       slug: 'accounts-principles-of-accounts' },
  { name: 'Further Mathematics',        slug: 'further-mathematics' },
];

const EXAM_TYPES = [
  { name: 'WAEC', param: 'waec', session: 'MAY_JUNE' },
  { name: 'NECO', param: 'neco', session: 'JUNE_JULY' },
];

const YEARS = Array.from({ length: 26 }, (_, i) => 2000 + i);

// ── Helpers ───────────────────────────────────────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function ensureOutputDir() {
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }
}

function saveJSON(data, filename) {
  ensureOutputDir();
  fs.writeFileSync(path.join(CONFIG.outputDir, filename), JSON.stringify(data, null, 2));
}

function loadJSON(filename, defaultValue) {
  const filepath = path.join(CONFIG.outputDir, filename);
  if (fs.existsSync(filepath)) {
    return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  }
  return defaultValue;
}

function sanitize(text) {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').replace(/\n+/g, ' ').trim();
}

function stripSubjectPrefix(text) {
  if (!text) return '';
  return text.replace(SUBJECT_PREFIX_REGEX, '').trim();
}

async function blockUnneeded(page) {
  await page.route('**/*', (route) => {
    const url = route.request().url();
    const type = route.request().resourceType();
    if (['image', 'font', 'media'].includes(type)) return route.abort();
    if (
      url.includes('googletagmanager') ||
      url.includes('sharethis') ||
      url.includes('googlesyndication') ||
      url.includes('doubleclick') ||
      url.includes('facebook.net') ||
      url.includes('google-analytics')
    ) return route.abort();
    return route.continue();
  });
}

// ── Step 1: Scrape listing page ───────────────────────────────
async function scrapeListingPage(page, url) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: CONFIG.pageTimeout });
    await page.waitForTimeout(3500);

    return await page.evaluate(() => {
      const questionItems = document.querySelectorAll('.question-item');
      const links = [];

      questionItems.forEach(item => {
        const anchor = item.querySelector('a[href*="/classroom/"]');
        if (!anchor) return;
        const href = anchor.href;
        if (!href || !href.includes('/classroom/')) return;
        const descEl = item.querySelector('.question-desc');
        const questionText = descEl ? descEl.innerText.trim() : '';
        const imgEl = item.querySelector('img');
        const imageUrl = imgEl ? imgEl.src : null;
        links.push({ href, questionText, imageUrl });
      });

      const pageNumbers = [...document.querySelectorAll('.pagination a[href]')]
        .map(a => a.href)
        .filter(h => h.includes('page='))
        .map(h => {
          const match = h.match(/page=(\d+)/);
          return match ? parseInt(match[1]) : 0;
        })
        .filter(n => n > 0);

      const totalPages = pageNumbers.length > 0 ? Math.max(...pageNumbers) : 1;
      return { links, totalPages };
    });
  } catch (err) {
    console.error(`    Listing page error:`, err.message);
    return { links: [], totalPages: 1 };
  }
}

// ── Step 2: Scrape detail page ────────────────────────────────
async function scrapeDetailPage(page, url) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: CONFIG.pageTimeout });
    await page.waitForTimeout(3000);

    return await page.evaluate(() => {
      function extractCleanText(el) {
        if (!el) return '';
        const clone = el.cloneNode(true);

        clone.querySelectorAll('.MathJax_Preview').forEach(preview => {
          const parent = preview.parentNode;
          const siblings = [...parent.childNodes];
          const previewIndex = siblings.indexOf(preview);
          let latexScript = null;
          for (let i = previewIndex; i < Math.min(previewIndex + 5, siblings.length); i++) {
            const sibling = siblings[i];
            if (sibling.nodeName === 'SCRIPT' && sibling.type && sibling.type.includes('math/tex')) {
              latexScript = sibling;
              break;
            }
          }
          if (latexScript) {
            preview.replaceWith(document.createTextNode(latexScript.textContent.trim()));
          } else {
            preview.remove();
          }
        });

        clone.querySelectorAll('.MathJax, script[type*="math"]').forEach(el => el.remove());
        clone.querySelectorAll('a').forEach(a => {
          if (a.href && a.href.includes('exam_year')) a.remove();
        });

        return clone.innerText.trim().replace(/\s+/g, ' ').trim();
      }

      const questionDesc = document.querySelector('.question-desc');
      const questionText = extractCleanText(questionDesc);

      const imgEl = document.querySelector('.question-desc img, .media-body img');
      const imageUrl = imgEl ? imgEl.src : null;

      const options = {};
      document.querySelectorAll('ul.list-unstyled li').forEach(li => {
        const keyEl = li.querySelector('strong');
        if (!keyEl) return;
        const key = keyEl.innerText.trim().replace('.', '').trim();
        if (!['A', 'B', 'C', 'D', 'E'].includes(key)) return;

        const liClone = li.cloneNode(true);
        liClone.querySelectorAll('strong').forEach(s => s.remove());

        liClone.querySelectorAll('.MathJax_Preview').forEach(preview => {
          const parent = preview.parentNode;
          const siblings = [...parent.childNodes];
          const idx = siblings.indexOf(preview);
          let latexScript = null;
          for (let i = idx; i < Math.min(idx + 5, siblings.length); i++) {
            if (siblings[i].nodeName === 'SCRIPT' && siblings[i].type?.includes('math/tex')) {
              latexScript = siblings[i];
              break;
            }
          }
          if (latexScript) {
            preview.replaceWith(document.createTextNode(latexScript.textContent.trim()));
          } else {
            preview.remove();
          }
        });
        liClone.querySelectorAll('.MathJax, script[type*="math"]').forEach(el => el.remove());

        const optionText = liClone.innerText.trim().replace(/\s+/g, ' ').trim();
        if (optionText) options[key] = optionText;
      });

      const bodyText = document.body.innerText;
      let correctAnswer = null;
      const correctMatch = bodyText.match(/Correct Answer:\s*Option\s+([A-E])/i);
      if (correctMatch) correctAnswer = correctMatch[1].toUpperCase();

      let explanation = null;
      const explMatch = bodyText.match(/Explanation\s*\n+([\s\S]{10,600}?)(?=\nNext\b|\nPrevious\b|\nGo back|\nReport|\nAsk A|\nDownload|Contributions|$)/i);
      if (explMatch) {
        explanation = explMatch[1]
          .replace(/\s*(Previous|Next|Go back.*|Report an Error.*|Ask A Question.*|Download App.*|Best Contributions.*)[\s\S]*$/i, '')
          .trim();
        if (explanation.length < 10 || explanation.includes('Go back') || explanation.includes('Download App')) {
          explanation = null;
        }
      }

      return { options, correctAnswer, explanation, questionText, imageUrl, year: null };
    });
  } catch (err) {
    console.error(`    Detail page error:`, err.message);
    return null;
  }
}

// ── Main ──────────────────────────────────────────────────────
async function main() {
  ensureOutputDir();

  console.log('\nPrepWise Scraper v2 — myschool.ng');
  console.log('===================================');
  console.log('Phase 1: Collect question URLs from listing pages');
  console.log('Phase 2: Visit each detail page for correct answers\n');

  const allQuestions = loadJSON('all_questions.json', []);
  const visitedUrls = new Set(loadJSON('visited_urls.json', []));

  console.log(`Resuming: ${allQuestions.length} questions, ${visitedUrls.size} URLs visited\n`);

  const browser = await chromium.launch({ headless: CONFIG.headless });
  let totalNew = 0;

  for (const subject of SUBJECTS) {
    console.log(`\nSubject: ${subject.name}`);
    console.log('─'.repeat(40));

    const page = await browser.newPage();
    await blockUnneeded(page);

    for (const examType of EXAM_TYPES) {
      for (const year of YEARS) {
        console.log(`\n  ${examType.name} ${year}`);

        let currentPage = 1;
        let totalPages = 1;
        const questionUrls = [];

        while (currentPage <= totalPages) {
          const listingUrl = `${CONFIG.baseUrl}/${subject.slug}?exam_type=${examType.param}&year=${year}&question_type=objective&page=${currentPage}`;
          process.stdout.write(`    Page ${currentPage}/${totalPages}... `);

          const { links, totalPages: tp } = await scrapeListingPage(page, listingUrl);
          if (currentPage === 1) totalPages = Math.min(tp, 10);

          const newLinks = links.filter(l => !visitedUrls.has(l.href));
          questionUrls.push(...newLinks);
          console.log(`${links.length} questions (${newLinks.length} new)`);

          if (links.length === 0) break;
          currentPage++;
          if (currentPage <= totalPages) await sleep(CONFIG.delayBetweenPages);
        }

        if (questionUrls.length === 0) {
          console.log(`    No new questions`);
          continue;
        }

        console.log(`\n    Getting answers for ${questionUrls.length} questions...`);

        for (let i = 0; i < questionUrls.length; i++) {
          const { href, questionText: listingText } = questionUrls[i];
          if (visitedUrls.has(href)) continue;

          process.stdout.write(`    [${i + 1}/${questionUrls.length}] `);

          const detail = await scrapeDetailPage(page, href);

          if (!detail) {
            console.log('FAILED — skipping');
            visitedUrls.add(href);
            continue;
          }

          const { options, correctAnswer, explanation, questionText: detailText } = detail;

          // ← Strip subject prefix from question text
          const rawText = sanitize(detailText || listingText);
          const finalText = stripSubjectPrefix(rawText);

          const finalYear = year;

          if (!finalText || finalText.length < 10) { console.log('SKIP — no text'); visitedUrls.add(href); continue; }
          if (!options.A || !options.B || !options.C || !options.D) { console.log('SKIP — missing options'); visitedUrls.add(href); continue; }
          if (!correctAnswer) { console.log('SKIP — no answer found'); visitedUrls.add(href); continue; }

          const question = {
            examType: examType.name,
            examSession: examType.session,
            subject: subject.name,
            year: finalYear,
            questionText: finalText,
            questionImageUrl: detail.imageUrl || questionUrls[i].imageUrl || null,
            options: {
              A: sanitize(options.A),
              B: sanitize(options.B),
              C: sanitize(options.C),
              D: sanitize(options.D),
              ...(options.E ? { E: sanitize(options.E) } : {}),
            },
            correctAnswer,
            aiExplanation: explanation ? sanitize(explanation) : null,
            difficulty: 'MEDIUM',
            isVerified: false,
            sourceUrl: href,
          };

          allQuestions.push(question);
          visitedUrls.add(href);
          totalNew++;

          console.log(`OK — ${correctAnswer}${explanation ? ' + explanation' : ''}`);

          saveJSON(allQuestions, 'all_questions.json');
          saveJSON([...visitedUrls], 'visited_urls.json');

          await sleep(CONFIG.delayBetweenQuestions);
        }
      }
    }

    await page.close();
    console.log(`\n  Finished: ${subject.name}`);
    await sleep(CONFIG.delayBetweenSubjects);
  }

  await browser.close();

  console.log('\n===================================');
  console.log(`New this run:   ${totalNew}`);
  console.log(`Total saved:    ${allQuestions.length}`);
  console.log(`\nRun next: node import_to_supabase.js`);
}

main().catch(err => {
  console.error('\nFatal error:', err);
  process.exit(1);
});