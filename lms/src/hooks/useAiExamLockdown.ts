import {useQueries} from '@tanstack/react-query';
import {unwrapData} from '@/apis';
import {quizApiService} from '@/apis/services/quiz-api';

export type AiExamLockdownStatus = 'checking' | 'locked' | 'unlocked' | 'error';

interface AiExamLockdownResult {
  status: AiExamLockdownStatus;
  lockedCourseIds: number[];
}

export const useAiExamLockdown = (
  courseIds: number[],
  viewerId: number | null,
  enabled: boolean,
): AiExamLockdownResult => {
  const uniqueCourseIds = [...new Set(courseIds.filter(courseId => Number.isInteger(courseId) && courseId > 0))];
  const canCheck = enabled && viewerId !== null;
  const results = useQueries({
    queries: uniqueCourseIds.map(courseId => ({
      // Attempt state is viewer-specific. Keeping the viewer in the key avoids
      // briefly reusing another account's cached student state after relogin.
      queryKey: ['ai-exam-lockdown', courseId, viewerId],
      queryFn: async () => unwrapData(
        await quizApiService.listQuizzes(courseId),
        `listQuizzes for AI exam lockdown (${courseId})`,
      ),
      enabled: canCheck,
      staleTime: 0,
      refetchOnMount: 'always' as const,
      retry: 1,
    })),
  });

  if (!canCheck) return {status: 'checking', lockedCourseIds: []};
  // Treat both the initial check and explicit invalidation/refetch after quiz
  // start/submit as locked-down time; stale "unlocked" data must not win.
  if (results.some(result => result.isFetching)) return {status: 'checking', lockedCourseIds: []};

  const lockedCourseIds = uniqueCourseIds.filter((_, index) =>
    results[index]?.data?.some(quiz => quiz.hasOpenAttempt === true),
  );

  if (lockedCourseIds.length > 0) return {status: 'locked', lockedCourseIds};
  if (results.some(result => result.isError)) return {status: 'error', lockedCourseIds: []};
  return {status: 'unlocked', lockedCourseIds: []};
};
