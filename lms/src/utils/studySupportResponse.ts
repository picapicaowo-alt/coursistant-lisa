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

  const userFacingAnswer = answer
    // The agent can append diagnostic blocks for verbose clients. They are
    // internal metadata, not part of the student-facing answer or progress UI.
    .replace(/\/begin-(think|rss)\/[\s\S]*?\/end-\1\//gi, '')
    .trim();

  if (!userFacingAnswer) {
    throw new Error('Study Support returned an empty response.');
  }
  return userFacingAnswer;
};
