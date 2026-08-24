import {renderHook, waitFor} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import type {PropsWithChildren} from 'react';
import {beforeEach, describe, expect, it, vi} from 'vitest';

const api = vi.hoisted(() => ({listQuizzes: vi.fn()}));
vi.mock('@/apis/services/quiz-api', () => ({quizApiService: api}));

import {useAiExamLockdown} from './useAiExamLockdown';

const response = <T,>(data: T) => ({
  status: 200,
  code: 'SUCCESS',
  data,
  message: 'OK',
  timestamp: '2026-08-23T00:00:00Z',
});

const createWrapper = () => {
  const client = new QueryClient({defaultOptions: {queries: {retry: false}}});
  const Wrapper = ({children}: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'AiExamLockdownTestWrapper';
  return Wrapper;
};

describe('useAiExamLockdown', () => {
  beforeEach(() => vi.clearAllMocks());

  it('locks Study Support only for the selected course with an open student attempt', async () => {
    api.listQuizzes.mockImplementation((courseId: number) => Promise.resolve(response([
      {id: courseId * 10, hasOpenAttempt: courseId === 31},
    ])));

    const locked = renderHook(() => useAiExamLockdown([31], 7, true), {wrapper: createWrapper()});
    await waitFor(() => expect(locked.result.current.status).toBe('locked'));
    expect(locked.result.current.lockedCourseIds).toEqual([31]);

    const unlocked = renderHook(() => useAiExamLockdown([32], 7, true), {wrapper: createWrapper()});
    await waitFor(() => expect(unlocked.result.current.status).toBe('unlocked'));
    expect(unlocked.result.current.lockedCourseIds).toEqual([]);
  });

  it('does not lock staff responses where hasOpenAttempt is null', async () => {
    api.listQuizzes.mockResolvedValue(response([{id: 310, hasOpenAttempt: null}]));

    const result = renderHook(() => useAiExamLockdown([31], 7, true), {wrapper: createWrapper()});

    await waitFor(() => expect(result.result.current.status).toBe('unlocked'));
  });

  it('fails closed when attempt status cannot be verified', async () => {
    api.listQuizzes.mockRejectedValue(new Error('network unavailable'));

    const result = renderHook(() => useAiExamLockdown([31], 7, true), {wrapper: createWrapper()});

    await waitFor(() => expect(result.result.current.status).toBe('error'), {timeout: 3_000});
  });
});
