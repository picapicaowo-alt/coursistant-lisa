import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import '@testing-library/jest-dom';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {AuthProvider, useAuth} from './AuthContext';

const mocks = vi.hoisted(() => ({
  clearAccessToken: vi.fn(),
  serverLogout: vi.fn(),
}));

vi.mock('@/apis', () => ({
  V2ApiClient: {
    clearAccessToken: mocks.clearAccessToken,
  },
}));

vi.mock('@/apis/services/auth-api', () => ({
  authApiService: {
    logout: mocks.serverLogout,
  },
}));

const storedUser = {
  id: 7,
  userId: 7,
  email: 'student@example.com',
  name: 'Student',
  username: 'student',
  role: 'USER',
  level: 'STUDENT',
  avatar: null,
  accessToken: 'sensitive-token',
};

const AuthHarness = () => {
  const {loading, logout, user} = useAuth();

  if (loading) return <span>Loading</span>;

  return (
    <div>
      <span>{user?.email ?? 'Signed out'}</span>
      <button type="button" onClick={() => void logout()}>Log out</button>
    </div>
  );
};

describe('AuthProvider logout', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('user', JSON.stringify(storedUser));
    localStorage.setItem('accToken', storedUser.accessToken);
    localStorage.setItem('account', JSON.stringify({token: true}));
    localStorage.setItem('unrelated-preference', 'keep-me');
    mocks.clearAccessToken.mockReset();
    mocks.serverLogout.mockReset();
    window.history.replaceState({}, '', '/');
  });

  it('revokes the server session before clearing local authentication', async () => {
    mocks.serverLogout.mockResolvedValue({status: 200, data: null});

    render(
      <AuthProvider>
        <AuthHarness/>
      </AuthProvider>
    );

    expect(await screen.findByText(storedUser.email)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: 'Log out'}));

    await waitFor(() => expect(mocks.serverLogout).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mocks.clearAccessToken).toHaveBeenCalledTimes(1));
    expect(localStorage.getItem('user')).toBeNull();
    expect(localStorage.getItem('accToken')).toBeNull();
    expect(localStorage.getItem('account')).toBeNull();
    expect(localStorage.getItem('unrelated-preference')).toBe('keep-me');
  });

  it('still clears the browser session when the API is unavailable', async () => {
    mocks.serverLogout.mockRejectedValue(new Error('Bad gateway'));
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    render(
      <AuthProvider>
        <AuthHarness/>
      </AuthProvider>
    );

    fireEvent.click(await screen.findByRole('button', {name: 'Log out'}));

    await waitFor(() => expect(mocks.clearAccessToken).toHaveBeenCalledTimes(1));
    expect(localStorage.getItem('user')).toBeNull();
    expect(localStorage.getItem('accToken')).toBeNull();
  });
});
