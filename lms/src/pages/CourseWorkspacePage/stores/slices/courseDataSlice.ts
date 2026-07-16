import {StateCreator} from 'zustand';
import {CourseWorkspaceStore} from "../useCourseWorkspaceStore";
import {CourseEntity} from "@/pages/DetailWorkspacePage/config";
import {CourseDetailDTO} from "@/apis";

export interface CourseDataSlice {
  loadCourseInfo: (courseInfo: CourseDetailDTO) => void;
  course: CourseEntity;
}

export const createCourseDataSlice: StateCreator<
  CourseWorkspaceStore,
  [["zustand/immer", never]],
  [],
  CourseDataSlice
> = (set, get) => ({
  loadCourseInfo: (courseInfo) => {
    const {load, addRelations} = get();
    load("courses", {...courseInfo.courseInfo});
    const unitIds = Array<number>();
    
    for (const unit of courseInfo.courseUnits) {
      load("courseUnits", {...unit});
      unitIds.push(unit.id);
    }
    addRelations("courseCourseUnits", courseInfo.courseInfo.id, unitIds);
    
    for (const assignment of courseInfo.assignments) {
      load("assignments", {
        ...assignment, description: "", settings: {
          allowLateSubmission: false,
          allowedResubmissionCount: 0
        }, dueTime: new Date(assignment.dueTime)
      });
      addRelations("courseUnitAssignments", assignment.courseUnitId, [assignment.id]);
    }
    
    set((state) => {
      state.course = {...courseInfo.courseInfo};
    });
  },
  
  course: {
    courseCode: "",
    name: "",
    description: "",
    school: "",
    semester: "",
    teacherName: "",
    teacherPhone: "",
    teacherEmail: "",
    id: -1,
    createdAt: new Date(),
    updatedAt: new Date()
  }
});