import type {GradingRoster, MyGradeItem} from '@/apis';

export interface MonthlyAveragePoint {
  key: string;
  label: string;
  average: number | null;
  earned: number;
  possible: number;
}

export interface AverageScoreSummary {
  series: MonthlyAveragePoint[];
  overall: number | null;
}

/**
 * Converts the grading rosters available to teaching staff into the same
 * point-weighted shape used by the student's released-grade feed. Group
 * grades are weighted by member count so a two-person group and a six-person
 * group contribute the correct number of learner results to the course mean.
 */
export const buildStaffAverageGradeItems = (rosters: GradingRoster[]): MyGradeItem[] => rosters.flatMap(roster => (
  roster.items.flatMap(item => {
    if (item.gradeStatus === 'Ungraded' || !Number.isFinite(item.score) || !Number.isFinite(roster.pointsPossible) || roster.pointsPossible! <= 0) {
      return [];
    }

    const learnerWeight = Math.max(1, item.memberCount ?? 1);
    return [{
      assignmentId: roster.assignmentId,
      assignmentTitle: roster.assignmentTitle,
      itemType: 'assignment',
      dueAtUtc: roster.dueAtUtc,
      dueAtLocal: roster.dueAtLocal,
      timezone: roster.timezone,
      released: true,
      releasedAt: item.releasedAt ?? roster.dueAtUtc,
      pointsEarned: item.score! * learnerWeight,
      pointsPossible: roster.pointsPossible! * learnerWeight,
    }];
  })
));

const monthKey = (date: Date) => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;

export const buildAverageScoreSummary = (
  grades: MyGradeItem[],
  referenceDate = new Date(),
  monthCount = 5,
): AverageScoreSummary => {
  const months: MonthlyAveragePoint[] = Array.from({length: monthCount}, (_, index) => {
    const date = new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth() - (monthCount - 1 - index), 1));
    return {
      key: monthKey(date),
      label: new Intl.DateTimeFormat('en', {month: 'short', timeZone: 'UTC'}).format(date),
      average: null,
      earned: 0,
      possible: 0,
    };
  });
  const byKey = new Map(months.map(month => [month.key, month]));
  let totalEarned = 0;
  let totalPossible = 0;

  grades.forEach(grade => {
    const earned = grade.pointsEarned ?? grade.score;
    const possible = grade.pointsPossible;
    if (!grade.released || !Number.isFinite(earned) || !Number.isFinite(possible) || possible! <= 0) return;

    totalEarned += earned!;
    totalPossible += possible!;
    const date = new Date(grade.releasedAt ?? grade.dueAtUtc);
    if (Number.isNaN(date.getTime())) return;
    const month = byKey.get(monthKey(date));
    if (!month) return;
    month.earned += earned!;
    month.possible += possible!;
  });

  months.forEach(month => {
    month.average = month.possible > 0 ? Math.round((month.earned / month.possible) * 1000) / 10 : null;
  });

  return {
    series: months,
    overall: totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 1000) / 10 : null,
  };
};
