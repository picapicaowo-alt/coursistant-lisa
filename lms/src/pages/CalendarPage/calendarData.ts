import {eachDayOfInterval, format, max, min, parseISO} from 'date-fns';
import {unwrapData} from '@/apis';
import type {CourseSession, MyCourse} from '@/apis';
import {assignmentApiService} from '@/apis/services/assignment-api';
import {courseApiService} from '@/apis/services/course-api';
import {dashboardApiService} from '@/apis/services/dashboard-api';
import {quizApiService} from '@/apis/services/quiz-api';

export type CalendarItemKind = 'Session' | 'Assignment' | 'Quiz' | 'Event';

export interface CalendarItem {
  id: string;
  sourceId: number;
  courseId: number;
  courseCode: string;
  courseTitle: string;
  title: string;
  kind: CalendarItemKind;
  date: string;
  startTime: string | null;
  endTime: string | null;
  timezone: string;
  location: string | null;
  path: string;
}

export interface CalendarWindowData {
  courses: Array<Pick<MyCourse, 'id' | 'courseCode' | 'title'>>;
  items: CalendarItem[];
  failures: string[];
}

const SESSION_DAY: Record<CourseSession['dayOfWeek'], number> = {
  SUN: 0,
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6,
};

const localDate = (value: string) => value.slice(0, 10);
const localTime = (value: string) => value.length > 10 ? value.slice(11, 16) : null;

export const expandSessions = (
  course: Pick<MyCourse, 'id' | 'courseCode' | 'title'>,
  sessions: CourseSession[],
  termStartDate: string,
  termEndDate: string,
  windowStart: string,
  windowEnd: string,
): CalendarItem[] => {
  const start = max([parseISO(termStartDate), parseISO(windowStart)]);
  const end = min([parseISO(termEndDate), parseISO(windowEnd)]);
  if (start > end) return [];

  return eachDayOfInterval({start, end}).flatMap(day => {
    const date = format(day, 'yyyy-MM-dd');
    return sessions
      .filter(session => SESSION_DAY[session.dayOfWeek] === day.getDay())
      .map(session => ({
        id: `session-${course.id}-${session.id}-${date}`,
        sourceId: session.id,
        courseId: course.id,
        courseCode: course.courseCode,
        courseTitle: course.title,
        title: session.type,
        kind: 'Session' as const,
        date,
        startTime: session.startTime.slice(0, 5),
        endTime: session.endTime.slice(0, 5),
        timezone: session.timezone,
        location: session.location,
        path: `/course/${course.id}/schedule`,
      }));
  });
};

const loadAllActiveCourses = async (): Promise<MyCourse[]> => {
  const first = unwrapData(
    await dashboardApiService.getMyCourses({state: 'Active', page: 0, size: 100}),
    'getMyCourses page 0 for calendar',
  );
  if (first.total <= first.items.length) return first.items;

  const pageCount = Math.ceil(first.total / 100);
  const remaining = await Promise.all(Array.from({length: pageCount - 1}, (_, index) => (
    dashboardApiService.getMyCourses({state: 'Active', page: index + 1, size: 100})
  )));
  return [first, ...remaining.map((response, index) => unwrapData(response, `getMyCourses page ${index + 1} for calendar`))]
    .flatMap(page => page.items);
};

export const loadCalendarWindow = async (windowStart: string, windowEnd: string): Promise<CalendarWindowData> => {
  const courses = await loadAllActiveCourses();
  const courseResults = await Promise.all(courses.map(async course => {
    const sourceNames = ['course dates', 'sessions', 'assignments', 'quizzes', 'events'] as const;
    const results = await Promise.allSettled([
      courseApiService.getCourse(course.id),
      courseApiService.getCourseSessions(course.id),
      assignmentApiService.getCourseAssignmentSummaries(course.id),
      quizApiService.listQuizzes(course.id),
      courseApiService.listCourseEvents(course.id),
    ]);
    const failures = results.flatMap((result, index) => result.status === 'rejected'
      ? [`${course.courseCode}: ${sourceNames[index]} could not be loaded`]
      : []);
    const items: CalendarItem[] = [];

    const courseDetail = results[0].status === 'fulfilled'
      ? unwrapData(results[0].value, `course ${course.id} calendar dates`)
      : null;
    const sessions = results[1].status === 'fulfilled'
      ? unwrapData(results[1].value, `course ${course.id} sessions`)
      : [];
    if (courseDetail) {
      items.push(...expandSessions(
        course,
        sessions,
        courseDetail.termStartDate,
        courseDetail.termEndDate,
        windowStart,
        windowEnd,
      ));
    }

    if (results[2].status === 'fulfilled') {
      unwrapData(results[2].value, `course ${course.id} assignments`).forEach(assignment => {
        const date = localDate(assignment.dueAtLocal);
        if (date < windowStart || date > windowEnd) return;
        items.push({
          id: `assignment-${course.id}-${assignment.id}`,
          sourceId: assignment.id,
          courseId: course.id,
          courseCode: course.courseCode,
          courseTitle: course.title,
          title: assignment.title,
          kind: 'Assignment',
          date,
          startTime: localTime(assignment.dueAtLocal),
          endTime: null,
          timezone: assignment.timezone,
          location: null,
          path: `/course/${course.id}/assignments/${assignment.id}`,
        });
      });
    }

    if (results[3].status === 'fulfilled') {
      unwrapData(results[3].value, `course ${course.id} quizzes`)
        .filter(quiz => quiz.state === 'Published')
        .forEach(quiz => {
          const date = localDate(quiz.closesAtLocal);
          if (date < windowStart || date > windowEnd) return;
          items.push({
            id: `quiz-${course.id}-${quiz.id}`,
            sourceId: quiz.id,
            courseId: course.id,
            courseCode: course.courseCode,
            courseTitle: course.title,
            title: quiz.title,
            kind: 'Quiz',
            date,
            startTime: localTime(quiz.closesAtLocal),
            endTime: null,
            timezone: quiz.timezone,
            location: null,
            path: `/course/${course.id}/quizzes/${quiz.id}`,
          });
        });
    }

    if (results[4].status === 'fulfilled') {
      unwrapData(results[4].value, `course ${course.id} events`).forEach(event => {
        if (event.date < windowStart || event.date > windowEnd) return;
        items.push({
          id: `event-${course.id}-${event.id}`,
          sourceId: event.id,
          courseId: course.id,
          courseCode: course.courseCode,
          courseTitle: course.title,
          title: event.name,
          kind: 'Event',
          date: event.date,
          startTime: event.startTime?.slice(0, 5) ?? null,
          endTime: event.endTime?.slice(0, 5) ?? null,
          timezone: event.timezone,
          location: event.location,
          path: `/course/${course.id}/events/${event.id}`,
        });
      });
    }

    return {items, failures};
  }));

  return {
    courses: courses.map(({id, courseCode, title}) => ({id, courseCode, title})),
    items: courseResults.flatMap(result => result.items).sort((a, b) => (
      `${a.date}T${a.startTime ?? '23:59'}`.localeCompare(`${b.date}T${b.startTime ?? '23:59'}`)
    )),
    failures: courseResults.flatMap(result => result.failures),
  };
};
