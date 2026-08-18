import {
  ApiResponse,
  CreateQuizQuestionRequest,
  CreateQuizRequest,
  idempotent,
  PatchQuizQuestionRequest,
  PatchQuizRequest,
  QuizAttempt,
  QuizAutosaveResponse,
  QuizGradingSummary,
  QuizQuestion,
  QuizReceipt,
  QuizResponse,
  QuizResult,
  QuizShortAnswerGradingItem,
  V2ApiClient,
} from '@/apis';

export class QuizApiService {
  private apiClient = V2ApiClient;

  constructor(apiClient?: typeof V2ApiClient) {
    if (apiClient) this.apiClient = apiClient;
  }

  listQuizzes(courseId: number): Promise<ApiResponse<QuizResponse[]>> {
    return this.apiClient.get(`/v2/courses/${courseId}/quizzes`);
  }

  getQuiz(courseId: number, quizId: number): Promise<ApiResponse<QuizResponse>> {
    return this.apiClient.get(`/v2/courses/${courseId}/quizzes/${quizId}`);
  }

  createQuiz(
    courseId: number,
    request: CreateQuizRequest,
    idempotencyKey: string = crypto.randomUUID(),
  ): Promise<ApiResponse<QuizResponse>> {
    return this.apiClient.post(`/v2/courses/${courseId}/quizzes`, request, idempotent(idempotencyKey));
  }

  patchQuiz(courseId: number, quizId: number, request: PatchQuizRequest): Promise<ApiResponse<QuizResponse>> {
    return this.apiClient.patch(`/v2/courses/${courseId}/quizzes/${quizId}`, request, idempotent());
  }

  deleteQuiz(courseId: number, quizId: number): Promise<ApiResponse<void>> {
    return this.apiClient.delete(`/v2/courses/${courseId}/quizzes/${quizId}`, {params: {confirm: true}});
  }

  publishQuiz(courseId: number, quizId: number): Promise<ApiResponse<QuizResponse>> {
    return this.apiClient.post(`/v2/courses/${courseId}/quizzes/${quizId}/publish`, undefined, idempotent());
  }

  unpublishQuiz(courseId: number, quizId: number): Promise<ApiResponse<QuizResponse>> {
    return this.apiClient.post(`/v2/courses/${courseId}/quizzes/${quizId}/unpublish`, undefined, idempotent());
  }

  listQuestions(courseId: number, quizId: number): Promise<ApiResponse<QuizQuestion[]>> {
    return this.apiClient.get(`/v2/courses/${courseId}/quizzes/${quizId}/questions`);
  }

  createQuestion(
    courseId: number,
    quizId: number,
    request: CreateQuizQuestionRequest,
  ): Promise<ApiResponse<QuizQuestion>> {
    return this.apiClient.post(`/v2/courses/${courseId}/quizzes/${quizId}/questions`, request, idempotent());
  }

  patchQuestion(
    courseId: number,
    quizId: number,
    questionId: number,
    request: PatchQuizQuestionRequest,
  ): Promise<ApiResponse<QuizQuestion>> {
    return this.apiClient.patch(
      `/v2/courses/${courseId}/quizzes/${quizId}/questions/${questionId}`,
      request,
      idempotent(),
    );
  }

  deleteQuestion(courseId: number, quizId: number, questionId: number): Promise<ApiResponse<void>> {
    return this.apiClient.delete(`/v2/courses/${courseId}/quizzes/${quizId}/questions/${questionId}`);
  }

  reorderQuestions(courseId: number, quizId: number, questionIds: number[]): Promise<ApiResponse<QuizQuestion[]>> {
    return this.apiClient.put(
      `/v2/courses/${courseId}/quizzes/${quizId}/questions/order`,
      {questionIds},
      idempotent(),
    );
  }

  startAttempt(
    courseId: number,
    quizId: number,
    idempotencyKey: string = crypto.randomUUID(),
  ): Promise<ApiResponse<QuizAttempt>> {
    return this.apiClient.post(
      `/v2/courses/${courseId}/quizzes/${quizId}/attempts`,
      undefined,
      idempotent(idempotencyKey),
    );
  }

  getCurrentAttempt(courseId: number, quizId: number): Promise<ApiResponse<QuizAttempt>> {
    return this.apiClient.get(`/v2/courses/${courseId}/quizzes/${quizId}/attempts/current`);
  }

  autosaveAnswer(
    courseId: number,
    quizId: number,
    attemptId: number,
    questionId: number,
    answer: {selectedOptionIds?: number[]; textAnswer?: string},
  ): Promise<ApiResponse<QuizAutosaveResponse>> {
    return this.apiClient.put(
      `/v2/courses/${courseId}/quizzes/${quizId}/attempts/${attemptId}/answers/${questionId}`,
      answer,
    );
  }

  submitAttempt(courseId: number, quizId: number, attemptId: number): Promise<ApiResponse<QuizReceipt>> {
    return this.apiClient.post(
      `/v2/courses/${courseId}/quizzes/${quizId}/attempts/${attemptId}/submit`,
      undefined,
      idempotent(),
    );
  }

  getMyResult(courseId: number, quizId: number): Promise<ApiResponse<QuizResult>> {
    return this.apiClient.get(`/v2/courses/${courseId}/quizzes/${quizId}/my-result`);
  }

  getGradingSummary(courseId: number, quizId: number): Promise<ApiResponse<QuizGradingSummary>> {
    return this.apiClient.get(`/v2/courses/${courseId}/quizzes/${quizId}/grading-summary`);
  }

  listShortAnswers(
    courseId: number,
    quizId: number,
    questionId: number,
  ): Promise<ApiResponse<QuizShortAnswerGradingItem[]>> {
    return this.apiClient.get(
      `/v2/courses/${courseId}/quizzes/${quizId}/grading/questions/${questionId}/answers`,
    );
  }

  gradeAnswer(
    courseId: number,
    quizId: number,
    attemptId: number,
    questionId: number,
    request: {score: number; feedback?: string; reason?: string},
  ): Promise<ApiResponse<QuizShortAnswerGradingItem>> {
    return this.apiClient.put(
      `/v2/courses/${courseId}/quizzes/${quizId}/attempts/${attemptId}/answers/${questionId}/grade`,
      request,
      idempotent(),
    );
  }

  releaseGrades(courseId: number, quizId: number, userIds?: number[]): Promise<ApiResponse<void>> {
    return this.apiClient.post(
      `/v2/courses/${courseId}/quizzes/${quizId}/grades/release`,
      userIds ? {userIds} : {},
      idempotent(),
    );
  }

  retractGrades(courseId: number, quizId: number, userIds?: number[]): Promise<ApiResponse<void>> {
    return this.apiClient.post(
      `/v2/courses/${courseId}/quizzes/${quizId}/grades/retract`,
      userIds ? {userIds} : {},
      idempotent(),
    );
  }
}

export const quizApiService = new QuizApiService();
