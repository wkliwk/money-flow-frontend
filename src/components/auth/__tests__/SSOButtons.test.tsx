import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { darkTheme } from '../../../theme';
import SSOButtons from '../SSOButtons';

jest.mock('../../../services/api', () => ({
  loginWithGoogle: jest.fn(),
  loginWithApple: jest.fn(),
}));

jest.mock('@react-oauth/google', () => ({
  GoogleLogin: ({ onSuccess, onError }: {
    onSuccess: (resp: { credential?: string }) => void;
    onError: () => void;
  }) => (
    <div>
      <button onClick={() => onSuccess({ credential: 'mock-google-token' })}>
        Sign in with Google
      </button>
      <button onClick={onError}>Google Error</button>
    </div>
  ),
}));

jest.mock('react-apple-signin-auth', () => ({
  appleAuthHelpers: {
    signIn: jest.fn(),
  },
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

import { loginWithGoogle, loginWithApple } from '../../../services/api';
import { appleAuthHelpers } from 'react-apple-signin-auth';

const mockedLoginWithGoogle = loginWithGoogle as jest.Mock;
const mockedLoginWithApple = loginWithApple as jest.Mock;
const mockedAppleSignIn = appleAuthHelpers.signIn as jest.Mock;

describe('SSOButtons', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = () =>
    render(
      <ThemeProvider theme={darkTheme}>
        <MemoryRouter>
          <SSOButtons />
        </MemoryRouter>
      </ThemeProvider>
    );

  it('renders Google and Apple sign-in buttons', () => {
    renderComponent();
    expect(screen.getByText(/sign in with google/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in with apple/i })).toBeInTheDocument();
  });

  it('renders divider with "or continue with email"', () => {
    renderComponent();
    expect(screen.getByText(/or continue with email/i)).toBeInTheDocument();
  });

  it('calls loginWithGoogle and navigates on Google success', async () => {
    mockedLoginWithGoogle.mockResolvedValue(undefined);
    renderComponent();
    fireEvent.click(screen.getByText(/sign in with google/i));
    await waitFor(() => expect(mockedLoginWithGoogle).toHaveBeenCalledWith('mock-google-token'));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'));
  });

  it('shows error when Google credential is missing', async () => {
    jest.resetModules();
    const { GoogleLogin } = await import('@react-oauth/google');
    // Simulate onSuccess with no credential
    renderComponent();
    // Trigger error path via Google Error button
    fireEvent.click(screen.getByText('Google Error'));
    await waitFor(() =>
      expect(screen.getByText(/google sign-in was cancelled or failed/i)).toBeInTheDocument()
    );
  });

  it('shows error when loginWithGoogle backend call fails', async () => {
    mockedLoginWithGoogle.mockRejectedValue({
      response: { data: { error: 'Account not allowed' } },
    });
    renderComponent();
    fireEvent.click(screen.getByText(/sign in with google/i));
    await waitFor(() =>
      expect(screen.getByText('Account not allowed')).toBeInTheDocument()
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('calls loginWithApple and navigates on Apple success', async () => {
    mockedAppleSignIn.mockResolvedValue({
      authorization: { id_token: 'mock-apple-token', code: 'mock-code' },
    });
    mockedLoginWithApple.mockResolvedValue(undefined);
    renderComponent();
    fireEvent.click(screen.getByRole('button', { name: /sign in with apple/i }));
    await waitFor(() =>
      expect(mockedLoginWithApple).toHaveBeenCalledWith('mock-apple-token')
    );
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'));
  });

  it('shows error when Apple sign-in returns no token', async () => {
    mockedAppleSignIn.mockResolvedValue({ authorization: { code: 'mock-code' } });
    renderComponent();
    fireEvent.click(screen.getByRole('button', { name: /sign in with apple/i }));
    await waitFor(() =>
      expect(screen.getByText(/apple sign-in failed/i)).toBeInTheDocument()
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows error when loginWithApple backend call fails', async () => {
    mockedAppleSignIn.mockResolvedValue({
      authorization: { id_token: 'mock-apple-token', code: 'mock-code' },
    });
    mockedLoginWithApple.mockRejectedValue({
      response: { data: { error: 'Apple auth rejected' } },
    });
    renderComponent();
    fireEvent.click(screen.getByRole('button', { name: /sign in with apple/i }));
    await waitFor(() =>
      expect(screen.getByText('Apple auth rejected')).toBeInTheDocument()
    );
  });

  it('shows generic error when Apple signIn throws without response', async () => {
    mockedAppleSignIn.mockRejectedValue(new Error('popup closed'));
    renderComponent();
    fireEvent.click(screen.getByRole('button', { name: /sign in with apple/i }));
    await waitFor(() =>
      expect(screen.getByText(/apple sign-in was cancelled or failed/i)).toBeInTheDocument()
    );
  });
});
