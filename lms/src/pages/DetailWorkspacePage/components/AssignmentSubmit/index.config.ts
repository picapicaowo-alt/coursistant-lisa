import {DetailWorkspaceConfig} from "../../types";
import {useAssignmentSubmitStore} from "../../stores/useAssignmentSubmitStore";
import {AssignmentSubmit} from "./index";
import {assignmentApiService} from "@/apis/services/assignment-api";

export interface StudentAssignmentQuery {
  assignmentId: number;
}

export const StudentAssignmentConfig: DetailWorkspaceConfig<"student-assignment"> = {
  type: "student-assignment",
  component: AssignmentSubmit,
  store: useAssignmentSubmitStore,
  
  queryFn: (query) => async () => {
    return (await assignmentApiService.getAssignmentForSubmission(query.assignmentId)).data;
  },
  
  queryKey: (query) => {
    return ['assignment-submission', query.assignmentId.toString()];
  }
}