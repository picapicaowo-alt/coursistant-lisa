import {beforeEach, describe, expect, it, vi} from 'vitest';
import {AssignmentApiService} from './assignment-api';
import type {V2ApiClient} from '@/apis';

const client = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
};

const service = new AssignmentApiService(client as unknown as typeof V2ApiClient);

describe('AssignmentApiService 8081 routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads an assignment inside its course scope', async () => {
    client.get.mockResolvedValue({status: 200, data: {id: 9}});

    await service.getAssignment(4, 9);

    expect(client.get).toHaveBeenCalledWith('/v2/courses/4/assignments/9');
  });

  it('patches an assignment with PATCH rather than a legacy edit POST', async () => {
    const payload = {title: 'Revised assignment'};
    client.patch.mockResolvedValue({status: 200, data: {id: 9}});

    await service.patchAssignment(4, 9, payload);

    expect(client.patch).toHaveBeenCalledWith('/v2/courses/4/assignments/9', payload);
  });

  it('uploads submission files to staging before hand-in', async () => {
    const file = new File(['answer'], 'answer.pdf', {type: 'application/pdf'});
    client.post.mockResolvedValue({status: 200, data: [{id: 101}]});

    await service.uploadStagingFiles(4, 9, [file]);

    const [url, body] = client.post.mock.calls[0];
    expect(url).toBe('/v2/courses/4/assignments/9/submission-staging-files');
    expect(body).toBeInstanceOf(FormData);
    expect((body as FormData).getAll('files')).toEqual([file]);
  });

  it('submits staged files through the idempotent submissions endpoint', async () => {
    const payload = {stagingFileIds: [101, 102]};
    client.post.mockResolvedValue({status: 200, data: {submissionId: 20}});

    await service.submitStagedFiles(4, 9, payload, 'submit-attempt-1');

    expect(client.post).toHaveBeenCalledWith(
      '/v2/courses/4/assignments/9/submissions',
      payload,
      {headers: {'Idempotency-Key': 'submit-attempt-1'}}
    );
  });

  it('uses DELETE for staged and instructor attachment removal', async () => {
    client.delete.mockResolvedValue({status: 200});

    await service.deleteStagingFile(4, 9, 101);
    await service.deleteAttachment(4, 9, 33);

    expect(client.delete).toHaveBeenNthCalledWith(
      1,
      '/v2/courses/4/assignments/9/submission-staging-files/101'
    );
    expect(client.delete).toHaveBeenNthCalledWith(
      2,
      '/v2/courses/4/assignments/9/attachments/33'
    );
  });

  it('publishes through the assignment lifecycle endpoint', async () => {
    client.post.mockResolvedValue({status: 200, data: {id: 9, state: 'Published'}});

    await service.publishAssignment(4, 9);

    expect(client.post).toHaveBeenCalledWith('/v2/courses/4/assignments/9/publish');
  });

  it('loads the instructor grading roster in the assignment course scope', async () => {
    client.get.mockResolvedValue({status: 200, data: {assignmentId: 9, items: []}});

    await service.getGradingRoster(4, 9);

    expect(client.get).toHaveBeenCalledWith('/v2/courses/4/assignments/9/grading-roster');
  });

  it('upserts an individual grade with PUT', async () => {
    const payload = {score: 92, submissionVersionId: 30};
    client.put.mockResolvedValue({status: 200, data: {id: 2, score: 92}});

    await service.upsertStudentGrade(4, 9, 385, payload);

    expect(client.put).toHaveBeenCalledWith(
      '/v2/courses/4/assignments/9/students/385/grade',
      payload
    );
  });

  it('releases every entered grade through the idempotent backend operation', async () => {
    client.post.mockResolvedValue({status: 200, data: {assignmentId: 9}});

    await service.releaseAllGrades(4, 9);

    expect(client.post).toHaveBeenCalledWith(
      '/v2/courses/4/assignments/9/grades/release-all'
    );
  });
});
