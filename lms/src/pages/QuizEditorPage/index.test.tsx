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
});
