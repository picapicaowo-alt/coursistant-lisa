import {beforeEach, describe, expect, it, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AskAssistant from './AskAssistant';

const navigate = vi.fn();

vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {...actual, useNavigate: () => navigate};
});

vi.mock('@/contexts/RequiredAuthContext', () => ({
  useRequiredAuth: () => ({user: {id: 42, level: 'STUDENT'}}),
}));

describe('AskAssistant', () => {
  beforeEach(() => {
    navigate.mockReset();
    sessionStorage.clear();
    localStorage.clear();
  });

  it('hands the first question to the dedicated Assistant page', async () => {
    const user = userEvent.setup();
    render(<AskAssistant/>);

    await user.type(screen.getByLabelText('Ask Coursistant AI'), 'Plan my study week{Enter}');

    expect(JSON.parse(sessionStorage.getItem('pendingChat') ?? '{}')).toEqual({
      text: 'Plan my study week',
    });
    expect(navigate).toHaveBeenCalledWith('/aibot');
  });

  it('keeps the send button disabled for an empty question', () => {
    render(<AskAssistant/>);
    expect(screen.getByRole('button', {name: 'Send to AI Assistant'})).toBeDisabled();
    expect(screen.getByText('Recommended question')).toBeInTheDocument();
  });

  it('starts a dedicated chat from a quick question', async () => {
    const user = userEvent.setup();
    render(<AskAssistant/>);

    await user.click(screen.getByRole('button', {name: 'Create a study plan'}));

    expect(JSON.parse(sessionStorage.getItem('pendingChat') ?? '{}')).toEqual({
      text: 'Create a study plan',
    });
    expect(navigate).toHaveBeenCalledWith('/aibot');
  });

  it('opens the latest meaningful conversation when history exists', async () => {
    const user = userEvent.setup();
    localStorage.setItem('coursistant.ai-assistant.history.v1.42', JSON.stringify([{
      id: 'thread-1',
      title: 'Help with my biology assignment',
      createdAt: 1,
      updatedAt: 2,
      conversationId: null,
      messages: [
        {id: 0, sender: 'agent', text: 'Welcome'},
        {id: 1, sender: 'user', text: 'Help with my biology assignment'},
      ],
    }]));

    render(<AskAssistant/>);

    expect(screen.getByText('Continue recent chat')).toBeInTheDocument();
    expect(screen.getByText('Help with my biology assignment')).toBeInTheDocument();

    await user.click(screen.getByRole('button', {name: /Continue recent chat/}));

    expect(sessionStorage.getItem('coursistant.ai-assistant.pending-thread')).toBe('thread-1');
    expect(navigate).toHaveBeenCalledWith('/aibot');
  });
});
