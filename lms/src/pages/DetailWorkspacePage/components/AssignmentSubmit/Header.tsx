import React from "react";
import styles from "./Header.module.scss";
import {useAssignmentSubmitStore} from "../../stores/useAssignmentSubmitStore";
import {useTranslation} from "react-i18next";
import {ReviewEntity, SubmissionEntity} from "@/pages/DetailWorkspacePage/config";

export const Header: React.FC = () => {
  const {t} = useTranslation("detailWorkspace");
  const {assignment, getRelated} = useAssignmentSubmitStore();
  
  const submission = React.useMemo(() => {
    const s: SubmissionEntity = getRelated("assignments", assignment.id, "assignmentSubmissions")[0];
    if (!s) return null;
    return s;
  }, [assignment, getRelated]);
  
  const review = React.useMemo(() => {
    const r: ReviewEntity = getRelated("assignments", assignment.id, "assignmentReviews")[0];
    if (!r) return null;
    return r;
  }, [assignment, getRelated]);
  
  return (
    <div className={styles.headerSection}>
      <div className={styles.assignmentInfo}>
        <h1 className={styles.assignmentTitle}>{assignment.title}</h1>
        <div className={styles.metaInfo}>
          <span className={styles.typeBadge}>{assignment.type}</span>
          <span className={styles.dueTime}>
            {t("assignment.dueTime")}: {new Date(assignment.dueTime).toLocaleString()}
          </span>
          {submission && (
            <span className={styles.submissionCount}>
              {t("assignment.submissionCount")}: {submission.submissionCount}
            </span>
          )}
        </div>
      </div>
      
      {review && (
        <div className={styles.reviewSummary}>
          <div className={styles.gradeDisplay}>
            <span className={styles.gradeLabel}>{t("assignment.grade")}</span>
            <span className={styles.gradeValue}>{review.grade}</span>
          </div>
          {review.teacherComment && (
            <div className={styles.commentPreview}>
              {review.teacherComment}
            </div>
          )}
        </div>
      )}
    </div>
  );
};