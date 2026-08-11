import React, {useState} from "react";
import {useMutation} from "@tanstack/react-query";
import styles from "../CourseDetailView/index.module.scss";
import editStyles from "./index.module.scss";
import {CourseWeek} from "@/apis";
import {courseApiService} from "@/apis/services/course-api";

interface WeekEditorListProps {
  courseId: number;
  weeks: CourseWeek[];
  activeWeekId: number | null;
  onSelect: (weekId: number) => void;
  onChanged: () => void;
}

/**
 * The editable week outline.
 *
 * The design's trailing slot reads "Enter the name of the course" next to a
 * `+`. It creates a week, so the placeholder here says so instead — naming a
 * course from the week list would be misleading, and the course title is
 * edited in place above.
 *
 * Deleting only works on an empty week; the API refuses one that still holds
 * materials, and the error says which case it was rather than failing silently.
 */
export const WeekEditorList: React.FC<WeekEditorListProps> = ({
                                                                courseId,
                                                                weeks,
                                                                activeWeekId,
                                                                onSelect,
                                                                onChanged,
                                                              }) => {
  const [draftTitle, setDraftTitle] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [failure, setFailure] = useState<string | null>(null);

  const createWeek = useMutation({
    mutationFn: (title: string) => courseApiService.createWeek(courseId, title),
    onSuccess: () => {
      setDraftTitle('');
      setFailure(null);
      onChanged();
    },
    onError: () => setFailure("Couldn't add the week."),
  });

  const renameWeek = useMutation({
    mutationFn: ({weekId, title}: {weekId: number; title: string}) =>
      courseApiService.renameWeek(courseId, weekId, title),
    onSuccess: () => {
      setEditingId(null);
      setFailure(null);
      onChanged();
    },
    onError: () => setFailure("Couldn't rename the week."),
  });

  const deleteWeek = useMutation({
    mutationFn: (weekId: number) => courseApiService.deleteWeek(courseId, weekId),
    onSuccess: () => {
      setFailure(null);
      onChanged();
    },
    // The usual cause is materials still in the week, which the API refuses.
    onError: () => setFailure("Couldn't delete the week. Empty it first."),
  });

  const togglePublish = useMutation({
    mutationFn: (week: CourseWeek) => week.state === 'Published'
      ? courseApiService.unpublishWeek(courseId, week.id)
      : courseApiService.publishWeek(courseId, week.id),
    onSuccess: () => {
      setFailure(null);
      onChanged();
    },
    onError: () => setFailure("Couldn't change the week's visibility."),
  });

  const commitRename = (weekId: number) => {
    const title = editingTitle.trim();
    if (!title) {
      setEditingId(null);
      return;
    }
    renameWeek.mutate({weekId, title});
  };

  return (
    <>
      <ul className={styles.weekList}>
        {weeks.map((week) => (
          <li key={week.id}>
            <div
              className={`${styles.weekCard} ${week.id === activeWeekId ? styles.weekCardActive : ''}`}
              onClick={() => onSelect(week.id)}
            >
              <span className={styles.weekLabel}>
                WEEK {week.orderPosition + 1}
                {week.state === 'Draft' && <span className={styles.draftTag}>Draft</span>}
              </span>

              {editingId === week.id ? (
                <input
                  className={editStyles.weekInput}
                  value={editingTitle}
                  autoFocus
                  onClick={(event) => event.stopPropagation()}
                  onChange={(event) => setEditingTitle(event.target.value)}
                  onBlur={() => commitRename(week.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') commitRename(week.id);
                    if (event.key === 'Escape') setEditingId(null);
                  }}
                />
              ) : (
                <span className={styles.weekTitle}>{week.title}</span>
              )}

              <div className={editStyles.weekActions}>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setEditingId(week.id);
                    setEditingTitle(week.title);
                  }}
                >
                  Rename
                </button>
                <button
                  type="button"
                  disabled={togglePublish.isPending}
                  onClick={(event) => {
                    event.stopPropagation();
                    togglePublish.mutate(week);
                  }}
                >
                  {week.state === 'Published' ? 'Unpublish' : 'Publish'}
                </button>
                <button
                  type="button"
                  className={editStyles.dangerAction}
                  disabled={deleteWeek.isPending}
                  onClick={(event) => {
                    event.stopPropagation();
                    deleteWeek.mutate(week.id);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </li>
        ))}

        <li>
          <div className={editStyles.newWeekCard}>
            <span className={styles.weekLabel}>WEEK {weeks.length + 1}</span>
            <div className={editStyles.newWeekRow}>
              <input
                className={editStyles.weekInput}
                placeholder="Name the new week"
                value={draftTitle}
                onChange={(event) => setDraftTitle(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && draftTitle.trim()) {
                    createWeek.mutate(draftTitle.trim());
                  }
                }}
              />
              <button
                type="button"
                className={editStyles.addButton}
                disabled={!draftTitle.trim() || createWeek.isPending}
                onClick={() => createWeek.mutate(draftTitle.trim())}
                aria-label="Add week"
              >
                +
              </button>
            </div>
          </div>
        </li>
      </ul>

      {failure && <p className={editStyles.error} role="alert">{failure}</p>}
    </>
  );
};
