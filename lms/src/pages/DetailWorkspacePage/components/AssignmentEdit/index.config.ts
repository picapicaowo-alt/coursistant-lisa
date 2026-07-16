import {DetailWorkspaceConfig} from "../../types";
import {AssignmentEdit} from "./index";
import {useAssignmentEditStore} from "../../stores/useAssignmentEditStore";
import {assignmentApiService} from "@/apis/services/assignment-api";

export interface AssignmentEditQuery {
  assignmentId?: number;
}

export const AssignmentEditConfig: DetailWorkspaceConfig<"teacher-assignment-edit"> = {
  type: "teacher-assignment-edit",
  component: AssignmentEdit,
  store: useAssignmentEditStore,
  
  queryFn: (query) => async () => {
    return (await assignmentApiService.getAssignmentForEdit(query.assignmentId)).data;
  },
  
  queryKey: (query) => {
    return query.assignmentId
      ? ['assignment-edit', query.assignmentId.toString()]
      : ['assignment-edit', 'new'];
  },
}