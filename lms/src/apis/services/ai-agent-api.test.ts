import {beforeEach, describe, expect, it, vi} from 'vitest';
import {aiAgentApiService} from './ai-agent-api';

const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {'Content-Type': 'application/json'},
});

describe('AiAgentApiService', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('accToken', 'test-access-token');
    vi.restoreAllMocks();
  });

  it('sends chat through the same-origin agent proxy with the LMS bearer token', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({
      reply: 'You have two upcoming assignments.',
      pendingAction: null,
      trace: {private: 'must not leak into the UI model'},
    }));

    await expect(aiAgentApiService.chat({
      message: 'What is due?',
      role: 'STUDENT',
    })).resolves.toEqual({
      reply: 'You have two upcoming assignments.',
      pendingAction: null,
    });

    expect(fetchMock).toHaveBeenCalledWith('/ai-agent/chat', expect.objectContaining({
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-access-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({message: 'What is due?', role: 'STUDENT'}),
    }));
  });

  it('uses the confirmed deadline-decision contract', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({
      reply: 'The deadline change was rejected.',
      pendingAction: null,
    }));

    await aiAgentApiService.decideDeadlineChange({actionId: 'action-123', decision: 'REJECT'});

    expect(fetchMock).toHaveBeenCalledWith('/ai-agent/chat/deadline-change/decision', expect.objectContaining({
      body: JSON.stringify({actionId: 'action-123', decision: 'REJECT'}),
    }));
  });

  it('surfaces the API error without exposing a server trace', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({
      message: 'No matching pending deadline change',
      trace: {internal: true},
    }, 409));

    await expect(aiAgentApiService.decideDeadlineChange({
      actionId: 'expired-action',
      decision: 'ALLOW',
    })).rejects.toThrow('No matching pending deadline change');
  });
});
