// @ts-nocheck — legacy DetailWorkspace config; quarantined with DetailWorkspacePage (PROJECT_STANDARDS.md §13).
import {DetailWorkspaceConfig} from "../../types";
import {AssignmentEdit} from "./index";
import {useAssignmentEditStore} from "../../stores/useAssignmentEditStore";
import {assignmentApiService} from "@/apis/services/assignment-api";
import {unwrapData} from "@/apis";

export interface AssignmentEditQuery {
  assignmentId?: number;
}

export const AssignmentEditConfig: DetailWorkspaceConfig<"teacher-assignment-edit"> = {
  type: "teacher-assignment-edit",
  component: AssignmentEdit,
  store: useAssignmentEditStore,
  
  queryFn: (query) => async () => {
    return unwrapData(
      await assignmentApiService.getAssignmentForEdit(query.assignmentId),
      'getAssignmentForEdit'
    );
  },
  
  queryKey: (query) => {
    return query.assignmentId
      ? ['assignment-edit', query.assignmentId.toString()]
      : ['assignment-edit', 'new'];
  },
}