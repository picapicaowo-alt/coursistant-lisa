import {BaseEntity} from '@/types/core/base';
import {FileDto} from '@/types';

export interface AssignmentBase extends BaseEntity {
  title: string;
  description: string;
  type: string;
  dueTime: Date;
  attachments: FileDto[];
  settings: AssignmentSettings;
}

export interface AssignmentSettings {
  allowLateSubmission: boolean;
  allowedResubmissionCount: number;
}

export interface SubmissionState {
  submissionCount: number;
  submittedAt: Date;
  submissionContent: string;
  submissionFiles: FileDto[];
}

export interface ReviewState {
  grade: number;
  gradedAt: Date;
  teacherComment: string;
}

// Specialized assignment types for different contexts
export interface AssignmentForStudent extends AssignmentBase {
  submission: SubmissionState | null;
  review: ReviewState | null;
}

export interface AssignmentForReview extends AssignmentBase {
  studentStates: StudentState[];
}

export interface StudentState {
  studentId: string;
  studentFirstName?: string | null;
  studentMiddleName?: string | null;
  studentLastName?: string | null;
  submission: SubmissionState | null;
  review: ReviewState | null;
}
