import {beforeEach, describe, expect, it, vi} from 'vitest';
import {act, render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const agentApi = vi.hoisted(() => ({
  chat: vi.fn(),
  decideDeadlineChange: vi.fn(),
}));
const studentSupportApi = vi.hoisted(() => ({chat: vi.fn()}));
const courseApi = vi.hoisted(() => ({loadActiveChatCourses: vi.fn()}));
const auth = vi.hoisted(() => ({
  user: {
    id: 43,
    name: 'Student',
    email: 'student@example.edu',
    level: 'STUDENT' as 'STUDENT' | 'INSTRUCTOR',
    accessToken: 'student-token',
  },
}));

vi.mock('@/apis/services/ai-agent-api', () => ({aiAgentApiService: agentApi}));
vi.mock('@/apis/services/student-study-support-api', () => ({
  studentStudySupportApiService: studentSupportApi,
}));
vi.mock('@/utils/chatCourses', () => ({
  SELECTED_CHAT_COURSE_STORAGE_KEY: 'selectedCourseId',
  loadActiveChatCourses: courseApi.loadActiveChatCourses,
}));
vi.mock('@/hooks/useAiExamLockdown', () => ({
  useAiExamLockdown: () => ({status: 'unlocked', lockedCourseIds: []}),
}));
vi.mock('@/contexts/RequiredAuthContext', () => ({
  useRequiredAuth: () => ({user: auth.user}),
}));
vi.mock('@/components/DynamicThinking/DynamicThinking', () => ({
  default: () => <div>Thinking</div>,
}));
vi.mock('@/components/MarkdownMessage', () => ({
  default: ({content}: {content: string}) => <span>{content}</span>,
}));
vi.mock('@/components/RichTextEditor', () => ({
  RichTextEditor: ({
    ariaLabel,
    content,
    disabled,
    onChange,
  }: {
    ariaLabel: string;
    content: string;
    disabled: boolean;
    onChange: (value: string) => void;
  }) => (
    <textarea
      aria-label={ariaLabel}
      disabled={disabled}
      value={content}
      onChange={event => onChange(event.target.value)}
    />
  ),
}));
vi.mock('./DeadlineDecisionModal', () => ({default: () => <div>Decision modal</div>}));

import AssistantWorkspace from './AssistantWorkspace';

class ResizeObserverMock {
  observe() {}
  disconnect() {}
}

describe('AssistantWorkspace API routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    auth.user = {
      id: 43,
      name: 'Student',
      email: 'student@example.edu',
      level: 'STUDENT',
      accessToken: 'student-token',
    };
    courseApi.loadActiveChatCourses.mockResolvedValue([
      {id: 40, name: 'Database Systems'},
      {id: 41, name: 'Internet and Cloud Computing'},
    ]);
    studentSupportApi.chat.mockResolvedValue('DDL means Data Definition Language.');
    agentApi.chat.mockResolvedValue({
      reply: 'Instructor workflow response.',
      pendingAction: null,
      conversationId: null,
      confirmationRequired: false,
    });
    Element.prototype.scrollIntoView = vi.fn();
    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockReturnValue({matches: false}),
    });
  });

  it('routes a student prompt to the Assistant API', async () => {
    const user = userEvent.setup();
    render(<AssistantWorkspace/>);

    await waitFor(() => expect(screen.getByRole('button', {name: 'Help me understand a difficult course concept.'})).toBeEnabled());
    await user.click(screen.getByRole('button', {name: 'Help me understand a difficult course concept.'}));

    await waitFor(() => expect(agentApi.chat).toHaveBeenCalledWith({
      message: 'Help me understand a difficult course concept.',
      role: 'STUDENT',
    }, {onReply: expect.any(Function)}));
    expect(studentSupportApi.chat).not.toHaveBeenCalled();
    expect(await screen.findByText('Instructor workflow response.')).toBeInTheDocument();
  });

  it('routes instructor requests to the same Assistant API', async () => {
    auth.user = {
      id: 42,
      name: 'Instructor',
      email: 'instructor@example.edu',
      level: 'INSTRUCTOR',
      accessToken: 'instructor-token',
    };
    const user = userEvent.setup();
    render(<AssistantWorkspace/>);

    await user.click(screen.getByRole('button', {name: 'What assignments are due in the next 14 days?'}));

    await waitFor(() => expect(agentApi.chat).toHaveBeenCalledWith({
      message: 'What assignments are due in the next 14 days?',
      role: 'INSTRUCTOR',
    }, {onReply: expect.any(Function)}));
    expect(studentSupportApi.chat).not.toHaveBeenCalled();
    expect(courseApi.loadActiveChatCourses).not.toHaveBeenCalled();
  });
  it('shows streamed text before completion without saving it as a finished message', async () => {
    auth.user.level = 'INSTRUCTOR';
    let finish!: (value: unknown) => void;
    agentApi.chat.mockImplementation((_body, options) => {
      options.onReply('Partial response');
      return new Promise(resolve => { finish = resolve; });
    });
    const user = userEvent.setup();
    render(<AssistantWorkspace/>);
    await user.click(screen.getByRole('button', {name: 'What assignments are due in the next 14 days?'}));
    expect(await screen.findByText('Partial response')).toBeInTheDocument();
    expect(localStorage.getItem('coursistant.ai-assistant.history.v1.43')).not.toContain('Partial response');
    await act(async () => finish({reply: 'Complete response', pendingAction: null, conversationId: null, confirmationRequired: false}));
    expect(await screen.findByText('Complete response')).toBeInTheDocument();
    expect(screen.queryByText('Partial response')).not.toBeInTheDocument();
  });

});
