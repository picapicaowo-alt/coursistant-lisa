import {describe, expect, it} from 'vitest';
import {buildAverageScoreSummary, buildStaffAverageGradeItems} from './averageScore';

describe('buildAverageScoreSummary', () => {
  it('weights released grades by points possible and groups them by month', () => {
    const result = buildAverageScoreSummary([
      {assignmentId: 1, dueAtUtc: '2026-06-10T00:00:00Z', releasedAt: '2026-06-12T00:00:00Z', released: true, pointsEarned: 8, pointsPossible: 10},
      {assignmentId: 2, dueAtUtc: '2026-06-20T00:00:00Z', releasedAt: '2026-06-22T00:00:00Z', released: true, pointsEarned: 45, pointsPossible: 50},
      {assignmentId: 3, dueAtUtc: '2026-07-10T00:00:00Z', releasedAt: '2026-07-12T00:00:00Z', released: true, score: 18, pointsPossible: 20},
    ], new Date('2026-08-18T00:00:00Z'));

    expect(result.series.map(point => point.label)).toEqual(['Apr', 'May', 'Jun', 'Jul', 'Aug']);
    expect(result.series[2].average).toBe(88.3);
    expect(result.series[3].average).toBe(90);
    expect(result.overall).toBe(88.8);
  });

  it('does not expose drafts, unreleased grades, or zero-point items', () => {
    const result = buildAverageScoreSummary([
      {assignmentId: 1, dueAtUtc: '2026-08-10T00:00:00Z', released: false, pointsEarned: 10, pointsPossible: 10},
      {assignmentId: 2, dueAtUtc: '2026-08-10T00:00:00Z', released: true, pointsEarned: 0, pointsPossible: 0},
    ], new Date('2026-08-18T00:00:00Z'));
    expect(result.overall).toBeNull();
    expect(result.series.every(point => point.average === null)).toBe(true);
  });

  it('weights teaching-side group grades by the number of learners', () => {
    const grades = buildStaffAverageGradeItems([{
      assignmentId: 10,
      assignmentTitle: 'Group project',
      pointsPossible: 100,
      dueAtUtc: '2026-08-10T00:00:00Z',
      dueAtLocal: '2026-08-09T17:00:00',
      timezone: 'America/Los_Angeles',
      totalStudents: 4,
      submittedCount: 4,
      lateCount: 0,
      notSubmittedCount: 0,
      ungradedCount: 0,
      enteredCount: 1,
      releasedCount: 1,
      gradingWritable: true,
      items: [
        {groupId: 1, memberCount: 3, submissionStatus: 'Submitted', gradeStatus: 'Entered', score: 80},
        {groupId: 2, memberCount: 1, submissionStatus: 'Submitted', gradeStatus: 'Released', score: 100, releasedAt: '2026-08-12T00:00:00Z'},
      ],
    }]);

    expect(buildAverageScoreSummary(grades, new Date('2026-08-18T00:00:00Z')).overall).toBe(85);
  });
});
