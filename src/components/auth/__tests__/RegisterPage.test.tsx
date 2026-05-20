import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RegisterPage from '../RegisterPage';

jest.mock('../../../services/api', () => ({
  register: jest.fn(),
  loginWithGoogle: jest.fn(),
  loginWithApple: jest.fn(),
}));

jest.mock('../SSOButtons', () => () => <div data-testid="sso-buttons">SSO Buttons</div>);

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

import { register } from '../../../services/api';
const mockedRegister = register as jest.Mock;

describe('RegisterPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderPage = () =>
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

  it('renders registration form', () => {
    renderPage();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('shows MoneyFlow heading', () => {
    renderPage();
    expect(screen.getByText('MoneyFlow')).toBeInTheDocument();
  });

  it('navigates to / on successful registration', async () => {
    mockedRegister.mockResolvedValue(undefined);
    renderPage();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'));
  });

  it('shows error message on failed registration', async () => {
    mockedRegister.mockRejectedValue({ response: { data: { error: 'Email already exists' } } });
    renderPage();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => expect(screen.getByText('Email already exists')).toBeInTheDocument());
  });
});
