import {Course} from '../types';
import axios from 'axios';
import {QueryObserverResult, RefetchOptions, useSuspenseQuery} from "@tanstack/react-query";
import {useRequiredAuth} from "@/contexts/RequiredAuthContext";

const COURSE_API_DOMAIN = import.meta.env.VITE_COURSE_API_DOMAIN_NAME;

export interface CourseListResult {
  courses: Course[];
  isLoading: boolean,
  error: Error | null,
  refetch: (options?: RefetchOptions) => Promise<QueryObserverResult<Course[], Error>>,
}

export const useCourseList = (): CourseListResult => {
  const {user} = useRequiredAuth();
  
  const fetchCourses = async (): Promise<Course[]> => {
    const response = await axios.get(
      `${COURSE_API_DOMAIN}/course/selectByUserId/${user.id}`,
      {
        headers: {token: user.accessToken},
      }
    );
    
    if (!response.data.data) {
      return [];
    }
    
    return response.data.data.map((course: {
      id: string;
      instructorName: string;
      name: string;
      courseUnitCount: number;
    }) => ({
      id: course.id,
      instructor: course.instructorName,
      title: course.name,
      subtitle: `${course.courseUnitCount} ${
        course.courseUnitCount === 1 ? 'WEEK' : 'WEEKS'
      }`,
      avatar: '/icons/course/instructor.png',
    })).slice(0, 2);
  };
  
  const query = useSuspenseQuery<Course[]>({
    queryKey: ['courses', user.id],
    queryFn: fetchCourses,
    staleTime: 5 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
  
  return {
    courses: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};