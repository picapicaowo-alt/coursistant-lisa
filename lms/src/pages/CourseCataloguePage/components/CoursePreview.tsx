import React, {useEffect, useRef, useState} from 'react';
import styles from './CoursePreview.module.scss';
import {useNavigate} from "react-router-dom";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {useTranslation} from "react-i18next";
import {courseApiService} from "@/apis/services/course-api";
import {CourseSession} from "@/apis";
import {formatCourseName} from "@/utils/course";

interface CoursePreviewProps {
  id: number;
  courseCode: string;
  title: string;
  /** Null when the payload carried only a userId for the instructor. */
  instructorName: string | null;
  /** Course Managers get the archive action; everyone else does not. */
  canManage: boolean;
  avatarUrl?: string;
}

const DAY_LABEL: Record<CourseSession['dayOfWeek'], string> = {
  MON: 'Mon', TUE: 'Tue', WED: 'Wed', THU: 'Thu', FRI: 'Fri', SAT: 'Sat', SUN: 'Sun',
};

/** `09:00:00` reads as `09:00`; the seconds are always zero in practice. */
const toClockTime = (time: string) => time.slice(0, 5);

/**
 * A course card in the course list.
 *
 * Class time and classroom come from the course's own sessions endpoint —
 * `/v2/me/courses` carries identity and enrolment only — so each card fetches
 * its own. React Query runs them in parallel and caches per course, and the
 * card renders immediately with the schedule filling in after, so a slow
 * session response never holds up the list.
 *
 * The design shows a concrete date ("April 18 09:00"). Sessions are recurring
 * weekly slots with a day of week and no date, so the card shows the day it
 * actually recurs on rather than inventing a calendar date. It also shows the
 * location verbatim: the design's "I-A Room #200" abbreviates the building and
 * nothing defines that derivation (open-decisions.md Q-13).
 */
export const CoursePreview: React.FC<CoursePreviewProps> = ({
                                                              id,
                                                              courseCode,
                                                              title,
                                                              instructorName,
                                                              canManage,
                                                              avatarUrl = '/icons/default_avatar.jpg'
                                                            }) => {
  const navigate = useNavigate();
  const {t} = useTranslation("course");
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const {data: sessions} = useQuery({
    queryKey: ['course-sessions', id],
    queryFn: async () => (await courseApiService.getCourseSessions(id)).data ?? [],
    staleTime: 5 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    // A missing schedule must not turn into a retry storm across every card.
    retry: 1,
  });

  const archive = useMutation({
    mutationFn: () => courseApiService.archiveCourse(id),
    onSuccess: () => queryClient.invalidateQueries({queryKey: ['my-courses']}),
  });

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [menuOpen]);

  const firstSession = sessions?.[0];

  return (
    <div className={styles.courseItem}>
      <div className={styles.courseHeader}>
        {instructorName && (
          <div className={styles.instructorInfo}>
            <div className={styles.avatarContainer}>
              <img src={avatarUrl} alt="" className={styles.avatar}/>
            </div>
            <div>
              <div className={styles.instructorName}>{instructorName}</div>
              <div className={styles.instructorRole}>{t("card.instructor")}</div>
            </div>
          </div>
        )}
      </div>

      <div className={styles.courseContent}>
        <div className={styles.courseTitle}>{formatCourseName(courseCode, title)}</div>

        {/* Only render the meta row once there is something real to put in it.
            An empty "Class Time" label would read as "no classes scheduled". */}
        {firstSession && (
          <div className={styles.courseMeta}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>{t("card.classTime")}</span>
              <span className={styles.metaValue}>
                {DAY_LABEL[firstSession.dayOfWeek]} {toClockTime(firstSession.startTime)}
              </span>
            </div>
            {firstSession.location && (
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>{t("card.classroom")}</span>
                <span className={styles.metaValue}>{firstSession.location}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className={styles.courseFooter}>
        <button
          type="button"
          className={styles.viewDetails}
          onClick={() => navigate(`/course/${id}`)}
        >
          {t("card.viewDetails")}
          <span aria-hidden="true">›</span>
        </button>

        {/* The design also offers Share Courses and Delete Course. Sharing has
            no endpoint, and deleting is not how a course is retired: it only
            works on a course with no dependencies at all, and INV-05 requires
            submissions and grades to survive every V1 action. Archive is the
            real lifecycle step (open-decisions.md B-2). */}
        {canManage && (
          <div className={styles.menuAnchor} ref={menuRef}>
            <button
              type="button"
              className={styles.menuButton}
              onClick={() => setMenuOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label={t("card.moreActions")}
            >
              ⋯
            </button>

            {menuOpen && (
              <div className={styles.menu} role="menu">
                <button
                  type="button"
                  role="menuitem"
                  className={styles.menuItem}
                  disabled={archive.isPending}
                  onClick={() => {
                    setMenuOpen(false);
                    archive.mutate();
                  }}
                >
                  {archive.isPending ? t("card.archiving") : t("card.archive")}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {archive.isError && (
        <p className={styles.error} role="alert">{t("card.archiveFailed")}</p>
      )}
    </div>
  );
};
