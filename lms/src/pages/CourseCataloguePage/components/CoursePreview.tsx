import React from 'react';
import styles from './CoursePreview.module.scss';
import {useNavigate} from "react-router-dom";
import {formatCourseName} from "@/utils/course";

interface CoursePreviewProps {
  id: number;
  courseCode: string;
  title: string;
  /** Null when the payload carried only a userId for the instructor. */
  instructorName: string | null;
  avatarUrl?: string;
}

/**
 * A course card in the course list.
 *
 * `/v2/me/courses` returns identity and enrolment only — no unit count, no
 * session times. The card previously filled both in: a unit count that the
 * payload never had, and a schedule list built by Math.random(), so the same
 * course showed a different timetable on every render. Both are gone; class
 * times live on the course page, which has the sessions endpoint behind it.
 */
export const CoursePreview: React.FC<CoursePreviewProps> = ({
                                                              id,
                                                              courseCode,
                                                              title,
                                                              instructorName,
                                                              avatarUrl = '/icons/default_avatar.jpg'
                                                            }) => {
  const navigate = useNavigate();

  return (
    <div className={styles.courseItem} onClick={() => navigate(`/course/${id}`)}>
      <div className={styles.courseHeader}>
        <div className={styles.courseCode}>{courseCode}</div>
      </div>

      <div className={styles.courseContent}>
        <div className={styles.courseTitle}>{formatCourseName(courseCode, title)}</div>

        {instructorName && (
          <div className={styles.instructorInfo}>
            <div className={styles.avatarContainer}>
              <img src={avatarUrl} alt="" className={styles.avatar}/>
            </div>
            <span className={styles.instructorName}>{instructorName}</span>
          </div>
        )}
      </div>
    </div>
  );
};
