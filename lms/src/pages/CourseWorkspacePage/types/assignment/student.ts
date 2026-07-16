import {AssignmentBase} from "./base";
import {ReviewState, SubmissionState} from "./state";

export interface AssignmentForStudent extends AssignmentBase {
  submission: SubmissionState | null;
  review: ReviewState | null;
}