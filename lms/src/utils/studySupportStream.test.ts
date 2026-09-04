import {beforeEach, describe, expect, it, vi} from 'vitest';
import {queryStudySupportWithFile, streamStudySupport} from './studySupportStream';

const streamResponse = (chunks: string[], status = 200) => new Response(
  new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      chunks.forEach(chunk => controller.enqueue(encoder.encode(chunk)));
      controller.close();
    },
  }),
  {status, headers: {'Content-Type': 'text/event-stream'}},
);

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('accToken', 'test-token');
});

describe('streamStudySupport', () => {
  it('emits progress in order and returns the final answer across chunk boundaries', async () => {
    const onProgress = vi.fn();
    const fetcher = vi.fn().mockResolvedValue(streamResponse([
      'event: progress\ndata: {"phase":"thinking","text":"Reading your question"}\n\n',
      'event: prog',
      'ress\ndata: {"phase":"writing","text":"Writing the answer"}\n\n',
      'event: answer\ndata: {"answer":"Dynamic programming reuses subproblem results."}\n\n',
    ]));

    const result = await streamStudySupport({
      url: '/study-support/api/query/stream',
      body: new URLSearchParams(),
      headers: {Authorization: 'Bearer test-token'},
      onProgress,
      fetcher,
    });

    expect(onProgress).toHaveBeenNthCalledWith(1, {
      phase: 'thinking',
      text: 'Reading your question',
    });
    expect(onProgress).toHaveBeenNthCalledWith(2, {
      phase: 'writing',
      text: 'Writing the answer',
    });
    expect(result).toEqual({answer: 'Dynamic programming reuses subproblem results.'});
  });

  it('ignores heartbeat comments and rejects an explicit error event', async () => {
    const fetcher = vi.fn().mockResolvedValue(streamResponse([
      ': keep-alive\n\n',
      'event: error\ndata: {"kind":"unhandled","request_id":"req-123"}\n\n',
    ]));

    await expect(streamStudySupport({
      url: '/study-support/api/query/stream',
      body: new URLSearchParams(),
      headers: {},
      onProgress: vi.fn(),
      fetcher,
    })).rejects.toThrow('request req-123');
  });

  it('rejects a successful stream that ends without an answer frame', async () => {
    const fetcher = vi.fn().mockResolvedValue(streamResponse([
      'event: progress\ndata: {"phase":"thinking","text":"Reading your question"}\n\n',
    ]));

    await expect(streamStudySupport({
      url: '/study-support/api/query/stream',
      body: new URLSearchParams(),
      headers: {},
      onProgress: vi.fn(),
      fetcher,
    })).rejects.toThrow('ended without an answer');
  });
});

describe('queryStudySupportWithFile', () => {
  it('sends multipart data without overriding the browser boundary', async () => {
    const body = new FormData();
    const file = new File(['notes'], 'notes.txt', {type: 'text/plain'});
    body.set('courseId', '37');
    body.set('query', 'Summarize this file.');
    body.set('file', file);
    const fetcher = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({data: {answer: 'Summary'}}),
      {status: 200, headers: {'Content-Type': 'application/json'}},
    ));

    await expect(queryStudySupportWithFile({
      url: '/study-support/api/query',
      body,
      headers: {Authorization: 'Bearer test-token'},
      fetcher,
    })).resolves.toEqual({data: {answer: 'Summary'}});

    expect(fetcher).toHaveBeenCalledWith('/study-support/api/query', {
      method: 'POST',
      headers: expect.any(Headers),
      body,
    });
    const headers = fetcher.mock.calls[0][1].headers as Headers;
    expect(headers.has('Content-Type')).toBe(false);
    expect(headers.get('Authorization')).toBe('Bearer test-token');
    expect(headers.get('Accept')).toBe('application/json');
  });
});
