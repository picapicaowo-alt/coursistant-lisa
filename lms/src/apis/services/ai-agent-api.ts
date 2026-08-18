export type AiAgentRole = 'STUDENT' | 'INSTRUCTOR';
export type DeadlineDecision = 'ALLOW' | 'REJECT';

export interface AiAgentPendingAction {
  actionId: string;
  type: 'ASSIGNMENT_DEADLINE_CHANGE' | string;
}

export interface AiAgentResponse {
  reply: string;
  pendingAction: AiAgentPendingAction | null;
}

export interface AiAgentChatRequest {
  message: string;
  role: AiAgentRole;
}

export interface DeadlineDecisionRequest {
  actionId: string;
  decision: DeadlineDecision;
}

interface AgentErrorBody {
  message?: unknown;
}

const AGENT_API_BASE = (import.meta.env.VITE_AI_AGENT_API_DOMAIN_NAME || '/ai-agent').replace(/\/$/, '');
const REQUEST_TIMEOUT_MS = 60_000;

const getAccessToken = (): string => {
  const directToken = localStorage.getItem('accToken');
  if (directToken) return directToken;

  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    try {
      const token = (JSON.parse(storedUser) as {accessToken?: unknown}).accessToken;
      if (typeof token === 'string' && token) return token;
    } catch {
      // AuthContext owns malformed-session cleanup. This client reports the
      // missing session without mutating unrelated local state.
    }
  }

  throw new Error('Your session is missing. Please sign in again.');
};

const normalizeResponse = (body: unknown): AiAgentResponse => {
  if (!body || typeof body !== 'object') {
    throw new Error('The AI Agent returned an invalid response.');
  }

  const candidate = body as {
    reply?: unknown;
    message?: unknown;
    pendingAction?: unknown;
  };
  const reply = typeof candidate.reply === 'string'
    ? candidate.reply
    : typeof candidate.message === 'string'
      ? candidate.message
      : '';

  let pendingAction: AiAgentPendingAction | null = null;
  if (candidate.pendingAction !== null && typeof candidate.pendingAction === 'object') {
    const action = candidate.pendingAction as {actionId?: unknown; type?: unknown};
    if (typeof action.actionId === 'string' && typeof action.type === 'string') {
      pendingAction = {actionId: action.actionId, type: action.type};
    }
  }

  if (!reply && !pendingAction) {
    throw new Error('The AI Agent returned an empty response.');
  }

  return {reply, pendingAction};
};

const parseBody = async (response: Response): Promise<unknown> => {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return response.json();
  const text = await response.text();
  return text ? {message: text} : {};
};

const request = async (path: string, body: AiAgentChatRequest | DeadlineDecisionRequest): Promise<AiAgentResponse> => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${AGENT_API_BASE}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const responseBody = await parseBody(response);

    if (!response.ok) {
      const detail = (responseBody as AgentErrorBody)?.message;
      if (response.status === 401) {
        throw new Error('Your session expired. Please sign in again.');
      }
      throw new Error(
        typeof detail === 'string' && detail
          ? detail
          : 'Workflow is temporarily unavailable. Please try again.',
      );
    }

    return normalizeResponse(responseBody);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('The AI Agent took too long to respond. Please try again.');
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
};

export class AiAgentApiService {
  chat(body: AiAgentChatRequest): Promise<AiAgentResponse> {
    return request('/chat', body);
  }

  decideDeadlineChange(body: DeadlineDecisionRequest): Promise<AiAgentResponse> {
    return request('/chat/deadline-change/decision', body);
  }
}

export const aiAgentApiService = new AiAgentApiService();
