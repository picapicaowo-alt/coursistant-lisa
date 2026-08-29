import {describe, expect, it} from 'vitest';
import type {GradingRosterItem} from '@/apis';
import {buildGradeSelection, rosterRowKey} from './gradeSelection';

const student: GradingRosterItem = {
  studentUserId: 389,
  studentFirstName: 'Eden',
  studentMiddleName: null,
  studentLastName: 'Brooks',
  submissionStatus: 'Submitted',
  gradeStatus: 'Entered',
};
const group: GradingRosterItem = {
  groupId: 21,
  groupName: 'Team A',
  submissionStatus: 'Submitted',
  gradeStatus: 'Released',
};

describe('buildGradeSelection', () => {
  it('splits selected roster rows into student and group ids', () => {
    const keys = new Set([rosterRowKey(student), rosterRowKey(group)]);
    expect(buildGradeSelection([student, group], keys)).toEqual({
      studentUserIds: [389],
      groupIds: [21],
    });
  });
});
