import React from "react";
import {useTranslation} from "react-i18next";
import styles from "./Editor.module.scss";
import AssignmentsList from "../AssignmentsList";
import {useCourseWorkspaceStore} from "../../stores/useCourseWorkspaceStore";

interface EditorProps {
  activeUnitId: number;
}

export const Editor: React.FC<EditorProps> = ({
                                                activeUnitId,
                                              }) => {
  const {t} = useTranslation("course");
  const {get, update, workspaceMode} = useCourseWorkspaceStore();
  
  const isEditable = React.useMemo(() => {
    return workspaceMode === "edit" || workspaceMode === "create";
  }, [workspaceMode]);
  
  const unit = React.useMemo(() => {
    const u = get("courseUnits", activeUnitId);
    if (!u) throw new Error("Unknown course unit");
    return u;
  }, [activeUnitId, get]);
  
  return (
    <div className={styles.unitEditor}>
      <div className={styles.unitHeader}>
        <input
          type="text"
          value={unit.title}
          disabled={!isEditable}
          onChange={(e) => {
            if (!isEditable) return;
            update("courseUnits", unit.id, {title: e.target.value});
          }}
          className={styles.unitTitleInput}
          placeholder={t('detail.unitPlaceholder')}
        />
      </div>
      
      <div className={styles.unitDescription}>
        <textarea
          value={unit.description}
          disabled={!isEditable}
          onChange={(e) => {
            if (!isEditable) return;
            update("courseUnits", unit.id, {description: e.target.value});
          }}
          className={styles.textarea}
          placeholder={t('form.descriptionLabel')}
          rows={3}
        />
      </div>
      
      <div className={styles.assignmentsSection}>
        <AssignmentsList activeUnitId={activeUnitId}/>
      </div>
    </div>
  );
};
export default Editor;