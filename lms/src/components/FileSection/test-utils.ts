import {vi} from 'vitest';
import {FileView} from '@/types';

// Mock function factories
export const createMockUploadFunction = () => vi.fn();
export const createMockOnUploadStart = () => vi.fn();
export const createMockOnUploadSucceed = () => vi.fn();
export const createMockOnUploadError = () => vi.fn();
export const createMockOnUploaded = () => vi.fn();

// Common test file creation
export const createTestFile = (name: string = 'test.pdf', content: string = 'content', type: string = 'application/pdf'): File => {
  return new File([content], name, { type });
};

// Common initial files
export const createInitialFiles = (): FileView[] => [
  {
    id: '1',
    filename: 'test-file.pdf',
    mimeType: 'application/pdf',
    fileSize: 1024,
    updatedAt: '2024-01-01T00:00:00.000Z',
    uploadStatus: 'success',
    uploadProgress: 100
  }
];

// Utility to simulate file input change
export const simulateFileInputChange = async (container: HTMLElement, file: File) => {
  const input = container.querySelector('input[type="file"]') as HTMLInputElement;
  Object.defineProperty(input, 'files', {
    value: [file],
  });
  
  // Reset the input value to allow selecting the same file again
  input.onchange = () => {
    input.value = '';
  };
  
  return input;
};

// Shared mock for react-i18next (this should be exported as a function)
export const mockI18nImplementation = {
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'fileUploadBox.prompt': 'Upload',
        'fileUploadBox.choose': 'choose',
        'fileUploadBox.toUpload': 'to upload',
        'fileUploadBox.dragDrop': 'or drag and drop'
      };
      return translations[key] || key;
    }
  })
};