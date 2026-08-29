import {AssignmentBase} from "./base";
import {ReviewState, SubmissionState} from "./state";

export interface AssignmentForReview extends AssignmentBase {
  studentStates: StudentState[];
}

export interface StudentState {
  studentId: string;
  studentFirstName: string | null;
  studentMiddleName: string | null;
  studentLastName: string | null;
  submission: SubmissionState | null;
  review: ReviewState | null;
}
