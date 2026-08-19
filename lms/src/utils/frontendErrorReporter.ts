import {getAppEnv} from '@/config/env';

const redact = (value: unknown): unknown => {
  if (typeof value !== 'object' || value === null) return value;
  if (Array.isArray(value)) return value.map(redact);
  const redacted: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (/token|password|email|authorization|cookie/i.test(key)) {
      redacted[key] = '[redacted]';
      continue;
    }
    redacted[key] = redact(entry);
  }
  return redacted;
};

/**
 * Last-resort browser error sink. Do not put PII, tokens, or request bodies here.
 * Replace the DEV console path with Sentry/OTel when a production sink is wired.
 */
export const frontendErrorReporter = {
  capture(error: unknown, context: Record<string, unknown> = {}): void {
    const env = getAppEnv();
    const payload = {
      message: error instanceof Error ? error.message : 'Unknown error',
      release: env.release,
      gitSha: env.gitSha,
      context: redact(context),
    };
    if (import.meta.env.DEV) {
      console.error('Unhandled render error', payload);
    }
  },
};
