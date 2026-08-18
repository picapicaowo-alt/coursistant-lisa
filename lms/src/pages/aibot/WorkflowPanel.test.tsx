import {beforeEach, describe, expect, it, vi} from 'vitest';
import '@testing-library/jest-dom';
import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const agentApi = vi.hoisted(() => ({
  chat: vi.fn(),
  decideDeadlineChange: vi.fn(),
}));

vi.mock('@/apis/services/ai-agent-api', () => ({aiAgentApiService: agentApi}));
vi.mock('@/contexts/RequiredAuthContext', () => ({
  useRequiredAuth: () => ({
    user: {id: 42, name: 'Teacher', level: 'INSTRUCTOR'},
  }),
}));

import WorkflowPanel from './WorkflowPanel';

describe('WorkflowPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('sends instructor prompts to the AI Agent', async () => {
    agentApi.chat.mockResolvedValue({reply: 'You teach two courses.', pendingAction: null});
    const user = userEvent.setup();
    render(<WorkflowPanel/>);

    await user.click(screen.getByRole('button', {name: 'List my courses.'}));

    await waitFor(() => expect(agentApi.chat).toHaveBeenCalledWith({
      message: 'List my courses.',
      role: 'INSTRUCTOR',
    }));
    expect(await screen.findByText('You teach two courses.')).toBeInTheDocument();
  });

  it('requires an explicit Allow or Reject decision for a pending change', async () => {
    agentApi.chat.mockResolvedValue({
      reply: 'Change Assignment A from August 26 to August 27?',
      pendingAction: {actionId: 'action-123', type: 'ASSIGNMENT_DEADLINE_CHANGE'},
    });
    agentApi.decideDeadlineChange.mockResolvedValue({
      reply: 'The deadline change was rejected.',
      pendingAction: null,
    });
    const user = userEvent.setup();
    render(<WorkflowPanel/>);

    await user.type(screen.getByLabelText('Tell Workflow what to do'), 'Move Assignment A');
    await user.click(screen.getByRole('button', {name: 'Run'}));

    expect(await screen.findByText('Approval required')).toBeInTheDocument();
    await user.click(screen.getByRole('button', {name: 'Reject'}));

    await waitFor(() => expect(agentApi.decideDeadlineChange).toHaveBeenCalledWith({
      actionId: 'action-123',
      decision: 'REJECT',
    }));
    expect(await screen.findByText('The deadline change was rejected.')).toBeInTheDocument();
  });
});
