import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import type {AssignmentAttachment} from '@/apis';
import {assignmentApiService} from '@/apis/services/assignment-api';
import {openPreviewWindow, saveBlob, showBlobInPreviewWindow} from '@/utils/downloadBlob';
import {InstructorAttachmentRow, uploadRubricWithReplaceConfirmation} from './index';

vi.mock('@/apis/services/assignment-api', () => ({
  assignmentApiService: {
    downloadAttachment: vi.fn(),
    previewAttachment: vi.fn(),
    uploadRubric: vi.fn(),
  },
}));

vi.mock('@/utils/downloadBlob', () => ({
  isPreviewableFile: vi.fn(() => true),
  openPreviewWindow: vi.fn(),
  saveBlob: vi.fn(),
  showBlobInPreviewWindow: vi.fn(),
}));

const attachment: AssignmentAttachment = {
  id: 33,
  assignmentId: 9,
  originalName: 'attach2.pdf',
  contentType: 'application/pdf',
  sizeBytes: 1024,
  uploadedBy: 7,
  createdAt: '2026-08-18T12:00:00Z',
  downloadUrl: '/v2/courses/4/assignments/9/attachments/33/download',
};

describe('InstructorAttachmentRow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('downloads a previewable file when its filename is clicked', async () => {
    const blob = new Blob(['assignment'], {type: 'application/pdf'});
    vi.mocked(assignmentApiService.downloadAttachment).mockResolvedValue(blob);
    render(<InstructorAttachmentRow courseId={4} assignmentId={9} attachment={attachment}/>);
    fireEvent.click(screen.getByRole('button', {name: 'Download attach2.pdf'}));

    await waitFor(() => {
      expect(assignmentApiService.downloadAttachment).toHaveBeenCalledWith(4, 9, 33);
      expect(saveBlob).toHaveBeenCalledWith(blob, 'attach2.pdf');
    });
  });

  it('uses the inline preview endpoint for a previewable instructor file', async () => {
    const blob = new Blob(['assignment'], {type: 'application/pdf'});
    const close = vi.fn();
    const previewWindow = {close} as unknown as Window;
    vi.mocked(openPreviewWindow).mockReturnValue(previewWindow);
    vi.mocked(assignmentApiService.previewAttachment).mockResolvedValue(blob);
    render(<InstructorAttachmentRow courseId={4} assignmentId={9} attachment={attachment}/>);
    fireEvent.click(screen.getByRole('button', {name: 'Preview'}));

    await waitFor(() => {
      expect(assignmentApiService.previewAttachment).toHaveBeenCalledWith(4, 9, 33);
      expect(showBlobInPreviewWindow).toHaveBeenCalledWith(previewWindow, blob);
    });
    expect(close).not.toHaveBeenCalled();
  });
});

describe('uploadRubricWithReplaceConfirmation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('asks for confirmation and retries when the server reports existing grades', async () => {
    const file = new File(['valid pdf'], 'rubric.pdf', {type: 'application/pdf'});
    const success = {
      status: 200,
      code: 'SUCCESS',
      message: 'ok',
      timestamp: '2026-08-18T12:00:00Z',
      data: {posted: true, originalName: 'rubric.pdf'},
    };
    vi.mocked(assignmentApiService.uploadRubric)
      .mockRejectedValueOnce({
        code: 409,
        message: 'Request failed',
        details: {code: 'RUBRIC_REPLACE_CONFIRM_REQUIRED'},
      })
      .mockResolvedValueOnce(success);
    const confirm = vi.fn(() => true);
    vi.stubGlobal('confirm', confirm);

    await expect(uploadRubricWithReplaceConfirmation(4, 9, file, false)).resolves.toBe(success);
    expect(confirm).toHaveBeenCalledWith(
      'At least one grade already references this rubric. Replace the rubric anyway? Existing grades will be preserved.',
    );
    expect(assignmentApiService.uploadRubric).toHaveBeenNthCalledWith(1, 4, 9, file, false);
    expect(assignmentApiService.uploadRubric).toHaveBeenNthCalledWith(2, 4, 9, file, true);
  });

  it('does not retry when the user declines replacement', async () => {
    const file = new File(['valid pdf'], 'rubric.pdf', {type: 'application/pdf'});
    const error = {
      code: 409,
      message: 'Request failed',
      details: {code: 'RUBRIC_REPLACE_CONFIRM_REQUIRED'},
    };
    vi.mocked(assignmentApiService.uploadRubric).mockRejectedValueOnce(error);
    vi.stubGlobal('confirm', vi.fn(() => false));

    await expect(uploadRubricWithReplaceConfirmation(4, 9, file, false)).rejects.toBe(error);
    expect(assignmentApiService.uploadRubric).toHaveBeenCalledTimes(1);
  });
});
