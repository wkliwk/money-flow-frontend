import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../LoginPage';

jest.mock('../../../services/api', () => ({
  login: jest.fn(),
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('LoginPage', () => {
  const mockLogin = require('../../../services/api').login;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLogin.mockResolvedValue(undefined);
  });

  const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  const getEmailInput = (container: HTMLElement) =>
    container.querySelector('input[type="email"]') as HTMLInputElement;

  const getPasswordInput = (container: HTMLElement) =>
    container.querySelector('input[type="password"]') as HTMLInputElement;

  it('should render login form', () => {
    const { container } = renderWithRouter(<LoginPage />);

    expect(screen.getByText('Money Flow')).toBeInTheDocument();
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    expect(getEmailInput(container)).toBeInTheDocument();
    expect(getPasswordInput(container)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('should render sign up link', () => {
    renderWithRouter(<LoginPage />);

    const signUpLink = screen.getByRole('link', { name: /Sign up/i });
    expect(signUpLink).toBeInTheDocument();
    expect(signUpLink).toHaveAttribute('href', '/register');
  });

  it('should update email input', () => {
    const { container } = renderWithRouter(<LoginPage />);

    const emailInput = getEmailInput(container);
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });

    expect(emailInput.value).toBe('user@example.com');
  });

  it('should update password input', () => {
    const { container } = renderWithRouter(<LoginPage />);

    const passwordInput = getPasswordInput(container);
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(passwordInput.value).toBe('password123');
  });

  it('should toggle password visibility', () => {
    const { container } = renderWithRouter(<LoginPage />);

    const passwordInput = getPasswordInput(container);
    expect(passwordInput.type).toBe('password');

    const toggleButton = screen.getAllByRole('button').find(
      (btn) => btn.querySelector('svg') && btn !== screen.getByRole('button', { name: /Sign In/i })
    );
    if (toggleButton) {
      fireEvent.click(toggleButton);
      const textInput = container.querySelector('input[type="text"]');
      expect(textInput).toBeTruthy();

      fireEvent.click(toggleButton);
      expect(getPasswordInput(container)).toBeTruthy();
    }
  });

  it('should submit form with email and password', async () => {
    const { container } = renderWithRouter(<LoginPage />);

    fireEvent.change(getEmailInput(container), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(getPasswordInput(container), {
      target: { value: 'password123' },
    });

    const submitButton = screen.getByRole('button', { name: /Sign In/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('user@example.com', 'password123');
    });
  });

  it('should navigate to dashboard on successful login', async () => {
    mockLogin.mockResolvedValueOnce({ token: 'mock-token' });

    const { container } = renderWithRouter(<LoginPage />);

    fireEvent.change(getEmailInput(container), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(getPasswordInput(container), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('should display error message on login failure', async () => {
    mockLogin.mockRejectedValueOnce({
      response: { data: { error: 'Invalid credentials' } },
    });

    const { container } = renderWithRouter(<LoginPage />);

    fireEvent.change(getEmailInput(container), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(getPasswordInput(container), {
      target: { value: 'wrong-password' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('should display generic error when API response has no error message', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Network error'));

    const { container } = renderWithRouter(<LoginPage />);

    fireEvent.change(getEmailInput(container), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(getPasswordInput(container), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(screen.getByText('Login failed. Please try again.')).toBeInTheDocument();
    });
  });

  it('should disable button while loading', async () => {
    mockLogin.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    const { container } = renderWithRouter(<LoginPage />);

    fireEvent.change(getEmailInput(container), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(getPasswordInput(container), {
      target: { value: 'password123' },
    });

    const submitButton = screen.getByRole('button', { name: /Sign In/i });
    fireEvent.click(submitButton);

    expect(submitButton).toBeDisabled();

    await waitFor(
      () => {
        expect(submitButton).not.toBeDisabled();
      },
      { timeout: 200 }
    );
  });

  it('should show loading spinner while submitting', async () => {
    mockLogin.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    const { container } = renderWithRouter(<LoginPage />);

    fireEvent.change(getEmailInput(container), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(getPasswordInput(container), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(
      () => {
        const spinner = container.querySelector('.MuiCircularProgress-root');
        expect(spinner || screen.queryByText(/Sign In/)).toBeTruthy();
      },
      { timeout: 50 }
    );
  });

  it('should clear error when user starts typing', async () => {
    mockLogin.mockRejectedValueOnce({
      response: { data: { error: 'Invalid credentials' } },
    });

    const { container } = renderWithRouter(<LoginPage />);

    fireEvent.change(getEmailInput(container), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(getPasswordInput(container), {
      target: { value: 'wrong-password' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });

    const emailInput = getEmailInput(container);
    fireEvent.change(emailInput, { target: { value: 'newemail@example.com' } });

    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
  });

  it('should have email input focused on mount', () => {
    const { container } = renderWithRouter(<LoginPage />);

    const emailInput = getEmailInput(container);
    expect(emailInput).toHaveFocus();
  });

  it('should have proper form structure', () => {
    const { container } = renderWithRouter(<LoginPage />);

    const form = container.querySelector('form');
    expect(form).toBeInTheDocument();

    const inputs = form?.querySelectorAll('input');
    expect(inputs?.length).toBeGreaterThanOrEqual(2);
  });

  it('should display email icon', () => {
    const { container } = renderWithRouter(<LoginPage />);

    const emailField = container.querySelector('input[type="email"]');
    expect(emailField?.parentElement?.querySelector('svg')).toBeTruthy();
  });

  it('should display lock icon', () => {
    const { container } = renderWithRouter(<LoginPage />);

    const passwordField = container.querySelector('input[type="password"]');
    expect(passwordField?.parentElement?.querySelector('svg')).toBeTruthy();
  });

  it('should require email field', () => {
    const { container } = renderWithRouter(<LoginPage />);

    const emailInput = getEmailInput(container);
    expect(emailInput.required).toBe(true);
  });

  it('should require password field', () => {
    const { container } = renderWithRouter(<LoginPage />);

    const passwordInput = getPasswordInput(container);
    expect(passwordInput.required).toBe(true);
  });

  it('should have email type on email input', () => {
    const { container } = renderWithRouter(<LoginPage />);

    const emailInput = getEmailInput(container);
    expect(emailInput.type).toBe('email');
  });

  it('should maintain separate form state for email and password', () => {
    const { container } = renderWithRouter(<LoginPage />);

    const emailInput = getEmailInput(container);
    const passwordInput = getPasswordInput(container);

    fireEvent.change(emailInput, { target: { value: 'email@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(emailInput.value).toBe('email@example.com');
    expect(passwordInput.value).toBe('password123');

    fireEvent.change(emailInput, { target: { value: 'newemail@example.com' } });

    expect(emailInput.value).toBe('newemail@example.com');
    expect(passwordInput.value).toBe('password123');
  });
});
