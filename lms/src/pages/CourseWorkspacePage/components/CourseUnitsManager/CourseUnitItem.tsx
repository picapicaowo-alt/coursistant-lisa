import {CourseUnit} from "../../types";
import React from "react";
import styles from "./CourseUnitItem.module.scss";
import {IconButton} from "@/components/IconButton";
import {useCourseWorkspaceStore} from "@/pages/CourseWorkspacePage/stores/useCourseWorkspaceStore";

const getUnitNumber = (index: number) => {
  return (index + 1).toString().padStart(2, '0');
};

interface CourseUnitItemProps {
  unit: Omit<CourseUnit, 'assignments'>;
  sortOrder: number;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  t: (key: string) => string;
}

export const CourseUnitItem: React.FC<CourseUnitItemProps> = ({
                                                                unit,
                                                                sortOrder,
                                                                isActive,
                                                                onSelect,
                                                                onDelete,
                                                                t
                                                              }) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(t('addContent.confirmDeleteWeek'))) {
      onDelete();
    }
  };
  
  const {course, getRelated, workspaceMode} = useCourseWorkspaceStore();
  
  const assignmentsCount = React.useMemo(() => {
    return getRelated("courseUnits", unit.id, "courseUnitAssignments").length;
  }, [course, unit, getRelated])
  
  return (
    <div
      className={`${styles.unitItem} ${isActive ? styles.active : ''}`}
      onClick={onSelect}
    >
      <div className={styles.unitIndex}>
        {getUnitNumber(sortOrder)}
      </div>
      <div className={styles.unitContent}>
        <h4 className={styles.unitTitle}>
          {unit.title || `${t('addContent.weekLabel')} ${sortOrder + 1}`}
        </h4>
        <p className={styles.unitDescription}>
          {unit.description || ''}
          {assignmentsCount > 0 && (
            <>
              {' • '}
              {assignmentsCount} {t('detail.assignments')}
            </>
          )}
        </p>
      </div>
      {(workspaceMode === "edit" || workspaceMode === "create") && (
        <div className={styles.unitActions}>
          <IconButton
            type={"delete"}
            onClick={handleDelete}
            title={t('card.deleteCourse')}
          />
        </div>
      )}
    </div>
  );
};