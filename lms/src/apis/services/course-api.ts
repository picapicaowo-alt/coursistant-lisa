import {
  ApiResponse,
  CourseBrowseParams,
  CoursePageResponse,
  CourseResponse,
  CourseSession,
  CourseSummary,
  CourseWeek,
  CreateAssignmentRequest,
  idempotent,
  CreateCourseRequest,
  CreateCourseUnitRequest,
  UpdateCourseRequest,
  V2ApiClient
} from '@/apis';

export class CourseApiService {
  private apiClient = V2ApiClient;
  
  constructor(apiClient?: typeof V2ApiClient) {
    if (apiClient) {
      this.apiClient = apiClient;
    }
  }
  
  /**
   * Browses courses across the tenant.
   *
   * Admin and instructor only — a plain Student or TA gets 403 ACCESS_DENIED.
   * For a user's own courses use `GET /v2/me/courses`
   * (`dashboardApiService.getMyCourses`), which every USER account can call.
   */
  async browseCourses(params?: CourseBrowseParams): Promise<ApiResponse<CoursePageResponse>> {
    try {
      return await this.apiClient.get<CoursePageResponse>("/v2/courses", {params});
    } catch (error) {
      console.error(`Failed to browse courses`, error);
      throw error;
    }
  }
  
  /** The course's recurring weekly schedule. Visible to any enrolled member. */
  async getCourseSessions(courseId: number): Promise<ApiResponse<CourseSession[]>> {
    try {
      return await this.apiClient.get<CourseSession[]>(`/v2/courses/${courseId}/sessions`);
    } catch (error) {
      console.error(`Failed to get sessions for courseId: ${courseId}`, error);
      throw error;
    }
  }

  /**
   * Archives a course. Course Manager only, and idempotent when it is already
   * archived.
   *
   * This is what retires a course — deletion is not. A course with any
   * dependency refuses to delete, and PRD INV-05 requires submissions,
   * attempts and grades to survive every V1 action, so archiving is the whole
   * lifecycle rather than a softer alternative to removal.
   */
  async archiveCourse(courseId: number): Promise<ApiResponse<CourseSummary>> {
    try {
      return await this.apiClient.post<CourseSummary>(
        `/v2/courses/${courseId}/archive`,
        undefined,
        idempotent()
      );
    } catch (error) {
      console.error(`Failed to archive course: ${courseId}`, error);
      throw error;
    }
  }

  async unarchiveCourse(courseId: number): Promise<ApiResponse<CourseSummary>> {
    try {
      return await this.apiClient.post<CourseSummary>(
        `/v2/courses/${courseId}/unarchive`,
        undefined,
        idempotent()
      );
    } catch (error) {
      console.error(`Failed to unarchive course: ${courseId}`, error);
      throw error;
    }
  }

  /**
   * A single course.
   *
   * Not `/detail`: that path does not exist and the server answers it with a
   * 500. There is no aggregate endpoint either — a course's weeks, materials,
   * assignments and members are each fetched separately.
   *
   * A course the caller cannot see returns 404 COURSE_NOT_FOUND rather than a
   * permission error, so membership cannot be probed by watching status codes.
   */
  async getCourse(courseId: number): Promise<ApiResponse<CourseResponse>> {
    try {
      return await this.apiClient.get<CourseResponse>(`/v2/courses/${courseId}`);
    } catch (error) {
      console.error(`Failed to get course: ${courseId}`, error);
      throw error;
    }
  }

  /**
   * The course outline. Materials come embedded in each week.
   * Students receive only Published weeks; staff see drafts too.
   */
  async getCourseWeeks(courseId: number): Promise<ApiResponse<CourseWeek[]>> {
    try {
      return await this.apiClient.get<CourseWeek[]>(`/v2/courses/${courseId}/weeks`);
    } catch (error) {
      console.error(`Failed to get weeks for courseId: ${courseId}`, error);
      throw error;
    }
  }
  
  async createCourse(
    request: CreateCourseRequest
  ): Promise<ApiResponse<number>> {
    try {
      return await this.apiClient.post<number>(
        '/v2/courses/new',
        request
      );
    } catch (error) {
      console.error('Failed to create course', error);
      throw error;
    }
  }
  
  async createCourseUnit(
    courseId: number,
    request: CreateCourseUnitRequest
  ): Promise<ApiResponse<number>> {
    try {
      return await this.apiClient.post<number>(
        `/v2/courses/${courseId}/units/new`,
        request
      );
    } catch (error) {
      console.error(`Failed to create course unit for courseId: ${courseId}`, error);
      throw error;
    }
  }
  
  async createAssignment(
    courseId: number,
    courseUnitId: number,
    request: CreateAssignmentRequest
  ): Promise<ApiResponse<number>> {
    try {
      return await this.apiClient.post<number>(
        `/v2/courses/${courseId}/units/${courseUnitId}/assignments/new`,
        request
      );
    } catch (error) {
      console.error(`Failed to create assignment for courseUnitId: ${courseUnitId}`, error);
      throw error;
    }
  }
  
  async updateCourse(
    courseId: number,
    request: UpdateCourseRequest
  ): Promise<ApiResponse<number>> {
    try {
      return await this.apiClient.post<number>(
        `/v2/courses/${courseId}/update`,
        request
      );
    } catch (error) {
      console.error(`Failed to update course: ${courseId}`, error);
      throw error;
    }
  }
  
  async deleteCourse(courseId: number): Promise<ApiResponse<boolean>> {
    try {
      return await this.apiClient.post<boolean>(
        `/v2/courses/${courseId}/delete`
      );
    } catch (error) {
      console.error(`Failed to delete course: ${courseId}`, error);
      throw error;
    }
  }
  
  async deleteCourseUnit(
    courseId: number,
    courseUnitId: number
  ): Promise<ApiResponse<boolean>> {
    try {
      return await this.apiClient.post<boolean>(
        `/v2/courses/${courseId}/units/${courseUnitId}/delete`
      );
    } catch (error) {
      console.error(`Failed to delete course unit: ${courseUnitId}`, error);
      throw error;
    }
  }
  
  async deleteAssignment(
    courseId: number,
    courseUnitId: number,
    assignmentId: number
  ): Promise<ApiResponse<boolean>> {
    try {
      return await this.apiClient.post<boolean>(
        `/v2/courses/${courseId}/units/${courseUnitId}/assignments/${assignmentId}/delete`
      );
    } catch (error) {
      console.error(`Failed to delete assignment: ${assignmentId}`, error);
      throw error;
    }
  }
}

export const courseApiService = new CourseApiService();