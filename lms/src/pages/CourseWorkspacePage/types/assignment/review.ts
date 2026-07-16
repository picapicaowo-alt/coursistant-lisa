import {AssignmentBase} from "./base";
import {ReviewState, SubmissionState} from "./state";

export interface AssignmentForReview extends AssignmentBase {
  studentStates: StudentState[];
}

export interface StudentState {
  studentId: string;
  studentName: string;
  submission: SubmissionState | null;
  review: ReviewState | null;
}