/**
 * An entry from `GET /v2/courses` — see docs/api/course_module-api_en.md 5.1.
 *
 * This is the browse listing for admins and instructors, not a personal one:
 * a plain Student or TA calling it gets 403 ACCESS_DENIED. Anything showing
 * "my courses" must use `GET /v2/me/courses` instead.
 */
export interface CourseSummary {
  id: number;
  /** Same value as `id`. */
  courseId: number;
  tenantId: number;
  courseCode: string;
  title: string;
  state: 'Active' | 'Archived';
  instructorId: number | null;
  primaryInstructor: {
    userId: number;
    name?: string;
    email?: string;
  } | null;
}

/** `GET /v2/courses` returns this page object, not a bare array. */
export interface CoursePageResponse {
  items: CourseSummary[];
  page: number;
  size: number;
  total: number;
}

export interface CourseBrowseParams {
  /** Free-text search. */
  q?: string;
  state?: 'Active' | 'Archived';
  /** SYSTEM_ADMIN only; ignored for other callers. */
  tenantId?: number;
  page?: number;
  /** Default 20, capped at 100. */
  size?: number;
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