export interface FileResponse {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  entityId: number;
  entityType: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  filePath: string;
}

export interface AssignmentSettings {
  allowLateSubmission: boolean;
  allowedResubmissionCount: number;
}

export interface AssignmentForEditResponse {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  title: string;
  description: string;
  type: string;
  dueTime: Date;
  settings: AssignmentSettings;
  attachments: FileResponse[];
}

export interface EditAssignmentRequest {
  title?: string;
  description?: string;
  type?: string;
  dueTime?: Date;
  settings?: AssignmentSettings;
}

export interface SubmissionResponse {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  assignmentId: number;
  submissionCount: number;
  submissionContent: string;
  files: FileResponse[];
}

export interface AssignmentForSubmissionResponse {
  assignment: AssignmentForEditResponse;
  submission?: SubmissionResponse;
  review?: Review
}

export interface AssignmentSubmissionRequest {
  submissionContent?: string;
}

export interface Assignment {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  title: string;
  description: string;
  type: string;
  dueTime: Date;
  settings: AssignmentSettings;
}

export interface Submission {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  assignmentId: number;
  studentName: string;
  submissionCount: number;
  submissionContent: string;
}

export interface Review {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  submissionId: number;
  grade: number;
  teacherComment: string;
}

export interface AssignmentForReviewResponse {
  assignment: Assignment;
  submissions: Submission[];
  reviews: Review[];
  files: FileResponse[];
}

export interface CreateSubmissionReviewRequest {
  grade?: number;
  teacherComment?: string;
}

export interface UpdateSubmissionReviewRequest {
  grade?: number;
  teacherComment?: string;
}