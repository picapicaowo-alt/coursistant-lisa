import {describe, expect, it} from 'vitest';
import {
  buildStudySupportFormData,
  buildStudySupportStreamBody,
} from './studySupportRequest';

describe('buildStudySupportFormData', () => {
  it('sends the agent request shape without a browser-controlled user id', () => {
    const request = buildStudySupportFormData({
      courseId: 37,
      query: 'Explain dynamic programming.',
      dialogueId: -1,
    });

    expect(request.get('courseId')).toBe('37');
    expect(request.get('query')).toBe('Explain dynamic programming.');
    expect(request.get('dialogueId')).toBe('-1');
    expect(request.has('userId')).toBe(false);
  });

  it('preserves an optional attachment', () => {
    const file = new File(['notes'], 'notes.txt', {type: 'text/plain'});
    const request = buildStudySupportFormData({
      courseId: 37,
      query: 'Summarize this file.',
      dialogueId: 12,
      file,
    });

    expect(request.get('file')).toBe(file);
  });

  it('builds the streaming request without browser-controlled identity', () => {
    const request = buildStudySupportStreamBody({
      courseId: 37,
      query: 'What is dynamic programming?',
      dialogueId: -1,
    });

    expect(request.get('courseId')).toBe('37');
    expect(request.get('query')).toBe('What is dynamic programming?');
    expect(request.get('dialogueId')).toBe('-1');
    expect(request.has('userId')).toBe(false);
  });
});
