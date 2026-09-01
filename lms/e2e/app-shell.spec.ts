import {expect, test, type Page} from '@playwright/test';

const apiResponse = (data: unknown) => ({
  status: 200,
  code: 'SUCCESS',
  message: 'Success',
  timestamp: '2026-08-27T08:00:00Z',
  data,
});

const course = {
  id: 17,
  courseId: 17,
  courseCode: 'OPS-SMOKE',
  title: 'Ops Smoke',
  name: 'Ops Smoke',
  description: null,
  tenantId: 1,
  state: 'Active',
  status: 'Active',
  courseRole: 'Student',
  role: 'Student',
  canGrade: null,
  canPostAnnouncements: null,
  canManageGroups: null,
  canManageCourseEvents: null,
  primaryInstructor: {userId: 42, instructorFirstName: 'Teach', instructorMiddleName: 'Test', instructorLastName: 'Two'},
  createdAt: '2026-08-01T10:00:00Z',
  updatedAt: '2026-08-27T08:00:00Z',
  archivedAt: null,
};

type UserLevel = 'STUDENT' | 'INSTRUCTOR';

const installSession = async (
  page: Page,
  role: 'USER' | 'TENANT_ADMIN',
  level: UserLevel = 'STUDENT',
) => {
  await page.addInitScript(({accountRole, accountLevel}) => {
    localStorage.setItem('user', JSON.stringify({
      id: 900,
      userId: 900,
      email: accountRole === 'USER' ? 'student@example.test' : 'admin@example.test',
      firstName: accountRole === 'USER'
        ? accountLevel === 'INSTRUCTOR' ? 'Teach' : 'Student'
        : 'Tenant',
      middleName: accountRole === 'USER' && accountLevel === 'INSTRUCTOR' ? 'Test' : null,
      lastName: accountRole === 'USER'
        ? accountLevel === 'INSTRUCTOR' ? 'Two' : 'Test'
        : 'Admin',
      username: accountRole === 'USER' ? 'student' : 'tenant-admin',
      role: accountRole,
      level: accountRole === 'USER' ? accountLevel : null,
      avatar: null,
      accessToken: 'browser-test-token',
    }));
    localStorage.setItem('accToken', 'browser-test-token');
  }, {accountRole: role, accountLevel: level});

  await page.route('**/v2/**', async route => {
    const url = new URL(route.request().url());
    const apiPathStart = url.pathname.indexOf('/v2/');
    const path = apiPathStart >= 0 ? url.pathname.slice(apiPathStart) : url.pathname;
    let data: unknown = [];

    if (path === '/v2/me/courses' || path === '/v2/courses') {
      data = {items: [course], page: 0, size: 20, total: 1};
    } else if (path === '/v2/me/notifications/unread-count') {
      data = {unreadCount: 0};
    } else if (path === '/v2/courses/17/sessions') {
      data = [{id: 1, dayOfWeek: 'TUE', startTime: '09:00:00', endTime: '10:00:00', location: 'B'}];
    } else if (path === '/v2/courses/17/members') {
      data = {
        items: [
          {
            id: 1,
            courseId: 17,
            userId: 901,
            userName: 'Prod Legacy Student',
            userEmail: 'legacy@example.test',
            courseRole: 'Student',
            active: true,
            level: 'STUDENT',
          },
          {
            id: 2,
            courseId: 17,
            userId: 902,
            userName: 'Ignored Legacy Name',
            userFirstName: 'Dev',
            userMiddleName: null,
            userLastName: 'Structured Student',
            userEmail: 'structured@example.test',
            courseRole: 'Student',
            active: true,
            level: 'STUDENT',
          },
        ],
        page: 0,
        size: 20,
        total: 2,
      };
    }

    await route.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify(apiResponse(data))});
  });
};

test('student routes share the compact dashboard shell at desktop and mobile widths', async ({page}) => {
  await installSession(page, 'USER');
  await page.goto('/course');

  await expect(page.getByRole('heading', {name: 'My Course'})).toBeVisible();
  await expect(page.getByRole('textbox', {name: 'Search courses and assignments'})).toBeVisible();
  await expect(page.getByRole('complementary', {name: 'Primary navigation'})).toHaveCSS('width', '104px');
  await expect(page.getByRole('button', {name: 'View details'})).toBeVisible();

  await page.setViewportSize({width: 390, height: 844});
  const navigation = page.getByRole('complementary', {name: 'Primary navigation'});
  await expect(navigation).toHaveCSS('position', 'fixed');
  await expect(navigation).toHaveCSS('width', '390px');
  await expect(page.getByRole('textbox', {name: 'Search courses and assignments'})).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('administration routes use the same shell without student-only search', async ({page}) => {
  await installSession(page, 'TENANT_ADMIN');
  await page.goto('/course');

  await expect(page.getByRole('heading', {name: 'Courses'})).toBeVisible();
  await expect(page.getByRole('complementary', {name: 'Primary navigation'})).toHaveCSS('width', '104px');
  await expect(page.getByRole('link', {name: 'Admin Console'})).toBeVisible();
  await expect(page.getByRole('textbox', {name: 'Search courses and assignments'})).toHaveCount(0);
});

test('roster supports the Prod legacy name field while preferring the Dev structured fields', async ({page}) => {
  await installSession(page, 'USER', 'INSTRUCTOR');
  await page.goto('/roster/17');

  await expect(page.getByRole('heading', {name: 'Roster'})).toBeVisible();
  await expect(page.getByRole('cell', {name: 'Prod Legacy Student'})).toBeVisible();
  await expect(page.getByRole('cell', {name: 'Dev Structured Student'})).toBeVisible();
  await expect(page.getByText('Ignored Legacy Name')).toHaveCount(0);
  await expect(page.getByText('Unnamed member')).toHaveCount(0);
});

test('dashboard stacks the assistant rail before the main content becomes cramped', async ({page}) => {
  await installSession(page, 'USER');
  await page.setViewportSize({width: 1200, height: 900});
  await page.goto('/');

  await expect(page.getByRole('heading', {name: 'Welcome back, Student'})).toBeVisible();
  const dashboard = page.getByRole('region', {name: 'Dashboard overview'});
  const mainColumn = dashboard.locator(':scope > div').first();
  const assistant = page.getByRole('complementary', {name: 'Coursistant AI chatbot'});
  const wideMainBox = await mainColumn.boundingBox();
  const wideAssistantBox = await assistant.boundingBox();
  expect(wideMainBox).not.toBeNull();
  expect(wideAssistantBox).not.toBeNull();
  expect(wideAssistantBox!.x).toBeGreaterThan(wideMainBox!.x);

  await page.setViewportSize({width: 1024, height: 900});
  const narrowMainBox = await mainColumn.boundingBox();
  const narrowAssistantBox = await assistant.boundingBox();
  expect(narrowMainBox).not.toBeNull();
  expect(narrowAssistantBox).not.toBeNull();
  expect(Math.round(narrowAssistantBox!.x)).toBe(Math.round(narrowMainBox!.x));
  expect(narrowAssistantBox!.y).toBeGreaterThan(narrowMainBox!.y);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1024);
});

test('student and teacher routes keep one stable global header frame', async ({browser}) => {
  const routes = ['/course', '/calendar', '/aibot', '/profile', '/settings'];

  for (const level of ['STUDENT', 'INSTRUCTOR'] as const) {
    const page = await browser.newPage({viewport: {width: 1440, height: 900}});
    await installSession(page, 'USER', level);
    let desktopWidth: number | null = null;

    for (const route of routes) {
      await page.goto(route);
      const header = page.locator('header.app-shell-header');
      await expect(header).toBeVisible();
      await expect(header).toHaveCSS('height', '84px');
      await expect(header).toHaveCSS('border-bottom-width', '1px');

      const box = await header.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBe(84);
      desktopWidth ??= box!.width;
      expect(box!.width).toBe(desktopWidth);
    }

    await page.setViewportSize({width: 390, height: 844});
    await page.goto('/aibot');
    const mobileHeader = page.locator('header.app-shell-header');
    await expect(mobileHeader).toHaveCSS('height', '68px');
    await expect(mobileHeader).toHaveCSS('border-bottom-width', '1px');
    expect((await mobileHeader.boundingBox())?.height).toBe(68);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);

    await page.close();
  }
});
