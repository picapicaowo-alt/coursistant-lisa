import {beforeEach, describe, expect, it, vi} from 'vitest';
import type {V2ApiClient} from '@/apis';
import {CourseApiService} from './course-api';

const binaryClient = {get: vi.fn()};
const client = {getClient: vi.fn(() => binaryClient)};
const service = new CourseApiService(client as unknown as typeof V2ApiClient);

describe('CourseApiService material binaries', () => {
  beforeEach(() => vi.clearAllMocks());

  it('downloads material bytes through the authenticated Axios instance', async () => {
    const blob = new Blob(['notes'], {type: 'application/pdf'});
    binaryClient.get.mockResolvedValue({data: blob});

    await expect(service.downloadMaterial(31, 5, 81)).resolves.toBe(blob);
    expect(binaryClient.get).toHaveBeenCalledWith(
      '/v2/courses/31/weeks/5/materials/81/download',
      {responseType: 'blob'}
    );
  });

  it('loads inline preview bytes through the authenticated Axios instance', async () => {
    const blob = new Blob(['image'], {type: 'image/png'});
    binaryClient.get.mockResolvedValue({data: blob});

    await expect(service.previewMaterial(31, 5, 82)).resolves.toBe(blob);
    expect(binaryClient.get).toHaveBeenCalledWith(
      '/v2/courses/31/weeks/5/materials/82/preview',
      {responseType: 'blob'}
    );
  });
});
