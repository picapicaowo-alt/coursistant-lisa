import React from "react";
import styles from "./index.module.scss";
import {useAssignmentSubmitStore} from "../../stores/useAssignmentSubmitStore";
import {Header} from "./Header";
import {useTranslation} from "react-i18next";
import {PropertyForm} from "@/components/PropertyForm";
import {RichTextEditor} from "@/components/RichTextEditor";
import {FileEntity} from "@/pages/DetailWorkspacePage/config";
import {FileSection} from "@/components/FileSection";
import {SubmissionForm} from "@/pages/DetailWorkspacePage/components/AssignmentSubmit/SubmissionForm";

export const AssignmentSubmit: React.FC = () => {
  const {t} = useTranslation("detailWorkspace");
  const {assignment, getRelated} = useAssignmentSubmitStore();
  
  const attachments = React.useMemo(() => {
    const att: FileEntity[] = getRelated("assignments", assignment.id, "assignmentFiles");
    return att.map(a => {
      return {
        ...a,
        uploadedAt: a.createdAt.toISOString().substring(0, 10),
      };
    });
  }, [assignment.id]);
  
  return (
    <div className={styles.container}>
      <Header/>
      
      <div className={styles.horizontalDivider}/>
      
      <PropertyForm title={t("assignment.description")}>
        <RichTextEditor
          content={assignment.description}
          disabled
          displayOnly
          showToolbar={false}
          ariaLabel="Assignment description"
        />
      </PropertyForm>
      
      {attachments.length > 0 && (
        <PropertyForm title={t("assignment.attachments")}>
          <FileSection files={attachments}
                       disabled={true}
                       uploadFunction={async () => ""}
                       onUploaded={() => {
                       }}/>
        </PropertyForm>
      )}
      
      <div className={styles.horizontalDivider}/>
      
      <SubmissionForm/>
    </div>
  );
};
