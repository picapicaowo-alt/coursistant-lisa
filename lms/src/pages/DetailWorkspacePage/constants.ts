import {AssignmentBase, AssignmentForReview, AssignmentForStudent} from "@/types";
import {BaseEntity} from "@/types/core/base";

export const DEFAULT_ASSIGNMENT_BASE: Omit<AssignmentBase, keyof BaseEntity> = {
  title: "New assignment",
  type: "Homework",
  dueTime: new Date("2026-01-01T00:00:00Z"),
  description: "Assignment description.",
  attachments: [],
  settings: {
    allowLateSubmission: false,
    allowedResubmissionCount: 0
  },
}

export const DEFAULT_ASSIGNMENT_FOR_STUDENT: Omit<AssignmentForStudent, keyof BaseEntity> = {
  ...DEFAULT_ASSIGNMENT_BASE,
  submission: null,
  review: null,
}

export const DEFAULT_ASSIGNMENT_FOR_REVIEW: Omit<AssignmentForReview, keyof BaseEntity> = {
  ...DEFAULT_ASSIGNMENT_BASE,
  studentStates: []
}