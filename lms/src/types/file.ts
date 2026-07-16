export type FileUploadStatus = 'idle' | 'uploading' | 'success' | 'error';

// Represents file data from the server (DTO)
export interface FileDto {
  id: number;
  filename: string;
  mimeType: string;
  fileSize: number;
  updatedAt: Date;
}

// Extends FileDto with UI-specific fields for upload status
export interface FileView extends FileDto {
  uploadStatus?: FileUploadStatus;
  uploadProgress?: number;
  errorMessage?: string;
}