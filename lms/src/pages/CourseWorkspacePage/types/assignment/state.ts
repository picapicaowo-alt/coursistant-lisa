import {FileDto} from "@/types";

export interface SubmissionState {
  // The number of submissions made by the student
  submissionCount: number;
  submittedAt: string;
  submissionContent: string;
  submissionFiles: FileDto[];
}

export interface ReviewState {
  grade: number;
  gradedAt: string;
  teacherComment: string;
}