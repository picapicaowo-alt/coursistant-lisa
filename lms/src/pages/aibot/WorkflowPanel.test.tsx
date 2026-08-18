import {beforeEach, describe, expect, it, vi} from 'vitest';
import '@testing-library/jest-dom';
import {render, screen, waitFor, within} from '@testing-library/react';
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

    const dialog = await screen.findByRole('dialog', {name: 'Deadline change approval'});
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(within(dialog).getByText('Change Assignment A from August 26 to August 27?')).toBeInTheDocument();
    expect(within(dialog).getByText(/remove any existing late submission window/i)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', {name: 'Reject'}));

    await waitFor(() => expect(agentApi.decideDeadlineChange).toHaveBeenCalledWith({
      actionId: 'action-123',
      decision: 'REJECT',
    }));
    expect(await screen.findByText('The deadline change was rejected.')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps the approval dialog open when the deadline update fails', async () => {
    agentApi.chat.mockResolvedValue({
      reply: 'Move Assignment A to August 27 and clear its late window?',
      pendingAction: {actionId: 'action-456', type: 'ASSIGNMENT_DEADLINE_CHANGE'},
    });
    agentApi.decideDeadlineChange.mockRejectedValue(new Error('The LMS rejected this deadline change.'));
    const user = userEvent.setup();
    render(<WorkflowPanel/>);

    await user.click(screen.getByRole('button', {name: 'Help me change an assignment deadline.'}));
    const dialog = await screen.findByRole('dialog', {name: 'Deadline change approval'});
    await user.click(within(dialog).getByRole('button', {name: 'Allow'}));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('The LMS rejected this deadline change.');
    expect(within(dialog).getByRole('button', {name: 'Reject'})).toBeEnabled();
    expect(screen.getByRole('dialog', {name: 'Deadline change approval'})).toBeInTheDocument();
  });
});
