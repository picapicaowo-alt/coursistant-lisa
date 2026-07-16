import React, {useMemo} from "react";
import {useTranslation} from "react-i18next";
import styles from "./MainContent.module.scss";
import {useAssignmentReviewStore} from "../../stores/useAssignmentReviewStore";
import {Header} from "@/components/HeaderArea";
import {ReviewSection} from "@/pages/DetailWorkspacePage/components/AssignmentReview/ReviewSection";
import {PropertyForm} from "@/components/PropertyForm";
import ReactMarkdown from "react-markdown";
import {FileEntity, SubmissionEntity} from "@/pages/DetailWorkspacePage/config";
import {FileSection} from "@/components/FileSection";

interface MainContentProps {
  selectedSubmissionId: number;
}

export const MainContent: React.FC<MainContentProps> = ({
                                                          selectedSubmissionId,
                                                        }) => {
  const {t} = useTranslation('detailWorkspace');
  
  const {assignment, get, getRelated} = useAssignmentReviewStore();
  
  const submission: SubmissionEntity | null = useMemo(() => {
    const s = get("submissions", selectedSubmissionId);
    if (s === undefined) return null;
    return s;
  }, [selectedSubmissionId]);
  
  const submissionFiles = React.useMemo(() => {
    if (submission === null) return Array<{
      id: number;
      filename: string;
      mimeType: string;
      fileSize: number;
      updatedAt: Date;
    }>();
    const su: FileEntity[] = getRelated("submissions", submission.id, "submissionFiles");
    return su.map(s => {
      return {
        ...s,
      };
    });
  }, [submission]);
  
  return (
    <div className={styles.mainContent}>
      <Header title={assignment.title}>
        <span className={styles.typeBadge}>{assignment.type}</span>
        <span className={styles.dueTime}>
            {t('assignment.dueTime')}: {new Date(assignment.dueTime).toLocaleString()}
          </span>
      </Header>
      
      <div className={styles.contentContainer}>
        <div className={styles.contentArea}>
          <PropertyForm title={t('assignmentReview.submission')} transparent={true}>
            {submission !== null ? (
              <React.Fragment>
                <div className={styles.submissionContent}>
                  <ReactMarkdown>{submission.submissionContent}</ReactMarkdown>
                </div>
                
                {submissionFiles.length > 0 &&
                  <FileSection files={submissionFiles}
                               uploadFunction={async () => ""}
                               onUploaded={() => {
                               }}
                               disabled={true}/>
                }
              </React.Fragment>
            ) : (
              <div className={styles.noSubmission}>
                {t('assignmentReview.noSubmission')}
              </div>
            )}
          </PropertyForm>
          
          <div className={styles.verticalDivider}/>
          
          <PropertyForm title={t('assignmentReview.grading')} transparent={true}>
            {submission !== null ? (
              <ReviewSection submissionId={submission.id}/>
            ) : (
              <div className={styles.noSubmission}>
                {t('assignmentReview.noSubmission')}
              </div>
            )}
          </PropertyForm>
        </div>
      </div>
    </div>
  );
};