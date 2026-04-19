// ============================================================
// PrepWise — Scraper: myschool.ng
// Usage: ts-node src/scrapers/myschool.ts
// ============================================================

import { chromium } from 'playwright';

interface ScrapedQuestion {
  examType: 'WAEC' | 'NECO';
  subject: string;
  year: number;
  questionText: string;
  options: Record<string, string>;
  correctAnswer: string;
  sourceUrl: string;
}

const SUBJECTS = [
  { name: 'Mathematics', slug: 'mathematics' },
  { name: 'English Language', slug: 'english-language' },
  { name: 'Biology', slug: 'biology' },
  { name: 'Chemistry', slug: 'chemistry' },
  { name: 'Physics', slug: 'physics' },
  { name: 'Economics', slug: 'economics' },
  { name: 'Government', slug: 'government' },
];

const YEARS = Array.from({ length: 15 }, (_, i) => 2024 - i); // 2010–2024

async function scrapeSubjectYear(
  subject: { name: string; slug: string },
  year: number,
  examType: 'WAEC' | 'NECO',
): Promise<ScrapedQuestion[]> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const questions: ScrapedQuestion[] = [];

  try {
    const typeSlug = examType === 'WAEC' ? 'wassce' : 'neco';
    const url = `https://myschool.ng/classroom/${subject.slug}?armId=${typeSlug}&year=${year}`;

    await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });
    await page.waitForSelector('.question-container', { timeout: 10_000 }).catch(() => null);

    const items = await page.$$eval('.question-container', (els) =>
      els.map((el) => {
        const text = el.querySelector('.question-text')?.textContent?.trim() ?? '';
        const optionEls = el.querySelectorAll('.option-item');
        const options: Record<string, string> = {};
        let correctAnswer = '';

        optionEls.forEach((opt, i) => {
          const key = String.fromCharCode(65 + i); // A, B, C, D, E
          options[key] = opt.querySelector('.option-text')?.textContent?.trim() ?? '';
          if (opt.classList.contains('correct')) correctAnswer = key;
        });

        return { text, options, correctAnswer };
      }),
    );

    for (const item of items) {
      if (!item.text || Object.keys(item.options).length < 4 || !item.correctAnswer) continue;
      questions.push({
        examType,
        subject: subject.name,
        year,
        questionText: item.text,
        options: item.options,
        correctAnswer: item.correctAnswer,
        sourceUrl: url,
      });
    }

    console.log(`  ✓ ${subject.name} ${examType} ${year}: ${questions.length} questions`);
  } catch (err) {
    console.error(`  ✗ Failed ${subject.name} ${examType} ${year}:`, (err as Error).message);
  } finally {
    await browser.close();
  }

  return questions;
}

async function runScraper() {
  console.log('PrepWise Scraper — myschool.ng\n');
  const allQuestions: ScrapedQuestion[] = [];

  for (const subject of SUBJECTS) {
    for (const year of YEARS) {
      for (const examType of ['WAEC', 'NECO'] as const) {
        const qs = await scrapeSubjectYear(subject, year, examType);
        allQuestions.push(...qs);
        // Polite delay — don't hammer the server
        await new Promise((r) => setTimeout(r, 1500));
      }
    }
  }

  console.log(`\nTotal scraped: ${allQuestions.length} questions`);

  // Write to JSON for review before DB insert
  const fs = await import('fs/promises');
  await fs.writeFile(
    'output/myschool_scraped.json',
    JSON.stringify(allQuestions, null, 2),
    'utf-8',
  );
  console.log('Saved to output/myschool_scraped.json');
}

runScraper().catch(console.error);
