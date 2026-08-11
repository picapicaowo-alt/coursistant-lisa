import {useParams} from 'react-router-dom';
import {useQueries} from '@tanstack/react-query';
import {AssignmentSummary, CourseResponse, CourseSession, CourseWeek, unwrapData} from '@/apis';
import {courseApiService} from '@/apis/services/course-api';
import {assignmentApiService} from '@/apis/services/assignment-api';

/**
 * Everything the course workspace renders.
 *
 * Four independent requests, because that is how the API is shaped — there is
 * no endpoint that returns a course with its contents. They run in parallel
 * and are cached separately, so the schedule and the assignment list do not
 * hold up the outline.
 *
 * Course and weeks are required to render anything and are reported as one
 * loading/error pair. Sessions and assignments each fill a single card, so a
 * failure there is left to that card rather than failing the page.
 */
export interface CourseWorkspaceData {
  /** Null on routes with no course in the path, such as course creation. */
  courseId: number | null;
  course?: CourseResponse;
  weeks: CourseWeek[];
  sessions: CourseSession[];
  assignments: AssignmentSummary[];
  isLoading: boolean;
  isError: boolean;
  sessionsFailed: boolean;
  assignmentsFailed: boolean;
  refetch: () => void;
}

const FIVE_MINUTES = 5 * 60 * 1000;

const shared = {
  staleTime: FIVE_MINUTES,
  gcTime: FIVE_MINUTES,
  retry: 1,
} as const;

export const useCourseWorkspaceData = (): CourseWorkspaceData => {
  const {courseId} = useParams();

  // No id means this is not a course route — the create screen shares these
  // components and has nothing to load yet. Reporting it as an error state
  // rather than throwing matters: a throw during render unmounts the tree
  // through the error boundary, which is what made the page appear and then
  // vanish.
  const parsed = courseId ? parseInt(courseId, 10) : NaN;
  const id = Number.isNaN(parsed) ? null : parsed;
  const enabled = id !== null;

  const [course, weeks, sessions, assignments] = useQueries({
    queries: [
      {
        queryKey: ['course', id],
        queryFn: async () => unwrapData(await courseApiService.getCourse(id!), 'getCourse'),
        enabled,
        ...shared,
      },
      {
        queryKey: ['course-weeks', id],
        queryFn: async () => unwrapData(await courseApiService.getCourseWeeks(id!), 'getCourseWeeks'),
        enabled,
        ...shared,
      },
      {
        queryKey: ['course-sessions', id],
        queryFn: async () => (await courseApiService.getCourseSessions(id!)).data ?? [],
        enabled,
        ...shared,
      },
      {
        queryKey: ['course-assignments', id],
        queryFn: async () =>
          (await assignmentApiService.getCourseAssignmentSummaries(id!)).data ?? [],
        enabled,
        ...shared,
      },
    ],
  });

  return {
    courseId: id,
    course: course.data,
    weeks: weeks.data ?? [],
    sessions: sessions.data ?? [],
    assignments: assignments.data ?? [],
    // A disabled query stays pending forever, so without an id this would
    // otherwise report a load that never finishes.
    isLoading: enabled && (course.isPending || weeks.isPending),
    isError: !enabled || course.isError || weeks.isError,
    sessionsFailed: sessions.isError,
    assignmentsFailed: assignments.isError,
    refetch: () => {
      void course.refetch();
      void weeks.refetch();
      void sessions.refetch();
      void assignments.refetch();
    },
  };
};
