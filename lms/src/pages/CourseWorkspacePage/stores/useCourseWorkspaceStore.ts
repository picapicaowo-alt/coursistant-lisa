import {create} from 'zustand';
import {ContextSlice, createContextSlice} from "./slices/contextSlice";
import {CourseDataSlice, createCourseDataSlice} from "./slices/courseDataSlice";
import {immer} from 'zustand/middleware/immer';
import {AggregateRootSlice, DataSliceConfig, RelationConfig} from "@/types/core/base";
import {
  AssignmentEntity,
  assignmentEntityConfig,
  CourseEntity,
  CourseUnitEntity,
  FileEntity,
  fileEntityConfig
} from "../workspaceEntities";
import {AggregateRootGenerator} from "@/stores/core/AggregateRootGenerator";

const relationsConfig: RelationConfig[] = [{
  sourceEntity: 'courses',
  targetEntity: 'courseUnits',
  relationName: 'courseCourseUnits',
  type: 'oneToMany'
}, {
  sourceEntity: 'courseUnits',
  targetEntity: 'assignments',
  relationName: 'courseUnitAssignments',
  type: 'oneToMany'
}, {
  sourceEntity: 'assignments',
  targetEntity: 'files',
  relationName: 'assignmentFiles',
  type: 'oneToMany'
}];

type AggregateRoot = {
  courses: CourseEntity;
  courseUnits: CourseUnitEntity;
  assignments: AssignmentEntity;
  files: FileEntity;
};

const config: DataSliceConfig<AggregateRoot> = {
  entities: {
    courses: {},
    courseUnits: {},
    assignments: assignmentEntityConfig,
    files: fileEntityConfig,
  },
  relations: relationsConfig
};

export type CourseWorkspaceStore = AggregateRootSlice<AggregateRoot> & ContextSlice & CourseDataSlice;

export const createCourseWorkspaceStore = () => {
  const createRoot = AggregateRootGenerator.createAggregateRoot(config);
  return create<CourseWorkspaceStore>()(
    immer((set, get, store) => ({
      ...createRoot(set as never, get as never, store as never),
      ...createContextSlice(set, get, store),
      ...createCourseDataSlice(set, get, store),
    })));
};

export const useCourseWorkspaceStore = createCourseWorkspaceStore();

