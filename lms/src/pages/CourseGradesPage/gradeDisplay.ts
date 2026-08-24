import type {QuizResponse, QuizResult} from '@/apis';

export const formatGradePoints = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '—';
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
};

export const quizGradeDisplay = (quiz: QuizResponse, result: QuizResult | null): string => {
  if (!result) return 'Not submitted';
  if (result.totalScore !== null) {
    return `${formatGradePoints(result.totalScore)} / ${formatGradePoints(quiz.totalPoints)}`;
  }
  if (quiz.resultVisibility === 'InstantAutoScore' && result.autoScore !== null) {
    const prefix = result.manualGradingPending ? 'Auto-score so far' : 'Auto-score';
    return `${prefix}: ${formatGradePoints(result.autoScore)} / ${formatGradePoints(quiz.totalPoints)}`;
  }
  return 'Not graded yet';
};
