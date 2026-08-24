import {expect, test} from '@playwright/test';

const apiResponse = (data: unknown) => ({
  status: 200,
  code: 'SUCCESS',
  message: 'Success',
  timestamp: '2026-08-24T12:00:00Z',
  data,
});

test('teacher reviews quiz results and uses explicit bulk selection', async ({page}) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const attemptRequests: string[] = [];

  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('request', request => {
    const url = new URL(request.url());
    if (url.pathname.endsWith('/v2/courses/37/quizzes/12/attempts')) attemptRequests.push(request.url());
  });

  await page.addInitScript(() => {
    localStorage.setItem('user', JSON.stringify({
      id: 900,
      userId: 900,
      email: 'teacher@example.com',
      name: 'Course Teacher',
      username: 'teacher',
      role: 'USER',
      level: 'INSTRUCTOR',
      avatar: null,
      accessToken: 'browser-test-token',
    }));
    localStorage.setItem('accToken', 'browser-test-token');
  });

  await page.route('**/v2/**', async route => {
    const url = new URL(route.request().url());
    const apiPathStart = url.pathname.indexOf('/v2/');
    const path = apiPathStart >= 0 ? url.pathname.slice(apiPathStart) : url.pathname;
    let data: unknown;

    if (path === '/v2/me/courses') {
      data = {items: [{
        id: 37,
        courseId: 37,
        courseCode: 'LAW-101',
        title: 'University Law',
        name: 'University Law',
        description: null,
        tenantId: 1,
        state: 'Published',
        status: 'Published',
        courseRole: 'Instructor',
        role: 'Instructor',
        canGrade: null,
        canPostAnnouncements: null,
        canManageGroups: null,
        canManageCourseEvents: null,
        primaryInstructor: null,
        createdAt: '2026-08-01T10:00:00',
        updatedAt: '2026-08-24T10:00:00',
        archivedAt: null,
      }], page: 0, size: 100, total: 1};
    } else if (path === '/v2/me/notifications/unread-count') {
      data = {unreadCount: 0};
    } else if (path === '/v2/courses/37/quizzes/12') {
      data = {
        id: 12,
        courseId: 37,
        title: 'Testing Quiz',
        instructions: null,
        opensAtUtc: '2026-08-24T09:00:00Z',
        opensAtLocal: '2026-08-24T02:00:00',
        closesAtUtc: '2026-08-25T09:00:00Z',
        closesAtLocal: '2026-08-25T02:00:00',
        timezone: 'America/Los_Angeles',
        timeLimitSeconds: null,
        attemptsAllowed: 1,
        resultVisibility: 'AfterRelease',
        state: 'Published',
        version: 1,
        totalPoints: 10,
        questionCount: 1,
        hasAttempts: true,
        hasOpenAttempt: null,
        createdAt: '2026-08-24T08:00:00Z',
        updatedAt: '2026-08-24T08:00:00Z',
      };
    } else if (path === '/v2/courses/37/quizzes/12/grading-summary') {
      data = {submittedAttemptCount: 2, pendingShortAnswerCount: 0, manualIncompleteAttemptCount: 0, releasedUserCount: 0};
    } else if (path === '/v2/courses/37/quizzes/12/questions') {
      data = [{
        id: 501,
        quizId: 12,
        type: 'SingleChoice',
        stem: 'Which option is correct?',
        points: 10,
        position: 1,
        options: [
          {id: 1, label: 'Option A', position: 1, isCorrect: true},
          {id: 2, label: 'Option B', position: 2, isCorrect: false},
        ],
      }];
    } else if (path === '/v2/courses/37/members') {
      data = {items: [
        {id: 1, courseId: 37, userId: 101, userName: 'Student One', userEmail: 'one@example.com', courseRole: 'Student', active: true},
        {id: 2, courseId: 37, userId: 102, userName: 'Student Two', userEmail: 'two@example.com', courseRole: 'Student', active: true},
        {id: 3, courseId: 37, userId: 103, userName: 'Student Three', userEmail: 'three@example.com', courseRole: 'Student', active: true},
      ], page: 0, size: 100, total: 3};
    } else if (path === '/v2/courses/37/quizzes/12/attempts/1001/result') {
      data = {
        quizId: 12,
        countedAttemptId: 1001,
        gradeStatus: 'Entered',
        closeReason: null,
        receiptId: 'receipt-1',
        autoScore: null,
        manualScore: null,
        totalScore: null,
        manualGradingPending: false,
        showCorrectAnswers: true,
        releasedAt: null,
        questions: [{
          questionId: 501,
          type: 'SingleChoice',
          points: 10,
          score: null,
          selectedOptionIds: [2],
          textAnswer: null,
        }],
      };
    } else if (path === '/v2/courses/37/quizzes/12/attempts/1001') {
      data = {
        id: 1001,
        quizId: 12,
        userId: 101,
        attemptNumber: 1,
        status: 'Submitted',
        closeReason: null,
        receiptId: 'receipt-1',
        startedAt: '2026-08-24T10:00:00Z',
        deadlineAt: '2026-08-24T11:00:00Z',
        submittedAt: '2026-08-24T10:10:00Z',
        serverNowUtc: '2026-08-24T12:00:00Z',
        autoScore: 7,
        manualScore: 0,
        totalScore: 7,
        manualGradingComplete: true,
        answers: [{questionId: 501, selectedOptionIds: [2], textAnswer: null, revision: 1, savedAt: '2026-08-24T10:09:00Z'}],
      };
    } else if (path === '/v2/courses/37/quizzes/12/attempts') {
      const userId = Number(url.searchParams.get('userId'));
      data = userId === 101
        ? [{id: 1001, attemptNumber: 1, status: 'Submitted', closeReason: null, startedAt: '2026-08-24T10:00:00Z', submittedAt: '2026-08-24T10:10:00Z', receiptId: 'receipt-1'}]
        : userId === 102
          ? [{id: 1002, attemptNumber: 1, status: 'Submitted', closeReason: null, startedAt: '2026-08-24T10:00:00Z', submittedAt: '2026-08-24T10:12:00Z', receiptId: 'receipt-2'}]
          : [];
    } else {
      data = [];
    }

    await route.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify(apiResponse(data))});
  });

  await page.goto('/course/37/quizzes/12/grading');
  await expect(page.getByRole('heading', {name: 'Testing Quiz'})).toBeVisible();
  await expect(page.getByText('Student One')).toBeVisible();
  expect(attemptRequests).toHaveLength(3);
  expect(attemptRequests.map(request => new URL(request).searchParams.get('userId')).sort()).toEqual(['101', '102', '103']);

  await page.getByRole('button', {name: 'Review result for Student One'}).click();
  await expect(page.getByRole('heading', {name: 'Student One'})).toBeVisible();
  await expect(page.getByText('7 / 10')).toBeVisible();
  await expect(page.getByText('Which option is correct?')).toBeVisible();
  await expect(page.getByText('Student answer')).toBeVisible();
  await expect(page.getByText('Correct answer')).toBeVisible();

  await page.getByRole('button', {name: 'Select all eligible (2)'}).click();
  await expect(page.getByText('2 selected')).toBeVisible();
  await expect(page.getByLabel('Select Student One')).toBeChecked();
  await page.getByRole('button', {name: 'Clear all'}).click();
  await expect(page.getByText('0 selected')).toBeVisible();
  await expect(page.getByLabel('Select Student One')).not.toBeChecked();

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
