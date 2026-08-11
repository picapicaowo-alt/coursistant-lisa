import {useParams} from 'react-router-dom';
import {useQueryClient, useSuspenseQuery} from "@tanstack/react-query";
import {useCourseWorkspaceStore} from "../stores/useCourseWorkspaceStore";
import React from "react";
import {CourseDetailDTO, CourseResponse, CourseWeek, unwrapData} from "@/apis";
import {courseApiService} from "@/apis/services/course-api";
import {useRequiredAuth} from "@/contexts/RequiredAuthContext";

/**
 * Assembles the workspace view of a course.
 *
 * There is no aggregate endpoint — the previous code called
 * `/v2/courses/{id}/detail`, which does not exist and answers 500 — so the
 * course and its weeks are fetched separately and combined here.
 *
 * Assignments are not loaded. In this API they belong to the course and are
 * ordered by due date; they carry no week reference at all, while this page
 * models them as children of a week. That relationship has no backing and
 * inventing one would misfile every assignment, so the per-week assignment
 * list stays empty until the workspace structure is settled
 * (open-decisions.md S-7).
 */
const toCourseDetail = (course: CourseResponse, weeks: CourseWeek[]): CourseDetailDTO => ({
  courseInfo: {
    id: course.id ?? course.courseId,
    courseCode: course.courseCode,
    name: course.title ?? course.name,
    description: course.description ?? "",
    termStartDate: course.termStartDate,
    termEndDate: course.termEndDate,
    location: course.location,
    teacherName: course.primaryInstructor?.name,
    teacherEmail: course.primaryInstructor?.email,
    createdAt: new Date(course.createdAt),
    updatedAt: new Date(course.updatedAt),
  },
  // Weeks are this product's course units. `orderPosition` is zero-based and
  // ascending, which is exactly what sortOrder means here.
  courseUnits: weeks.map((week) => ({
    id: week.id,
    title: week.title,
    sortOrder: week.orderPosition,
    // Weeks have no description field; they hold materials instead.
    description: "",
    createdAt: new Date(week.createdAt),
    updatedAt: new Date(week.updatedAt),
  })),
  assignments: [],
});

export const useCourseEdit = () => {
  const {user} = useRequiredAuth();
  const {courseId} = useParams();
  if (!courseId) throw new Error("Course id is required");

  const {loadCourseInfo} = useCourseWorkspaceStore();
  const numericCourseId = parseInt(courseId);

  const queryClient = useQueryClient();
  const {data} = useSuspenseQuery<CourseDetailDTO>({
    queryKey: ['course-workspace', courseId, user.id],
    queryFn: async () => {
      const [course, weeks] = await Promise.all([
        courseApiService.getCourse(numericCourseId),
        courseApiService.getCourseWeeks(numericCourseId),
      ]);

      return toCourseDetail(
        unwrapData(course, 'getCourse'),
        unwrapData(weeks, 'getCourseWeeks')
      );
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  }, queryClient);

  React.useEffect(() => {
    if (data) {
      loadCourseInfo(data);
    }
  }, [data]);
};
