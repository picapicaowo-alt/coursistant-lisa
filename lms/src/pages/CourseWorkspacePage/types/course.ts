import {AssignmentPreview} from "./assignment";

export interface CourseInfo {
  courseCode: string;
  name: string;
  description: string;
  school: string;
  semester: string;
  teacherName: string;
  teacherPhone: string;
  teacherEmail: string;
  courseUnits: CourseUnit[];
}

export interface CourseUnit {
  id: number;
  // The index (starting from 0) the unit appears in the units list
  sortOrder: number;
  title: string;
  // A markdown string (disallow html for safety)
  description: string;
  assignments: AssignmentPreview[]
}