import {describe, expect, it} from 'vitest';
import type {CourseGroupMembership, UngroupedStudent} from '@/apis';
import {groupMemberName, ungroupedStudentName} from './memberName';

const membership = (overrides: Partial<CourseGroupMembership> = {}): CourseGroupMembership => ({
  groupId: 18,
  userId: 453,
  userFirstName: null,
  userMiddleName: null,
  userLastName: null,
  joinedAt: '2026-08-29T00:00:00',
  addedByType: 'STAFF',
  addedByUserId: 1,
  ...overrides,
});

const ungroupedStudent = (overrides: Partial<UngroupedStudent> = {}): UngroupedStudent => ({
  userId: 467,
  studentFirstName: null,
  studentMiddleName: null,
  studentLastName: null,
  ...overrides,
});

describe('group member names', () => {
  it('prefers the structured roster name', () => {
    expect(groupMemberName(membership({
      displayName: 'Legacy Name',
      userFirstName: 'Ada',
      userLastName: 'Lovelace',
    }))).toBe('Ada Lovelace');
  });

  it('uses the legacy group displayName during contract migration', () => {
    expect(groupMemberName(membership({displayName: '  Grace Hopper  '}))).toBe('Grace Hopper');
    expect(ungroupedStudentName(ungroupedStudent({displayName: '  Katherine Johnson  '}))).toBe('Katherine Johnson');
  });

  it('uses the user id only when neither name shape is available', () => {
    expect(groupMemberName(membership({displayName: '   '}))).toBe('User 453');
    expect(ungroupedStudentName(ungroupedStudent())).toBe('User 467');
  });
});
