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
  role: AiAgentRole;
  conversationId?: string;
  history?: AiAgentChatHistoryTurn[];
}

export interface DeadlineDecisionRequest {
  actionId: string;
  decision: DeadlineDecision;
}

const AGENT_API_BASE = (import.meta.env.VITE_AI_AGENT_API_DOMAIN_NAME || '/ai-agent').replace(/\/$/, '');
const REQUEST_TIMEOUT_MS = 60_000;

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
  const candidate = unwrapPayload(body);
  const reply = firstString(candidate.reply, candidate.message) ?? '';
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

  return {
    reply,
    pendingAction,
    conversationId,
    confirmationRequired,
  };
};

const parseBody = async (response: Response): Promise<unknown> => {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return response.json();
  const text = await response.text();
  return text ? {message: text} : {};
};

const request = async (
  path: string,
  body: AiAgentChatRequest | DeadlineDecisionRequest,
  accessToken: string,
): Promise<AiAgentResponse> => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${AGENT_API_BASE}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const responseBody = await parseBody(response);

    if (!response.ok) {
      const detail = asRecord(responseBody)?.message;
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
  private pendingDecisionContext: {actionId: string; accessToken: string} | null = null;

  async chat(body: AiAgentChatRequest): Promise<AiAgentResponse> {
    const accessToken = getAccessToken();
    const response = await request('/chat', body, accessToken);

    this.pendingDecisionContext = response.pendingAction
      ? {actionId: response.pendingAction.actionId, accessToken}
      : null;

    return response;
  }

  async decideDeadlineChange(body: DeadlineDecisionRequest): Promise<AiAgentResponse> {
    const accessToken = this.pendingDecisionContext?.actionId === body.actionId
      ? this.pendingDecisionContext.accessToken
      : getAccessToken();
    const response = await request('/chat/deadline-change/decision', body, accessToken);

    if (!response.pendingAction) {
      this.pendingDecisionContext = null;
    }

    return response;
  }
}

export const aiAgentApiService = new AiAgentApiService();
