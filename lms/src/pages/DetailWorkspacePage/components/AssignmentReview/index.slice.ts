import {LoadableStore} from "@/types/stores";
import {AssignmentEntity} from "@/pages/DetailWorkspacePage/config";
import {StateCreator} from "zustand";
import {AssignmentReviewStore} from "@/pages/DetailWorkspacePage/stores/useAssignmentReviewStore";
import {AssignmentForReviewResponse} from "@/apis";

export interface AssignmentReviewSlice extends LoadableStore<AssignmentForReviewResponse> {
  assignment: AssignmentEntity,
}

export const createAssignmentReviewSlice: StateCreator<
  AssignmentReviewStore,
  [["zustand/immer", never]],
  [],
  AssignmentReviewSlice
> = (set, get) => ({
  loadRoot: (data) => {
    const {load, addRelations, clearAll} = get();
    clearAll();
    load("assignments", {...data.assignment});
    
    const assignmentAttachmentIds = Array<number>();
    for (const file of data.files) {
      load("files", {...file});
      if (file.entityType === "nw_assignment") {
        assignmentAttachmentIds.push(file.id);
      } else if (file.entityType === "nw_submission") {
        addRelations("submissionFiles", file.entityId, [file.id]);
      }
    }
    addRelations("assignmentFiles", data.assignment.id, assignmentAttachmentIds);
    
    const submissionIds = Array<number>();
    for (const submission of data.submissions) {
      load("submissions", {...submission});
      submissionIds.push(submission.id);
    }
    addRelations("assignmentSubmissions", data.assignment.id, submissionIds);
    
    for (const review of data.reviews) {
      load("reviews", {...review});
      addRelations("submissionReviews", review.submissionId, [review.id]);
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
  },
});