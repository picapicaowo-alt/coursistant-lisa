import {useQuery} from '@tanstack/react-query';
import {dashboardApiService} from '@/apis/services/dashboard-api';
import {MyCourse} from '@/apis';
import {useRequiredAuth} from '@/contexts/RequiredAuthContext';
import {DashboardCourse} from '../types';

const INSTRUCTOR_AVATAR_FALLBACK = '/icons/course/instructor.png';

/**
 * The dashboard card shows the instructor, so surface the name only when the
 * payload actually carries one. `primaryInstructor` can arrive as `userId`
 * alone when the user row is missing, and inventing a name there would be a
 * false state (PRIN-03).
 */
const toDashboardCourse = (course: MyCourse): DashboardCourse => ({
  id: course.id ?? course.courseId,
  courseCode: course.courseCode,
  title: course.title ?? course.name,
  courseRole: course.courseRole ?? course.role,
  instructorName: course.primaryInstructor?.name ?? null,
  instructorAvatar: INSTRUCTOR_AVATAR_FALLBACK,
});

export interface CourseListResult {
  courses: DashboardCourse[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * My Courses region of the dashboard (`GET /v2/me/courses`).
 *
 * Deliberately not a suspense query: the API contract requires each region to
 * fail on its own with an error and a retry, and a thrown suspense error would
 * take down neighbouring widgets instead. An empty list and a failed request
 * must stay distinguishable, so failures propagate as `isError` rather than
 * collapsing into `courses: []`.
 */
export const useCourseList = (): CourseListResult => {
  const {user} = useRequiredAuth();

  const query = useQuery({
    queryKey: ['dashboard', 'my-courses', user.id],
    queryFn: async () => {
      const response = await dashboardApiService.getMyCourses({state: 'Active'});
      // A success envelope with no page object means the contract was broken.
      // Treating it as "no courses" is exactly the false-empty PRIN-03 forbids.
      if (!response.data?.items) {
        throw new Error('Malformed response from /v2/me/courses: missing items');
      }
      return response.data.items.map(toDashboardCourse);
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return {
    courses: query.data ?? [],
    isLoading: query.isPending,
    isError: query.isError,
    error: query.error,
    refetch: () => void query.refetch(),
  };
};
