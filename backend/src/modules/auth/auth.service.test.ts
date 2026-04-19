// ============================================================
// PrepWise — Auth Service: Unit Tests
// ============================================================

import { calculateScore, getScoreGrade, formatDuration, shuffleArray, canAccessFeature } from '@prepwise/utils';

describe('calculateScore', () => {
  it('returns 0 when total is 0', () => {
    expect(calculateScore(0, 0)).toBe(0);
  });

  it('returns 100 for a perfect score', () => {
    expect(calculateScore(20, 20)).toBe(100);
  });

  it('rounds to nearest integer', () => {
    expect(calculateScore(7, 20)).toBe(35);
    expect(calculateScore(13, 20)).toBe(65);
  });
});

describe('getScoreGrade', () => {
  it('returns A for 80+', () => {
    expect(getScoreGrade(80).grade).toBe('A');
    expect(getScoreGrade(100).grade).toBe('A');
  });

  it('returns F for below 50', () => {
    expect(getScoreGrade(49).grade).toBe('F');
    expect(getScoreGrade(0).grade).toBe('F');
  });

  it('returns B for 70–79', () => {
    expect(getScoreGrade(70).grade).toBe('B');
    expect(getScoreGrade(79).grade).toBe('B');
  });
});

describe('formatDuration', () => {
  it('formats seconds only', () => {
    expect(formatDuration(45)).toBe('45s');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(90)).toBe('1m 30s');
  });

  it('formats hours, minutes, seconds', () => {
    expect(formatDuration(3661)).toBe('1h 1m 1s');
  });
});

describe('shuffleArray', () => {
  it('returns same length', () => {
    const arr = [1, 2, 3, 4, 5];
    expect(shuffleArray(arr)).toHaveLength(5);
  });

  it('does not mutate original', () => {
    const arr = [1, 2, 3];
    const original = [...arr];
    shuffleArray(arr);
    expect(arr).toEqual(original);
  });

  it('contains all original elements', () => {
    const arr = ['a', 'b', 'c', 'd'];
    const shuffled = shuffleArray(arr);
    expect(shuffled.sort()).toEqual(arr.sort());
  });
});

describe('canAccessFeature', () => {
  it('free users cannot access mock exams', () => {
    expect(canAccessFeature('FREE', 'mock_exam')).toBe(false);
  });

  it('premium users can access mock exams', () => {
    expect(canAccessFeature('PREMIUM', 'mock_exam')).toBe(true);
  });

  it('student users can access offline mode', () => {
    expect(canAccessFeature('STUDENT', 'offline')).toBe(true);
  });

  it('free users cannot access offline mode', () => {
    expect(canAccessFeature('FREE', 'offline')).toBe(false);
  });

  it('school users can access all features', () => {
    expect(canAccessFeature('SCHOOL', 'ai_chat')).toBe(true);
    expect(canAccessFeature('SCHOOL', 'mock_exam')).toBe(true);
    expect(canAccessFeature('SCHOOL', 'offline')).toBe(true);
  });
});
