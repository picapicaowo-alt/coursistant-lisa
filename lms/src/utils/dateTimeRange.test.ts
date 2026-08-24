import {describe, expect, it} from 'vitest';
import {
  addMinutesToDateTimeValue,
  addMinutesToTimeValue,
  dateTimeDurationMinutes,
  defaultDateTimeRange,
  defaultTimeRange,
  durationLabel,
  roundUpToMinutes,
  timeDurationMinutes,
} from './dateTimeRange';

describe('dateTimeRange', () => {
  it('rounds a new start up to the next half hour and defaults the end one hour later', () => {
    expect(defaultDateTimeRange(new Date(2026, 7, 24, 8, 7, 12))).toEqual({
      start: '2026-08-24T08:30',
      end: '2026-08-24T09:30',
    });
    expect(roundUpToMinutes(new Date(2026, 7, 24, 8, 30, 0))).toEqual(new Date(2026, 7, 24, 8, 30, 0));
  });

  it('creates a safe one-hour event range and rolls very late defaults to tomorrow morning', () => {
    expect(defaultTimeRange(new Date(2026, 7, 24, 10, 4))).toEqual({date: '2026-08-24', start: '10:30', end: '11:30'});
    expect(defaultTimeRange(new Date(2026, 7, 24, 23, 20))).toEqual({date: '2026-08-25', start: '09:00', end: '10:00'});
  });

  it('updates datetime and time-only ends from a selected duration', () => {
    expect(addMinutesToDateTimeValue('2026-08-24T23:30', 60)).toBe('2026-08-25T00:30');
    expect(addMinutesToTimeValue('10:15', 90)).toBe('11:45');
    expect(addMinutesToTimeValue('23:30', 60)).toBe('');
  });

  it('detects preset and custom durations', () => {
    expect(dateTimeDurationMinutes('2026-08-24T10:00', '2026-08-24T11:30')).toBe(90);
    expect(timeDurationMinutes('10:00', '11:00')).toBe(60);
    expect(timeDurationMinutes('11:00', '10:00')).toBeNull();
    expect(durationLabel(10080)).toBe('1 week');
  });
});
