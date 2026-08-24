import {act, render, screen} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import DynamicThinking from './DynamicThinking';

describe('DynamicThinking', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('reveals fallback progress over time and reports the active step accessibly', () => {
    vi.useFakeTimers();
    render(<DynamicThinking/>);

    expect(screen.getByText('Understanding your request.')).toBeInTheDocument();
    expect(screen.queryByText('Reviewing the relevant context.')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'AI is thinking: Understanding your request.',
    );

    act(() => vi.advanceTimersByTime(4000));

    expect(screen.getByText('Reviewing the relevant context.')).toBeInTheDocument();
    expect(screen.getByText('· 4s')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'AI is thinking: Reviewing the relevant context.',
    );
  });

  it('renders streamed status summaries instead of fallback copy', () => {
    render(
      <DynamicThinking
        label="AI Agent is thinking"
        steps={[
          {id: 'course', text: 'Checking course permissions.'},
          {id: 'assignment', text: 'Reviewing the assignment deadline.'},
        ]}
      />,
    );

    expect(screen.getByText('Checking course permissions.')).toBeInTheDocument();
    expect(screen.getByText('Reviewing the assignment deadline.')).toBeInTheDocument();
    expect(screen.queryByText('Understanding your request.')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'AI Agent is thinking: Reviewing the assignment deadline.',
    );
  });
});
