import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, expect, it, vi} from 'vitest';
import type {CourseWeek} from '@/apis';

const downloadWeekMaterials = vi.hoisted(() => vi.fn());
const saveBlob = vi.hoisted(() => vi.fn());
vi.mock('@/apis/services/course-api', () => ({courseApiService: {downloadWeekMaterials, downloadMaterial: vi.fn(), previewMaterial: vi.fn()}}));
vi.mock('@/utils/downloadBlob', () => ({saveBlob, openPreviewWindow: vi.fn(), showBlobInPreviewWindow: vi.fn()}));

import {ContentCard} from './ContentCard';

describe('ContentCard', () => {
  it('downloads all file materials in the selected week as a ZIP', async () => {
    const week: CourseWeek = {
      id: 5, courseId: 37, title: 'Week 1: Foundations', orderPosition: 0, state: 'Published',
      createdAt: '2026-08-24T00:00:00', updatedAt: '2026-08-24T00:00:00',
      materials: [{id: 81, weekId: 5, courseId: 37, materialType: 'FILE', displayName: 'Slides', orderPosition: 0, originalFilename: 'slides.pdf', contentType: 'application/pdf', extension: 'pdf', sizeBytes: 12, linkUrl: null, uploadedBy: 443, previewAvailable: true, downloadUrl: '/download'}],
    };
    const blob = new Blob(['zip'], {type: 'application/zip'});
    downloadWeekMaterials.mockResolvedValue(blob);
    render(<ContentCard week={week}/>);

    await userEvent.click(screen.getByRole('button', {name: 'Download all'}));
    expect(downloadWeekMaterials).toHaveBeenCalledWith(37, 5);
    expect(saveBlob).toHaveBeenCalledWith(blob, 'Week-1-Foundations-materials.zip');
  });
});
