import {describe, expect, it} from 'vitest';
import type {AssignmentDetail} from '@/apis';
import {
  buildEmptySubmissionState,
  formatSubmissionStatus,
  isNoFormalSubmissionError,
} from './submissionState';

const assignment: AssignmentDetail = {
  id: 37,
  courseId: 19,
  title: 'Reading notes',
  description: '',
  dueAtUtc: '2026-07-31T21:34:00Z',
  dueAtLocal: '2026-07-31T14:34:00',
  timezone: 'America/Los_Angeles',
  submissionType: 'Individual',
  state: 'Published',
  attachments: [],
  createdAt: '2026-07-01T00:00:00Z',
  updatedAt: '2026-07-01T00:00:00Z',
  submissionStatus: 'NotSubmittedClosed',
  submissionEligibility: 'Eligible',
  windowOpen: false,
  acceptingSubmissions: false,
  stagedFileCount: 0,
};

describe('assignment submission empty state', () => {
  it('recognizes only the backend no-formal-submission 404', () => {
    expect(isNoFormalSubmissionError({
      code: 404,
      message: 'Request failed',
      details: {code: 'NOT_FOUND', message: 'No formal submission yet'},
    })).toBe(true);

    expect(isNoFormalSubmissionError({
      code: 404,
      details: {code: 'ASSIGNMENT_NOT_FOUND', message: 'Assignment not found'},
    })).toBe(false);
    expect(isNoFormalSubmissionError({code: 503})).toBe(false);
  });

  it('builds the closed, unsubmitted state from assignment detail', () => {
    expect(buildEmptySubmissionState(assignment, 385)).toMatchObject({
      assignmentId: 37,
      ownerUserId: 385,
      submissionStatus: 'NotSubmittedClosed',
      acceptingSubmissions: false,
      totalVersions: 0,
      stagingFiles: [],
    });
    expect(formatSubmissionStatus('NotSubmittedClosed')).toBe('Submission closed');
  });
});
