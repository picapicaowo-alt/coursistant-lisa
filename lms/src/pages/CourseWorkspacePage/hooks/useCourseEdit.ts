import {useParams} from 'react-router-dom';
import {useQueryClient, useSuspenseQuery} from "@tanstack/react-query";
import {useCourseWorkspaceStore} from "../stores/useCourseWorkspaceStore";
import React from "react";
import {CourseDetailDTO, unwrapData} from "@/apis";
import {courseApiService} from "@/apis/services/course-api";
import {useRequiredAuth} from "@/contexts/RequiredAuthContext";

export const useCourseEdit = () => {
  const {user} = useRequiredAuth();
  const {courseId} = useParams();
  if (!courseId) throw new Error("Course id is required");
  
  const {loadCourseInfo} = useCourseWorkspaceStore();
  
  const queryClient = useQueryClient();
  const {data} = useSuspenseQuery<CourseDetailDTO>({
    queryKey: ['course-detail', courseId, user.id],
    queryFn: async () => unwrapData(
      await courseApiService.getCourseDetail(parseInt(courseId)),
      'getCourseDetail'
    ),
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