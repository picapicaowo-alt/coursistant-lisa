import {describe, expect, it, vi} from 'vitest';
import {StudentStudySupportApiService} from './student-study-support-api';

describe('StudentStudySupportApiService', () => {
  it('sends student Assistant questions through the Study Support stream contract', async () => {
    const stream = vi.fn().mockResolvedValue({answer: 'Course-grounded answer.'});
    const service = new StudentStudySupportApiService(stream);
    const onProgress = vi.fn();

    await expect(service.chat({
      courseId: 40,
      message: 'What assignments are due this week?',
      accessToken: 'student-token',
      timeZone: 'America/Los_Angeles',
      onProgress,
    })).resolves.toBe('Course-grounded answer.');

    expect(stream).toHaveBeenCalledOnce();
    const request = stream.mock.calls[0][0];
    expect(request.url).toBe('/study-support/api/query/stream');
    expect(request.body.toString()).toBe(
      'courseId=40&query=What+assignments+are+due+this+week%3F&dialogueId=-1',
    );
    expect(request.headers).toEqual({
      Authorization: 'Bearer student-token',
      'X-Timezone': 'America/Los_Angeles',
    });
    expect(request.onProgress).toBe(onProgress);
  });

  it('rejects a request without a concrete course context', async () => {
    const stream = vi.fn();
    const service = new StudentStudySupportApiService(stream);

    await expect(service.chat({
      courseId: 0,
      message: 'Explain DDL.',
      accessToken: 'student-token',
      timeZone: 'America/Los_Angeles',
    })).rejects.toThrow('Select a course before asking Coursistant.');
    expect(stream).not.toHaveBeenCalled();
  });
});
