import {LoadableStore} from "@/types/stores";
import {StateCreator} from "zustand";
import {AssignmentSubmissionStore} from "@/pages/DetailWorkspacePage/stores/useAssignmentSubmitStore";
import {AssignmentEntity} from "@/pages/DetailWorkspacePage/config";
import {AssignmentForSubmissionResponse} from "@/apis";

export interface AssignmentSubmissionSlice extends LoadableStore<AssignmentForSubmissionResponse> {
  assignment: AssignmentEntity,
}

export const createAssignmentSubmitSlice: StateCreator<
  AssignmentSubmissionStore,
  [["zustand/immer", never]],
  [],
  AssignmentSubmissionSlice
> = (set, get) => ({
  loadRoot: (data) => {
    const {load, addRelations, clearAll} = get();
    clearAll();
    load("assignments", {...data.assignment});
    
    const fileIds = Array<number>();
    for (const file of data.assignment.attachments) {
      load("files", {...file});
      fileIds.push(file.id);
    }
    addRelations("assignmentFiles", data.assignment.id, fileIds);
    
    if (data.submission !== null && data.submission !== undefined) {
      load("submissions", {
        ...data.submission,
        studentFirstName: "",
        studentMiddleName: null,
        studentLastName: "",
      });
      addRelations("assignmentSubmissions", data.assignment.id, [data.submission.id]);
      
      const submissionFileIds = Array<number>();
      for (const file of data.submission.files) {
        load("files", {...file});
        submissionFileIds.push(file.id);
      }
      addRelations("submissionFiles", data.submission.id, submissionFileIds);
      
      if (data.review !== null && data.review !== undefined) {
        load("reviews", {...data.review});
        addRelations("submissionReviews", data.submission.id, [data.review.id]);
      }
    }
    
    set(state => {
      state.assignment = {...data.assignment};
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
