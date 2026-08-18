import React from 'react';
import {useTranslation} from "react-i18next";
import styles from './index.module.scss';
import {AssignmentItem} from "../AssignmentsList/AssignmentItem";
import {useCourseWorkspaceStore} from "../../stores/useCourseWorkspaceStore";
import {AssignmentEntity} from "@/pages/DetailWorkspacePage/config";

interface AssignmentsListProps {
  activeUnitId: number | null;
}

const AssignmentsList: React.FC<AssignmentsListProps> = ({
                                                           activeUnitId,
                                                         }) => {
  const {t} = useTranslation("course");
  
  const {
    course,
    getRelated,
    setWorkspaceMode,
    workspaceMode,
    openDetailWorkspace
  } = useCourseWorkspaceStore();
  
  const assignments: AssignmentEntity[] = React.useMemo(() => {
    if (activeUnitId === null) return [];
    return getRelated("courseUnits", activeUnitId, "courseUnitAssignments");
  }, [course, activeUnitId, getRelated]);
  
  if (activeUnitId === null) {
    return null;
  }
  
  return (
    <div className={`${styles.card} ${assignments.length === 0 ? styles.hoverBg : ''}`}>
      <div className={styles.sectionHeaderRow}>
        <h3>
          {t("assignmentsList.weeklyAssignments")}
        </h3>
        {(workspaceMode === "edit" || workspaceMode === "create") && (
          <button
            type="button"
            className={styles.lightActionBtn}
            onClick={() => {
              openDetailWorkspace({
                type: "teacher-assignment-edit",
                query: {}
              });
            }}
            title={t("assignmentsList.addAssignmentTitle")}
          >
            {t("assignmentsList.addNew")}
          </button>
        )}
      </div>
      
      {assignments.length === 0 && (
        <>
          {workspaceMode === "view" && (
            <div className={styles.emptyAssignments}>
              <span className={styles.emptyAssignmentsText}>
                {t("assignmentsList.noAssignments")}
              </span>
            </div>
          )}
          {(workspaceMode === "edit" || workspaceMode === "create") && (
            <div
              className={styles.dashedPlaceholder}
              onClick={() => {
                setWorkspaceMode("detailWorkspace")
              }}
            >
              
              <div className={styles.placeholderInner}>
                <div className={styles.plusCircle}>+</div>
                <span>{t("assignmentsList.addingNewContent")}</span>
              </div>
            </div>
          )}
        </>
      )}
      
      {assignments.length > 0 && (
        <div className={styles.assignmentsList}>
          {assignments.map((assignment, index) => (
            <AssignmentItem key={assignment.id}
                            assignment={{...assignment, dueTime: assignment.dueTime.toLocaleString('en-US'), index}}
                            activeUnitId={activeUnitId}/>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssignmentsList;
