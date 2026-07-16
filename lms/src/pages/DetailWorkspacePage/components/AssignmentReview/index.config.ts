import {useAssignmentReviewStore} from "../../stores/useAssignmentReviewStore";
import {DetailWorkspaceConfig} from "../../types";
import {AssignmentReview} from "./index"
import {assignmentApiService} from "@/apis/services/assignment-api";

export interface AssignmentReviewQuery {
  assignmentId: number;
}

export const AssignmentReviewConfig: DetailWorkspaceConfig<"teacher-assignment-review"> = {
  type: "teacher-assignment-review",
  component: AssignmentReview,
  store: useAssignmentReviewStore,
  
  queryFn: (query) => async () => {
    return (await assignmentApiService.getAssignmentForReview(query.assignmentId)).data;
  },
  
  queryKey: (query) => {
    return ['assignment-review', query.assignmentId.toString()];
  }
}