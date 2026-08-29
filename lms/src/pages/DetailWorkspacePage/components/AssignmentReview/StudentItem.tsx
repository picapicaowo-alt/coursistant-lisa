import React from "react";
import {useTranslation} from "react-i18next";
import styles from "./StudentItem.module.scss";
import {useAssignmentReviewStore} from "../../stores/useAssignmentReviewStore";
import {SubmissionEntity} from "@/pages/DetailWorkspacePage/config";
import {formatPersonName} from '@/utils/personName';

const STATUS_COLORS: Record<string, string> = {
  'not-submitted': '#e53e3e',
  'submitted': '#3182ce',
  'graded': '#38a169',
};

interface StudentItemProps {
  submission: SubmissionEntity;
  selected: boolean;
  onSelected: (submissionId: number) => void;
}

export const StudentItem: React.FC<StudentItemProps> = ({
                                                          submission,
                                                          selected,
                                                          onSelected,
                                                        }) => {
  const {t} = useTranslation('detailWorkspace');
  
  const {getRelated} = useAssignmentReviewStore();
  
  const submissionStatus = React.useMemo(() => {
    if (submission === null) return 'not-submitted';
    const reviewed = getRelated("submissions", submission?.id, "submissionReviews").length > 0;
    return reviewed ? 'graded' : 'submitted';
  }, [submission, getRelated])
  const studentName = formatPersonName({
    firstName: submission.studentFirstName,
    middleName: submission.studentMiddleName,
    lastName: submission.studentLastName,
  }) || 'Unknown learner';
  
  return (
    <button
      key={submission.id}
      className={`${styles.studentItem} ${selected ? styles.selected : ''}`}
      onClick={() => {
        onSelected(submission.id);
      }}
    >
      <div className={styles.studentInfo}>
        <span className={styles.studentName}>{studentName}</span>
        <span className={styles.submissionTime}>
          {new Date(submission.updatedAt).toLocaleDateString('en-US')}
        </span>
      </div>
      
      <div className={styles.statusIndicator}>
        <span
          className={styles.statusDot}
          style={{backgroundColor: STATUS_COLORS[submissionStatus] || '#94a3b8'}}
        />
        <span className={styles.statusText}>
          {t(`assignmentReview.status.${submissionStatus}`)}
        </span>
      </div>
    </button>
  );
};
