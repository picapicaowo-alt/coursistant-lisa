import {
  ApiResponse,
  CourseDetailDTO, CoursePreviewResponse,
  CreateAssignmentRequest,
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
  
  async getCourseCatalogues(): Promise<ApiResponse<CoursePreviewResponse[]>> {
    try {
      return await this.apiClient.get<CoursePreviewResponse[]>("/v2/courses");
    } catch (error) {
      console.error(`Failed to get course catalogues`, error);
      throw error;
    }
  }
  
  async getCourseDetail(courseId: number): Promise<ApiResponse<CourseDetailDTO>> {
    try {
      return await this.apiClient.get<CourseDetailDTO>(
        `/v2/courses/${courseId}/detail`
      );
    } catch (error) {
      console.error(`Failed to get course detail for courseId: ${courseId}`, error);
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