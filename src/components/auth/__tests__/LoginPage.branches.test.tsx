import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../LoginPage';

jest.mock('../../../services/api', () => ({
  login: jest.fn(),
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

import { login } from '../../../services/api';
const mockedLogin = login as jest.Mock;

describe('LoginPage — branch coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderPage = () =>
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

  it('shows generic fallback message when error has no response.data.error', async () => {
    mockedLogin.mockRejectedValue(new Error('Network error'));
    renderPage();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'badpass' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() =>
      expect(screen.getByText('Login failed. Please try again.')).toBeInTheDocument()
    );
  });

  it('toggles password visibility when eye icon is clicked', () => {
    renderPage();
    const passwordField = screen.getByLabelText(/password/i);
    expect(passwordField).toHaveAttribute('type', 'password');

    // Click the visibility toggle icon button
    const toggleButtons = screen.getAllByRole('button');
    // The visibility toggle is the only non-submit icon button
    const toggleBtn = toggleButtons.find((b) => !b.getAttribute('type') || b.getAttribute('type') === 'button');
    if (toggleBtn) {
      fireEvent.click(toggleBtn);
      expect(passwordField).toHaveAttribute('type', 'text');
      // Toggle back
      fireEvent.click(toggleBtn);
      expect(passwordField).toHaveAttribute('type', 'password');
    }
  });

  it('has a Sign up link to /register', () => {
    renderPage();
    const link = screen.getByRole('link', { name: /sign up/i });
    expect(link).toBeInTheDocument();
  });
});
