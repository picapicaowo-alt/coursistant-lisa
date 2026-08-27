import '@testing-library/jest-dom';
import {fireEvent, render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {describe, expect, it, vi} from 'vitest';

const mocks = vi.hoisted(() => ({
  useCourseList: vi.fn(),
  useDashboardAssignments: vi.fn(),
}));

vi.mock('@/pages/LmsHomePage/hooks/useCourseList', () => ({
  useCourseList: mocks.useCourseList,
}));

vi.mock('@/pages/LmsHomePage/hooks/useDashboardAssignments', () => ({
  useDashboardAssignments: mocks.useDashboardAssignments,
}));

import DashboardSearch from './DashboardSearch';

const renderSearch = () => render(
  <MemoryRouter>
    <DashboardSearch/>
  </MemoryRouter>,
);

describe('DashboardSearch', () => {
  it('links matching live course and assignment results to their owned routes', () => {
    mocks.useCourseList.mockReturnValue({
      courses: [{id: 4, courseCode: 'BIO-210', title: 'Cell Biology'}],
    });
    mocks.useDashboardAssignments.mockReturnValue({
      rows: [{
        key: 'assignment-9',
        courseCode: 'BIO-210',
        title: 'Week 3 Lab Report',
        destination: '/course/4/assignments/9',
      }],
    });

    renderSearch();
    const input = screen.getByRole('textbox', {name: 'Search courses and assignments'});
    fireEvent.focus(input);
    fireEvent.change(input, {target: {value: 'BIO-210'}});

    expect(screen.getByText('Cell Biology').closest('a')).toHaveAttribute('href', '/course/4');
    expect(screen.getByText('Week 3 Lab Report').closest('a'))
      .toHaveAttribute('href', '/course/4/assignments/9');
  });

  it('shows an explicit empty result instead of navigating to a fabricated destination', () => {
    mocks.useCourseList.mockReturnValue({courses: []});
    mocks.useDashboardAssignments.mockReturnValue({rows: []});

    renderSearch();
    const input = screen.getByRole('textbox', {name: 'Search courses and assignments'});
    fireEvent.focus(input);
    fireEvent.change(input, {target: {value: 'missing'}});

    expect(screen.getByText('No matching courses or assignments.')).toBeVisible();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
