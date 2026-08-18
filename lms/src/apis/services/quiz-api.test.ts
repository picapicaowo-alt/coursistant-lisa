import {beforeEach, describe, expect, it, vi} from 'vitest';
import type {V2ApiClient} from '@/apis';
import {QuizApiService} from './quiz-api';

const client = {
  get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn(),
};
const service = new QuizApiService(client as unknown as typeof V2ApiClient);

describe('QuizApiService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('covers the student attempt lifecycle with documented routes', async () => {
    client.post.mockResolvedValue({status: 200, data: {id: 12}});
    client.put.mockResolvedValue({status: 200, data: {revision: 1}});

    await service.startAttempt(4, 3, 'attempt-key');
    await service.autosaveAnswer(4, 3, 12, 101, {selectedOptionIds: [1001]});
    await service.submitAttempt(4, 3, 12);

    expect(client.post).toHaveBeenNthCalledWith(
      1,
      '/v2/courses/4/quizzes/3/attempts',
      undefined,
      {headers: {'Idempotency-Key': 'attempt-key'}},
    );
    expect(client.put).toHaveBeenCalledWith(
      '/v2/courses/4/quizzes/3/attempts/12/answers/101',
      {selectedOptionIds: [1001]},
    );
    expect(client.post).toHaveBeenNthCalledWith(
      2,
      '/v2/courses/4/quizzes/3/attempts/12/submit',
      undefined,
      expect.objectContaining({headers: expect.any(Object)}),
    );
  });

  it('uses explicit confirm when deleting a quiz', async () => {
    client.delete.mockResolvedValue({status: 200});
    await service.deleteQuiz(4, 3);
    expect(client.delete).toHaveBeenCalledWith('/v2/courses/4/quizzes/3', {params: {confirm: true}});
  });
});
