import {validate as isUuid} from 'uuid';
import {fetchWithAiSession} from '@/apis/ai-session-fetch';
import {getApiErrorMessage} from '@/utils/apiError';
import {sanitizeAgentAnswer} from '@/utils/studySupportResponse';
import {readAssistantStream} from './assistant-stream';

const ASSISTANT_ENDPOINTS = {
  turn: '/api/assistant/turn/stream',
  decision: '/api/assistant/decision',
} as const;

export type AiAgentRole = 'STUDENT' | 'INSTRUCTOR';
export type DeadlineDecision = 'ALLOW' | 'REJECT';

export interface AiAgentPendingAction {
  actionId: string;
  type: 'ASSIGNMENT_DEADLINE_CHANGE' | string;
}

export interface AiAgentChatHistoryTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiAgentResponse {
  reply: string;
  pendingAction: AiAgentPendingAction | null;
  conversationId: string | null;
  confirmationRequired: boolean;
}

export interface AiAgentChatRequest {
  message: string;
  /**
   * Local UI role; never serialized. The assistant derives identity and course
   * permissions from the Bearer token.
   */
  role: AiAgentRole;
  /** Existing text suggestions remain messages; no chip selection is null. */
  chip?: string | null;
  conversationId?: string;
  history?: AiAgentChatHistoryTurn[];
}

export interface AiAgentStreamOptions {
  onReply?: (reply: string) => void;
  signal?: AbortSignal;
}

export interface DeadlineDecisionRequest {
  actionId: string;
  decision: DeadlineDecision;
}

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;

const firstString = (...values: unknown[]): string | null => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value;
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return null;
};

const readFlag = (...values: unknown[]): boolean =>
  values.some(value => value === true || value === 'true');

const sanitizeStreamingReply = (reply: string): string => {
  const markerStart = reply.lastIndexOf('/');
  const tail = reply.slice(markerStart).toLowerCase();
  const isPartialMarker = markerStart >= 0
    && ['/begin-think/', '/begin-rss/'].some(marker => marker.startsWith(tail));
  return sanitizeAgentAnswer(isPartialMarker ? reply.slice(0, markerStart) : reply);
};

const unwrapPayload = (body: unknown): Record<string, unknown> => {
  const root = asRecord(body);
  if (!root) {
    throw new Error('The AI Agent returned an invalid response.');
  }

  const nested = asRecord(root.data);
  if (nested && (
    'reply' in nested
    || 'message' in nested
    || 'pendingAction' in nested
    || 'pending_action' in nested
  )) {
    return nested;
  }

  return root;
};

const parsePendingAction = (value: unknown): AiAgentPendingAction | null => {
  const action = asRecord(value);
  if (!action) return null;

  const actionId = firstString(action.actionId, action.action_id, action.id);
  if (!actionId) return null;

  const type = firstString(action.type, action.actionType, action.action_type)
    ?? 'ASSIGNMENT_DEADLINE_CHANGE';
  return {actionId, type};
};

const normalizeResponse = (body: unknown): AiAgentResponse => {
  const candidate = unwrapPayload(body);
  const rawReply = firstString(candidate.reply, candidate.message) ?? '';
  const reply = sanitizeAgentAnswer(rawReply);
  const pendingAction = parsePendingAction(
    candidate.pendingAction ?? candidate.pending_action,
  );
  const conversationId = firstString(
    candidate.conversationId,
    candidate.conversation_id,
    candidate.sessionId,
    candidate.session_id,
  );
  const confirmationRequired = readFlag(
    candidate.confirmationRequired,
    candidate.confirmation_required,
    candidate.requiresConfirmation,
    candidate.requires_confirmation,
  );

  if (!reply && !pendingAction) {
    throw new Error('The AI Agent returned an empty response.');
  }

  if (pendingAction && !reply) {
    throw new Error('The AI Agent returned an approval request without details.');
  }

  return {
    reply,
    pendingAction,
    conversationId: conversationId && isUuid(conversationId) ? conversationId : null,
    confirmationRequired,
  };
};

export class AiAgentApiService {
  constructor(private readonly fetcher: typeof fetch = (input, init) => fetch(input, init)) {}

  async chat(body: AiAgentChatRequest, options: AiAgentStreamOptions = {}): Promise<AiAgentResponse> {
    const response = await this.post(ASSISTANT_ENDPOINTS.turn, {
      message: body.message,
      chip: body.chip ?? null,
      // Browser history can contain legacy session IDs. Never send those as UUIDs.
      ...(body.conversationId && isUuid(body.conversationId)
        ? {conversationId: body.conversationId} : {}),
      history: body.history ?? [],
    }, 'text/event-stream', options.signal);

    if (response.headers.get('Content-Type')?.includes('application/json')) {
      return normalizeResponse(await response.json());
    }
    if (!response.headers.get('Content-Type')?.includes('text/event-stream') || !response.body) {
      throw new Error('The AI Assistant returned no event stream.');
    }

    let reply = '';
    let complete = false;
    const result: Record<string, unknown> = {};
    await readAssistantStream(response.body, frame => {
      if (frame.data === '[DONE]') {
        complete = true;
        return;
      }
      let payload: unknown;
      try { payload = JSON.parse(frame.data); } catch {
        throw new Error('The AI Assistant returned an invalid stream event.');
      }
      if (frame.event === 'error') {
        throw new Error('The AI Assistant stream failed. Please try again.');
      }
      // Progress/diagnostics are not answer text or approval actions.
      if (!['message', 'delta', 'answer', 'done'].includes(frame.event)) return;
      const candidate = asRecord(payload);
      const data = asRecord(candidate?.data) ?? candidate;
      if (frame.event === 'delta') {
        const delta = typeof payload === 'string' ? payload : data?.delta ?? data?.text;
        if (typeof delta === 'string') reply += delta;
      } else if (data) {
        Object.assign(result, data);
        const text = firstString(data.reply, data.answer, data.message);
        if (text) reply = text;
        if (text || frame.event === 'done') complete = true;
      }
      // Hide an unfinished diagnostic marker while it is split across deltas.
      options.onReply?.(sanitizeStreamingReply(reply));
    });
    if (!complete) throw new Error('The AI Assistant stream ended without a final answer.');
    return normalizeResponse({...result, reply});
  }

  async decideDeadlineChange(body: DeadlineDecisionRequest): Promise<AiAgentResponse> {
    const response = await this.post(ASSISTANT_ENDPOINTS.decision, body, 'application/json');
    return normalizeResponse(await response.json());
  }

  private async post(path: string, data: unknown, accept: string, signal?: AbortSignal): Promise<Response> {
    try {
      const response = await fetchWithAiSession(path, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', Accept: accept},
        body: JSON.stringify(data),
        signal,
      }, this.fetcher);
      if (!response.ok) {
        const details: unknown = response.headers.get('Content-Type')?.includes('application/json')
          ? await response.json().catch(() => null) : null;
        throw new Error(getApiErrorMessage(
          {code: response.status, details},
          `The AI Assistant returned HTTP ${response.status}.`,
        ));
      }
      return response;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Workflow is temporarily unavailable. Please try again.'));
    }
  }
}

export const aiAgentApiService = new AiAgentApiService();
