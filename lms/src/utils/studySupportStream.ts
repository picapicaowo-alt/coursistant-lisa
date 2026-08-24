export interface StudySupportProgress {
  phase: string;
  text: string;
}

interface StreamStudySupportOptions {
  url: string;
  body: URLSearchParams;
  headers: Record<string, string>;
  onProgress: (progress: StudySupportProgress) => void;
  fetcher?: typeof fetch;
}

interface QueryStudySupportOptions {
  url: string;
  body: FormData;
  headers: Record<string, string>;
  fetcher?: typeof fetch;
}

interface SseFrame {
  event: string;
  data: unknown;
}

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;

const parseFrame = (block: string): SseFrame | null => {
  let event = 'message';
  const dataLines: string[] = [];

  for (const rawLine of block.replace(/\r/g, '').split('\n')) {
    if (!rawLine || rawLine.startsWith(':')) continue;
    if (rawLine.startsWith('event:')) {
      event = rawLine.slice('event:'.length).trim();
    } else if (rawLine.startsWith('data:')) {
      dataLines.push(rawLine.slice('data:'.length).trimStart());
    }
  }

  if (!dataLines.length) return null;
  return {event, data: JSON.parse(dataLines.join('\n'))};
};

const errorMessage = (payload: unknown): string => {
  const record = asRecord(payload);
  const requestId = typeof record?.request_id === 'string' ? record.request_id : '';
  return requestId
    ? `Study Support stream failed (request ${requestId}).`
    : 'Study Support stream failed.';
};

export const streamStudySupport = async ({
  url,
  body,
  headers,
  onProgress,
  fetcher = fetch,
}: StreamStudySupportOptions): Promise<unknown> => {
  const response = await fetcher(url, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      Accept: 'text/event-stream',
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`Study Support returned HTTP ${response.status}.`);
  }
  if (!response.body) {
    throw new Error('Study Support returned no response stream.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let answer: unknown;

  const handleFrame = (frame: SseFrame | null) => {
    if (!frame) return;
    if (frame.event === 'error') throw new Error(errorMessage(frame.data));
    if (frame.event === 'answer') {
      answer = frame.data;
      return;
    }
    if (frame.event !== 'progress') return;

    const payload = asRecord(frame.data);
    const text = typeof payload?.text === 'string' ? payload.text.trim() : '';
    const phase = typeof payload?.phase === 'string' ? payload.phase.trim() : '';
    if (text) onProgress({phase: phase || 'thinking', text});
  };

  while (true) {
    const {done, value} = await reader.read();
    buffer = (buffer + decoder.decode(value, {stream: !done})).replace(/\r\n/g, '\n');

    let boundary = buffer.indexOf('\n\n');
    while (boundary >= 0) {
      handleFrame(parseFrame(buffer.slice(0, boundary)));
      buffer = buffer.slice(boundary + 2);
      boundary = buffer.indexOf('\n\n');
    }

    if (done) break;
  }

  if (buffer.trim()) handleFrame(parseFrame(buffer));
  if (answer === undefined) {
    throw new Error('Study Support stream ended without an answer.');
  }
  return answer;
};

export const queryStudySupportWithFile = async ({
  url,
  body,
  headers,
  fetcher = fetch,
}: QueryStudySupportOptions): Promise<unknown> => {
  const response = await fetcher(url, {
    method: 'POST',
    headers: {
      ...headers,
      Accept: 'application/json',
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`Study Support returned HTTP ${response.status}.`);
  }
  return response.json();
};
