import {expect, test, type Page} from '@playwright/test';

const envelope = (data: unknown) => ({code: 'SUCCESS', data});
const CONVERSATION_ID = '25b65753-7962-4c25-916e-402657e976a1';

const installSession = async (page: Page, level: 'STUDENT' | 'INSTRUCTOR') => {
  await page.addInitScript(({level}) => {
    localStorage.setItem('user', JSON.stringify({
      id: 43, userId: 43, email: 'ai-session@example.test', firstName: 'Session',
      lastName: 'Test', role: 'USER', level, accessToken: 'login-snapshot-token',
    }));
    localStorage.setItem('accToken', 'initial-token');
  }, {level});
  await page.route('**/v2/**', async route => {
    const path = new URL(route.request().url()).pathname;
    const data = path.endsWith('/me/courses')
      ? {items: [{id: 40, name: 'Database Systems'}], page: 0, total: 1, size: 100}
      : path.endsWith('/unread-count') ? {unreadCount: 0} : [];
    await route.fulfill({json: envelope(data)});
  });
};

for (const level of ['STUDENT', 'INSTRUCTOR'] as const) {
  test(`${level} uses Assistant SSE, current bearer and UUID history on follow-up`, async ({page}) => {
    await installSession(page, level);
    let refreshes = 0;
    const tokens: string[] = [];
    const bodies: Record<string, unknown>[] = [];
    const legacyRoutes: string[] = [];
    await page.route(/\/(ai-agent|study-support)\//, async route => {
      legacyRoutes.push(route.request().url());
      await route.fulfill({status: 404});
    });
    await page.route('**/v1/auth/refresh-token', async route => {
      refreshes += 1;
      await route.fulfill({json: envelope('refreshed-token')});
    });
    await page.route('**/api/assistant/turn/stream', async route => {
      const request = route.request();
      const token = request.headers().authorization;
      tokens.push(token);
      expect(request.method()).toBe('POST');
      expect(request.headers()['content-type']).toBe('application/json');
      expect(request.headers().accept).toBe('text/event-stream');
      bodies.push(request.postDataJSON());
      if (token === 'Bearer initial-token') {
        await route.fulfill({status: 401});
        return;
      }
      await route.fulfill({contentType: 'text/event-stream', body:
        'event: delta\ndata: {"text":"Assistant response"}\n\n'
        + `event: answer\ndata: ${JSON.stringify({reply: 'Assistant response verified.', conversationId: CONVERSATION_ID})}\n\n`,
      });
    });
    await page.goto('/aibot');
    await page.getByRole('button', {name: level === 'STUDENT'
      ? 'Help me understand a difficult course concept.'
      : 'What assignments are due in the next 14 days?'}).click();
    await expect(page.getByText('Assistant response verified.')).toBeVisible();
    await page.getByRole('textbox', {name: 'Message Coursistant'}).fill('Continue the conversation.');
    await page.getByRole('button', {name: 'Send message', exact: true}).click();
    await expect(page.getByText('Assistant response verified.')).toHaveCount(2);
    expect(tokens).toEqual(['Bearer initial-token', 'Bearer refreshed-token', 'Bearer refreshed-token']);
    expect(bodies[0]).toEqual({message: expect.any(String), chip: null, history: []});
    expect(bodies[1]).toEqual(bodies[0]);
    expect(bodies[2]).toEqual({message: 'Continue the conversation.', chip: null, conversationId: CONVERSATION_ID,
      history: [{role: 'user', content: bodies[0].message}, {role: 'assistant', content: 'Assistant response verified.'}],
    });
    expect(refreshes).toBe(1);
    expect(legacyRoutes).toEqual([]);
  });
}

for (const decision of ['ALLOW', 'REJECT'] as const) {
  test(`card ${decision} calls the new decision endpoint only after clicking`, async ({page}) => {
    await installSession(page, 'INSTRUCTOR');
    const decisions: unknown[] = [];
    await page.route('**/api/assistant/turn/stream', async route => {
      await route.fulfill({contentType: 'text/event-stream', body: `event: answer\ndata: ${JSON.stringify({
        reply: 'Move Assignment A to September 10?', conversationId: CONVERSATION_ID,
        pendingAction: {actionId: 'action-123', type: 'ASSIGNMENT_DEADLINE_CHANGE'},
      })}\n\n`});
    });
    await page.route('**/api/assistant/decision', async route => {
      expect(route.request().method()).toBe('POST');
      expect(route.request().headers().authorization).toBe('Bearer initial-token');
      decisions.push(route.request().postDataJSON());
      await route.fulfill({json: {reply: `Decision ${decision} received.`, conversationId: CONVERSATION_ID}});
    });
    await page.goto('/aibot');
    await page.getByRole('button', {name: 'Help me change an assignment deadline.'}).click();
    const card = page.getByRole('dialog', {name: 'Deadline change approval'});
    await expect(card).toBeVisible();
    expect(decisions).toEqual([]);
    await card.getByRole('button', {name: decision === 'ALLOW' ? 'Allow' : 'Reject', exact: true}).click();
    await expect(card).not.toBeVisible();
    await expect(page.getByText(`Decision ${decision} received.`)).toBeVisible();
    expect(decisions).toEqual([{actionId: 'action-123', decision}]);
  });
}
