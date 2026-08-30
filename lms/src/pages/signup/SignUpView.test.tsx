import '@testing-library/jest-dom';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import {beforeEach, describe, expect, it, vi} from 'vitest';

const mocks = vi.hoisted(() => ({
  register: vi.fn(),
  sendVerification: vi.fn(),
  storeLogin: vi.fn(),
  setAccessToken: vi.fn(),
}));

vi.mock('@/apis/services/auth-api', () => ({
  authApiService: {
    register: mocks.register,
    sendRegistrationVerification: mocks.sendVerification,
  },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({login: mocks.storeLogin}),
}));

vi.mock('@/apis', () => ({
  AUTH_ERROR_CODES: {
    invalidPasswordFormat: 'INVALID_PASSWORD_FORMAT',
    invalidVerificationCode: 'INVALID_VERIFICATION_CODE',
    verificationCodeExpired: 'VERIFICATION_CODE_EXPIRED',
    verificationAttemptsExceeded: 'VERIFICATION_ATTEMPTS_EXCEEDED',
    verificationResendCooldown: 'VERIFICATION_RESEND_COOLDOWN',
    verificationHourlyLimit: 'VERIFICATION_HOURLY_LIMIT',
  },
  V2ApiClient: {setAccessToken: mocks.setAccessToken},
}));

vi.mock('@iconify/react', () => ({Icon: () => <span/>}));

const copy: Record<string, string> = {
  'signup.title': 'Create an account',
  'signup.subtitle': 'Enter your details',
  'signup.nameLabel': 'Name',
  'signup.emailLabel': 'Email',
  'signup.passwordLabel': 'Password',
  'signup.verificationLabel': 'Verification code',
  'signup.nicknamePlaceholder': 'Enter name',
  'signup.emailPlaceholder': 'Enter email',
  'signup.passwordPlaceholder': 'Enter password',
  'signup.passwordHint': 'Password help',
  'signup.verificationPlaceholder': 'Enter code',
  'signup.verifyEmail': 'Verify Email',
  'signup.verifyTime': 'Retry {{time}}',
  'signup.sendingCode': 'Sending...',
  'signup.creatingAccount': 'Creating account...',
  'signup.continueButton': 'Continue',
  'signup.alreadyRegistered': 'Already registered?',
  'signup.signinLink': 'Sign in',
  'signupErrors.nicknameRequired': 'Name is required.',
  'signupErrors.emailRequired': 'Email is required.',
  'signupErrors.emailInvalid': 'Email is invalid.',
  'signupErrors.passwordRequired': 'Password is required.',
  'signupErrors.passwordFormat': 'Password format is invalid.',
  'signupErrors.verificationRequired': 'Code is required.',
  'signupErrors.verificationCodeFormat': 'Code must have six digits.',
  'signupErrors.verificationCodeSent': 'Code sent.',
  'signupErrors.verificationFailed': 'Code is incorrect.',
  'signupErrors.verificationExpired': 'Code expired.',
  'signupErrors.verificationAttemptsExceeded': 'Too many attempts.',
  'signupErrors.resendCooldown': 'Wait before resending.',
  'signupErrors.hourlyLimit': 'Hourly limit reached.',
  'signupErrors.fullNameRequired': 'Enter first and last name.',
  'signupErrors.sendVerificationFailed': 'Could not send code.',
  'signupErrors.signupFailed': 'Could not register.',
  'signupErrors.serviceUnavailable': 'Registration unavailable.',
  'login.hidePassword': 'Hide password',
  'login.showPassword': 'Show password',
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, variables?: {time?: string}) => {
      const value = copy[key] ?? key;
      return variables?.time ? value.replace('{{time}}', variables.time) : value;
    },
  }),
}));

import SignUpView from './SignUpView';

const authResponse = {
  status: 200,
  code: 'SUCCESS',
  message: 'Success',
  timestamp: '2026-08-18T00:00:00Z',
  data: {
    userId: 9,
    email: 'student@example.com',
    firstName: 'Student',
    middleName: null,
    lastName: 'One',
    username: 'student',
    role: 'USER',
    level: 'STUDENT',
    avatar: null,
    accessToken: 'registered-token',
  },
};

const renderSignup = () => render(
  <MemoryRouter initialEntries={['/signup']}>
    <Routes>
      <Route path="/signup" element={<SignUpView/>}/>
      <Route path="/" element={<div>Student dashboard</div>}/>
    </Routes>
  </MemoryRouter>
);

const fillRegistration = async () => {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Name'), 'Student One');
  await user.type(screen.getByLabelText('Email'), ' Student@Example.com ');
  await user.type(screen.getByLabelText('Password'), 'Passw0rd1');
  await user.type(screen.getByLabelText('Verification code'), '123456');
  return user;
};

describe('SignUpView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mocks.sendVerification.mockResolvedValue({status: 200, data: null});
    mocks.register.mockResolvedValue(authResponse);
  });

  it('sends a code and creates an authenticated student account', async () => {
    renderSignup();
    const user = await fillRegistration();

    await user.click(screen.getByRole('button', {name: 'Verify Email'}));
    expect(mocks.sendVerification).toHaveBeenCalledWith('student@example.com', expect.any(String));
    expect(await screen.findByText('Code sent.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', {name: 'Continue'}));

    expect(mocks.register).toHaveBeenCalledWith(
      {
        firstName: 'Student',
        lastName: 'One',
        email: 'student@example.com',
        password: 'Passw0rd1',
        verificationCode: '123456',
      },
      expect.any(String),
    );
    expect(mocks.setAccessToken).toHaveBeenCalledWith('registered-token');
    expect(mocks.storeLogin).toHaveBeenCalledWith(expect.objectContaining({id: 9}));
    expect(await screen.findByText('Student dashboard')).toBeInTheDocument();
  });

  it('blocks a password that the backend would reject', async () => {
    renderSignup();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Name'), 'Student One');
    await user.type(screen.getByLabelText('Email'), 'student@example.com');
    await user.type(screen.getByLabelText('Password'), 'passwordonly');
    await user.type(screen.getByLabelText('Verification code'), '123456');

    await user.click(screen.getByRole('button', {name: 'Continue'}));

    expect(await screen.findByText('Password format is invalid.')).toBeInTheDocument();
    expect(mocks.register).not.toHaveBeenCalled();
  });

  it('shows an invalid-code response beside the verification field', async () => {
    mocks.register.mockRejectedValue({
      code: 400,
      details: {code: 'INVALID_VERIFICATION_CODE'},
    });
    renderSignup();
    const user = await fillRegistration();

    await user.click(screen.getByRole('button', {name: 'Continue'}));

    expect(await screen.findByText('Code is incorrect.')).toBeInTheDocument();
  });
});
