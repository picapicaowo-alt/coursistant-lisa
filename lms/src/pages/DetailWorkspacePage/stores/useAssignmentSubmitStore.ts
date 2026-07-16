import {AggregateRootSlice, DataSliceConfig, RelationConfig} from "@/types/core/base";
import {create} from "zustand";
import {immer} from "zustand/middleware/immer";
import {AggregateRootGenerator} from "@/stores/core/AggregateRootGenerator";
import {
  AssignmentEntity,
  assignmentEntityConfig,
  FileEntity,
  fileEntityConfig, ReviewEntity, SubmissionEntity
} from "@/pages/DetailWorkspacePage/config";
import {
  AssignmentSubmissionSlice,
  createAssignmentSubmitSlice
} from "@/pages/DetailWorkspacePage/components/AssignmentSubmit/index.slice";

const relationsConfig: RelationConfig[] = [{
  sourceEntity: 'assignments',
  targetEntity: 'files',
  relationName: 'assignmentFiles',
  type: 'oneToMany'
}, {
  sourceEntity: "assignments",
  targetEntity: "submissions",
  relationName: "assignmentSubmissions",
  type: "oneToMany"
}, {
  sourceEntity: "submissions",
  targetEntity: "files",
  relationName: "submissionFiles",
  type: "oneToMany"
}, {
  sourceEntity: "submissions",
  targetEntity: "reviews",
  relationName: "submissionReviews",
  type: "oneToMany"
}];

type AggregateRoot = {
  assignments: AssignmentEntity;
  files: FileEntity;
  submissions: SubmissionEntity;
  reviews: ReviewEntity;
};

const config: DataSliceConfig<AggregateRoot> = {
  entities: {
    assignments: assignmentEntityConfig,
    files: fileEntityConfig,
    submissions: {},
    reviews: {}
  },
  relations: relationsConfig,
};

export type AssignmentSubmissionStore = AggregateRootSlice<AggregateRoot> & AssignmentSubmissionSlice;

export const useAssignmentSubmitStore = create<AssignmentSubmissionStore>()(
  immer((...args) => ({
    ...AggregateRootGenerator.createAggregateRoot(config)(...args),
    ...createAssignmentSubmitSlice(...args),
  }))
);