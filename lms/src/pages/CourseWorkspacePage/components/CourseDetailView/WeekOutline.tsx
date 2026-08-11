import React from "react";
import styles from "./index.module.scss";
import {CourseWeek} from "@/apis";

interface WeekOutlineProps {
  weeks: CourseWeek[];
  activeWeekId: number | null;
  onSelect: (weekId: number) => void;
}

/**
 * The week list down the left side.
 *
 * The design labels each card WEEK n and prints the week's content title
 * beneath. The number comes from `orderPosition`, which is zero-based and
 * ascending, so it is the position in the course rather than anything stored
 * on the week.
 *
 * The trailing "Add new content" card is the design's empty slot for the next
 * week. It creates a week, which only a Course Manager may do, so it is not
 * rendered for anyone else. Creating one is not wired up yet.
 */
export const WeekOutline: React.FC<WeekOutlineProps> = ({weeks, activeWeekId, onSelect}) => {
  if (weeks.length === 0) {
    return <p className={styles.outlineEmpty}>This course has no weeks yet.</p>;
  }

  return (
    <ul className={styles.weekList}>
      {weeks.map((week) => (
        <li key={week.id}>
          <button
            type="button"
            className={`${styles.weekCard} ${week.id === activeWeekId ? styles.weekCardActive : ''}`}
            onClick={() => onSelect(week.id)}
            aria-current={week.id === activeWeekId}
          >
            <span className={styles.weekLabel}>
              WEEK {week.orderPosition + 1}
              {/* Drafts are staff-only, so saying so here cannot leak anything
                  to a student — they never receive an unpublished week. */}
              {week.state === 'Draft' && <span className={styles.draftTag}>Draft</span>}
            </span>
            <span className={styles.weekTitle}>{week.title}</span>
          </button>
        </li>
      ))}
    </ul>
  );
};
