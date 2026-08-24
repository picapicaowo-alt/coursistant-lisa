import {beforeEach, describe, expect, it, vi} from 'vitest';

const getMyCourses = vi.hoisted(() => vi.fn());
vi.mock('@/apis/services/dashboard-api', () => ({
  dashboardApiService: {getMyCourses},
}));

import {loadActiveChatCourses} from './chatCourses';

const envelope = <T,>(data: T) => ({
  status: 200,
  code: 'SUCCESS',
  data,
  message: 'Success',
  timestamp: '2026-08-23T00:00:00Z',
});

describe('loadActiveChatCourses', () => {
  beforeEach(() => vi.clearAllMocks());

  it('uses the v2 active-enrolment contract and follows every page', async () => {
    const first = {id: 31, name: 'Course 31'};
    const second = {id: 32, name: 'Course 32'};
    getMyCourses
      .mockResolvedValueOnce(envelope({items: [first], page: 0, size: 1, total: 2}))
      .mockResolvedValueOnce(envelope({items: [second], page: 1, size: 1, total: 2}));

    await expect(loadActiveChatCourses()).resolves.toEqual([first, second]);
    expect(getMyCourses).toHaveBeenNthCalledWith(1, {state: 'Active', page: 0, size: 100});
    expect(getMyCourses).toHaveBeenNthCalledWith(2, {state: 'Active', page: 1, size: 100});
  });
});
