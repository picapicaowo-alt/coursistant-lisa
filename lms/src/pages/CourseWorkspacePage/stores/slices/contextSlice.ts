import {StateCreator} from 'zustand';
import {CourseWorkspaceStore} from "../useCourseWorkspaceStore";
import {UserRole, WorkspaceMode} from "../../types";

export type DetailWorkspaceProps = {
  type: string;
  query: Record<string, unknown>;
};

export interface ContextSlice {
  /** Legacy detail-workspace audience. Privileged page controls no longer use this value. */
  role: UserRole;
  setRole: (role: UserRole) => void;
  workspaceMode: WorkspaceMode;
  setWorkspaceMode: (mode: WorkspaceMode) => void;
  detailWorkspaceProps: DetailWorkspaceProps | null;
  openDetailWorkspace: (props: DetailWorkspaceProps) => void;
  closeDetailWorkspace: () => void;
}

export const createContextSlice: StateCreator<
  CourseWorkspaceStore,
  [["zustand/immer", never]],
  [],
  ContextSlice
> = (set, get) => {
  let previousWorkspaceMode: WorkspaceMode = "view";
  
  return {
    // Fail closed until a course enrollment is resolved.
    role: "student",
    workspaceMode: "view",
    detailWorkspaceProps: null,

    setRole: (role) => set((state) => {
      state.role = role;
    }),

    setWorkspaceMode: (mode) => set((state) => {
      state.workspaceMode = mode;
    }),
    
    openDetailWorkspace: (props) => {
      const {workspaceMode} = get();
      previousWorkspaceMode = workspaceMode;
      set((state) => {
        state.workspaceMode = "detailWorkspace";
        state.detailWorkspaceProps = props;
      });
    },
    
    closeDetailWorkspace: () => {
      set((state) => {
        state.workspaceMode = previousWorkspaceMode;
        state.detailWorkspaceProps = null;
      });
    },
  };
};
