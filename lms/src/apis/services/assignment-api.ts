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
  DueDateChangePreview,
  EditAssignmentRequest,
  GradeRecord,
  GradeSelectionPayload,
  GradingRoster,
  MyGradeItem,
  PatchAssignmentPayload,
  RubricState,
  StagingFile,
  SubmissionVersion,
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

  async deleteAssignment(courseId: number, assignmentId: number): Promise<ApiResponse<void>> {
    return this.apiClient.delete(`/v2/courses/${courseId}/assignments/${assignmentId}`);
  }

  async previewDueDateChange(
    courseId: number,
    assignmentId: number,
    request: {dueAt: string; lateUntil?: string; clearLateUntil?: boolean},
  ): Promise<ApiResponse<DueDateChangePreview>> {
    return this.apiClient.post(
      `/v2/courses/${courseId}/assignments/${assignmentId}/due-date-change-preview`,
      request,
    );
  }

  async getRubric(courseId: number, assignmentId: number): Promise<ApiResponse<RubricState>> {
    return this.apiClient.get(`/v2/courses/${courseId}/assignments/${assignmentId}/rubric`);
  }

  async uploadRubric(courseId: number, assignmentId: number, file: File, confirmReplaceAfterGrading = false): Promise<ApiResponse<RubricState>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.apiClient.post(
      `/v2/courses/${courseId}/assignments/${assignmentId}/rubric`,
      formData,
      {params: {confirmReplaceAfterGrading}},
    );
  }

  private async getRubricBlob(courseId: number, assignmentId: number, action: 'preview' | 'download'): Promise<Blob> {
    const response = await this.apiClient.getClient().get<Blob>(
      `/v2/courses/${courseId}/assignments/${assignmentId}/rubric/${action}`,
      {responseType: 'blob'},
    );
    return response.data;
  }

  downloadRubric(courseId: number, assignmentId: number): Promise<Blob> {
    return this.getRubricBlob(courseId, assignmentId, 'download');
  }

  previewRubric(courseId: number, assignmentId: number): Promise<Blob> {
    return this.getRubricBlob(courseId, assignmentId, 'preview');
  }

  async restorePreviousRubric(courseId: number, assignmentId: number, confirmReplaceAfterGrading = false): Promise<ApiResponse<RubricState>> {
    return this.apiClient.post(
      `/v2/courses/${courseId}/assignments/${assignmentId}/rubric/restore-previous`,
      undefined,
      {params: {confirmReplaceAfterGrading}},
    );
  }

  private async uploadAnnotatedFile(
    courseId: number,
    assignmentId: number,
    target: 'students' | 'groups',
    targetId: number,
    file: File,
  ): Promise<ApiResponse<GradeRecord>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.apiClient.post(
      `/v2/courses/${courseId}/assignments/${assignmentId}/${target}/${targetId}/grade/annotated-file`,
      formData,
    );
  }

  uploadStudentAnnotatedFile(courseId: number, assignmentId: number, studentUserId: number, file: File) {
    return this.uploadAnnotatedFile(courseId, assignmentId, 'students', studentUserId, file);
  }

  uploadGroupAnnotatedFile(courseId: number, assignmentId: number, groupId: number, file: File) {
    return this.uploadAnnotatedFile(courseId, assignmentId, 'groups', groupId, file);
  }

  private async downloadAnnotatedFile(courseId: number, assignmentId: number, target: 'students' | 'groups', targetId: number): Promise<Blob> {
    const response = await this.apiClient.getClient().get<Blob>(
      `/v2/courses/${courseId}/assignments/${assignmentId}/${target}/${targetId}/grade/annotated-file`,
      {responseType: 'blob'},
    );
    return response.data;
  }

  downloadStudentAnnotatedFile(courseId: number, assignmentId: number, studentUserId: number) {
    return this.downloadAnnotatedFile(courseId, assignmentId, 'students', studentUserId);
  }

  downloadGroupAnnotatedFile(courseId: number, assignmentId: number, groupId: number) {
    return this.downloadAnnotatedFile(courseId, assignmentId, 'groups', groupId);
  }

  async getGradingRoster(
    courseId: number,
    assignmentId: number
  ): Promise<ApiResponse<GradingRoster>> {
    return this.apiClient.get<GradingRoster>(
      `/v2/courses/${courseId}/assignments/${assignmentId}/grading-roster`
    );
  }

  async listMyGrades(courseId: number): Promise<ApiResponse<MyGradeItem[]>> {
    return this.apiClient.get<MyGradeItem[]>(`/v2/courses/${courseId}/my-grades`);
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

  private async getAttachmentBlob(
    courseId: number,
    assignmentId: number,
    attachmentId: number,
    action: 'preview' | 'download',
  ): Promise<Blob> {
    const response = await this.apiClient.getClient().get<Blob>(
      `/v2/courses/${courseId}/assignments/${assignmentId}/attachments/${attachmentId}/${action}`,
      {responseType: 'blob'},
    );
    return response.data;
  }

  downloadAttachment(courseId: number, assignmentId: number, attachmentId: number): Promise<Blob> {
    return this.getAttachmentBlob(courseId, assignmentId, attachmentId, 'download');
  }

  previewAttachment(courseId: number, assignmentId: number, attachmentId: number): Promise<Blob> {
    return this.getAttachmentBlob(courseId, assignmentId, attachmentId, 'preview');
  }

  async getMySubmission(
    courseId: number,
    assignmentId: number
  ): Promise<ApiResponse<SubmissionState>> {
    return this.apiClient.get<SubmissionState>(
      `/v2/courses/${courseId}/assignments/${assignmentId}/submission`
    );
  }

  async listSubmissionVersions(
    courseId: number,
    assignmentId: number,
    submissionId: number,
  ): Promise<ApiResponse<SubmissionVersion[]>> {
    return this.apiClient.get(
      `/v2/courses/${courseId}/assignments/${assignmentId}/submissions/${submissionId}/versions`,
    );
  }

  private async getSubmissionFileBlob(
    courseId: number,
    assignmentId: number,
    submissionId: number,
    fileId: number,
    action: 'download' | 'preview',
  ): Promise<Blob> {
    const response = await this.apiClient.getClient().get<Blob>(
      `/v2/courses/${courseId}/assignments/${assignmentId}/submissions/${submissionId}/files/${fileId}/${action}`,
      {responseType: 'blob'},
    );
    return response.data;
  }

  downloadSubmissionFile(
    courseId: number,
    assignmentId: number,
    submissionId: number,
    fileId: number,
  ): Promise<Blob> {
    return this.getSubmissionFileBlob(courseId, assignmentId, submissionId, fileId, 'download');
  }

  previewSubmissionFile(
    courseId: number,
    assignmentId: number,
    submissionId: number,
    fileId: number,
  ): Promise<Blob> {
    return this.getSubmissionFileBlob(courseId, assignmentId, submissionId, fileId, 'preview');
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
