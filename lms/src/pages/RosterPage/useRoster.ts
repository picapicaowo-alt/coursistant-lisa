import {useState} from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {useParams} from 'react-router-dom';
import {CourseMember, CourseRole, CourseMemberPage, TaPermissions, unwrapData} from '@/apis';
import {courseApiService} from '@/apis/services/course-api';

export const ROSTER_PAGE_SIZE = 20;
export type RoleFilter = CourseRole | 'All';

export interface RosterFilters {
  q: string;
  role: RoleFilter;
  includeWithdrawn: boolean;
}

/**
 * Owns the server-paged roster and every membership mutation for the page.
 * Filters are part of the Query key; successful writes invalidate every page
 * for this course so counts and role groupings cannot drift apart.
 */
export const useRoster = () => {
  const {courseId} = useParams();
  const queryClient = useQueryClient();
  const parsedCourseId = Number(courseId);
  const id = Number.isInteger(parsedCourseId) && parsedCourseId > 0 ? parsedCourseId : null;
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<RosterFilters>({q: '', role: 'All', includeWithdrawn: false});

  const query = useQuery({
    queryKey: ['course-members', id, page, filters],
    queryFn: async (): Promise<CourseMemberPage> => unwrapData(
      await courseApiService.listCourseMembers(id!, {
        page,
        size: ROSTER_PAGE_SIZE,
        q: filters.q.trim() || undefined,
        courseRole: filters.role === 'All' ? undefined : filters.role,
        active: filters.includeWithdrawn ? undefined : true,
      }),
      'listCourseMembers',
    ),
    enabled: id !== null,
    staleTime: 30_000,
    retry: (failureCount, error) => (
      // A permission denial is stable for the current session and retrying it
      // only delays the page's explicit forbidden state.
      (error as {code?: number})?.code === 403 ? false : failureCount < 1
    ),
  });

  const refresh = () => queryClient.invalidateQueries({queryKey: ['course-members', id]});
  const mutationOptions = <T,>(mutationFn: (value: T) => Promise<unknown>) => ({
    mutationFn,
    onSuccess: () => void refresh(),
  });

  const withdraw = useMutation(mutationOptions<CourseMember>(member => (
    courseApiService.withdrawStudent(id!, member.userId)
  )));
  const promote = useMutation(mutationOptions<CourseMember>(member => (
    courseApiService.promoteToTa(id!, member.userId)
  )));
  const demote = useMutation(mutationOptions<CourseMember>(member => (
    courseApiService.demoteTa(id!, member.userId)
  )));
  const updatePermissions = useMutation(mutationOptions<{member: CourseMember; permissions: TaPermissions}>(
    ({member, permissions}) => courseApiService.updateTaPermissions(id!, member.userId, permissions),
  ));
  const enrol = useMutation({
    mutationFn: (emails: string[]) => courseApiService.enrolStudents(id!, {emails}),
    onSuccess: () => void refresh(),
  });
  const total = query.data?.total ?? 0;
  // The API sorts the full filtered result by role, last name, first name and
  // userId before it paginates. Re-sorting this one page would break that
  // global ordering at page boundaries.
  const members = query.data?.items ?? [];

  return {
    courseId: id,
    members,
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / ROSTER_PAGE_SIZE)),
    setPage,
    filters,
    setFilters: (next: RosterFilters) => {
      setFilters(next);
      setPage(0);
    },
    isLoading: id !== null && query.isPending,
    isError: query.isError,
    isForbidden: (query.error as {code?: number} | null)?.code === 403,
    refetch: () => void query.refetch(),
    withdraw,
    promote,
    demote,
    updatePermissions,
    enrol,
  };
};
