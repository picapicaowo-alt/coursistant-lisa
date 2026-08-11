import {BaseEntity, EntityConfig} from "@/types/core/base";

/**
 * A course in the workspace store.
 *
 * Optional fields have no source in the current API: `school`, `semester` and
 * `teacherPhone` are left over from the previous backend, and instructor
 * contact details only arrive when the course carries a primary instructor.
 * A course does have term dates and a location, which the old shape lacked.
 * Keeping the absent ones optional stops the UI from printing empty strings
 * as though the values were blank rather than unavailable.
 */
export interface CourseEntity extends BaseEntity {
  courseCode: string;
  name: string;
  description: string;
  termStartDate?: string;
  termEndDate?: string;
  location?: string | null;
  teacherName?: string;
  teacherEmail?: string;
  school?: string;
  semester?: string;
  teacherPhone?: string;
}

export interface CourseUnitEntity extends BaseEntity {
  sortOrder: number;
  title: string;
  description: string;
}

export interface AssignmentEntity extends BaseEntity {
  title: string;
  description: string;
  type: string;
  dueTime: Date;
  settings: {
    allowLateSubmission: boolean;
    allowedResubmissionCount: number;
  };
}

export const assignmentEntityConfig: EntityConfig<AssignmentEntity> = {
  defaultValues: {
    title: "New assignment",
    description: "No description...",
    type: "homework",
    dueTime: new Date(),
    settings: {
      allowLateSubmission: false,
      allowedResubmissionCount: 0,
    }
  },
  validate: (data) => {
    const errors: Record<string, string> = {};
    if (!data.title) errors.title = 'Title is required';
    return Object.keys(errors).length > 0 ? errors : null;
  },
};

export interface FileEntity extends BaseEntity {
  filename: string;
  fileSize: number;
  mimeType: string;
  filePath: string;
}

export const fileEntityConfig: EntityConfig<FileEntity> = {
  validate: (data) => {
    const errors: Record<string, string> = {};
    if (!data.filename) errors.name = 'Filename is required';
    return Object.keys(errors).length > 0 ? errors : null;
  }
};

export interface SubmissionEntity extends BaseEntity {
  studentName: string;
  submissionCount: number;
  submissionContent: string;
}

export interface ReviewEntity extends BaseEntity {
  grade: number;
  teacherComment: string;
}