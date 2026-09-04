import axios from 'axios';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {V2ApiClient} from '@/apis/v2-api-client';
import {AiAgentApiService} from './ai-agent-api';

const CONVERSATION_ID = '25b65753-7962-4c25-916e-402657e976a1';
const json = (data: unknown) => new Response(JSON.stringify(data), {
  headers: {'Content-Type': 'application/json'},
});
const sse = (...frames: string[]) => new Response(frames.join(''), {
  headers: {'Content-Type': 'text/event-stream'},
});
const finalAnswer = () => sse('event: answer\ndata: {"reply":"Course answer."}\n\n');

describe('AiAgentApiService', () => {
  const fetcher = vi.fn<typeof fetch>();
  let service: AiAgentApiService;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    V2ApiClient.setAccessToken('current-token');
    service = new AiAgentApiService(fetcher);
  });
  afterEach(() => vi.restoreAllMocks());

  it('sends only the new turn contract with the current bearer token', async () => {
    fetcher.mockResolvedValue(finalAnswer());
    await expect(service.chat({message: 'What is due?', role: 'STUDENT'}))
      .resolves.toEqual({reply: 'Course answer.', pendingAction: null, conversationId: null, confirmationRequired: false});
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe('/api/assistant/turn/stream');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(String(init?.body))).toEqual({message: 'What is due?', chip: null, history: []});
    const headers = new Headers(init?.headers);
    expect(headers.get('Authorization')).toBe('Bearer current-token');
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(headers.get('Accept')).toBe('text/event-stream');
  });

  it('forwards a supplied chip, valid UUID and history unchanged', async () => {
    fetcher.mockResolvedValue(finalAnswer());
    const history = [{role: 'user' as const, content: 'List my courses.'}];
    await service.chat({message: 'Continue', role: 'INSTRUCTOR', chip: 'server-supplied-chip', conversationId: CONVERSATION_ID, history});
    expect(JSON.parse(String(fetcher.mock.calls[0][1]?.body)))
      .toEqual({message: 'Continue', chip: 'server-supplied-chip', conversationId: CONVERSATION_ID, history});
  });

  it.each(['legacy-thread', '', '123', '2026-01-01', 'not-a-uuid'])('omits legacy conversation ID %j', async conversationId => {
    fetcher.mockResolvedValue(finalAnswer());
    await service.chat({message: 'Continue', role: 'INSTRUCTOR', conversationId});
    expect(JSON.parse(String(fetcher.mock.calls[0][1]?.body))).not.toHaveProperty('conversationId');
  });

  it('normalizes pending actions and retains only UUID response IDs', async () => {
    fetcher.mockResolvedValue(sse(`event: answer\ndata: ${JSON.stringify({data: {
      reply: 'Allow this deadline change?', pending_action: {action_id: 456, action_type: 'ASSIGNMENT_DEADLINE_CHANGE'},
      conversation_id: CONVERSATION_ID, confirmation_required: true,
    }})}\n\n`));
    await expect(service.chat({message: 'Move Assignment A', role: 'INSTRUCTOR'})).resolves.toEqual({
      reply: 'Allow this deadline change?', pendingAction: {actionId: '456', type: 'ASSIGNMENT_DEADLINE_CHANGE'},
      conversationId: CONVERSATION_ID, confirmationRequired: true,
    });
    fetcher.mockResolvedValue(json({reply: 'Done', sessionId: 'legacy-session'}));
    await expect(service.chat({message: 'Hi', role: 'INSTRUCTOR'})).resolves.toMatchObject({conversationId: null});
  });

  it('decodes split UTF-8, CRLF and multiline data and publishes deltas', async () => {
    const bytes = new TextEncoder().encode(': heartbeat\r\n\r\nevent: delta\r\ndata: {"text":"你好"}\r\n\r\n'
      + 'event: delta\ndata: {\ndata: "delta":"!"}\n\nevent: done\ndata: {}\n\n');
    fetcher.mockResolvedValue(new Response(new ReadableStream({start(controller) {
      for (const byte of bytes) controller.enqueue(new Uint8Array([byte]));
      controller.close();
    }}), {headers: {'Content-Type': 'text/event-stream'}}));
    const onReply = vi.fn();
    await expect(service.chat({message: 'Hello', role: 'INSTRUCTOR'}, {onReply})).resolves.toMatchObject({reply: '你好!'});
    expect(onReply).toHaveBeenCalledWith('你好');
    expect(onReply).toHaveBeenLastCalledWith('你好!');
  });

  it('keeps diagnostics and split internal markers out of streamed text', async () => {
    fetcher.mockResolvedValue(sse(
      'event: progress\ndata: {"text":"private diagnostics"}\n\n',
      'event: delta\ndata: {"text":"Answer /begin-th"}\n\n',
      'event: delta\ndata: {"text":"ink/private model details/end-think/"}\n\n',
      'data: [DONE]\n\n',
    ));
    const onReply = vi.fn();
    await expect(service.chat({message: 'Hello', role: 'INSTRUCTOR'}, {onReply})).resolves.toMatchObject({reply: 'Answer'});
    expect(onReply.mock.calls.every(([reply]) => reply === 'Answer')).toBe(true);
  });

  it('posts explicit card decisions with a freshly read bearer token', async () => {
    fetcher.mockResolvedValueOnce(finalAnswer()).mockResolvedValueOnce(json({reply: 'Rejected.'}));
    await service.chat({message: 'Hello', role: 'INSTRUCTOR'});
    V2ApiClient.setAccessToken('rotated-token');
    await service.decideDeadlineChange({actionId: 'action-456', decision: 'REJECT'});
    const [url, init] = fetcher.mock.calls[1];
    expect(url).toBe('/api/assistant/decision');
    expect(JSON.parse(String(init?.body))).toEqual({actionId: 'action-456', decision: 'REJECT'});
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer rotated-token');
  });

  it('retries a 401 once through the shared LMS refresh with identical JSON', async () => {
    const refresh = vi.spyOn(axios, 'post').mockResolvedValue({data: {data: 'refreshed-token'}});
    fetcher.mockResolvedValueOnce(new Response(null, {status: 401})).mockResolvedValueOnce(finalAnswer());
    await service.chat({message: 'Hello', role: 'INSTRUCTOR'});
    expect(refresh).toHaveBeenCalledOnce();
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[0][1]?.body).toBe(fetcher.mock.calls[1][1]?.body);
    expect(new Headers(fetcher.mock.calls[1][1]?.headers).get('Authorization')).toBe('Bearer refreshed-token');
  });

  it.each([
    ['event: delta\ndata: {"text":"incomplete"}\n\n', 'without a final answer'],
    ['event: error\ndata: {"trace":"private error"}\n\n', 'stream failed'],
    ['event: answer\ndata: not-json\n\n', 'invalid stream event'],
    ['event: answer\ndata: {"reply":"","pendingAction":{"actionId":"a"}}\n\n', 'without a final answer'],
  ])('rejects incomplete or invalid streams without replaying them', async (body, error) => {
    fetcher.mockResolvedValue(sse(body));
    await expect(service.chat({message: 'Hi', role: 'INSTRUCTOR'})).rejects.toThrow(error);
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it('rejects approval requests without user-visible details', async () => {
    fetcher.mockResolvedValue(json({reply: '', pendingAction: {actionId: 'a'}}));
    await expect(service.chat({message: 'Hi', role: 'INSTRUCTOR'})).rejects.toThrow('without details');
  });

  it('preserves a failed card decision message without exposing its trace', async () => {
    fetcher.mockResolvedValue(new Response(JSON.stringify({
      message: 'No matching pending deadline change', trace: 'private server details',
    }), {status: 409, headers: {'Content-Type': 'application/json'}}));
    await expect(service.decideDeadlineChange({actionId: 'expired', decision: 'ALLOW'}))
      .rejects.toThrow('No matching pending deadline change');
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it('does not accept an HTML fallback as a successful turn', async () => {
    fetcher.mockResolvedValue(new Response('<html>SPA</html>', {headers: {'Content-Type': 'text/html'}}));
    await expect(service.chat({message: 'Hi', role: 'STUDENT'})).rejects.toThrow('no event stream');
  });
});
