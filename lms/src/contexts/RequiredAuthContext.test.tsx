import {render, screen} from '@testing-library/react';
import '@testing-library/jest-dom';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {RequiredAuthProvider} from './RequiredAuthContext';

const {useAuthMock} = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

const renderProtectedRoute = () => render(
  <MemoryRouter initialEntries={['/protected']}>
    <Routes>
      <Route
        path="/protected"
        element={(
          <RequiredAuthProvider>
            <div>Protected content</div>
          </RequiredAuthProvider>
        )}
      />
      <Route path="/login" element={<div>Login page</div>}/>
    </Routes>
  </MemoryRouter>
);

describe('RequiredAuthProvider', () => {
  beforeEach(() => {
    useAuthMock.mockReset();
  });

  it('redirects a signed-out visitor without navigating during render', () => {
    useAuthMock.mockReturnValue({user: null, loading: false});

    renderProtectedRoute();

    expect(screen.getByText('Login page')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('waits for the stored session before deciding to redirect', () => {
    useAuthMock.mockReturnValue({user: null, loading: true});

    renderProtectedRoute();

    expect(screen.getByRole('status')).toHaveTextContent('Loading session…');
    expect(screen.queryByText('Login page')).not.toBeInTheDocument();
  });

  it('renders protected content for a signed-in user', () => {
    useAuthMock.mockReturnValue({
      loading: false,
      user: {
        id: 7,
        userId: 7,
        email: 'student@example.test',
        name: 'Demo Student',
        username: 'demo.student',
        role: 'USER',
        level: 'STUDENT',
        avatar: null,
        accessToken: 'test-token',
      },
    });

    renderProtectedRoute();

    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });
});
