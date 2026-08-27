import {ArrowUpRight, GraduationCap} from 'lucide-react';
import {Link} from 'react-router-dom';
import {DashboardCourse} from '@/pages/LmsHomePage/types';
import styles from './CourseCard.module.scss';

const COURSE_TONES = [styles.green, styles.indigo, styles.cyan] as const;

const CourseCard = ({id, courseCode, title, instructorName, courseRole}: DashboardCourse) => (
  <Link
    className={`${styles.card} ${COURSE_TONES[id % COURSE_TONES.length]}`}
    to={`/course/${id}`}
    aria-label={`Open ${courseCode}, ${title}. Your role is ${courseRole}${instructorName ? `, instructor ${instructorName}` : ''}.`}
  >
    <span className={styles.mark}><GraduationCap aria-hidden="true"/></span>
    <span className={styles.copy}>
      <span className={styles.code}>{courseCode}</span>
      <strong>{title}</strong>
    </span>
    <ArrowUpRight className={styles.arrow} aria-hidden="true"/>
  </Link>
);

export default CourseCard;
