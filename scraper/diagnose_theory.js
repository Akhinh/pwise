// ============================================================
// PrepWise — Selector Diagnostic
// Run this FIRST to find the correct CSS selectors on theory pages
//
// Usage: node diagnose_theory.js
// Output: ./output/diagnosis.json + ./output/page_dump.html
// ============================================================

const { chromium } = require('playwright');
const fs = require('fs');

const TEST_URL = 'https://myschool.ng/classroom/mathematics?exam_type=waec&exam_year=2000&type=theory&topic=';

async function diagnose() {
  console.log('Opening:', TEST_URL);
  const browser = await chromium.launch({ headless: false }); // visible so you can watch
  const page    = await browser.newPage();

  // Block ads but allow everything else
  await page.route('**/*', (route) => {
    const url  = route.request().url();
    const type = route.request().resourceType();
    if (['font', 'media'].includes(type)) return route.abort();
    if (url.includes('googlesyndication') || url.includes('doubleclick')) return route.abort();
    return route.continue();
  });

  await page.goto(TEST_URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(4000);

  console.log('Page loaded. Scanning selectors...');

  const diagnosis = await page.evaluate(() => {
    // Try every plausible selector
    const candidates = [
      '.question-item',
      '.theory-question',
      '.question-wrap',
      '.question-container',
      '.question-block',
      '.question-card',
      '.question-box',
      '.question-content',
      '.q-item',
      '.q-block',
      '[class*="question"]',
      '[class*="theory"]',
      '[class*="exam-question"]',
      'article',
      '.card',
      '.panel',
      '.panel-body',
      '.media',
      '.media-body',
      'li.list-group-item',
      '.row .col',
      '.col-md-12',
    ];

    const results = {};
    for (const sel of candidates) {
      try {
        const els = document.querySelectorAll(sel);
        if (els.length > 0) {
          results[sel] = {
            count: els.length,
            firstText: els[0].innerText.slice(0, 120).trim(),
            firstClass: els[0].className,
          };
        }
      } catch { /* skip */ }
    }

    // Also dump ALL class names on the page (helps find the right one)
    const allClasses = new Set();
    document.querySelectorAll('*').forEach(el => {
      el.classList.forEach(c => allClasses.add(c));
    });

    // Find elements that contain "(a)" or "(b)" — likely question elements
    const likelyQuestions = [];
    document.querySelectorAll('*').forEach(el => {
      const text = el.innerText || '';
      if (
        (text.includes('(a)') || text.includes('(b)')) &&
        text.length > 50 &&
        text.length < 3000 &&
        el.children.length < 20
      ) {
        likelyQuestions.push({
          tag:       el.tagName,
          className: el.className,
          id:        el.id,
          textSnip:  text.slice(0, 150).trim(),
        });
      }
    });

    // Find "View Answer" button to understand surrounding structure
    const answerBtns = [...document.querySelectorAll('a, button')]
      .filter(el => el.innerText.toLowerCase().includes('view answer'))
      .map(el => ({
        tag:            el.tagName,
        text:           el.innerText.trim(),
        parentClass:    el.parentElement?.className,
        grandpaClass:   el.parentElement?.parentElement?.className,
        greatgrandClass:el.parentElement?.parentElement?.parentElement?.className,
      }));

    return {
      matchingSelectors: results,
      allClassNames:     [...allClasses].sort(),
      likelyQuestions:   likelyQuestions.slice(0, 10),
      answerButtons:     answerBtns.slice(0, 5),
      totalElements:     document.querySelectorAll('*').length,
    };
  });

  // Save full HTML dump
  const html = await page.content();
  if (!fs.existsSync('./output')) fs.mkdirSync('./output');
  fs.writeFileSync('./output/page_dump.html', html);
  fs.writeFileSync('./output/diagnosis.json', JSON.stringify(diagnosis, null, 2));

  console.log('\n── Matching Selectors ──────────────────');
  for (const [sel, info] of Object.entries(diagnosis.matchingSelectors)) {
    console.log(`  ${sel}: ${info.count} elements`);
    console.log(`    Class: "${info.firstClass}"`);
    console.log(`    Text:  "${info.firstText}"\n`);
  }

  console.log('\n── Likely Question Elements ────────────');
  diagnosis.likelyQuestions.forEach((q, i) => {
    console.log(`  [${i}] <${q.tag}> class="${q.className}"`);
    console.log(`       "${q.textSnip}"\n`);
  });

  console.log('\n── Answer Button Parents ───────────────');
  diagnosis.answerButtons.forEach((b, i) => {
    console.log(`  [${i}] parent="${b.parentClass}" grandparent="${b.grandpaClass}" great="${b.greatgrandClass}"`);
  });

  console.log('\nFull results saved to:');
  console.log('  ./output/diagnosis.json');
  console.log('  ./output/page_dump.html');
  console.log('\nShare the diagnosis.json output here so I can fix the scraper selectors.');

  await browser.close();
}

diagnose().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});