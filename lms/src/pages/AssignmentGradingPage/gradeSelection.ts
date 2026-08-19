import type {GradeSelectionPayload, GradingRosterItem} from '@/apis';

export const rosterRowKey = (row: GradingRosterItem) =>
  row.groupId !== undefined ? `group-${row.groupId}` : `student-${row.studentUserId}`;

export const buildGradeSelection = (
  rows: GradingRosterItem[],
  selectedKeys: Set<string>,
): GradeSelectionPayload => {
  const studentUserIds: number[] = [];
  const groupIds: number[] = [];
  for (const row of rows) {
    if (!selectedKeys.has(rosterRowKey(row))) continue;
    if (row.groupId !== undefined) groupIds.push(row.groupId);
    else if (row.studentUserId !== undefined) studentUserIds.push(row.studentUserId);
  }
  return {
    ...(studentUserIds.length ? {studentUserIds} : {}),
    ...(groupIds.length ? {groupIds} : {}),
  };
};
