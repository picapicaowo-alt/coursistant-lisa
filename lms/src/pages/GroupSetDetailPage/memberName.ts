import type {CourseGroup, UngroupedStudent} from '@/apis';
import {formatPersonName} from '@/utils/personName';

const legacyDisplayName = (value?: string | null): string => value?.trim() ?? '';

export const groupMemberName = (member: CourseGroup['members'][number]): string => formatPersonName({
  firstName: member.userFirstName,
  middleName: member.userMiddleName,
  lastName: member.userLastName,
}) || legacyDisplayName(member.displayName) || `User ${member.userId}`;

export const ungroupedStudentName = (student: UngroupedStudent): string => formatPersonName({
  firstName: student.studentFirstName,
  middleName: student.studentMiddleName,
  lastName: student.studentLastName,
}) || legacyDisplayName(student.displayName) || `User ${student.userId}`;
