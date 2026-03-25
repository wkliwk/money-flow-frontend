import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../LoginPage';

// Mock the API module
jest.mock('../../../services/api', () => ({
  login: jest.fn(),
}));

// Mock react-router navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

import { login } from '../../../services/api';
const mockLogin = login as jest.MockedFunction<typeof login>;

function renderLogin() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders email field, password field, and submit button', () => {
    renderLogin();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('navigates to / on successful login', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    renderLogin();

    await userEvent.type(screen.getByLabelText(/email/i), 'user@test.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('user@test.com', 'password123');
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('shows error message on failed login', async () => {
    mockLogin.mockRejectedValueOnce({
      response: { data: { error: 'Invalid email or password' } },
    });
    renderLogin();

    await userEvent.type(screen.getByLabelText(/email/i), 'user@test.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows fallback error when server returns no message', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Network error'));
    renderLogin();

    await userEvent.type(screen.getByLabelText(/email/i), 'user@test.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'pass');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/login failed/i)).toBeInTheDocument();
    });
  });
});
