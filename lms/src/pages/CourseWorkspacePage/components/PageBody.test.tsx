import {describe, expect, it, vi, beforeEach} from 'vitest';
// No global test setup file exists, so the DOM matchers are pulled in here.
import '@testing-library/jest-dom';
import {render, screen} from '@testing-library/react';
import React from 'react';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';

// The heavy children are irrelevant here; what matters is which branch of
// PageBody renders for a given route and mode.
vi.mock('./CourseDetailView', () => ({CourseDetailView: () => <div>detail-view</div>}));
vi.mock('./CourseEditView', () => ({CourseEditView: () => <div>edit-view</div>}));
vi.mock('./CourseUnitsManager', () => ({CourseUnitsManager: () => <div>units-manager</div>}));
vi.mock('./CourseInfoPanel', () => ({CourseInfoPanel: () => <div>info-panel</div>}));
vi.mock('./CourseUnitPanel', () => ({CourseUnitPanel: () => <div>unit-panel</div>}));
vi.mock('@/pages/DetailWorkspacePage', () => ({DetailWorkspacePage: () => <div>detail-workspace</div>}));

import {PageBody} from './PageBody';
import {useCourseWorkspaceStore} from '../stores/useCourseWorkspaceStore';

const renderAt = (path: string, routePattern: string) => {
  const client = new QueryClient({defaultOptions: {queries: {retry: false}}});
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={routePattern} element={<PageBody/>}/>
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
    renderAt('/course/23', '/course/:courseId');
    expect(screen.getByText('edit-view')).toBeInTheDocument();
  });

  /**
   * The create screen shares PageBody and flips the mode out of "view" in an
   * effect, so its first render still reads "view". That frame used to reach
   * the detail view, which threw for want of a course id and took the page
   * down through the error boundary — the page appeared, then vanished.
   */
  it('does not reach the detail view on a route with no course id', () => {
    renderAt('/course/add-content', '/course/add-content');
    expect(screen.queryByText('detail-view')).not.toBeInTheDocument();
    expect(screen.queryByText('edit-view')).not.toBeInTheDocument();
    expect(screen.getByText('units-manager')).toBeInTheDocument();
  });

  it('never throws while rendering the create route', () => {
    expect(() => renderAt('/course/add-content', '/course/add-content')).not.toThrow();
  });
});
