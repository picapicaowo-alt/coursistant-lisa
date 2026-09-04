import axios, {AxiosError, AxiosHeaders, type InternalAxiosRequestConfig} from 'axios';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {V2ApiClient, agentApiClient} from './v2-api-client';
import {fetchWithAiSession} from './ai-session-fetch';
import {streamStudySupport, queryStudySupportWithFile} from '@/utils/studySupportStream';
import {buildStudySupportFormData, buildStudySupportStreamBody} from '@/utils/studySupportRequest';

const reply = (config: InternalAxiosRequestConfig, status = 200) => ({
  config, status, statusText: String(status), headers: new AxiosHeaders(),
  data: {code: status === 200 ? 'SUCCESS' : 'INVALID_TOKEN', data: []},
});

const unauthorized = (config: InternalAxiosRequestConfig) =>
  Promise.reject(new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, reply(config, 401)));

const answer = () => new Response('event: answer\ndata: {"answer":"Course answer"}\n\n', {
  headers: {'Content-Type': 'text/event-stream'},
});

const streamOptions = () => ({
  url: '/study-support/api/query/stream',
  body: buildStudySupportStreamBody({courseId: 40, query: 'Explain DDL.', dialogueId: -1}),
  headers: {'X-Timezone': 'America/Los_Angeles'},
  onProgress: vi.fn(),
});

describe('shared LMS and AI session', () => {
  const lmsAdapter = V2ApiClient.getClient().defaults.adapter;
  const agentAdapter = agentApiClient.getClient().defaults.adapter;

  beforeEach(() => {
    localStorage.clear();
    V2ApiClient.setAccessToken('initial-token');
  });

  afterEach(() => {
    V2ApiClient.getClient().defaults.adapter = lmsAdapter;
    agentApiClient.getClient().defaults.adapter = agentAdapter;
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('uses an LMS refresh for an already-used instructor client and student stream', async () => {
    const tokens: unknown[] = [];
    agentApiClient.getClient().defaults.adapter = async config => {
      tokens.push(config.headers.Authorization);
      return reply(config);
    };
    await agentApiClient.post('/chat', {message: 'First turn'});
    const refresh = vi.spyOn(axios, 'post').mockResolvedValue({data: {data: 'refreshed-token'}});
    V2ApiClient.getClient().defaults.adapter = async config =>
      config.headers.Authorization === 'Bearer initial-token' ? unauthorized(config) : reply(config);

    await V2ApiClient.get('/v2/me/courses');
    await agentApiClient.post('/chat', {message: 'After refresh'});
    const fetcher = vi.fn().mockResolvedValue(answer());
    await streamStudySupport({...streamOptions(), fetcher});

    expect(tokens).toEqual(['Bearer initial-token', 'Bearer refreshed-token']);
    expect(fetcher.mock.calls[0][1].headers.get('Authorization')).toBe('Bearer refreshed-token');
    expect(refresh).toHaveBeenCalledOnce();
  });

  it('coalesces simultaneous instructor and student 401s into one LMS refresh', async () => {
    let completeRefresh!: (value: {data: {data: string}}) => void;
    const refresh = vi.spyOn(axios, 'post').mockImplementation(() => new Promise(resolve => {
      completeRefresh = resolve;
    }));
    const tokens: unknown[] = [];
    agentApiClient.getClient().defaults.adapter = async config => {
      tokens.push(config.headers.Authorization);
      return config.headers.Authorization === 'Bearer initial-token' ? unauthorized(config) : reply(config);
    };
    const recover = vi.spyOn(V2ApiClient, 'recoverSession');
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response(null, {status: 401}))
      .mockResolvedValueOnce(answer());

    const instructor = agentApiClient.post('/chat', {message: 'Teaching question'});
    const student = streamStudySupport({...streamOptions(), fetcher});
    await vi.waitFor(() => expect(recover).toHaveBeenCalledTimes(2));
    completeRefresh({data: {data: 'refreshed-token'}});
    await Promise.all([instructor, student]);

    expect(refresh).toHaveBeenCalledOnce();
    expect(refresh.mock.calls[0][0]).toContain('/v1/auth/refresh-token');
    expect(refresh.mock.calls[0][2]).toMatchObject({withCredentials: true});
    expect(tokens).toEqual(['Bearer initial-token', 'Bearer refreshed-token']);
    expect(fetcher.mock.calls[1][1].headers.get('Authorization')).toBe('Bearer refreshed-token');
    expect(fetcher.mock.calls[1][1].body).toBe(fetcher.mock.calls[0][1].body);
    expect(fetcher.mock.calls[1][1].headers.get('Content-Type'))
      .toBe('application/x-www-form-urlencoded;charset=UTF-8');
  });

  it('reuses a token rotated while a rejected request was in flight', async () => {
    const refresh = vi.spyOn(axios, 'post');
    const fetcher = vi.fn()
      .mockImplementationOnce(async () => {
        V2ApiClient.setAccessToken('rotated-elsewhere');
        return new Response(null, {status: 401});
      })
      .mockResolvedValueOnce(answer());
    await streamStudySupport({...streamOptions(), fetcher});
    expect(refresh).not.toHaveBeenCalled();
    expect(fetcher.mock.calls[1][1].headers.get('Authorization')).toBe('Bearer rotated-elsewhere');
  });

  it('retries a multipart file request with the current token and original attachment', async () => {
    vi.spyOn(axios, 'post').mockResolvedValue({data: {data: 'refreshed-token'}});
    const body = buildStudySupportFormData({courseId: 40, query: 'Summarize notes.', dialogueId: -1});
    const file = new File(['notes'], 'notes.txt');
    body.set('file', file);
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response(null, {status: 401}))
      .mockResolvedValueOnce(new Response(JSON.stringify({answer: 'Summary'})));
    await expect(queryStudySupportWithFile({
      url: '/study-support/api/query', body, headers: {}, fetcher,
    })).resolves.toEqual({answer: 'Summary'});
    expect(fetcher.mock.calls[1][1].body.get('file')).toBe(file);
    expect(fetcher.mock.calls[1][1].headers.get('Authorization')).toBe('Bearer refreshed-token');
  });

  it('stops after a second stream 401 and preserves the LMS session', async () => {
    const refresh = vi.spyOn(axios, 'post').mockResolvedValue({data: {data: 'refreshed-token'}});
    const fetcher = vi.fn().mockImplementation(async () => new Response(null, {status: 401}));
    await expect(streamStudySupport({...streamOptions(), fetcher})).rejects.toThrow('HTTP 401');
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(refresh).toHaveBeenCalledOnce();
    expect(V2ApiClient.getAccessToken()).toBe('refreshed-token');
  });

  it('stops after a second instructor 401 and preserves the LMS session', async () => {
    const refresh = vi.spyOn(axios, 'post').mockResolvedValue({data: {data: 'refreshed-token'}});
    const adapter = vi.fn(unauthorized);
    agentApiClient.getClient().defaults.adapter = adapter;
    await expect(agentApiClient.post('/chat', {})).rejects.toMatchObject({code: 401});
    expect(adapter).toHaveBeenCalledTimes(2);
    expect(refresh).toHaveBeenCalledOnce();
    expect(V2ApiClient.getAccessToken()).toBe('refreshed-token');
  });

  it('does not replay an SSE error or a forbidden request', async () => {
    const refresh = vi.spyOn(axios, 'post');
    for (const response of [
      new Response('event: error\ndata: {"request_id":"test-request"}\n\n'),
      new Response(null, {status: 403}),
    ]) {
      const fetcher = vi.fn().mockResolvedValue(response);
      await expect(streamStudySupport({...streamOptions(), fetcher})).rejects.toThrow();
      expect(fetcher).toHaveBeenCalledOnce();
    }
    expect(refresh).not.toHaveBeenCalled();
  });

  it('does not reuse old credentials after logout or an account switch', async () => {
    const tokens: unknown[] = [];
    agentApiClient.getClient().defaults.adapter = async config => {
      tokens.push(config.headers.Authorization);
      return reply(config);
    };
    await agentApiClient.post('/chat', {});
    V2ApiClient.clearAccessToken();
    await agentApiClient.post('/chat', {}, {headers: {Authorization: 'Bearer stale-token'}});
    const fetcher = vi.fn().mockResolvedValue(new Response());
    await fetchWithAiSession('/study-support/api/query', {
      headers: {Authorization: 'Bearer stale-token'},
    }, fetcher);
    V2ApiClient.setAccessToken('other-user-token');
    await agentApiClient.post('/chat', {});
    expect(tokens).toEqual(['Bearer initial-token', undefined, 'Bearer other-user-token']);
    expect(fetcher.mock.calls[0][1].headers.has('Authorization')).toBe(false);
  });

  it('omits Bearer on anonymous requests even with an active session', async () => {
    V2ApiClient.getClient().defaults.adapter = async config => {
      expect(config.headers.Authorization).toBeUndefined();
      return reply(config);
    };
    await V2ApiClient.post('/v1/auth/login', {}, {skipAuth: true});
  });
});
