import {
  ApiResponse,
  CourseBrowseParams,
  CourseAnnouncement,
  CourseEvent,
  CourseGroupSet,
  CourseMaterial,
  CoursePageResponse,
  CourseResponse,
  CourseSession,
  CourseSummary,
  CourseWeek,
  idempotent,
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

  async getAnnouncement(
    courseId: number,
    announcementId: number
  ): Promise<ApiResponse<CourseAnnouncement>> {
    return this.apiClient.get<CourseAnnouncement>(
      `/v2/courses/${courseId}/announcements/${announcementId}`
    );
  }

  async getCourseEvent(
    courseId: number,
    eventId: number
  ): Promise<ApiResponse<CourseEvent>> {
    return this.apiClient.get<CourseEvent>(`/v2/courses/${courseId}/events/${eventId}`);
  }

  async getGroupSet(
    courseId: number,
    groupSetId: number
  ): Promise<ApiResponse<CourseGroupSet>> {
    return this.apiClient.get<CourseGroupSet>(
      `/v2/courses/${courseId}/group-sets/${groupSetId}`
    );
  }

  /**
   * Fetches material bytes with the current Bearer token.
   *
   * These endpoints return raw binary rather than an ApiResponse envelope.
   * A plain anchor cannot attach Authorization, so the UI downloads a Blob
   * through this authenticated client and then opens/saves an object URL.
   * Storage stays opaque to the browser (S3 today, another provider later).
   */
  private async getMaterialBlob(
    courseId: number,
    weekId: number,
    materialId: number,
    action: 'download' | 'preview'
  ): Promise<Blob> {
    const response = await this.apiClient.getClient().get<Blob>(
      `/v2/courses/${courseId}/weeks/${weekId}/materials/${materialId}/${action}`,
      {responseType: 'blob'}
    );
    return response.data;
  }

  async downloadMaterial(courseId: number, weekId: number, materialId: number): Promise<Blob> {
    return this.getMaterialBlob(courseId, weekId, materialId, 'download');
  }

  async previewMaterial(courseId: number, weekId: number, materialId: number): Promise<Blob> {
    return this.getMaterialBlob(courseId, weekId, materialId, 'preview');
  }

  /** Uploads files, creates a link, or does both in one multipart request. */
  async createMaterials(
    courseId: number,
    weekId: number,
    request: {files?: File[]; linkUrl?: string; linkDisplayName?: string},
    idempotencyKey: string = crypto.randomUUID()
  ): Promise<ApiResponse<CourseMaterial[]>> {
    const formData = new FormData();
    request.files?.forEach(file => formData.append('files', file));
    if (request.linkUrl) formData.append('linkUrl', request.linkUrl);
    if (request.linkDisplayName) formData.append('linkDisplayName', request.linkDisplayName);

    return this.apiClient.post<CourseMaterial[]>(
      `/v2/courses/${courseId}/weeks/${weekId}/materials`,
      formData,
      idempotent(idempotencyKey)
    );
  }

  async renameMaterial(
    courseId: number,
    weekId: number,
    materialId: number,
    displayName: string
  ): Promise<ApiResponse<CourseMaterial>> {
    return this.apiClient.patch<CourseMaterial>(
      `/v2/courses/${courseId}/weeks/${weekId}/materials/${materialId}`,
      {displayName},
      idempotent()
    );
  }

  async deleteMaterial(
    courseId: number,
    weekId: number,
    materialId: number
  ): Promise<ApiResponse<void>> {
    return this.apiClient.delete<void>(
      `/v2/courses/${courseId}/weeks/${weekId}/materials/${materialId}`
    );
  }

  async moveMaterial(
    courseId: number,
    weekId: number,
    materialId: number,
    targetWeekId: number
  ): Promise<ApiResponse<CourseMaterial>> {
    return this.apiClient.post<CourseMaterial>(
      `/v2/courses/${courseId}/weeks/${weekId}/materials/${materialId}/move`,
      {targetWeekId},
      idempotent()
    );
  }

  /** `materialIds` must be a full permutation of the materials in the week. */
  async reorderMaterials(
    courseId: number,
    weekId: number,
    materialIds: number[]
  ): Promise<ApiResponse<CourseMaterial[]>> {
    return this.apiClient.put<CourseMaterial[]>(
      `/v2/courses/${courseId}/weeks/${weekId}/materials/reorder`,
      {materialIds},
      idempotent()
    );
  }
  
  /**
   * Edits a course. Course Manager only.
   *
   * PATCH, not PUT, and partial — send only what changed. Tenant and primary
   * instructor are rejected here; reassigning the instructor is an admin-only
   * call of its own. Editing an archived course fails with COURSE_ARCHIVED.
   */
  async updateCourse(
    courseId: number,
    request: UpdateCourseRequest
  ): Promise<ApiResponse<CourseResponse>> {
    try {
      return await this.apiClient.patch<CourseResponse>(
        `/v2/courses/${courseId}`,
        request,
        idempotent()
      );
    } catch (error) {
      console.error(`Failed to update course: ${courseId}`, error);
      throw error;
    }
  }

  /**
   * Deletes a course outright.
   *
   * Only succeeds on a course with no dependencies and a single instructor
   * enrolment; anything else returns 409 and must be archived instead. Prefer
   * archiveCourse — INV-05 requires submissions, attempts and grades to
   * survive every V1 action.
   */
  async deleteCourse(courseId: number): Promise<ApiResponse<void>> {
    try {
      return await this.apiClient.delete<void>(`/v2/courses/${courseId}`);
    } catch (error) {
      console.error(`Failed to delete course: ${courseId}`, error);
      throw error;
    }
  }

  // ---------------------------------------------------------------- weeks
  //
  // Weeks are the course outline. All writes are Course Manager only and fail
  // with COURSE_ARCHIVED once the course is archived. A new week starts as a
  // Draft and stays invisible to students until it is published.

  async createWeek(
    courseId: number,
    title: string,
    idempotencyKey: string = crypto.randomUUID()
  ): Promise<ApiResponse<CourseWeek>> {
    try {
      return await this.apiClient.post<CourseWeek>(
        `/v2/courses/${courseId}/weeks`,
        {title},
        idempotent(idempotencyKey)
      );
    } catch (error) {
      console.error(`Failed to create week for courseId: ${courseId}`, error);
      throw error;
    }
  }

  async renameWeek(
    courseId: number,
    weekId: number,
    title: string
  ): Promise<ApiResponse<CourseWeek>> {
    try {
      return await this.apiClient.patch<CourseWeek>(
        `/v2/courses/${courseId}/weeks/${weekId}`,
        {title},
        idempotent()
      );
    } catch (error) {
      console.error(`Failed to rename week: ${weekId}`, error);
      throw error;
    }
  }

  /** Only an empty week can be deleted; one holding materials is refused. */
  async deleteWeek(courseId: number, weekId: number): Promise<ApiResponse<void>> {
    try {
      return await this.apiClient.delete<void>(`/v2/courses/${courseId}/weeks/${weekId}`);
    } catch (error) {
      console.error(`Failed to delete week: ${weekId}`, error);
      throw error;
    }
  }

  /** Makes the week and its materials visible to students. */
  async publishWeek(courseId: number, weekId: number): Promise<ApiResponse<CourseWeek>> {
    try {
      return await this.apiClient.post<CourseWeek>(
        `/v2/courses/${courseId}/weeks/${weekId}/publish`,
        undefined,
        idempotent()
      );
    } catch (error) {
      console.error(`Failed to publish week: ${weekId}`, error);
      throw error;
    }
  }

  async unpublishWeek(courseId: number, weekId: number): Promise<ApiResponse<CourseWeek>> {
    try {
      return await this.apiClient.post<CourseWeek>(
        `/v2/courses/${courseId}/weeks/${weekId}/unpublish`,
        undefined,
        idempotent()
      );
    } catch (error) {
      console.error(`Failed to unpublish week: ${weekId}`, error);
      throw error;
    }
  }

  /** `weekIds` must be a full permutation of the course's weeks. */
  async reorderWeeks(courseId: number, weekIds: number[]): Promise<ApiResponse<CourseWeek[]>> {
    try {
      return await this.apiClient.put<CourseWeek[]>(
        `/v2/courses/${courseId}/weeks/reorder`,
        {weekIds},
        idempotent()
      );
    } catch (error) {
      console.error(`Failed to reorder weeks for courseId: ${courseId}`, error);
      throw error;
    }
  }
}

export const courseApiService = new CourseApiService();
