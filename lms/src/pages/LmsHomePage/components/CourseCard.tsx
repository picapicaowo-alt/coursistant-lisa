import {ArrowUpRight} from 'lucide-react';
import {Link} from 'react-router-dom';
import {DashboardCourse} from '@/pages/LmsHomePage/types';
import styles from './CourseCard.module.scss';

const COURSE_TONES = [styles.green, styles.indigo, styles.cyan] as const;

const CourseCard = ({
  id,
  courseCode,
  title,
  instructorName,
  instructorAvatar,
  courseRole,
}: DashboardCourse) => (
  <Link className={`${styles.card} ${COURSE_TONES[id % COURSE_TONES.length]}`} to={`/course/${id}`}>
    <div className={styles.topline}>
      <span className={styles.code}>{courseCode}</span>
      <ArrowUpRight aria-hidden="true"/>
    </div>
    <h3>{title}</h3>
    <div className={styles.instructor}>
      <img src={instructorAvatar} alt=""/>
      <span>
        <strong>{instructorName || 'Instructor information unavailable'}</strong>
        <small>Instructor</small>
      </span>
      <span className={styles.role}>Your role: {courseRole}</span>
    </div>
  </Link>
);

export default CourseCard;
