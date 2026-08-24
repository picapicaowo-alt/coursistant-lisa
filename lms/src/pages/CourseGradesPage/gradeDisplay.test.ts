import {describe, expect, it} from 'vitest';
import type {QuizResponse, QuizResult} from '@/apis';
import {quizGradeDisplay} from './gradeDisplay';

const quiz = (visibility: QuizResponse['resultVisibility']): QuizResponse => ({
  id: 21,
  courseId: 37,
  title: 'Quiz',
  instructions: null,
  opensAtUtc: '2026-08-24T00:00:00Z',
  opensAtLocal: '2026-08-23T20:00:00',
  closesAtUtc: '2026-08-31T00:00:00Z',
  closesAtLocal: '2026-08-30T20:00:00',
  timezone: 'America/New_York',
  timeLimitSeconds: 900,
  attemptsAllowed: 1,
  resultVisibility: visibility,
  state: 'Published',
  version: 1,
  totalPoints: 10,
  questionCount: 1,
  hasAttempts: true,
  hasOpenAttempt: false,
  createdAt: '2026-08-24T00:00:00Z',
  updatedAt: '2026-08-24T00:00:00Z',
});

const result = (manualGradingPending = false): QuizResult => ({
  quizId: 21,
  countedAttemptId: 1,
  gradeStatus: 'Entered',
  closeReason: null,
  receiptId: 'receipt',
  autoScore: 6,
  manualScore: null,
  totalScore: null,
  manualGradingPending,
  showCorrectAnswers: false,
  releasedAt: null,
  questions: [],
});

describe('quizGradeDisplay', () => {
  it('hides an unreleased auto-score when visibility is AfterRelease', () => {
    expect(quizGradeDisplay(quiz('AfterRelease'), result())).toBe('Not graded yet');
  });

  it('shows an objective-only instant auto-score', () => {
    expect(quizGradeDisplay(quiz('InstantAutoScore'), result())).toBe('Auto-score: 6 / 10');
  });

  it('labels mixed-question partial scoring clearly', () => {
    expect(quizGradeDisplay(quiz('InstantAutoScore'), result(true))).toBe('Auto-score so far: 6 / 10');
  });
});
