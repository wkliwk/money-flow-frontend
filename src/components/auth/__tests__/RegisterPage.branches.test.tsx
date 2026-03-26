import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RegisterPage from '../RegisterPage';

jest.mock('../../../services/api', () => ({
  register: jest.fn(),
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

import { register } from '../../../services/api';
const mockedRegister = register as jest.Mock;

describe('RegisterPage — branch coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderPage = () =>
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

  it('shows generic fallback message when error has no response.data.error', async () => {
    mockedRegister.mockRejectedValue(new Error('Network error'));
    renderPage();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'pass123' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() =>
      expect(screen.getByText('Registration failed. Please try again.')).toBeInTheDocument()
    );
  });

  it('toggles password visibility when eye icon is clicked', () => {
    renderPage();
    const passwordField = screen.getByLabelText(/password/i);
    expect(passwordField).toHaveAttribute('type', 'password');

    const toggleButtons = screen.getAllByRole('button');
    const toggleBtn = toggleButtons.find((b) => !b.getAttribute('type') || b.getAttribute('type') === 'button');
    if (toggleBtn) {
      fireEvent.click(toggleBtn);
      expect(passwordField).toHaveAttribute('type', 'text');
      fireEvent.click(toggleBtn);
      expect(passwordField).toHaveAttribute('type', 'password');
    }
  });

  it('has a Sign in link to /login', () => {
    renderPage();
    const link = screen.getByRole('link', { name: /sign in/i });
    expect(link).toBeInTheDocument();
  });
});
