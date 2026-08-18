import {beforeEach, describe, expect, it, vi} from 'vitest';
import {AiAgentApiService} from './ai-agent-api';

const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {'Content-Type': 'application/json'},
});

describe('AiAgentApiService', () => {
  let aiAgentApiService: AiAgentApiService;

  beforeEach(() => {
    aiAgentApiService = new AiAgentApiService();
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

  it('reuses the token that created a pending deadline action', async () => {
    localStorage.setItem('accToken', 'pending-action-token');
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse({
        reply: 'Allow this deadline change?',
        pendingAction: {actionId: 'action-456', type: 'ASSIGNMENT_DEADLINE_CHANGE'},
      }))
      .mockResolvedValueOnce(jsonResponse({
        reply: 'The deadline change was rejected.',
        pendingAction: null,
      }));

    await aiAgentApiService.chat({message: 'Move Assignment A', role: 'INSTRUCTOR'});
    localStorage.setItem('accToken', 'refreshed-token');
    await aiAgentApiService.decideDeadlineChange({actionId: 'action-456', decision: 'REJECT'});

    expect(fetchMock).toHaveBeenNthCalledWith(2, '/ai-agent/chat/deadline-change/decision', expect.objectContaining({
      headers: {
        Authorization: 'Bearer pending-action-token',
        'Content-Type': 'application/json',
      },
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
