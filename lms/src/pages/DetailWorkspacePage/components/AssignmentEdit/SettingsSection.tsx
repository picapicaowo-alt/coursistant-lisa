import React from "react";
import {useTranslation} from "react-i18next";
import styles from "./SettingsSection.module.scss";
import {useAssignmentEditStore} from "../../stores/useAssignmentEditStore";

export const SettingsSection: React.FC = () => {
  const {t} = useTranslation("detailWorkspace");
  const {assignment, update} = useAssignmentEditStore();
  
  return (
    <div className={styles.settingsSection}>
      <h3 className={styles.settingsTitle}>{t('assignmentEdit.settings')}</h3>
      
      <div className={styles.settingsGrid}>
        <label className={styles.settingItem}>
          <input
            type="checkbox"
            checked={assignment.settings.allowLateSubmission}
            onChange={(e) => {
              update("assignments", assignment.id, {
                settings: {
                  allowedResubmissionCount: assignment.settings.allowedResubmissionCount,
                  allowLateSubmission: e.target.checked,
                }
              });
            }}
            className={styles.settingCheckbox}
          />
          <div className={styles.settingContent}>
            <span className={styles.settingText}>{t('assignmentEdit.allowLateSubmission')}</span>
            <span className={styles.settingHint}>{t('assignmentEdit.allowLateSubmissionHint')}</span>
          </div>
        </label>
        
        <div className={styles.settingItem}>
          <div className={styles.settingContent}>
            <span className={styles.settingText}>{t('assignmentEdit.allowedResubmissionCount')}</span>
            <span className={styles.settingHint}>{t('assignmentEdit.allowedResubmissionCountHint')}</span>
          </div>
          <div className={styles.resubmissionControl}>
            <button
              type="button"
              onClick={() => {
                update("assignments", assignment.id, {
                  settings: {
                    allowedResubmissionCount: Math.max(0, assignment.settings.allowedResubmissionCount - 1),
                    allowLateSubmission: assignment.settings.allowLateSubmission,
                  }
                });
              }}
              className={styles.resubmissionButton}
              disabled={assignment.settings.allowedResubmissionCount === 0}
            >
              -
            </button>
            <input
              type="number"
              min="0"
              max="10"
              value={assignment.settings.allowedResubmissionCount}
              onChange={(e) => {
                update("assignments", assignment.id, {
                  settings: {
                    allowedResubmissionCount: parseInt(e.target.value) || 0,
                    allowLateSubmission: assignment.settings.allowLateSubmission,
                  }
                });
              }}
              className={styles.resubmissionInput}
            />
            <button
              type="button"
              onClick={() => {
                update("assignments", assignment.id, {
                  settings: {
                    allowedResubmissionCount: Math.min(10, assignment.settings.allowedResubmissionCount + 1),
                    allowLateSubmission: assignment.settings.allowLateSubmission,
                  }
                });
              }}
              className={styles.resubmissionButton}
              disabled={assignment.settings.allowedResubmissionCount === 10}
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};