export interface AssistantStreamFrame {
  event: string;
  data: string;
}

/** Decode SSE independently of network chunks, including split UTF-8 and CRLF. */
export const readAssistantStream = async (
  body: ReadableStream<Uint8Array>,
  onFrame: (frame: AssistantStreamFrame) => void,
): Promise<void> => {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const dispatch = (block: string) => {
    let event = 'message';
    const data: string[] = [];
    for (const line of block.split(/\r\n|\n|\r/)) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''));
    }
    if (data.length) onFrame({event, data: data.join('\n')});
  };

  try {
    while (true) {
      const {done, value} = await reader.read();
      buffer += decoder.decode(value, {stream: !done});
      let boundary = /\r\n\r\n|\n\n|\r\r/.exec(buffer);
      while (boundary) {
        dispatch(buffer.slice(0, boundary.index));
        buffer = buffer.slice(boundary.index + boundary[0].length);
        boundary = /\r\n\r\n|\n\n|\r\r/.exec(buffer);
      }
      if (done) break;
    }
    if (buffer.trim()) dispatch(buffer);
  } finally {
    // Cancel on a malformed/error frame so a producer cannot keep streaming.
    try { await reader.cancel(); } finally { reader.releaseLock(); }
  }
};
