import {describe, expect, it} from 'vitest';
import {normalizeCourseLocalDateTime, toCourseLocalDateTimeInput} from './courseLocalDateTime';

describe('course-local assignment date-times', () => {
  it('normalizes accepted wall-clock formats without applying a timezone conversion', () => {
    expect(normalizeCourseLocalDateTime('2026-09-20T23:59')).toBe('2026-09-20T23:59:00');
    expect(normalizeCourseLocalDateTime('2026-09-20T23:59:42')).toBe('2026-09-20T23:59:42');
    expect(toCourseLocalDateTimeInput('2026-09-20T23:59:00')).toBe('2026-09-20T23:59');
  });

  it.each([
    '2026-09-21T06:59:00Z',
    '2026-09-20T23:59:00-07:00',
    '2026-09-20T23:59:00.123',
    '2026-02-29T23:59:00',
    '2026-09-20T24:00:00',
  ])('rejects a non-local or invalid value: %s', value => {
    expect(normalizeCourseLocalDateTime(value)).toBeNull();
  });

  it('rejects non-string values', () => {
    expect(normalizeCourseLocalDateTime(null)).toBeNull();
    expect(normalizeCourseLocalDateTime(20260920)).toBeNull();
  });
});
