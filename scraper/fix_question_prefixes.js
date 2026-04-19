const fs = require('fs');
const path = require('path');

const ALL_SUBJECT_NAMES = [
  'Mathematics', 'English Language', 'Biology', 'Chemistry', 'Physics',
  'Economics', 'Government', 'Literature in English', 'Geography',
  'Agricultural Science', 'Commerce', 'Christian Religious Studies',
  'Islamic Religious Studies', 'History', 'Fine Arts', 'Music', 'French',
  'Animal Husbandry', 'Insurance', 'Civic Education', 'Yoruba', 'Igbo',
  'Arabic JAMB 2025', 'Home Economics', 'Hausa', 'Book Keeping', 'Data Processing',
  'Catering Craft Practice', 'Computer Studies', 'Marketing',
  'Physical Education', 'Financial Accounting', 'Further Mathematics',
  'Christian Religious Knowledge (CRK)', 'Islamic Religious Knowledge (IRK)',
];

const subjectPattern = ALL_SUBJECT_NAMES
  .sort((a, b) => b.length - a.length)
  .map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  .join('|');

const SUBJECT_PREFIX_REGEX = new RegExp(`^(${subjectPattern})\\s+`, 'i');

const inputFile  = path.join(__dirname, 'output', 'all_questions.json');
const outputFile = path.join(__dirname, 'output', 'all_questions_fixed.json');

const questions = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));

let fixedCount = 0;

const fixed = questions.map(q => {
  const original = q.questionText;
  const cleaned  = original.replace(SUBJECT_PREFIX_REGEX, '').trim();

  if (cleaned !== original) {
    fixedCount++;
    return { ...q, questionText: cleaned };
  }
  return q;
});

fs.writeFileSync(outputFile, JSON.stringify(fixed, null, 2));

console.log(`Total questions: ${questions.length}`);
console.log(`Fixed:           ${fixedCount}`);
console.log(`Output:          ${outputFile}`);