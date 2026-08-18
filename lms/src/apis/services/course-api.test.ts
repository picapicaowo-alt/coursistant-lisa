import {beforeEach, describe, expect, it, vi} from 'vitest';
import type {V2ApiClient} from '@/apis';
import {CourseApiService} from './course-api';

const binaryClient = {get: vi.fn(), delete: vi.fn()};
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

describe('CourseApiService event and group management', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates, updates, and deletes course events through the v2 contract', async () => {
    const payload = {name: 'Review', date: '2026-09-10', startTime: '10:00'};
    client.post.mockResolvedValue({status: 200, data: {id: 10}});
    client.put.mockResolvedValue({status: 200, data: {id: 10}});
    client.delete.mockResolvedValue({status: 200});
    await service.createCourseEvent(31, payload, 'event-key');
    await service.updateCourseEvent(31, 10, payload);
    await service.deleteCourseEvent(31, 10);
    expect(client.post).toHaveBeenCalledWith('/v2/courses/31/events', payload, {headers: {'Idempotency-Key': 'event-key'}});
    expect(client.put).toHaveBeenCalledWith('/v2/courses/31/events/10', payload, expect.objectContaining({headers: expect.any(Object)}));
    expect(client.delete).toHaveBeenCalledWith('/v2/courses/31/events/10');
  });

  it('uses canonical group membership routes for student and staff actions', async () => {
    client.post.mockResolvedValue({status: 200, data: {}});
    client.delete.mockResolvedValue({status: 200});
    await service.joinGroup(31, 11, 21);
    await service.switchGroup(31, 11, 22);
    await service.assignGroupMember(31, 11, 21, 385, {confirmCapacityOverfill: true});
    await service.moveGroupMember(31, 11, 385, 22, {confirmAcademicImpact: true});
    await service.removeGroupMember(31, 11, 21, 385, true);
    expect(client.post).toHaveBeenNthCalledWith(1, '/v2/courses/31/group-sets/11/groups/21/join');
    expect(client.post).toHaveBeenNthCalledWith(2, '/v2/courses/31/group-sets/11/switch', {targetGroupId: 22});
    expect(client.post).toHaveBeenNthCalledWith(3, '/v2/courses/31/group-sets/11/groups/21/members', {userId: 385, confirmCapacityOverfill: true});
    expect(client.post).toHaveBeenNthCalledWith(4, '/v2/courses/31/group-sets/11/members/385/move', {targetGroupId: 22, confirmAcademicImpact: true});
    expect(client.delete).toHaveBeenCalledWith('/v2/courses/31/group-sets/11/groups/21/members/385', {params: {confirmAcademicImpact: true}});
  });
});

describe('CourseApiService course, roster, and syllabus workflows', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a course at the v2 collection with an idempotency key', async () => {
    const request = {courseCode: 'BIO-211', title: 'Genetics', termStartDate: '2026-08-24', termEndDate: '2026-12-12'};
    client.post.mockResolvedValue({status: 200, data: {id: 32}});
    await service.createCourse(request);
    expect(client.post).toHaveBeenCalledWith(
      '/v2/courses',
      request,
      expect.objectContaining({headers: expect.objectContaining({'Idempotency-Key': expect.any(String)})}),
    );
  });

  it('uses the current member lifecycle routes', async () => {
    client.get.mockResolvedValue({status: 200, data: {items: []}});
    client.post.mockResolvedValue({status: 200, data: {}});
    client.delete.mockResolvedValue({status: 200, data: {}});
    await service.listCourseMembers(31, {courseRole: 'Student', active: true, page: 0, size: 20});
    await service.enrolStudents(31, {emails: ['student@example.test']});
    await service.promoteToTa(31, 8);
    await service.demoteTa(31, 8);
    await service.withdrawStudent(31, 8);
    expect(client.get).toHaveBeenCalledWith('/v2/courses/31/members', {params: {courseRole: 'Student', active: true, page: 0, size: 20}});
    expect(client.post).toHaveBeenNthCalledWith(1, '/v2/courses/31/students/batch', {emails: ['student@example.test']}, expect.objectContaining({headers: expect.any(Object)}));
    expect(client.post).toHaveBeenNthCalledWith(2, '/v2/courses/31/tas', {userId: 8}, expect.objectContaining({headers: expect.any(Object)}));
    expect(client.delete).toHaveBeenNthCalledWith(1, '/v2/courses/31/tas/8');
    expect(client.delete).toHaveBeenNthCalledWith(2, '/v2/courses/31/students/8');
  });

  it('uploads and reads the versioned syllabus through authenticated routes', async () => {
    const file = new File(['pdf'], 'syllabus.pdf', {type: 'application/pdf'});
    const blob = new Blob(['pdf'], {type: 'application/pdf'});
    client.get.mockResolvedValue({status: 200, data: {posted: false}});
    client.post.mockResolvedValue({status: 200, data: {posted: true}});
    binaryClient.get.mockResolvedValue({data: blob});
    await service.getSyllabus(31);
    await service.uploadSyllabus(31, file);
    await service.restoreSyllabus(31);
    await expect(service.downloadSyllabus(31, true)).resolves.toBe(blob);
    expect(client.get).toHaveBeenCalledWith('/v2/courses/31/syllabus');
    const uploadCall = client.post.mock.calls[0];
    expect(uploadCall[0]).toBe('/v2/courses/31/syllabus');
    expect(uploadCall[1]).toBeInstanceOf(FormData);
    expect((uploadCall[1] as FormData).get('file')).toBe(file);
    expect(binaryClient.get).toHaveBeenCalledWith('/v2/courses/31/syllabus/preview', {responseType: 'blob'});
  });

  it('updates all four TA permission flags through the scoped route', async () => {
    const permissions = {canGrade: true, canPostAnnouncements: false, canManageGroups: true, canManageCourseEvents: false};
    client.patch.mockResolvedValue({status: 200, data: {userId: 8}});
    await service.updateTaPermissions(31, 8, permissions);
    expect(client.patch).toHaveBeenCalledWith('/v2/courses/31/tas/8/permissions', permissions, expect.objectContaining({headers: expect.any(Object)}));
  });
});

describe('CourseApiService announcements, sessions, and lifecycle', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates, edits, lists, and deletes announcements', async () => {
    const payload = {title: 'Office hours', content: '<p>Friday</p>'};
    client.get.mockResolvedValue({status: 200, data: []});
    client.post.mockResolvedValue({status: 200, data: {id: 5}});
    client.patch.mockResolvedValue({status: 200, data: {id: 5}});
    binaryClient.delete = vi.fn().mockResolvedValue({status: 204});
    await service.listAnnouncements(31);
    await service.createAnnouncement(31, payload);
    await service.updateAnnouncement(31, 5, payload);
    await service.deleteAnnouncement(31, 5);
    expect(client.get).toHaveBeenCalledWith('/v2/courses/31/announcements');
    expect(client.post).toHaveBeenCalledWith('/v2/courses/31/announcements', payload, expect.objectContaining({headers: expect.any(Object)}));
    expect(client.patch).toHaveBeenCalledWith('/v2/courses/31/announcements/5', payload, expect.objectContaining({headers: expect.any(Object)}));
    expect(binaryClient.delete).toHaveBeenCalledWith('/v2/courses/31/announcements/5', {params: {confirm: true}});
  });

  it('writes recurring sessions and supports archive restoration and hard deletion', async () => {
    const session = {dayOfWeek: 'MON' as const, startTime: '09:00', endTime: '10:00', type: 'Lecture', location: 'Room 1'};
    client.post.mockResolvedValue({status: 200, data: {}});
    client.put.mockResolvedValue({status: 200, data: {}});
    client.delete.mockResolvedValue({status: 200});
    await service.createCourseSession(31, session);
    await service.updateCourseSession(31, 7, session);
    await service.deleteCourseSession(31, 7);
    await service.unarchiveCourse(31);
    await service.deleteCourse(31);
    expect(client.post).toHaveBeenNthCalledWith(1, '/v2/courses/31/sessions', session, expect.objectContaining({headers: expect.any(Object)}));
    expect(client.put).toHaveBeenCalledWith('/v2/courses/31/sessions/7', session, expect.objectContaining({headers: expect.any(Object)}));
    expect(client.delete).toHaveBeenNthCalledWith(1, '/v2/courses/31/sessions/7');
    expect(client.post).toHaveBeenNthCalledWith(2, '/v2/courses/31/unarchive', undefined, expect.objectContaining({headers: expect.any(Object)}));
    expect(client.delete).toHaveBeenNthCalledWith(2, '/v2/courses/31');
  });
});
