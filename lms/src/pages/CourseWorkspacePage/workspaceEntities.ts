import {BaseEntity, EntityConfig} from "@/types/core/base";

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
