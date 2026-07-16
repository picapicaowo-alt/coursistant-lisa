export interface AssignmentPreview {
  id: number;
  // The index (starting from 0) the assignment appears in the assignments list
  index: number;
  title: string;
  type: string;
  // A specified time format should be agreed
  dueTime: string;
}