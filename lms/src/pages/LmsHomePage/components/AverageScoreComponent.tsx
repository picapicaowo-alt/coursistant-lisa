import React, {useMemo, useState} from 'react';
import {useQueries, useQuery} from '@tanstack/react-query';
import {unwrapData} from '@/apis';
import {assignmentApiService} from '@/apis/services/assignment-api';
import {useMyCourses} from '@/hooks/useCourseAccess';
import {formatCourseName} from '@/utils/course';
import {buildAverageScoreSummary, buildStaffAverageGradeItems} from '../utils/averageScore';
import styles from './AverageScoreComponent.module.scss';

const AverageScoreComponent: React.FC = () => {
  const coursesQuery = useMyCourses();
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const courses = useMemo(() => (coursesQuery.data ?? [])
    .filter(course => (course.state ?? course.status) === 'Active'), [coursesQuery.data]);
  const effectiveCourseId = courses.some(course => (course.id ?? course.courseId) === selectedCourseId)
    ? selectedCourseId
    : (courses[0]?.id ?? courses[0]?.courseId ?? null);
  const selectedCourse = courses.find(course => (course.id ?? course.courseId) === effectiveCourseId);
  const selectedRole = selectedCourse?.courseRole ?? selectedCourse?.role;
  const canReadStaffGrades = selectedRole === 'Instructor'
    || (selectedRole === 'TA' && selectedCourse?.canGrade === true);

  const studentGradesQuery = useQuery({
    queryKey: ['my-grades', effectiveCourseId],
    queryFn: async () => unwrapData(
      await assignmentApiService.listMyGrades(effectiveCourseId!),
      `listMyGrades ${effectiveCourseId}`,
    ),
    enabled: effectiveCourseId !== null && selectedRole === 'Student',
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const assignmentSummariesQuery = useQuery({
    queryKey: ['course-assignments', effectiveCourseId],
    queryFn: async () => unwrapData(
      await assignmentApiService.getCourseAssignmentSummaries(effectiveCourseId!),
      `getCourseAssignmentSummaries ${effectiveCourseId}`,
    ),
    enabled: effectiveCourseId !== null && canReadStaffGrades,
    staleTime: 5 * 60_000,
    retry: 1,
  });
  const staffRosterQueries = useQueries({
    queries: (canReadStaffGrades ? assignmentSummariesQuery.data ?? [] : []).map(assignment => ({
      queryKey: ['grading-roster', effectiveCourseId, assignment.id],
      queryFn: async () => unwrapData(
        await assignmentApiService.getGradingRoster(effectiveCourseId!, assignment.id),
        `getGradingRoster ${effectiveCourseId}/${assignment.id}`,
      ),
      staleTime: 5 * 60_000,
      retry: 1,
    })),
  });

  const staffGrades = useMemo(
    () => buildStaffAverageGradeItems(staffRosterQueries.flatMap(query => query.data ? [query.data] : [])),
    [staffRosterQueries],
  );
  const grades = useMemo(
    () => selectedRole === 'Student' ? studentGradesQuery.data ?? [] : staffGrades,
    [selectedRole, studentGradesQuery.data, staffGrades],
  );
  const summary = useMemo(() => buildAverageScoreSummary(grades), [grades]);
  const loading = coursesQuery.isPending
    || (selectedRole === 'Student' && studentGradesQuery.isPending)
    || (canReadStaffGrades && (assignmentSummariesQuery.isPending || staffRosterQueries.some(query => query.isPending)));
  const failed = coursesQuery.isError
    || (selectedRole === 'Student' && studentGradesQuery.isError)
    || (canReadStaffGrades && (assignmentSummariesQuery.isError || (staffRosterQueries.length > 0 && staffRosterQueries.every(query => query.isError))));

  const points = summary.series.flatMap((point, index) => point.average === null ? [] : [{
    x: 18 + index * 71,
    y: 108 - Math.max(0, Math.min(100, point.average)),
    value: point.average,
  }]);
  const polyline = points.map(point => `${point.x},${point.y}`).join(' ');

  return (
    <section className={styles.widget} aria-labelledby="average-score-title">
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>{selectedRole === 'Student' ? 'My released assignment grades' : 'Course assignment grades'}</p>
          <h2 id="average-score-title">Average grade</h2>
        </div>
        {summary.overall !== null ? <strong className={styles.score}>{summary.overall}%</strong> : null}
      </div>

      {courses.length > 0 ? (
        <label className={styles.coursePicker}>
          <span>Course</span>
          <select
            value={effectiveCourseId ?? ''}
            onChange={event => setSelectedCourseId(Number(event.target.value))}
          >
            {courses.map(course => {
              const courseId = course.id ?? course.courseId;
              return <option key={courseId} value={courseId}>{formatCourseName(course.courseCode, course.title ?? course.name)}</option>;
            })}
          </select>
        </label>
      ) : null}

      {loading ? <p className={styles.status}>Loading scores…</p> : null}
      {failed ? <p className={styles.status} role="alert">Scores couldn&apos;t be loaded.</p> : null}
      {!loading && !failed && courses.length === 0 ? <p className={styles.status}>No active courses.</p> : null}
      {!loading && !failed && selectedRole === 'TA' && !canReadStaffGrades ? <p className={styles.status}>Grading access is not enabled for this course.</p> : null}
      {!loading && !failed && courses.length > 0 && summary.overall === null && (selectedRole !== 'TA' || canReadStaffGrades) ? <p className={styles.status}>No graded assignments yet.</p> : null}

      {!loading && !failed && summary.overall !== null ? (
        <div className={styles.chart}>
          <svg viewBox="0 0 320 122" role="img" aria-label={`Five month average for ${selectedCourse?.courseCode ?? 'the selected course'}. Overall ${summary.overall} percent.`}>
            {[25, 50, 75, 100].map(value => <line key={value} x1="12" x2="308" y1={108 - value} y2={108 - value} className={styles.gridLine}/>)}
            {points.length > 1 ? <polyline points={polyline} className={styles.line}/> : null}
            {points.map(point => <g key={`${point.x}-${point.value}`}><circle cx={point.x} cy={point.y} r="4" className={styles.dot}/><title>{point.value}%</title></g>)}
          </svg>
          <div className={styles.labels}>{summary.series.map(point => <span key={point.key}>{point.label}</span>)}</div>
        </div>
      ) : null}
    </section>
  );
};

export default AverageScoreComponent;
