import {
  ApiResponse,
  AssignmentAttachment,
  AssignmentDetail,
  AssignmentForEditResponse,
  AssignmentForReviewResponse,
  AssignmentForSubmissionResponse,
  AssignmentSubmissionRequest,
  AssignmentSummary,
  CreateAssignmentPayload,
  CreateSubmissionReviewRequest,
  EditAssignmentRequest,
  GradeRecord,
  GradeSelectionPayload,
  GradingRoster,
  PatchAssignmentPayload,
  StagingFile,
  SubmissionState,
  SubmitAssignmentPayload,
  UpdateSubmissionReviewRequest,
  UpsertGradePayload,
  V2ApiClient
} from "@/apis";
import {idempotent} from '@/apis/types/common';

export class AssignmentApiService {
  private apiClient = V2ApiClient;
  
  constructor(apiClient?: typeof V2ApiClient) {
    if (apiClient) {
      this.apiClient = apiClient;
    }
  }
  
  /**
   * Assignment list cards for a course, ordered by due date.
   *
   * The slim endpoint rather than `/assignments`, which returns every field
   * including descriptions and attachments — far more than a list needs.
   */
  async getCourseAssignmentSummaries(courseId: number): Promise<ApiResponse<AssignmentSummary[]>> {
    try {
      return await this.apiClient.get<AssignmentSummary[]>(
        `/v2/courses/${courseId}/assignments/summaries`
      );
    } catch (error) {
      console.error(`Failed to get assignment summaries for courseId: ${courseId}`, error);
      throw error;
    }
  }

  /** Role-shaped assignment detail from the current 8081 contract. */
  async getAssignment(courseId: number, assignmentId: number): Promise<ApiResponse<AssignmentDetail>> {
    return this.apiClient.get<AssignmentDetail>(
      `/v2/courses/${courseId}/assignments/${assignmentId}`
    );
  }

  async createAssignment(
    courseId: number,
    request: CreateAssignmentPayload
  ): Promise<ApiResponse<AssignmentDetail>> {
    return this.apiClient.post<AssignmentDetail>(`/v2/courses/${courseId}/assignments`, request);
  }

  async patchAssignment(
    courseId: number,
    assignmentId: number,
    request: PatchAssignmentPayload
  ): Promise<ApiResponse<AssignmentDetail>> {
    return this.apiClient.patch<AssignmentDetail>(
      `/v2/courses/${courseId}/assignments/${assignmentId}`,
      request
    );
  }

  async publishAssignment(
    courseId: number,
    assignmentId: number
  ): Promise<ApiResponse<AssignmentDetail>> {
    return this.apiClient.post<AssignmentDetail>(
      `/v2/courses/${courseId}/assignments/${assignmentId}/publish`
    );
  }

  async unpublishAssignment(
    courseId: number,
    assignmentId: number
  ): Promise<ApiResponse<AssignmentDetail>> {
    return this.apiClient.post<AssignmentDetail>(
      `/v2/courses/${courseId}/assignments/${assignmentId}/unpublish`
    );
  }

  async getGradingRoster(
    courseId: number,
    assignmentId: number
  ): Promise<ApiResponse<GradingRoster>> {
    return this.apiClient.get<GradingRoster>(
      `/v2/courses/${courseId}/assignments/${assignmentId}/grading-roster`
    );
  }

  async upsertStudentGrade(
    courseId: number,
    assignmentId: number,
    studentUserId: number,
    request: UpsertGradePayload
  ): Promise<ApiResponse<GradeRecord>> {
    return this.apiClient.put<GradeRecord>(
      `/v2/courses/${courseId}/assignments/${assignmentId}/students/${studentUserId}/grade`,
      request
    );
  }

  async upsertGroupGrade(
    courseId: number,
    assignmentId: number,
    groupId: number,
    request: UpsertGradePayload
  ): Promise<ApiResponse<GradeRecord>> {
    return this.apiClient.put<GradeRecord>(
      `/v2/courses/${courseId}/assignments/${assignmentId}/groups/${groupId}/grade`,
      request
    );
  }

  async releaseGrades(
    courseId: number,
    assignmentId: number,
    request: GradeSelectionPayload
  ): Promise<ApiResponse<GradingRoster>> {
    return this.apiClient.post<GradingRoster>(
      `/v2/courses/${courseId}/assignments/${assignmentId}/grades/release`,
      request
    );
  }

  async releaseAllGrades(
    courseId: number,
    assignmentId: number
  ): Promise<ApiResponse<GradingRoster>> {
    return this.apiClient.post<GradingRoster>(
      `/v2/courses/${courseId}/assignments/${assignmentId}/grades/release-all`
    );
  }

  async retractGrades(
    courseId: number,
    assignmentId: number,
    request: GradeSelectionPayload
  ): Promise<ApiResponse<GradingRoster>> {
    return this.apiClient.post<GradingRoster>(
      `/v2/courses/${courseId}/assignments/${assignmentId}/grades/retract`,
      request
    );
  }

  async uploadAttachments(
    courseId: number,
    assignmentId: number,
    files: File[]
  ): Promise<ApiResponse<AssignmentAttachment[]>> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    return this.apiClient.post<AssignmentAttachment[]>(
      `/v2/courses/${courseId}/assignments/${assignmentId}/attachments`,
      formData
    );
  }

  async deleteAttachment(
    courseId: number,
    assignmentId: number,
    attachmentId: number
  ): Promise<ApiResponse<void>> {
    return this.apiClient.delete<void>(
      `/v2/courses/${courseId}/assignments/${assignmentId}/attachments/${attachmentId}`
    );
  }

  async getMySubmission(
    courseId: number,
    assignmentId: number
  ): Promise<ApiResponse<SubmissionState>> {
    return this.apiClient.get<SubmissionState>(
      `/v2/courses/${courseId}/assignments/${assignmentId}/submission`
    );
  }

  /** Active, not-yet-submitted files owned by the current student. */
  async listStagingFiles(
    courseId: number,
    assignmentId: number
  ): Promise<ApiResponse<StagingFile[]>> {
    return this.apiClient.get<StagingFile[]>(
      `/v2/courses/${courseId}/assignments/${assignmentId}/submission-staging-files`
    );
  }

  async uploadStagingFiles(
    courseId: number,
    assignmentId: number,
    files: File[],
    signal?: AbortSignal
  ): Promise<ApiResponse<StagingFile[]>> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    return this.apiClient.post<StagingFile[]>(
      `/v2/courses/${courseId}/assignments/${assignmentId}/submission-staging-files`,
      formData,
      signal ? {signal} : undefined
    );
  }

  async deleteStagingFile(
    courseId: number,
    assignmentId: number,
    stagingFileId: number
  ): Promise<ApiResponse<void>> {
    return this.apiClient.delete<void>(
      `/v2/courses/${courseId}/assignments/${assignmentId}/submission-staging-files/${stagingFileId}`
    );
  }

  async submitStagedFiles(
    courseId: number,
    assignmentId: number,
    request?: SubmitAssignmentPayload,
    idempotencyKey: string = crypto.randomUUID()
  ): Promise<ApiResponse<SubmissionState>> {
    return this.apiClient.post<SubmissionState>(
      `/v2/courses/${courseId}/assignments/${assignmentId}/submissions`,
      request,
      idempotent(idempotencyKey)
    );
  }

  async getAssignmentForEdit(assignmentId: number): Promise<ApiResponse<AssignmentForEditResponse>> {
    return this.apiClient.get<AssignmentForEditResponse>(`/v2/assignments/${assignmentId}/edit`);
  }
  
  async editAssignment(
    assignmentId: number,
    request: EditAssignmentRequest
  ): Promise<ApiResponse<boolean>> {
    return this.apiClient.post<boolean>(`/v2/assignments/${assignmentId}/edit`, request);
  }
  
  async uploadAssignmentAttachment(
    assignmentId: number,
    file: File,
    fieldName = 'attachment'
  ): Promise<ApiResponse<number>> {
    const formData = new FormData();
    formData.append(fieldName, file);
    
    return this.apiClient.post<number>(
      `/v2/assignments/${assignmentId}/edit/attachments`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
  }
  
  async deleteAssignmentAttachment(
    assignmentId: number,
    attachmentId: number
  ): Promise<ApiResponse<boolean>> {
    return this.apiClient.post<boolean>(
      `/v2/assignments/${assignmentId}/edit/attachments/${attachmentId}/delete`
    );
  }
  
  async getAssignmentForSubmission(
    assignmentId: number
  ): Promise<ApiResponse<AssignmentForSubmissionResponse>> {
    return this.apiClient.get<AssignmentForSubmissionResponse>(
      `/v2/assignments/${assignmentId}/submission`
    );
  }
  
  async submitAssignment(
    assignmentId: number,
    request: AssignmentSubmissionRequest
  ): Promise<ApiResponse<boolean>> {
    return this.apiClient.post<boolean>(
      `/v2/assignments/${assignmentId}/submission`,
      request
    );
  }
  
  async resubmitAssignment(
    assignmentId: number,
    submissionId: number,
    request: AssignmentSubmissionRequest
  ): Promise<ApiResponse<boolean>> {
    return this.apiClient.post<boolean>(
      `/v2/assignments/${assignmentId}/submissions/${submissionId}`,
      request
    );
  }
  
  async uploadAssignmentSubmissionFile(
    assignmentId: number,
    submissionId: number,
    file: File,
    fieldName = 'file'
  ): Promise<ApiResponse<number>> {
    const formData = new FormData();
    formData.append(fieldName, file);
    
    return this.apiClient.post<number>(
      `/v2/assignments/${assignmentId}/submissions/${submissionId}/files`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
  }
  
  async deleteAssignmentSubmissionFile(
    assignmentId: number,
    submissionId: number,
    fileId: number
  ): Promise<ApiResponse<boolean>> {
    return this.apiClient.post<boolean>(
      `/v2/assignments/${assignmentId}/submissions/${submissionId}/files/${fileId}/delete`
    );
  }
  
  async getAssignmentForReview(
    assignmentId: number
  ): Promise<ApiResponse<AssignmentForReviewResponse>> {
    return this.apiClient.get<AssignmentForReviewResponse>(
      `/v2/assignments/${assignmentId}/review`
    );
  }
  
  async createSubmissionReview(
    assignmentId: number,
    submissionId: number,
    request: CreateSubmissionReviewRequest
  ): Promise<ApiResponse<number>> {
    return this.apiClient.post<number>(
      `/v2/assignments/${assignmentId}/submissions/${submissionId}/review`,
      request
    );
  }
  
  async updateSubmissionReview(
    assignmentId: number,
    submissionId: number,
    request: Record<number, UpdateSubmissionReviewRequest>
  ): Promise<ApiResponse<boolean>> {
    return this.apiClient.post<boolean>(
      `/v2/assignments/${assignmentId}/submission/${submissionId}/reviews/updates`,
      request
    );
  }
}

export const assignmentApiService = new AssignmentApiService();
