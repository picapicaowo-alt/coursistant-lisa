import {describe, expect, it, vi} from 'vitest';
import {formatUtcTimestamp, parseUtcTimestamp} from './datetime';

describe('UTC timestamp display', () => {
  it('treats a zone-less backend LocalDateTime as UTC', () => {
    expect(parseUtcTimestamp('2026-08-24T04:47:21').toISOString()).toBe('2026-08-24T04:47:21.000Z');
    expect(parseUtcTimestamp('2026-08-24 04:47:21').toISOString()).toBe('2026-08-24T04:47:21.000Z');
  });

  it('does not alter an instant that already has a timezone', () => {
    expect(parseUtcTimestamp('2026-08-24T04:47:21Z').toISOString()).toBe('2026-08-24T04:47:21.000Z');
    expect(parseUtcTimestamp('2026-08-23T21:47:21-07:00').toISOString()).toBe('2026-08-24T04:47:21.000Z');
  });

  it('formats normalized UTC in the viewer timezone with a zone label', () => {
    vi.stubEnv('TZ', 'America/Los_Angeles');
    expect(formatUtcTimestamp('2026-08-24T04:47:21')).toContain('Aug 23, 2026');
    expect(formatUtcTimestamp('2026-08-24T04:47:21')).toMatch(/PDT|GMT-7/);
    vi.unstubAllEnvs();
  });
});
