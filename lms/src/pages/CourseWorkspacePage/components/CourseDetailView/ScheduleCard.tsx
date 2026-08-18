import React from "react";
import styles from "./index.module.scss";
import {CourseSession, SessionDayOfWeek} from "@/apis";
import {Link} from 'react-router-dom';

interface ScheduleCardProps {
  sessions: CourseSession[];
  failed: boolean;
  courseId: number;
  canManage: boolean;
}

/** Monday to Friday, as the design's grid shows. */
const DAYS: {code: SessionDayOfWeek; label: string}[] = [
  {code: 'MON', label: 'Mon'},
  {code: 'TUE', label: 'Tue'},
  {code: 'WED', label: 'Wed'},
  {code: 'THU', label: 'Thu'},
  {code: 'FRI', label: 'Fri'},
];

/** 09:00 to 16:00. The design skips 12:00, so the lunch hour is left out. */
const HOURS = [9, 10, 11, 13, 14, 15, 16];

const hourOf = (time: string) => parseInt(time.slice(0, 2), 10);

/** Pale fills keyed by session type, matching the design's coloured chips. */
const TYPE_TONE: Record<CourseSession['type'], string> = {
  Lecture: styles.chipCyan,
  Lab: styles.chipGreen,
  Tutorial: styles.chipOrange,
};

/**
 * The weekly Schedule grid.
 *
 * Sessions recur by day of week, so the grid is a week template rather than
 * specific dates. The design's header steps through calendar weeks
 * ("June 2 - June 6 2025"), which would imply per-date sessions; the API has
 * none, and paging through weeks that all render identically would suggest
 * the schedule changes when it does not. The navigation is therefore left out.
 *
 * Chips show the location verbatim. The design splits it into a building
 * badge and a room ("I-A" + "Room #200") but nothing defines how a building
 * name becomes that abbreviation (open-decisions.md Q-13).
 */
export const ScheduleCard: React.FC<ScheduleCardProps> = ({sessions, failed, courseId, canManage}) => {
  const at = (day: SessionDayOfWeek, hour: number) =>
    sessions.find((s) => s.dayOfWeek === day && hourOf(s.startTime) === hour);

  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>Schedule</h2>
        <Link to={`/course/${courseId}/schedule`} className={styles.addButton}>{canManage ? 'Manage schedule' : 'View all'}</Link>
      </div>

      {failed ? (
        <p className={styles.cardEmpty} role="alert">Couldn&apos;t load the schedule.</p>
      ) : sessions.length === 0 ? (
        <p className={styles.cardEmpty}>No class times set for this course.</p>
      ) : (
        <div className={styles.gridScroll}>
          <div className={styles.grid}>
            <div/>
            {DAYS.map((day) => (
              <div key={day.code} className={styles.dayHeader}>{day.label}</div>
            ))}

            {HOURS.map((hour) => (
              <React.Fragment key={hour}>
                <div className={styles.hourLabel}>{`${hour}`.padStart(2, '0')}:00</div>
                {DAYS.map((day) => {
                  const session = at(day.code, hour);
                  return (
                    <div key={`${day.code}-${hour}`} className={styles.cell}>
                      {session && (
                        <div className={`${styles.chip} ${TYPE_TONE[session.type]}`}>
                          <span className={styles.chipType}>{session.type}</span>
                          {session.location && (
                            <span className={styles.chipRoom}>{session.location}</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
