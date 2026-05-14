// Test the real answer detail page
const { chromium: stealthChromium } = require('playwright-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
stealthChromium.use(StealthPlugin());
const fs = require('fs');

// Real answer URL from diagnosis
const ANSWER_URL = 'https://myschool.ng/classroom/mathematics/53460?exam_type=waec&exam_year=2000&type=theory&page=1';

async function test() {
  console.log('Testing answer page:', ANSWER_URL);
  const browser = await stealthChromium.launch({ headless: true });
  const page    = await browser.newPage();

  await page.goto(ANSWER_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3500);

  const result = await page.evaluate(() => {
    // Dump all class names
    const classes = new Set();
    document.querySelectorAll('*').forEach(el => el.classList.forEach(c => classes.add(c)));

    // Try every possible selector
    const selectors = [
      '.answer-section', '.solution', '.best-answer', '.answer',
      '.answer-body', '.solution-body', '.contribution',
      '.contribution-body', '.answer-content', '.panel-body',
      '.card-body', '.question-answer', '.q-answer',
      '[class*="answer"]', '[class*="solution"]', '[class*="contribution"]',
      'blockquote', '.well', '.alert',
    ];

    const found = {};
    for (const sel of selectors) {
      const els = document.querySelectorAll(sel);
      if (els.length > 0) {
        found[sel] = {
          count: els.length,
          firstClass: els[0].className,
          text: els[0].innerText.trim().slice(0, 300),
        };
      }
    }

    return {
      url: window.location.href,
      title: document.title,
      found,
      allClasses: [...classes].sort(),
      bodyText: document.body.innerText.slice(0, 1500),
    };
  });

  console.log('\nFinal URL:', result.url);
  console.log('Title:', result.title);

  console.log('\n── Matching selectors ──────────────────────────');
  if (Object.keys(result.found).length === 0) {
    console.log('  NONE');
  } else {
    for (const [sel, info] of Object.entries(result.found)) {
      console.log(`\n  ${sel} (${info.count} elements, class="${info.firstClass}"):`);
      console.log(`    "${info.text}"`);
    }
  }

  console.log('\n── Body text (first 1500 chars) ─────────────────');
  console.log(result.bodyText);

  console.log('\n── All CSS classes ──────────────────────────────');
  console.log(result.allClasses.join(', '));

  const html = await page.content();
  if (!fs.existsSync('./output')) fs.mkdirSync('./output');
  fs.writeFileSync('./output/real_answer_dump.html', html);
  console.log('\nHTML saved to ./output/real_answer_dump.html');

  await browser.close();
}

test().catch(err => { console.error('Error:', err); process.exit(1); });