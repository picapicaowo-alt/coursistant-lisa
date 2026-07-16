import {FileDto} from '@/types';

export interface AssignmentBase {
  id: string;
  title: string;
  description: string;
  type: string;
  dueTime: string;
  attachments: FileDto[];
  updatedAt: string;
  settings: AssignmentSettings;
}

export interface AssignmentSettings {
  allowLateSubmission: boolean;
  allowedResubmissionCount: number;
}