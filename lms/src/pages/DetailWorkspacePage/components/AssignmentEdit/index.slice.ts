import {LoadableStore} from "@/types/stores";
import {AssignmentEntity} from "@/pages/DetailWorkspacePage/config";
import {StateCreator} from "zustand";
import {AssignmentEditStore} from "@/pages/DetailWorkspacePage/stores/useAssignmentEditStore";
import {AssignmentForEditResponse} from "@/apis";

export interface AssignmentEditSlice extends LoadableStore<AssignmentForEditResponse> {
  assignment: AssignmentEntity,
}

export const createAssignmentEditSlice: StateCreator<
  AssignmentEditStore,
  [["zustand/immer", never]],
  [],
  AssignmentEditSlice
> = (set, get) => ({
  loadRoot: (data) => {
    const {load, addRelations, clearAll} = get();
    clearAll();
    load("assignments", {...data});
    
    const fileIds = Array<number>();
    for (const file of data.attachments) {
      load("files", {...file});
      fileIds.push(file.id);
    }
    addRelations("assignmentFiles", data.id, fileIds);
    
    set(state => {
      state.assignment = {...data};
    });
  },
  
  assignment: {
    title: "",
    description: "",
    type: "",
    dueTime: new Date(),
    settings: {
      allowLateSubmission: false,
      allowedResubmissionCount: 0
    },
    id: -1,
    createdAt: new Date(),
    updatedAt: new Date()
  }
});