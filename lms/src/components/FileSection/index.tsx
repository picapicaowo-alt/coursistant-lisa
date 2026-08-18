import React from 'react';
import FileUploadBox from "./FileUploadBox";
import styles from './index.module.scss';
import {FileBlock} from "./FileBlock";
import {FileView} from "@/types";

/**
 * FileSection Component
 * Displays a file upload box and a list of uploaded files
 * @param {FileView[]} files - Initial list of files to display
 * @param {(file: File, abortSignal: AbortSignal) => Promise<string>} uploadFunction - Function to handle file uploads, returns file ID
 * @param {(file: FileView) => void} onUploaded - Callback when a file upload succeeds
 */
interface FileSectionProps {
  files: FileView[];
  uploadFunction: (file: File, abortSignal: AbortSignal) => Promise<string>;
  onUploaded: (file: FileView) => void;
  disabled?: boolean;
  accept?: string;
}

export const FileSection: React.FC<FileSectionProps> = ({
                                                          files,
                                                          uploadFunction,
                                                          onUploaded,
                                                          disabled = false,
                                                          accept,
                                                        }) => {
  const [pendingFiles, setPendingFiles] = React.useState<FileView[]>([]);
  const pendingFilesRef = React.useRef(new Map<string | number, FileView>());

  const displayedFiles = React.useMemo(() => {
    const persistedIds = new Set(files.map(file => file.id));
    return [
      ...files,
      ...pendingFiles.filter(file => !persistedIds.has(file.id)),
    ];
  }, [files, pendingFiles]);

  React.useEffect(() => {
    const persistedIds = new Set(files.map(file => file.id));
    if (persistedIds.size === 0) return;

    setPendingFiles(prev => {
      const next = prev.filter(file => !persistedIds.has(file.id));
      return next.length === prev.length ? prev : next;
    });
  }, [files]);
  
  /**
   * Called when a file upload starts
   * Updates the file status to 'uploading' and sets progress to 0
   */
  const onUploadStart = (file: FileView): void => {
    const pendingFile: FileView = {
      ...file,
      uploadStatus: 'uploading',
      uploadProgress: 0
    };

    pendingFilesRef.current.set(file.id, pendingFile);
    setPendingFiles(prev => [...prev, pendingFile]);
  }
  
  /**
   * Called when a file upload succeeds
   * Updates the file status to 'success', replaces temporary ID with actual file ID
   */
  const onUploadSucceed = (tempId: string, uploadedFileId: string): void => {
    const pendingFile = pendingFilesRef.current.get(tempId);
    if (!pendingFile) return;

    const uploadedFile: FileView = {
      ...pendingFile,
      id: uploadedFileId,
      uploadStatus: 'success',
      uploadProgress: 100
    };

    pendingFilesRef.current.delete(tempId);
    setPendingFiles(prev => prev.map(file => file.id === tempId ? uploadedFile : file));
    onUploaded(uploadedFile);
  }
  
  /**
   * Called when a file upload fails
   * Updates the file status to 'error' and stores the error message
   */
  const onUploadError = (tempId: string, error: Error): void => {
    const failedFile = pendingFilesRef.current.get(tempId);
    if (failedFile) {
      pendingFilesRef.current.set(tempId, {
        ...failedFile,
        uploadStatus: 'error',
        errorMessage: error.message,
      });
    }

    setPendingFiles(prev => prev.map(file => {
      if (file.id === tempId) {
        return {
          ...file,
          uploadStatus: 'error',
          errorMessage: error.message
        };
      }
      return file;
    }));
  }
  
  return (
    <React.Fragment>
      {!disabled &&
        <div className={styles.uploadArea}>
          <FileUploadBox
            uploadFunction={uploadFunction}
            accept={accept}
            onUploadStart={onUploadStart}
            onUploadSucceed={onUploadSucceed}
            onUploadError={onUploadError}
          />
        </div>
      }
      
      <div className={styles.fileList}>
        {displayedFiles.map((fileBlock) => (
          <FileBlock key={fileBlock.id} block={fileBlock} disabled={disabled}/>
        ))}
      </div>
    </React.Fragment>
  );
};
