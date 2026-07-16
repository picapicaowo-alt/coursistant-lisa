import {create} from "zustand";
import {immer} from "zustand/middleware/immer";
import {AggregateRootSlice, DataSliceConfig, RelationConfig} from "@/types/core/base";
import {
  AssignmentEntity,
  assignmentEntityConfig,
  FileEntity,
  fileEntityConfig
} from "@/pages/DetailWorkspacePage/config";
import {AggregateRootGenerator} from "@/stores/core/AggregateRootGenerator";
import {
  AssignmentEditSlice,
  createAssignmentEditSlice
} from "@/pages/DetailWorkspacePage/components/AssignmentEdit/index.slice";

const relationsConfig: RelationConfig[] = [{
  sourceEntity: 'assignments',
  targetEntity: 'files',
  relationName: 'assignmentFiles',
  type: 'oneToMany'
}];

type AggregateRoot = {
  assignments: AssignmentEntity;
  files: FileEntity;
};

const config: DataSliceConfig<AggregateRoot> = {
  entities: {
    assignments: assignmentEntityConfig,
    files: fileEntityConfig,
  },
  relations: relationsConfig
};

export type AssignmentEditStore = AggregateRootSlice<AggregateRoot> & AssignmentEditSlice;

export const useAssignmentEditStore = create<AssignmentEditStore>()(
  immer((...args) => ({
    ...AggregateRootGenerator.createAggregateRoot(config)(...args),
    ...createAssignmentEditSlice(...args),
  }))
);