import {FormEvent, useMemo, useRef, useState} from 'react';
import {BookOpen, CalendarDays, Search} from 'lucide-react';
import {Link, useNavigate} from 'react-router-dom';
import {useCourseList} from '@/pages/LmsHomePage/hooks/useCourseList';
import {useDashboardAssignments} from '@/pages/LmsHomePage/hooks/useDashboardAssignments';
import styles from './DashboardSearch.module.scss';

interface SearchResult {
  id: string;
  label: string;
  meta: string;
  destination: string;
  kind: 'course' | 'assignment';
}

const DashboardSearch = () => {
  const navigate = useNavigate();
  const searchRegionRef = useRef<HTMLDivElement>(null);
  const {courses} = useCourseList();
  const {rows} = useDashboardAssignments();
  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const searchResults = useMemo<SearchResult[]>(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return [];

    const courseResults = courses.flatMap(course => {
      const searchable = `${course.courseCode} ${course.title}`.toLocaleLowerCase();
      return searchable.includes(normalizedQuery) ? [{
        id: `course-${course.id}`,
        label: course.title,
        meta: course.courseCode,
        destination: `/course/${course.id}`,
        kind: 'course' as const,
      }] : [];
    });
    const assignmentResults = rows.flatMap(row => {
      const searchable = `${row.courseCode} ${row.title}`.toLocaleLowerCase();
      return searchable.includes(normalizedQuery) ? [{
        id: row.key,
        label: row.title,
        meta: row.courseCode,
        destination: row.destination,
        kind: 'assignment' as const,
      }] : [];
    });

    return [...courseResults, ...assignmentResults].slice(0, 6);
  }, [courses, query, rows]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const firstResult = searchResults[0];
    if (firstResult) navigate(firstResult.destination);
  };

  return (
    <div
      ref={searchRegionRef}
      className={styles.searchRegion}
      onFocus={() => setSearchFocused(true)}
      onBlur={event => {
        if (!searchRegionRef.current?.contains(event.relatedTarget as Node | null)) {
          setSearchFocused(false);
        }
      }}
    >
      <form className={styles.search} role="search" onSubmit={handleSearch}>
        <Search aria-hidden="true"/>
        <input
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Search courses, assignments…"
          aria-label="Search courses and assignments"
        />
      </form>
      {searchFocused && query.trim() ? (
        <div className={styles.results} aria-live="polite">
          {searchResults.length > 0 ? searchResults.map(result => (
            <Link key={result.id} to={result.destination}>
              {result.kind === 'course'
                ? <BookOpen aria-hidden="true"/>
                : <CalendarDays aria-hidden="true"/>}
              <span>{result.label}<small>{result.meta}</small></span>
            </Link>
          )) : (
            <p>No matching courses or assignments.</p>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default DashboardSearch;
