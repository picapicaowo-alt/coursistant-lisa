import type {AiAgentRole} from '@/apis/services/ai-agent-api';
import type {WorkflowChatMessage} from './workflowConversation';

export interface AssistantThread {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  conversationId: string | null;
  messages: WorkflowChatMessage[];
}

const STORAGE_PREFIX = 'coursistant.ai-assistant.history.v1';
export const ASSISTANT_PENDING_THREAD_KEY = 'coursistant.ai-assistant.pending-thread';

const welcomeMessage = (role: AiAgentRole): string => role === 'INSTRUCTOR'
  ? 'I can help with course questions, teaching plans, deadlines, and supported LMS tasks. Changes that affect students always require your approval.'
  : 'I can help you understand course material, plan your work, and check courses or upcoming deadlines.';

const createId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const createAssistantThread = (role: AiAgentRole): AssistantThread => {
  const now = Date.now();
  return {
    id: createId(),
    title: 'New conversation',
    createdAt: now,
    updatedAt: now,
    conversationId: null,
    messages: [{id: 0, sender: 'agent', text: welcomeMessage(role)}],
  };
};

const isMessage = (value: unknown): value is WorkflowChatMessage => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<WorkflowChatMessage>;
  return typeof candidate.id === 'number'
    && (candidate.sender === 'user' || candidate.sender === 'agent')
    && typeof candidate.text === 'string';
};

const isThread = (value: unknown): value is AssistantThread => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<AssistantThread>;
  return typeof candidate.id === 'string'
    && typeof candidate.title === 'string'
    && typeof candidate.createdAt === 'number'
    && typeof candidate.updatedAt === 'number'
    && (candidate.conversationId === null || typeof candidate.conversationId === 'string')
    && Array.isArray(candidate.messages)
    && candidate.messages.every(isMessage);
};

const storageKey = (userId: number): string => `${STORAGE_PREFIX}.${userId}`;

export const loadAssistantThreads = (userId: number, role: AiAgentRole): AssistantThread[] => {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [createAssistantThread(role)];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [createAssistantThread(role)];
    const threads = parsed.filter(isThread).sort((a, b) => b.updatedAt - a.updatedAt);
    return threads.length ? threads : [createAssistantThread(role)];
  } catch {
    return [createAssistantThread(role)];
  }
};

export const saveAssistantThreads = (userId: number, threads: AssistantThread[]): void => {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(threads));
  } catch {
    // A full or restricted browser storage area must not interrupt the chat.
  }
};

export const titleFromMessage = (message: string): string => {
  const normalized = message.trim().replace(/\s+/g, ' ');
  if (normalized.length <= 46) return normalized;
  return `${normalized.slice(0, 45).trimEnd()}...`;
};
