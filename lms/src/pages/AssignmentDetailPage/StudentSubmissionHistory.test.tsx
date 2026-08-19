import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import '@testing-library/jest-dom';
import type {SubmissionVersion} from '@/apis';
import {assignmentApiService} from '@/apis/services/assignment-api';
import {openPreviewWindow, saveBlob, showBlobInPreviewWindow} from '@/utils/downloadBlob';
import {StudentSubmissionHistory} from './StudentSubmissionHistory';

vi.mock('@/apis/services/assignment-api', () => ({
  assignmentApiService: {
    downloadSubmissionFile: vi.fn(),
    previewSubmissionFile: vi.fn(),
  },
}));

vi.mock('@/utils/downloadBlob', () => ({
  openPreviewWindow: vi.fn(),
  saveBlob: vi.fn(),
  showBlobInPreviewWindow: vi.fn(),
}));

const version: SubmissionVersion = {
  id: 37,
  submissionId: 30,
  assignmentId: 48,
  ownerUserId: 389,
  versionNo: 1,
  submittedAt: '2026-08-18T10:34:30Z',
  usedGraceBuffer: false,
  submissionStatus: 'Submitted',
  fileCount: 1,
  files: [{
    id: 46,
    submissionVersionId: 37,
    originalName: 'regtest5-postgresql-setup-report.pdf',
    contentType: 'application/pdf',
    sizeBytes: 2180,
    checksumSha256: 'checksum',
    sortOrder: 0,
    previewAvailable: true,
    downloadUrl: '/download',
    previewUrl: '/preview',
    createdAt: '2026-08-18T10:34:30Z',
  }],
};

describe('StudentSubmissionHistory', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows the files belonging to Version 1 and downloads them', async () => {
    const blob = new Blob(['submission'], {type: 'application/pdf'});
    vi.mocked(assignmentApiService.downloadSubmissionFile).mockResolvedValue(blob);

    render(
      <StudentSubmissionHistory
        courseId={34}
        assignmentId={48}
        submissionId={30}
        versions={[version]}
      />
    );

    expect(screen.getByText('Version 1')).toBeInTheDocument();
    expect(screen.getByText('regtest5-postgresql-setup-report.pdf')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: /download/i}));

    await waitFor(() => {
      expect(assignmentApiService.downloadSubmissionFile).toHaveBeenCalledWith(34, 48, 30, 46);
      expect(saveBlob).toHaveBeenCalledWith(blob, 'regtest5-postgresql-setup-report.pdf');
    });
  });

  it('previews a previewable submitted file', async () => {
    const blob = new Blob(['submission'], {type: 'application/pdf'});
    const previewWindow = {close: vi.fn()} as unknown as Window;
    vi.mocked(openPreviewWindow).mockReturnValue(previewWindow);
    vi.mocked(assignmentApiService.previewSubmissionFile).mockResolvedValue(blob);

    render(
      <StudentSubmissionHistory
        courseId={34}
        assignmentId={48}
        submissionId={30}
        versions={[version]}
      />
    );
    fireEvent.click(screen.getByRole('button', {name: /preview/i}));

    await waitFor(() => {
      expect(assignmentApiService.previewSubmissionFile).toHaveBeenCalledWith(34, 48, 30, 46);
      expect(showBlobInPreviewWindow).toHaveBeenCalledWith(previewWindow, blob);
    });
  });
});
