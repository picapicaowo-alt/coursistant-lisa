import React from "react";
import {StudentAssignmentQuery} from "../components/AssignmentSubmit/index.config";
import {AssignmentReviewQuery} from "../components/AssignmentReview/index.config";
import {AssignmentEditQuery} from "../components/AssignmentEdit/index.config";
import {LoadableStore} from "@/types/stores";
import {AssignmentForEditResponse, AssignmentForReviewResponse, AssignmentForSubmissionResponse} from "@/apis";

export type DetailWorkspaceType =
  "student-assignment"
  | "teacher-assignment-review"
  | "teacher-assignment-edit";

export type DetailWorkspaceDataMap = {
  "student-assignment": AssignmentForSubmissionResponse;
  "teacher-assignment-review": AssignmentForReviewResponse;
  "teacher-assignment-edit": AssignmentForEditResponse;
}

export type DetailWorkspaceQueryMap = {
  "student-assignment": StudentAssignmentQuery;
  "teacher-assignment-review": AssignmentReviewQuery;
  "teacher-assignment-edit": AssignmentEditQuery;
};

export type DetailWorkspaceStoreMap = {
  "student-assignment": LoadableStore<AssignmentForSubmissionResponse>;
  "teacher-assignment-review": LoadableStore<AssignmentForReviewResponse>;
  "teacher-assignment-edit": LoadableStore<AssignmentForEditResponse>;
};

export interface DetailWorkspaceConfig<
  TType extends DetailWorkspaceType = DetailWorkspaceType
> {
  type: TType;
  component: React.ComponentType;
  store: () => DetailWorkspaceStoreMap[TType];
  queryFn: (
    query: DetailWorkspaceQueryMap[TType]
  ) => () => Promise<DetailWorkspaceDataMap[TType]>;
  queryKey: (
    query: DetailWorkspaceQueryMap[TType]
  ) => string[];
}

export type DetailWorkspaceProps = {
  [T in DetailWorkspaceType]: {
    type: T;
    query: DetailWorkspaceQueryMap[T];
  };
}[DetailWorkspaceType];

export type DetailWorkspaceConfigMap = {
  [TType in DetailWorkspaceType]: DetailWorkspaceConfig<TType>;
};