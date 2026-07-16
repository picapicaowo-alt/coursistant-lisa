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
}

export const FileSection: React.FC<FileSectionProps> = ({
                                                          files,
                                                          uploadFunction,
                                                          onUploaded,
                                                          disabled = false,
                                                        }) => {
  const [, setFileInfo] = React.useState<FileView[]>([...files]);
  
  /**
   * Called when a file upload starts
   * Updates the file status to 'uploading' and sets progress to 0
   */
  const onUploadStart = (file: FileView): void => {
    setFileInfo(prev => [...prev, {
      ...file,
      uploadStatus: 'uploading',
      uploadProgress: 0
    }]);
  }
  
  /**
   * Called when a file upload succeeds
   * Updates the file status to 'success', replaces temporary ID with actual file ID
   */
  const onUploadSucceed = (tempId: string, uploadedFileId: string): void => {
    setFileInfo(prev => {
      return prev.map(file => {
        if (file.id === tempId) {
          const updatedFile: FileView = {
            ...file,
            id: uploadedFileId,
            uploadStatus: 'success',
            uploadProgress: 100
          };
          
          onUploaded(updatedFile);
          
          return updatedFile;
        }
        return file;
      });
    });
  }
  
  /**
   * Called when a file upload fails
   * Updates the file status to 'error' and stores the error message
   */
  const onUploadError = (tempId: string, error: Error): void => {
    setFileInfo(prev => prev.map(file => {
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
            onUploadStart={onUploadStart}
            onUploadSucceed={onUploadSucceed}
            onUploadError={onUploadError}
          />
        </div>
      }
      
      <div className={styles.fileList}>
        {files.map((fileBlock) => (
          <FileBlock key={fileBlock.id} block={fileBlock} disabled={disabled}/>
        ))}
      </div>
    </React.Fragment>
  );
};