import {describe, expect, it} from 'vitest';
import {resolveNotificationPath} from './utils';

describe('resolveNotificationPath', () => {
  it('maps the backend plural assignment path to the current frontend route', () => {
    expect(resolveNotificationPath({
      availability: 'AVAILABLE',
      courseId: 7,
      deepLink: '/courses/7/assignments/12',
    })).toBe('/course/7/assignments/12');
  });

  it('opens the quiz destination instead of dropping the user at the course root', () => {
    expect(resolveNotificationPath({
      availability: 'AVAILABLE',
      courseId: 7,
      deepLink: '/courses/7/quizzes/3',
    })).toBe('/course/7/quizzes/3');
  });

  it.each([
    ['announcements', 'announcements'],
    ['events', 'events'],
    ['weeks', 'weeks'],
    ['groups', 'group-sets'],
  ])('maps plural %s notification paths', (backendKind, frontendKind) => {
    expect(resolveNotificationPath({
      availability: 'AVAILABLE',
      courseId: 7,
      deepLink: `/courses/7/${backendKind}/3`,
    })).toBe(`/course/7/${frontendKind}/3`);
  });

  it('never follows an absolute URL supplied as a deep link', () => {
    expect(resolveNotificationPath({
      availability: 'AVAILABLE',
      courseId: null,
      deepLink: 'https://malicious.example.test/steal',
    })).toBeNull();
  });

  it('disables navigation when the backend says the subject is unavailable', () => {
    expect(resolveNotificationPath({
      availability: 'NO_LONGER_AVAILABLE',
      courseId: 7,
      deepLink: '/courses/7/assignments/12',
    })).toBeNull();
  });
});
