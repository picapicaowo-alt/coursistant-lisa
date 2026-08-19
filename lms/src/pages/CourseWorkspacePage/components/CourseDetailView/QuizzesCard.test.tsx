import {render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import type {QuizResponse} from '@/apis';
import {QuizzesCard} from './QuizzesCard';

const quiz = (overrides: Partial<QuizResponse> = {}): QuizResponse => ({
  id: 16,
  courseId: 34,
  title: 'Quiz 2: Normalization and Indexing',
  instructions: 'This quiz assesses functional dependencies.',
  opensAtUtc: '2099-09-05T07:00:00Z',
  opensAtLocal: '2099-09-05T00:00:00',
  closesAtUtc: '2099-09-27T06:59:00Z',
  closesAtLocal: '2099-09-26T23:59:00',
  timezone: 'America/Los_Angeles',
  timeLimitSeconds: 1500,
  attemptsAllowed: 2,
  resultVisibility: 'AfterRelease',
  state: 'Published',
  windowOpen: false,
  version: 1,
  totalPoints: 20,
  questionCount: 5,
  hasAttempts: false,
  createdAt: '2026-08-01T00:00:00Z',
  updatedAt: '2026-08-01T00:00:00Z',
  ...overrides,
});

describe('QuizzesCard', () => {
  it('shows upcoming availability and the open time instead of only the close time', () => {
    render(
      <MemoryRouter>
        <QuizzesCard courseId={34} quizzes={[quiz()]} failed={false}/>
      </MemoryRouter>,
    );

    expect(screen.getByText('Upcoming')).toBeTruthy();
    expect(screen.queryByText('Published')).toBeNull();
    expect(screen.getByText('Opens', {selector: 'span'})).toBeTruthy();
    expect(screen.getByText('Closes', {selector: 'span'})).toBeTruthy();
  });

  it('shows Open and both window edges when the quiz is active', () => {
    render(
      <MemoryRouter>
        <QuizzesCard courseId={34} quizzes={[quiz({windowOpen: true})]} failed={false}/>
      </MemoryRouter>,
    );

    expect(screen.getByText('Open')).toBeTruthy();
    expect(screen.getByText('Opens', {selector: 'span'})).toBeTruthy();
    expect(screen.getByText('Closes', {selector: 'span'})).toBeTruthy();
  });
});
