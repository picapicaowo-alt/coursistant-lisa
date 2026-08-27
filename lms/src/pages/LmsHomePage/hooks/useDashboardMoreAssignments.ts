import {useQuery} from '@tanstack/react-query';
import {assignmentApiService} from '@/apis/services/assignment-api';
import {useRequiredAuth} from '@/contexts/RequiredAuthContext';
import {useMyCourses} from '@/hooks/useCourseAccess';
import {AssignmentRow, useDashboardAssignments} from './useDashboardAssignments';

const FIVE_MINUTES = 5 * 60 * 1000;

/**
 * All future assignments across the user's active courses.
 *
 * This intentionally uses course assignment summaries instead of the
 * dashboard deadline endpoint: that endpoint is capped at 30 days and cannot
 * represent the unbounded "More assignments" region. The separate 14-day
 * query remains the source of truth for Due Next.
 */
export const useDashboardMoreAssignments = () => {
  const {user} = useRequiredAuth();
  const isInstructor = user.level === 'INSTRUCTOR';
  const coursesQuery = useMyCourses();
  const dueNextQuery = useDashboardAssignments();
  const activeCourses = (coursesQuery.data ?? []).filter(
    course => (course.state ?? course.status) === 'Active'
  );
  const courseScope = activeCourses.map(course => course.id ?? course.courseId).sort((a, b) => a - b);

  const assignmentsQuery = useQuery({
    queryKey: ['dashboard', 'more-assignments', user.id, courseScope],
    enabled: coursesQuery.isSuccess,
    queryFn: async (): Promise<AssignmentRow[]> => {
      const now = Date.now();
      const courseRows = await Promise.all(activeCourses.map(async course => {
        const courseId = course.id ?? course.courseId;
        const response = await assignmentApiService.getCourseAssignmentSummaries(courseId);
        if (!response.data) {
          throw new Error(`Malformed response from /v2/courses/${courseId}/assignments/summaries`);
        }

        return response.data
          .filter(assignment => new Date(assignment.dueAtUtc).getTime() >= now)
          .map(assignment => ({
            dueAtUtc: assignment.dueAtUtc,
            row: {
              key: `assignment-${courseId}-${assignment.id}`,
              courseId,
              courseCode: course.courseCode,
              title: assignment.title,
              atLocal: assignment.dueAtLocal,
              timezone: assignment.timezone,
              submissionStatus: assignment.submissionStatus,
              assignmentId: assignment.id,
              destination: `/course/${courseId}/assignments/${assignment.id}`,
            } satisfies AssignmentRow,
          }));
      }));

      return courseRows
        .flat()
        .sort((a, b) => a.dueAtUtc.localeCompare(b.dueAtUtc))
        .map(item => item.row);
    },
    staleTime: FIVE_MINUTES,
    gcTime: FIVE_MINUTES,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const dueNext = dueNextQuery.rows[0];
  const rows = (assignmentsQuery.data ?? []).filter(row => (
    !dueNext
    || row.courseId !== dueNext.courseId
    || row.assignmentId !== dueNext.assignmentId
  ));

  return {
    rows,
    hasDueNext: Boolean(dueNext),
    isInstructor,
    isLoading: coursesQuery.isPending
      || (coursesQuery.isSuccess && assignmentsQuery.isPending)
      || dueNextQuery.isLoading,
    isError: coursesQuery.isError || assignmentsQuery.isError,
    refetch: () => {
      void Promise.all([
        coursesQuery.refetch(),
        assignmentsQuery.refetch(),
        dueNextQuery.refetch(),
      ]);
    },
  };
};
