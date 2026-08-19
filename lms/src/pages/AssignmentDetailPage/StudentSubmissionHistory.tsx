import {useState} from 'react';
import {Download, Eye, FileText} from 'lucide-react';
import type {SubmissionFile, SubmissionVersion} from '@/apis';
import {assignmentApiService} from '@/apis/services/assignment-api';
import {openPreviewWindow, saveBlob, showBlobInPreviewWindow} from '@/utils/downloadBlob';
import styles from './index.module.scss';

interface StudentSubmissionHistoryProps {
  courseId: number;
  assignmentId: number;
  submissionId: number;
  versions: SubmissionVersion[];
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const StudentSubmissionHistory = ({
  courseId,
  assignmentId,
  submissionId,
  versions,
}: StudentSubmissionHistoryProps) => {
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const downloadFile = async (file: SubmissionFile) => {
    setActiveAction(`download-${file.id}`);
    setFileError(null);
    try {
      const blob = await assignmentApiService.downloadSubmissionFile(
        courseId, assignmentId, submissionId, file.id,
      );
      saveBlob(blob, file.originalName);
    } catch {
      setFileError(`Could not download ${file.originalName}.`);
    } finally {
      setActiveAction(null);
    }
  };

  const previewFile = async (file: SubmissionFile) => {
    const previewWindow = openPreviewWindow();
    if (!previewWindow) {
      setFileError('Allow pop-ups to preview this file.');
      return;
    }

    setActiveAction(`preview-${file.id}`);
    setFileError(null);
    try {
      const blob = await assignmentApiService.previewSubmissionFile(
        courseId, assignmentId, submissionId, file.id,
      );
      showBlobInPreviewWindow(previewWindow, blob);
    } catch {
      previewWindow.close();
      setFileError(`Could not preview ${file.originalName}.`);
    } finally {
      setActiveAction(null);
    }
  };

  return (
    <div className={styles.submissionVersions} aria-label="Submission version history">
      {versions.map((version, index) => (
        <section className={styles.submissionVersion} key={version.id}>
          <div className={styles.versionHeader}>
            <div>
              <strong>Version {version.versionNo}</strong>
              <span>{version.fileCount} file(s)</span>
            </div>
            <span>{index === 0 ? 'Current' : 'Previous submission'}</span>
          </div>

          {version.files.length > 0 ? (
            <ul className={styles.submissionFiles}>
              {version.files.map(file => (
                <li key={file.id}>
                  <FileText size={20} aria-hidden="true"/>
                  <span className={styles.submissionFileName}>
                    <strong>{file.originalName}</strong>
                    <small>{formatFileSize(file.sizeBytes)}</small>
                  </span>
                  <span className={styles.submissionFileActions}>
                    {file.previewAvailable ? (
                      <button
                        type="button"
                        onClick={() => void previewFile(file)}
                        disabled={activeAction !== null}
                      >
                        <Eye size={15}/>
                        {activeAction === `preview-${file.id}` ? 'Opening…' : 'Preview'}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => void downloadFile(file)}
                      disabled={activeAction !== null}
                    >
                      <Download size={15}/>
                      {activeAction === `download-${file.id}` ? 'Downloading…' : 'Download'}
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.secondaryText}>No files were attached to this version.</p>
          )}
        </section>
      ))}
      {fileError ? <p className={styles.error} role="alert">{fileError}</p> : null}
    </div>
  );
};
