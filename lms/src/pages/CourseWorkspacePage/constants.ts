import {AssignmentPreview, CourseInfo, CourseUnit} from "./types";

export const DEFAULT_COURSE_INFO: CourseInfo = {
  courseCode: "COURSE",
  name: "New Course",
  description: "Course description.",
  school: "",
  semester: "Spring 2025",
  teacherName: "",
  teacherPhone: "",
  teacherEmail: "",
  courseUnits: []
};

export const DEFAULT_COURSE_UNIT: Omit<CourseUnit, 'id' | 'sortOrder'> = {
  title: 'New course unit',
  description: 'Unit description.',
  assignments: [],
};

export const DEFAULT_ASSIGNMENT_PREVIEW: Omit<AssignmentPreview, 'id' | 'index' | 'roleSpecificInfo'> = {
  title: "New assignment",
  type: "Homework",
  dueTime: "2026-01-01T00:00:00Z",
}