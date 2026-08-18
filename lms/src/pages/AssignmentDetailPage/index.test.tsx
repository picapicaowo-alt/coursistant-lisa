import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import type {AssignmentAttachment} from '@/apis';
import {assignmentApiService} from '@/apis/services/assignment-api';
import {openPreviewWindow, saveBlob, showBlobInPreviewWindow} from '@/utils/downloadBlob';
import {InstructorAttachmentRow} from './index';

vi.mock('@/apis/services/assignment-api', () => ({
  assignmentApiService: {
    downloadAttachment: vi.fn(),
    previewAttachment: vi.fn(),
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
