import {describe, expect, it} from 'vitest';
import type {QuizResponse} from '@/apis';
import {
  isMissingCurrentAttempt,
  isQuizAttemptNotFound,
  isQuizAttemptNotInProgress,
  isQuizNotFound,
  isQuizWindowClosed,
  quizQuestionErrorMessage,
  quizWindowStatus,
  quizWindowStatusLabel,
  startAttemptErrorMessage,
} from './quizAvailability';

const now = Date.parse('2026-08-19T18:00:00Z');

const quiz = (overrides: Partial<QuizResponse> = {}): QuizResponse => ({
  id: 16,
  courseId: 34,
  title: 'Quiz 2',
  instructions: null,
  opensAtUtc: '2026-09-05T07:00:00Z',
  opensAtLocal: '2026-09-05T00:00:00',
  closesAtUtc: '2026-09-27T06:59:00Z',
  closesAtLocal: '2026-09-26T23:59:00',
  timezone: 'America/Los_Angeles',
  timeLimitSeconds: 1500,
  attemptsAllowed: 2,
  resultVisibility: 'AfterRelease',
  state: 'Published',
  version: 1,
  totalPoints: 20,
  questionCount: 5,
  hasAttempts: false,
  hasOpenAttempt: false,
  createdAt: '2026-08-01T00:00:00Z',
  updatedAt: '2026-08-01T00:00:00Z',
  ...overrides,
});

describe('quizWindowStatus', () => {
  it('treats unpublished quizzes as draft even inside the window', () => {
    expect(quizWindowStatus(quiz({state: 'Draft', windowOpen: true}), now)).toBe('draft');
    expect(quizWindowStatusLabel('draft')).toBe('Draft');
  });

  it('marks a published quiz as upcoming before opensAt', () => {
    expect(quizWindowStatus(quiz({windowOpen: false}), now)).toBe('upcoming');
    expect(quizWindowStatusLabel('upcoming')).toBe('Upcoming');
  });

  it('marks a published quiz as open when the server says the window is open', () => {
    expect(quizWindowStatus(quiz({windowOpen: true}), now)).toBe('open');
    expect(quizWindowStatusLabel('open')).toBe('Open');
  });

  it('marks a published quiz as closed after closesAt', () => {
    expect(quizWindowStatus(quiz({
      windowOpen: false,
      opensAtUtc: '2026-07-01T00:00:00Z',
      closesAtUtc: '2026-08-01T06:59:00Z',
    }), now)).toBe('closed');
    expect(quizWindowStatusLabel('closed')).toBe('Closed');
  });
});

describe('isMissingCurrentAttempt', () => {
  it('treats QUIZ_ATTEMPT_NOT_FOUND as an empty current attempt', () => {
    expect(isMissingCurrentAttempt({
      code: 404,
      message: 'Not Found',
      details: {code: 'QUIZ_ATTEMPT_NOT_FOUND'},
    })).toBe(true);
  });

  it('treats a bare 404 as an empty current attempt', () => {
    expect(isMissingCurrentAttempt({code: 404, message: 'Not Found'})).toBe(true);
  });

  it('does not swallow other 404s', () => {
    expect(isMissingCurrentAttempt({
      code: 404,
      message: 'Not Found',
      details: {code: 'QUIZ_NOT_FOUND'},
    })).toBe(false);
  });
});

describe('startAttemptErrorMessage', () => {
  it('explains that an upcoming quiz has not opened yet', () => {
    expect(startAttemptErrorMessage(
      {code: 409, message: 'Conflict', details: {code: 'QUIZ_WINDOW_CLOSED'}},
      quiz({
        windowOpen: false,
        opensAtUtc: '2099-09-05T07:00:00Z',
        opensAtLocal: '2099-09-05T00:00:00',
      }),
    )).toMatch(/not open yet/i);
  });
});

describe('Quiz Question Attempt Gate error helpers', () => {
  it('detects QUIZ_ATTEMPT_NOT_FOUND', () => {
    expect(isQuizAttemptNotFound({
      code: 404,
      message: 'Not Found',
      details: {code: 'QUIZ_ATTEMPT_NOT_FOUND'},
    })).toBe(true);
    expect(quizQuestionErrorMessage({
      code: 404,
      message: 'Not Found',
      details: {code: 'QUIZ_ATTEMPT_NOT_FOUND'},
    })).toMatch(/exam has not been started/i);
  });

  it('detects QUIZ_ATTEMPT_NOT_IN_PROGRESS', () => {
    expect(isQuizAttemptNotInProgress({
      code: 409,
      message: 'Conflict',
      details: {code: 'QUIZ_ATTEMPT_NOT_IN_PROGRESS'},
    })).toBe(true);
    expect(quizQuestionErrorMessage({
      code: 409,
      message: 'Conflict',
      details: {code: 'QUIZ_ATTEMPT_NOT_IN_PROGRESS'},
    })).toMatch(/no longer in progress/i);
  });

  it('detects QUIZ_WINDOW_CLOSED', () => {
    expect(isQuizWindowClosed({
      code: 409,
      message: 'Conflict',
      details: {code: 'QUIZ_WINDOW_CLOSED'},
    })).toBe(true);
    expect(quizQuestionErrorMessage({
      code: 409,
      message: 'Conflict',
      details: {code: 'QUIZ_WINDOW_CLOSED'},
    })).toMatch(/not opened or has already closed/i);
  });

  it('detects QUIZ_NOT_FOUND', () => {
    expect(isQuizNotFound({
      code: 404,
      message: 'Not Found',
      details: {code: 'QUIZ_NOT_FOUND'},
    })).toBe(true);
    expect(quizQuestionErrorMessage({
      code: 404,
      message: 'Not Found',
      details: {code: 'QUIZ_NOT_FOUND'},
    })).toMatch(/not available or not visible/i);
  });
});
