import {describe, expect, it} from 'vitest';
import {expandSessions} from './calendarData';

describe('expandSessions', () => {
  it('creates recurring occurrences only inside both the term and visible window', () => {
    const items = expandSessions(
      {id: 37, courseCode: 'EE-503', title: 'Probability'},
      [{id: 9, courseId: 37, type: 'Lecture', dayOfWeek: 'TUE', startTime: '11:00:00', endTime: '12:20:00', location: 'OHE 132', timezone: 'America/Los_Angeles'}],
      '2026-08-24',
      '2026-09-05',
      '2026-08-23',
      '2026-09-12',
    );

    expect(items.map(item => item.date)).toEqual(['2026-08-25', '2026-09-01']);
    expect(items[0]).toMatchObject({kind: 'Session', startTime: '11:00', endTime: '12:20', path: '/course/37/schedule'});
  });
});
