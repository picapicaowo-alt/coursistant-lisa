import React, {useMemo} from 'react';
import styles from './CoursePreview.module.scss';
import {useTranslation} from "react-i18next";
import {useNavigate} from "react-router-dom";
import {CoursePreviewResponse} from "@/apis";

interface CoursePreviewProps extends CoursePreviewResponse {
  schedules?: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    location?: string;
  }>;
}

export const CoursePreview: React.FC<CoursePreviewProps> = ({
                                                              id,
                                                              courseCode,
                                                              name,
                                                              teacherName,
                                                              courseUnitsCount,
                                                              avatarUrl = '/icons/default_avatar.jpg'
                                                            }) => {
  const navigate = useNavigate();
  
  const {t} = useTranslation("course");
  const dayNames = useMemo(() => [
    t("days.monday"),
    t("days.tuesday"),
    t("days.wednesday"),
    t("days.thursday"),
    t("days.friday"),
    t("days.saturday"),
    t("days.sunday"),
  ], [t]);
  
  const fakeSchedules = useMemo(() => {
    const list: {
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      location?: string;
    }[] = [];
    for (let i = 0; i < Math.floor(Math.random() * 7); i++) {
      list.push({
        dayOfWeek: 0,
        startTime: "08:00",
        endTime: "10:00",
        location: "Main Building 201"
      });
    }
    return list;
  }, [])
  
  return (
    <div className={styles.courseItem}
         onClick={() => navigate(`/course/${id}`)}
    >
      <div className={styles.courseHeader}>
        <div className={styles.courseCode}>{courseCode}</div>
      </div>
      
      <div className={styles.courseContent}>
        <div className={styles.courseTitle}>{name}</div>
        <div className={styles.instructorInfo}>
          <div className={styles.avatarContainer}>
            <img src={avatarUrl} alt={teacherName} className={styles.avatar}/>
          </div>
          <span className={styles.instructorName}>{teacherName}</span>
        </div>
        
        <div className={styles.courseMeta}>
          <div className={styles.metaItem}>
            <svg className={styles.metaIcon} viewBox="0 0 24 24">
              <path fill="currentColor"
                    d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/>
            </svg>
            <span>{courseUnitsCount} {t("course.unit")}</span>
          </div>
          
          {fakeSchedules.length > 0 ? (
            <div className={styles.scheduleContainer}>
              {fakeSchedules.map((schedule, index) => (
                <div key={index} className={styles.scheduleItem}>
                  <svg className={styles.scheduleIcon} viewBox="0 0 24 24">
                    <path fill="currentColor"
                          d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                  </svg>
                  <span className={styles.scheduleText}>
                    {dayNames[schedule.dayOfWeek] || `${t("course.unit")} ${schedule.dayOfWeek + 1}`}
                    {' '}{schedule.startTime}-{schedule.endTime}
                    {schedule.location && ` · ${schedule.location}`}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.schedulePlaceholder}>
            
            </div>
          )}
        </div>
      </div>
    </div>
  );
};