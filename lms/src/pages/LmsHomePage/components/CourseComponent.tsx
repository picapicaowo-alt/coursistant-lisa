import {Link} from 'react-router-dom';
import CourseCard from './CourseCard';
import {useCourseList} from '@/pages/LmsHomePage/hooks/useCourseList';
import styles from './CourseComponent.module.scss';

const CourseComponent = () => {
  const {courses, isLoading, isError, refetch} = useCourseList();

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2>My Courses</h2>
        <Link to="/course">View all</Link>
      </div>
      <CourseListBody courses={courses} isLoading={isLoading} isError={isError} refetch={refetch}/>
    </div>
  );
};

type CourseListBodyProps = Pick<ReturnType<typeof useCourseList>,
  'courses' | 'isLoading' | 'isError' | 'refetch'>;

const CourseListBody = ({courses, isLoading, isError, refetch}: CourseListBodyProps) => {
  if (isLoading) return <p className={styles.state}>Loading courses…</p>;

  if (isError) {
    return (
      <div className={styles.state} role="alert">
        <p>Courses couldn&apos;t be loaded.</p>
        <button type="button" onClick={refetch}>Try again</button>
      </div>
    );
  }

  if (courses.length === 0) {
    return <p className={styles.state}>You are not enrolled in any active courses.</p>;
  }

  return (
    <div className={styles.courseGrid}>
      {courses.slice(0, 3).map(course => <CourseCard key={course.id} {...course}/>)}
    </div>
  );
};

export default CourseComponent;
