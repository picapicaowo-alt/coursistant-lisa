const asRecord = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;

const INTERNAL_AGENT_BLOCK = /\/begin-(think|rss)\/[\s\S]*?(?:\/end-\1\/|$)/gi;
const ORPHANED_AGENT_MARKER = /\/(?:begin|end)-(?:think|rss)\//gi;

/**
 * Removes verbose model diagnostics from an agent answer before it reaches a
 * message component. An unterminated block is discarded through end-of-text so
 * a truncated response can never expose internal output.
 */
export const sanitizeAgentAnswer = (answer: string): string => answer
  .replace(INTERNAL_AGENT_BLOCK, '')
  .replace(ORPHANED_AGENT_MARKER, '')
  .replace(/\n{3,}/g, '\n\n')
  .trim();

export const readStudySupportAnswer = (responseBody: unknown): string => {
  const root = asRecord(responseBody);
  const data = asRecord(root?.data);
  const answer = data?.answer ?? root?.answer;

  if (typeof answer !== 'string' || !answer.trim()) {
    throw new Error('Study Support returned an empty response.');
  }

  const userFacingAnswer = sanitizeAgentAnswer(answer);

  if (!userFacingAnswer) {
    throw new Error('Study Support returned an empty response.');
  }
  return userFacingAnswer;
};
