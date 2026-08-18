// noinspection DuplicatedCode

import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import {act} from 'react-dom/test-utils';
import '@testing-library/jest-dom';
import FileUploadBox from './FileUploadBox';
import {
  createMockUploadFunction,
  createMockOnUploadStart,
  createMockOnUploadSucceed,
  createMockOnUploadError,
  createTestFile,
  simulateFileInputChange
} from './test-utils';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'fileUploadBox.prompt': 'Upload',
        'fileUploadBox.choose': 'choose',
        'fileUploadBox.toUpload': 'to upload'
      };
      return translations[key] || key;
    }
  })
}));

describe('FileUploadBox', () => {
  let mockUploadFunction: ReturnType<typeof createMockUploadFunction>;
  let mockOnUploadStart: ReturnType<typeof createMockOnUploadStart>;
  let mockOnUploadSucceed: ReturnType<typeof createMockOnUploadSucceed>;
  let mockOnUploadError: ReturnType<typeof createMockOnUploadError>;
  
  beforeEach(() => {
    mockUploadFunction = createMockUploadFunction();
    mockOnUploadStart = createMockOnUploadStart();
    mockOnUploadSucceed = createMockOnUploadSucceed();
    mockOnUploadError = createMockOnUploadError();
    vi.clearAllMocks();
  });
  
  describe('Rendering', () => {
    it('renders upload area with prompt text', () => {
      render(
        <FileUploadBox
          uploadFunction={mockUploadFunction}
          onUploadStart={mockOnUploadStart}
          onUploadSucceed={mockOnUploadSucceed}
          onUploadError={mockOnUploadError}
        />
      );
      
      // Text is split across multiple elements, so check for each part
      expect(screen.getByText(/Upload/)).toBeInTheDocument();
      expect(screen.getByText(/choose/)).toBeInTheDocument();
      expect(screen.getByText(/to upload/)).toBeInTheDocument();
    });
    
    it('renders file input element', () => {
      const {container} = render(
        <FileUploadBox
          uploadFunction={mockUploadFunction}
          onUploadStart={mockOnUploadStart}
          onUploadSucceed={mockOnUploadSucceed}
          onUploadError={mockOnUploadError}
        />
      );
      
      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput!.className).toContain('fileInput');
    });
    
    it('renders upload icon', () => {
      render(
        <FileUploadBox
          uploadFunction={mockUploadFunction}
          onUploadStart={mockOnUploadStart}
          onUploadSucceed={mockOnUploadSucceed}
          onUploadError={mockOnUploadError}
        />
      );
      
      const uploadIcon = screen.getByRole('button').querySelector('.lucide-upload');
      expect(uploadIcon).toBeInTheDocument();
    });
  });
  
  describe('File Selection', () => {
    it('triggers file selection when clicking on the upload area', () => {
      const {container} = render(
        <FileUploadBox
          uploadFunction={mockUploadFunction}
          onUploadStart={mockOnUploadStart}
          onUploadSucceed={mockOnUploadSucceed}
          onUploadError={mockOnUploadError}
        />
      );
      
      // Get the hidden file input element
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const originalClick = fileInput.click;
      let clickCount = 0;
      fileInput.click = () => {
        clickCount++;
      };
      
      // Click the upload area
      const uploadArea = screen.getByRole('button');
      fireEvent.click(uploadArea!);
      
      expect(clickCount).toBe(1);
      
      // Restore original click method
      fileInput.click = originalClick;
    });

    it('triggers file selection from the keyboard', () => {
      const {container} = render(
        <FileUploadBox
          uploadFunction={mockUploadFunction}
          onUploadStart={mockOnUploadStart}
          onUploadSucceed={mockOnUploadSucceed}
          onUploadError={mockOnUploadError}
        />
      );

      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const clickSpy = vi.spyOn(fileInput, 'click').mockImplementation(() => undefined);
      const uploadArea = screen.getByRole('button');

      fireEvent.keyDown(uploadArea, {key: 'Enter'});
      fireEvent.keyDown(uploadArea, {key: ' '});

      expect(clickSpy).toHaveBeenCalledTimes(2);
    });
    
    it('handles file selection and triggers upload start', async () => {
      const mockFile = createTestFile();
      mockUploadFunction.mockResolvedValue('uploaded-file-id'); // Ensure it returns a promise
      
      const {container} = render(
        <FileUploadBox
          uploadFunction={mockUploadFunction}
          onUploadStart={mockOnUploadStart}
          onUploadSucceed={mockOnUploadSucceed}
          onUploadError={mockOnUploadError}
        />
      );
      
      // Wait for component to fully initialize
      await new Promise(resolve => setTimeout(resolve, 20));
      
      // Simulate file selection
      const input = await simulateFileInputChange(container, mockFile);
      
      await act(async () => {
        fireEvent.change(input);
      });
      
      await waitFor(() => {
        expect(mockOnUploadStart).toHaveBeenCalledTimes(1);
        const calledWith = mockOnUploadStart.mock.calls[0][0];
        expect(calledWith.filename).toBe('test.pdf');
        expect(calledWith.mimeType).toBe('application/pdf');
        expect(calledWith.fileSize).toBe(7);
      });
    });
  });
  
  describe('Upload Process', () => {
    it('calls onUploadStart when file is selected', async () => {
      const mockFile = createTestFile();
      mockUploadFunction.mockResolvedValue('uploaded-file-id');
      
      const {container} = render(
        <FileUploadBox
          uploadFunction={mockUploadFunction}
          onUploadStart={mockOnUploadStart}
          onUploadSucceed={mockOnUploadSucceed}
          onUploadError={mockOnUploadError}
        />
      );
      
      // Wait for component to fully initialize
      await new Promise(resolve => setTimeout(resolve, 20));
      
      const input = await simulateFileInputChange(container, mockFile);
      
      await act(async () => {
        fireEvent.change(input);
      });
      
      await waitFor(() => {
        expect(mockOnUploadStart).toHaveBeenCalledTimes(1);
      });
    });
    
    it('calls onUploadSucceed when upload completes successfully', async () => {
      const mockFile = createTestFile();
      mockUploadFunction.mockResolvedValue('uploaded-file-id');
      
      const {container} = render(
        <FileUploadBox
          uploadFunction={mockUploadFunction}
          onUploadStart={mockOnUploadStart}
          onUploadSucceed={mockOnUploadSucceed}
          onUploadError={mockOnUploadError}
        />
      );
      
      // Wait for component to fully initialize
      await new Promise(resolve => setTimeout(resolve, 20));
      
      const input = await simulateFileInputChange(container, mockFile);
      
      await act(async () => {
        fireEvent.change(input);
      });
      
      await waitFor(() => {
        expect(mockOnUploadSucceed).toHaveBeenCalledWith(expect.any(String), 'uploaded-file-id');
      });
    });
    
    it('calls onUploadError when upload fails', async () => {
      const mockFile = createTestFile();
      const error = new Error('Upload failed');
      mockUploadFunction.mockRejectedValue(error);
      
      const {container} = render(
        <FileUploadBox
          uploadFunction={mockUploadFunction}
          onUploadStart={mockOnUploadStart}
          onUploadSucceed={mockOnUploadSucceed}
          onUploadError={mockOnUploadError}
        />
      );
      
      // Wait for component to fully initialize
      await new Promise(resolve => setTimeout(resolve, 20));
      
      const input = await simulateFileInputChange(container, mockFile);
      
      await act(async () => {
        fireEvent.change(input);
      });
      
      await waitFor(() => {
        expect(mockOnUploadError).toHaveBeenCalledWith(expect.any(String), error);
      });
    });
  });
  
  describe('Drag and Drop', () => {
    it('changes appearance when file is dragged over', () => {
      render(
        <FileUploadBox
          uploadFunction={mockUploadFunction}
          onUploadStart={mockOnUploadStart}
          onUploadSucceed={mockOnUploadSucceed}
          onUploadError={mockOnUploadError}
        />
      );
      
      const uploadArea = screen.getByRole('button');
      fireEvent.dragOver(uploadArea!);
      
      // The CSS module class name might be different due to transformation
      expect(uploadArea!.className).toContain('uploadAreaDragging');
    });
    
    it('handles file drop and triggers upload', async () => {
      const mockFile = new File(['content'], 'test.pdf', {type: 'application/pdf'});
      mockUploadFunction.mockResolvedValue('uploaded-file-id');
      
      render(
        <FileUploadBox
          uploadFunction={mockUploadFunction}
          onUploadStart={mockOnUploadStart}
          onUploadSucceed={mockOnUploadSucceed}
          onUploadError={mockOnUploadError}
        />
      );
      
      const uploadArea = screen.getByRole('button');
      fireEvent.drop(uploadArea!, {
        dataTransfer: {
          files: [mockFile],
        },
      });
      
      await waitFor(() => {
        expect(mockOnUploadStart).toHaveBeenCalledTimes(1);
      });
    });
  });
});
