interface StudySupportRequestInput {
  courseId: number;
  query: string;
  dialogueId: number;
  file?: File | null;
}

/**
 * Builds the agent-compatible multipart request. Identity is intentionally
 * absent: the AI agent derives the caller from the verified access token.
 */
export const buildStudySupportFormData = ({
  courseId,
  query,
  dialogueId,
  file,
}: StudySupportRequestInput): FormData => {
  const formData = new FormData();
  formData.append('courseId', String(courseId));
  formData.append('query', query);
  formData.append('dialogueId', String(dialogueId));
  if (file) formData.append('file', file);
  return formData;
};

export const buildStudySupportStreamBody = ({
  courseId,
  query,
  dialogueId,
}: Omit<StudySupportRequestInput, 'file'>): URLSearchParams => {
  const body = new URLSearchParams();
  body.set('courseId', String(courseId));
  body.set('query', query);
  body.set('dialogueId', String(dialogueId));
  return body;
};
