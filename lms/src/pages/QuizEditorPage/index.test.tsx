import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {fireEvent, render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import {describe, expect, it, vi} from 'vitest';

const api = vi.hoisted(() => ({
  getQuiz: vi.fn(),
  listQuestions: vi.fn(),
  createQuiz: vi.fn(),
  patchQuiz: vi.fn(),
  createQuestion: vi.fn(),
  patchQuestion: vi.fn(),
  patchAnswerKey: vi.fn(),
  deleteQuestion: vi.fn(),
  deleteQuiz: vi.fn(),
  reorderQuestions: vi.fn(),
  publishQuiz: vi.fn(),
  unpublishQuiz: vi.fn(),
}));

vi.mock('@/apis/services/quiz-api', () => ({quizApiService: api}));
vi.mock('@/hooks/useCourseAccess', () => ({
  useCourseAccess: () => ({isResolved: true, canConfigureAssignments: true}),
}));
vi.mock('@/components/RichTextEditor', () => ({
  RichTextEditor: ({content, onChange, ariaLabel}: {content: string; onChange: (value: string) => void; ariaLabel: string}) => (
    <textarea aria-label={ariaLabel} value={content} onChange={event => onChange(event.target.value)}/>
  ),
}));

import QuizEditorPage from './index';

const renderPage = () => render(
  <QueryClientProvider client={new QueryClient({defaultOptions: {queries: {retry: false}}})}>
    <MemoryRouter initialEntries={['/course/37/quizzes/new']}>
      <Routes>
        <Route path="/course/:courseId/quizzes/new" element={<QuizEditorPage/>}/>
      </Routes>
    </MemoryRouter>
  </QueryClientProvider>,
);

const renderExistingPage = () => render(
  <QueryClientProvider client={new QueryClient({defaultOptions: {queries: {retry: false}}})}>
    <MemoryRouter initialEntries={['/course/37/quizzes/21/edit']}>
      <Routes>
        <Route path="/course/:courseId/quizzes/:quizId/edit" element={<QuizEditorPage/>}/>
      </Routes>
    </MemoryRouter>
  </QueryClientProvider>,
);

describe('QuizEditorPage time range', () => {
  it('defaults to a rounded one-hour window and updates close from duration', async () => {
    renderPage();
    const user = userEvent.setup();
    const opens = screen.getByLabelText('Opens') as HTMLInputElement;
    const closes = screen.getByLabelText('Closes') as HTMLInputElement;

    expect(opens.value).toMatch(/:(00|30) (AM|PM)$/);
    expect(screen.getByLabelText('Duration')).toHaveValue('60');

    fireEvent.change(opens, {target: {value: '08/24/2026, 10:00 AM'}});
    expect(closes).toHaveValue('08/24/2026, 11:00 AM');
    await user.selectOptions(screen.getByLabelText('Duration'), '120');
    expect(closes).toHaveValue('08/24/2026, 12:00 PM');
  });

  it('offers audited answer-key correction after attempts and triggers regrade', async () => {
    api.getQuiz.mockResolvedValue({data: {
      id: 21, courseId: 37, title: 'First quiz', instructions: null,
      opensAtUtc: '2026-08-24T16:00:00Z', opensAtLocal: '2026-08-24T09:00:00',
      closesAtUtc: '2026-08-24T17:00:00Z', closesAtLocal: '2026-08-24T10:00:00', timezone: 'America/Los_Angeles',
      timeLimitSeconds: null, attemptsAllowed: 1, resultVisibility: 'InstantAutoScore', state: 'Published',
      version: 2, totalPoints: 1, questionCount: 1, hasAttempts: true, hasOpenAttempt: null,
    }});
    api.listQuestions.mockResolvedValue({data: [{
      id: 101, quizId: 21, type: 'SingleChoice', stem: 'Choose A', points: 1, position: 1, version: 3,
      options: [{id: 1001, label: 'A', position: 1, isCorrect: true}, {id: 1002, label: 'B', position: 2, isCorrect: false}],
    }]});
    api.patchAnswerKey.mockResolvedValue({data: {id: 101}});
    renderExistingPage();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', {name: /correct answer key for/i}));
    const radios = screen.getAllByRole('radio');
    await user.click(radios[1]);
    await user.type(screen.getByLabelText('Audit reason'), 'Published key was incorrect');
    await user.click(screen.getByRole('button', {name: 'Correct key and regrade'}));

    expect(api.patchAnswerKey).toHaveBeenCalledWith(37, 21, 101, {
      options: [{optionId: 1001, isCorrect: false}, {optionId: 1002, isCorrect: true}],
      reason: 'Published key was incorrect',
      expectedVersion: 3,
    }, expect.any(String));
    expect(await screen.findByText(/submitted attempts were regraded atomically/i)).toBeInTheDocument();
  });
});
