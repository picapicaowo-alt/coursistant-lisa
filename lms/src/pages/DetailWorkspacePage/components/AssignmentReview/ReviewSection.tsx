import React from "react";
import {useTranslation} from "react-i18next";
import {RichTextEditor} from "@/components/RichTextEditor";
import styles from "./ReviewSection.module.scss";
import {useAssignmentReviewStore} from "../../stores/useAssignmentReviewStore";
import {ReviewEntity} from "@/pages/DetailWorkspacePage/config";

interface ReviewSectionProps {
  submissionId: number;
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({
                                                              submissionId,
                                                            }) => {
  const {t} = useTranslation('detailWorkspace');
  
  const {getRelated} = useAssignmentReviewStore();
  
  const review: ReviewEntity | null = React.useMemo(() => {
    const r = getRelated("submissions", submissionId, "submissionReviews")[0];
    if (!r) return null;
    return r;
  }, [submissionId, getRelated])
  
  return (
    <React.Fragment>
      <div className={styles.gradeInputGroup}>
        <label className={styles.gradeLabel}>
          {t('assignmentReview.grade')}
        </label>
        <div className={styles.gradeInputWrapper}>
          <input
            type="number"
            min="0"
            max="100"
            value={review?.grade || 0}
            onChange={() => {}}
            className={styles.gradeInput}
          />
          <span className={styles.gradeSuffix}>/100</span>
        </div>
      </div>
      
      <div className={styles.commentSection}>
        <label className={styles.commentLabel}>
          {t('assignmentReview.comment')}
        </label>
        <div className={styles.commentEditor}>
          <RichTextEditor
            content={review?.teacherComment || ""}
            placeholder={t('assignmentReview.commentPlaceholder')}
            onChange={() => {}}
          />
        </div>
      </div>
    </React.Fragment>
  );
};
