import {useMemo, useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {addMonths, addWeeks, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, startOfMonth, startOfWeek} from 'date-fns';
import {CalendarDays, ChevronLeft, ChevronRight, Clock3, MapPin} from 'lucide-react';
import {Link} from 'react-router-dom';
import {loadCalendarWindow} from './calendarData';
import styles from './index.module.scss';

type CalendarView = 'month' | 'week';
const COURSE_COLORS = ['cyan', 'green', 'orange', 'pink', 'brand'] as const;
const courseColor = (courseId: number) => COURSE_COLORS[Math.abs(courseId) % COURSE_COLORS.length];

const CalendarPage = () => {
  const [view, setView] = useState<CalendarView>('month');
  const [cursor, setCursor] = useState(() => new Date());
  const [hiddenCourseIds, setHiddenCourseIds] = useState<Set<number>>(() => new Set());

  const range = useMemo(() => {
    const start = view === 'month'
      ? startOfWeek(startOfMonth(cursor), {weekStartsOn: 0})
      : startOfWeek(cursor, {weekStartsOn: 0});
    const end = view === 'month'
      ? endOfWeek(endOfMonth(cursor), {weekStartsOn: 0})
      : endOfWeek(cursor, {weekStartsOn: 0});
    return {start, end, startKey: format(start, 'yyyy-MM-dd'), endKey: format(end, 'yyyy-MM-dd')};
  }, [cursor, view]);

  const calendarQuery = useQuery({
    queryKey: ['calendar', range.startKey, range.endKey],
    queryFn: () => loadCalendarWindow(range.startKey, range.endKey),
    retry: 1,
  });

  const days = useMemo(() => eachDayOfInterval({start: range.start, end: range.end}), [range.end, range.start]);
  const visibleItems = useMemo(() => (calendarQuery.data?.items ?? []).filter(item => !hiddenCourseIds.has(item.courseId)), [calendarQuery.data?.items, hiddenCourseIds]);
  const itemsByDate = useMemo(() => {
    const grouped = new Map<string, typeof visibleItems>();
    visibleItems.forEach(item => {
      const existing = grouped.get(item.date) ?? [];
      existing.push(item);
      grouped.set(item.date, existing);
    });
    return grouped;
  }, [visibleItems]);
  const timezones = [...new Set(visibleItems.map(item => item.timezone))];

  const move = (direction: -1 | 1) => setCursor(current => view === 'month'
    ? addMonths(current, direction)
    : addWeeks(current, direction));
  const toggleCourse = (courseId: number) => setHiddenCourseIds(current => {
    const next = new Set(current);
    if (next.has(courseId)) next.delete(courseId);
    else next.add(courseId);
    return next;
  });

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div><h1>Calendar</h1><p>Class sessions, assignments, quizzes, and course events in one place.</p></div>
        <div className={styles.viewSwitch} aria-label="Calendar view">
          <button type="button" aria-pressed={view === 'month'} onClick={() => setView('month')}>Month</button>
          <button type="button" aria-pressed={view === 'week'} onClick={() => setView('week')}>Week</button>
        </div>
      </header>

      <section className={styles.toolbar} aria-label="Calendar navigation">
        <div className={styles.navigation}>
          <button type="button" onClick={() => move(-1)} aria-label={`Previous ${view}`}><ChevronLeft size={19}/></button>
          <button type="button" onClick={() => setCursor(new Date())}>Today</button>
          <button type="button" onClick={() => move(1)} aria-label={`Next ${view}`}><ChevronRight size={19}/></button>
          <h2>{view === 'month' ? format(cursor, 'MMMM yyyy') : `${format(range.start, 'MMM d')} – ${format(range.end, 'MMM d, yyyy')}`}</h2>
        </div>
        <p className={styles.timezone}><Clock3 size={16}/>{timezones.length === 1 ? timezones[0] : timezones.length > 1 ? `${timezones.length} course timezones` : 'Course timezone'}</p>
      </section>

      {calendarQuery.data?.courses.length ? (
        <section className={styles.filters} aria-label="Filter courses">
          {calendarQuery.data.courses.map(course => (
            <label key={course.id} data-color={courseColor(course.id)}>
              <input type="checkbox" checked={!hiddenCourseIds.has(course.id)} onChange={() => toggleCourse(course.id)}/>
              <span aria-hidden="true"/>{course.courseCode}<small>{course.title}</small>
            </label>
          ))}
        </section>
      ) : null}

      {calendarQuery.data?.failures.length ? (
        <details className={styles.partialWarning}>
          <summary>Some calendar data could not be loaded ({calendarQuery.data.failures.length})</summary>
          <ul>{calendarQuery.data.failures.map(failure => <li key={failure}>{failure}</li>)}</ul>
        </details>
      ) : null}

      {calendarQuery.isPending ? <section className={styles.status} role="status"><CalendarDays size={26}/>Loading calendar…</section> : null}
      {calendarQuery.isError ? <section className={styles.status} role="alert"><p>Calendar could not be loaded.</p><button type="button" onClick={() => void calendarQuery.refetch()}>Retry</button></section> : null}

      {calendarQuery.data ? view === 'month' ? (
        <section className={styles.monthGrid} aria-label={format(cursor, 'MMMM yyyy')}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(label => <div key={label} className={styles.weekday}>{label}</div>)}
          {days.map(day => {
            const date = format(day, 'yyyy-MM-dd');
            return (
              <article key={date} className={styles.dayCell} data-outside={!isSameMonth(day, cursor)}>
                <time dateTime={date}>{format(day, 'd')}</time>
                <div className={styles.dayItems}>{(itemsByDate.get(date) ?? []).map(item => (
                  <Link key={item.id} to={item.path} className={styles.calendarItem} data-color={courseColor(item.courseId)} title={`${item.courseCode} · ${item.title}`}>
                    <strong>{item.startTime ?? 'All day'}</strong><span>{item.courseCode} · {item.title}</span>
                  </Link>
                ))}</div>
              </article>
            );
          })}
        </section>
      ) : (
        <section className={styles.weekList} aria-label="Week calendar">
          {days.map(day => {
            const date = format(day, 'yyyy-MM-dd');
            const dayItems = itemsByDate.get(date) ?? [];
            return (
              <article key={date} className={styles.weekDay}>
                <header><time dateTime={date}><strong>{format(day, 'EEE')}</strong><span>{format(day, 'MMM d')}</span></time></header>
                <div>{dayItems.length ? dayItems.map(item => (
                  <Link key={item.id} to={item.path} className={styles.weekItem} data-color={courseColor(item.courseId)}>
                    <span className={styles.itemTime}>{item.startTime ?? 'All day'}{item.endTime ? `–${item.endTime}` : ''}</span>
                    <span className={styles.itemBody}><strong>{item.title}</strong><small>{item.courseCode} · {item.kind}{item.location ? <><MapPin size={13}/>{item.location}</> : null}</small></span>
                  </Link>
                )) : <p>No scheduled items</p>}</div>
              </article>
            );
          })}
        </section>
      ) : null}
    </main>
  );
};

export default CalendarPage;
