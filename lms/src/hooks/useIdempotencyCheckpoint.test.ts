import {beforeEach, describe, expect, it, vi} from 'vitest';
import {IdempotencyCheckpoint, idempotencyFingerprint} from './useIdempotencyCheckpoint';

describe('IdempotencyCheckpoint', () => {
  beforeEach(() => {
    vi.spyOn(crypto, 'randomUUID')
      .mockReturnValueOnce('11111111-1111-4111-8111-111111111111')
      .mockReturnValueOnce('22222222-2222-4222-8222-222222222222');
  });

  it('reuses a key for the same failed operation and rotates it when the payload changes', () => {
    const checkpoint = new IdempotencyCheckpoint();
    const firstPayload = idempotencyFingerprint({title: 'Quiz 1'});

    expect(checkpoint.keyFor('quiz-create', firstPayload)).toBe('11111111-1111-4111-8111-111111111111');
    expect(checkpoint.keyFor('quiz-create', firstPayload)).toBe('11111111-1111-4111-8111-111111111111');
    expect(checkpoint.keyFor('quiz-create', idempotencyFingerprint({title: 'Quiz 2'})))
      .toBe('22222222-2222-4222-8222-222222222222');
  });

  it('starts a new key after the previous operation completes', () => {
    const checkpoint = new IdempotencyCheckpoint();
    const fingerprint = idempotencyFingerprint({courseId: 31});
    const firstKey = checkpoint.keyFor('event-delete', fingerprint);

    checkpoint.complete('event-delete', firstKey);

    expect(checkpoint.keyFor('event-delete', fingerprint)).toBe('22222222-2222-4222-8222-222222222222');
  });
});
