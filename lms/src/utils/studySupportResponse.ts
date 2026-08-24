const asRecord = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;

export const readStudySupportAnswer = (responseBody: unknown): string => {
  const root = asRecord(responseBody);
  const data = asRecord(root?.data);
  const answer = data?.answer ?? root?.answer;

  if (typeof answer !== 'string' || !answer.trim()) {
    throw new Error('Study Support returned an empty response.');
  }

  return answer.trim();
};
