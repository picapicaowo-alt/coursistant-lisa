import {beforeEach, describe, expect, it, vi} from 'vitest';
import type {V2ApiClient} from '@/apis';
import {CourseApiService} from './course-api';

const binaryClient = {get: vi.fn()};
const client = {
  getClient: vi.fn(() => binaryClient),
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
};
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

describe('CourseApiService material management', () => {
  beforeEach(() => vi.clearAllMocks());

  it('uploads files and link fields as multipart with a reusable idempotency key', async () => {
    const file = new File(['notes'], 'notes.pdf', {type: 'application/pdf'});
    client.post.mockResolvedValue({status: 200, data: []});

    await service.createMaterials(31, 5, {
      files: [file],
      linkUrl: 'https://example.com/reading',
      linkDisplayName: 'Reading',
    }, 'material-attempt-1');

    const [url, body, config] = client.post.mock.calls[0];
    expect(url).toBe('/v2/courses/31/weeks/5/materials');
    expect(body).toBeInstanceOf(FormData);
    expect((body as FormData).getAll('files')).toEqual([file]);
    expect((body as FormData).get('linkUrl')).toBe('https://example.com/reading');
    expect(config).toEqual({headers: {'Idempotency-Key': 'material-attempt-1'}});
  });

  it('renames, moves, reorders, and deletes materials through the documented routes', async () => {
    client.patch.mockResolvedValue({status: 200, data: {id: 81}});
    client.post.mockResolvedValue({status: 200, data: {id: 81}});
    client.put.mockResolvedValue({status: 200, data: []});
    client.delete.mockResolvedValue({status: 200});

    await service.renameMaterial(31, 5, 81, 'Revised notes');
    await service.moveMaterial(31, 5, 81, 6);
    await service.reorderMaterials(31, 5, [82, 81]);
    await service.deleteMaterial(31, 5, 81);

    expect(client.patch).toHaveBeenCalledWith(
      '/v2/courses/31/weeks/5/materials/81',
      {displayName: 'Revised notes'},
      expect.objectContaining({headers: expect.objectContaining({'Idempotency-Key': expect.any(String)})})
    );
    expect(client.post).toHaveBeenCalledWith(
      '/v2/courses/31/weeks/5/materials/81/move',
      {targetWeekId: 6},
      expect.objectContaining({headers: expect.objectContaining({'Idempotency-Key': expect.any(String)})})
    );
    expect(client.put).toHaveBeenCalledWith(
      '/v2/courses/31/weeks/5/materials/reorder',
      {materialIds: [82, 81]},
      expect.objectContaining({headers: expect.objectContaining({'Idempotency-Key': expect.any(String)})})
    );
    expect(client.delete).toHaveBeenCalledWith('/v2/courses/31/weeks/5/materials/81');
  });
});

describe('CourseApiService week management', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a week with the caller-provided retry key', async () => {
    client.post.mockResolvedValue({status: 200, data: {id: 6}});

    await service.createWeek(31, 'Week 2', 'week-attempt-1');

    expect(client.post).toHaveBeenCalledWith(
      '/v2/courses/31/weeks',
      {title: 'Week 2'},
      {headers: {'Idempotency-Key': 'week-attempt-1'}}
    );
  });
});

describe('CourseApiService notification subjects', () => {
  beforeEach(() => vi.clearAllMocks());

  it('loads announcement, event, and group-set details from their canonical routes', async () => {
    client.get.mockResolvedValue({status: 200, data: {id: 9}});

    await service.getAnnouncement(31, 9);
    await service.getCourseEvent(31, 10);
    await service.getGroupSet(31, 11);

    expect(client.get).toHaveBeenNthCalledWith(1, '/v2/courses/31/announcements/9');
    expect(client.get).toHaveBeenNthCalledWith(2, '/v2/courses/31/events/10');
    expect(client.get).toHaveBeenNthCalledWith(3, '/v2/courses/31/group-sets/11');
  });
});
