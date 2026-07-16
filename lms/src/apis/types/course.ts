export interface CoursePreviewResponse {
  id: number;
  courseCode: string;
  name: string;
  teacherName: string;
  courseUnitsCount: number;
  avatarUrl?: string;
}

export interface CourseInfo {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  courseCode: string;
  name: string;
  description: string;
  school: string;
  semester: string;
  teacherName: string;
  teacherPhone: string;
  teacherEmail: string;
}

export interface CourseUnit {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  sortOrder: number;
  title: string;
  description: string;
}

export interface AssignmentPreview {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  courseUnitId: number;
  title: string;
  type: string;
  dueTime: Date;
}

export interface CourseDetailDTO {
  courseInfo: CourseInfo;
  courseUnits: CourseUnit[];
  assignments: AssignmentPreview[];
}

export interface CreateCourseRequest {
  courseCode: string;
  name: string;
  description: string;
  school: string;
  semester: string;
}

export interface CreateCourseUnitRequest {
  sortOrder: number;
  title: string;
  description: string;
}

export interface CreateAssignmentRequest {
  title: string;
  type: string;
  dueTime: string;
}

export interface CourseUpdate {
  courseCode?: string;
  name?: string;
  description?: string;
  school?: string;
  semester?: string;
}

export interface CourseUnitUpdate {
  sortOrder?: number;
  title?: string;
  description?: string;
}

export interface AssignmentUpdate {
  title?: string;
  description?: string;
  type?: string;
  dueTime?: Date;
  settings?: {
    allowLateSubmission: boolean;
    allowedResubmissionCount: number;
  };
}

export interface UpdateCourseRequest {
  courseUpdate?: CourseUpdate;
  courseUnitUpdateMap?: Record<number, CourseUnitUpdate>;
  assignmentUpdateMap?: Record<number, AssignmentUpdate>;
}