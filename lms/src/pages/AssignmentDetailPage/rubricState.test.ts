import {beforeEach, describe, expect, it, vi} from 'vitest';
import {assignmentApiService} from '@/apis/services/assignment-api';
import {loadRubricState} from './rubricState';

vi.mock('@/apis/services/assignment-api', () => ({
  assignmentApiService: {
    getRubric: vi.fn(),
  },
}));

describe('loadRubricState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('treats RUBRIC_NOT_FOUND as an assignment without an uploaded rubric', async () => {
    vi.mocked(assignmentApiService.getRubric).mockRejectedValue({
      code: 404,
      message: 'Rubric does not exist',
      details: {code: 'RUBRIC_NOT_FOUND'},
    });

    await expect(loadRubricState(37, 57)).resolves.toEqual({
      posted: false,
      assignmentId: 57,
      totalVersions: 0,
      canRestorePrevious: false,
    });
  });

  it('preserves unrelated failures so the page can show a real load error', async () => {
    const error = {
      code: 404,
      message: 'Assignment does not exist',
      details: {code: 'ASSIGNMENT_NOT_FOUND'},
    };
    vi.mocked(assignmentApiService.getRubric).mockRejectedValue(error);

    await expect(loadRubricState(37, 57)).rejects.toBe(error);
  });
});
