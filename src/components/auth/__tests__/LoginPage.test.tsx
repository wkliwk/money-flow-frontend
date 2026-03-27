import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { lightTheme, darkTheme } from '../../../theme';
import LoginPage from '../LoginPage';

jest.mock('../../../services/api', () => ({
  login: jest.fn(),
  loginWithGoogle: jest.fn(),
  loginWithApple: jest.fn(),
}));

jest.mock('../SSOButtons', () => () => <div data-testid="sso-buttons">SSO Buttons</div>);

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

import { login } from '../../../services/api';
const mockedLogin = login as jest.Mock;

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderPage = (theme = darkTheme) =>
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </ThemeProvider>
    );

  it('renders login form', () => {
    renderPage();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows Money Flow heading', () => {
    renderPage();
    expect(screen.getByText('Money Flow')).toBeInTheDocument();
  });

  it('navigates to / on successful login', async () => {
    mockedLogin.mockResolvedValue(undefined);
    renderPage();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'));
  });

  it('shows error message on failed login', async () => {
    mockedLogin.mockRejectedValue({ response: { data: { error: 'Invalid credentials' } } });
    renderPage();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => expect(screen.getByText('Invalid credentials')).toBeInTheDocument());
  });

  it('renders without errors in light theme', () => {
    renderPage(lightTheme);
    expect(screen.getByText('Money Flow')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('renders without errors in dark theme', () => {
    renderPage(darkTheme);
    expect(screen.getByText('Money Flow')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('shows sign up link', () => {
    renderPage();
    expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument();
  });
});
