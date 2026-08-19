import {describe, expect, it, vi, beforeEach} from 'vitest';
import '@testing-library/jest-dom';
import {render, screen} from '@testing-library/react';
import React from 'react';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';

vi.mock('./CourseDetailView', () => ({CourseDetailView: () => <div>detail-view</div>}));
vi.mock('./CourseEditView', () => ({CourseEditView: () => <div>edit-view</div>}));

import {PageBody} from './PageBody';
import {useCourseWorkspaceStore} from '../stores/useCourseWorkspaceStore';

const renderAt = (path: string, routePattern: string, canEditCourse = false) => {
  const client = new QueryClient({defaultOptions: {queries: {retry: false}}});
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={routePattern} element={<PageBody canEditCourse={canEditCourse}/>}/>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('PageBody route handling', () => {
  beforeEach(() => {
    useCourseWorkspaceStore.setState({workspaceMode: 'view'});
  });

  it('shows the detail view on a course route', () => {
    renderAt('/course/23', '/course/:courseId');
    expect(screen.getByText('detail-view')).toBeInTheDocument();
  });

  it('shows the edit view when the mode says so', () => {
    useCourseWorkspaceStore.setState({workspaceMode: 'edit'});
    renderAt('/course/23', '/course/:courseId', true);
    expect(screen.getByText('edit-view')).toBeInTheDocument();
  });

  it('does not render the edit view without course-manager permission', () => {
    useCourseWorkspaceStore.setState({workspaceMode: 'edit'});
    renderAt('/course/23', '/course/:courseId');
    expect(screen.queryByText('edit-view')).not.toBeInTheDocument();
    expect(screen.getByText('detail-view')).toBeInTheDocument();
  });

  it('does not reach the detail view on a route with no course id', () => {
    renderAt('/course/add-content', '/course/add-content');
    expect(screen.queryByText('detail-view')).not.toBeInTheDocument();
    expect(screen.queryByText('edit-view')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('not available');
  });

  it('never throws while rendering a route with no course id', () => {
    expect(() => renderAt('/course/add-content', '/course/add-content')).not.toThrow();
  });
});
