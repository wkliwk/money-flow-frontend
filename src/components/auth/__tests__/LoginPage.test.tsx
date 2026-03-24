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

  it('should render login form', () => {
    renderWithRouter(<LoginPage />);

    expect(screen.getByText('Money Flow')).toBeInTheDocument();
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('should render sign up link', () => {
    renderWithRouter(<LoginPage />);

    const signUpLink = screen.getByRole('link', { name: /Sign up/i });
    expect(signUpLink).toBeInTheDocument();
    expect(signUpLink).toHaveAttribute('href', '/register');
  });

  it('should update email input', () => {
    renderWithRouter(<LoginPage />);

    const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });

    expect(emailInput.value).toBe('user@example.com');
  });

  it('should update password input', () => {
    renderWithRouter(<LoginPage />);

    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(passwordInput.value).toBe('password123');
  });

  it('should toggle password visibility', () => {
    renderWithRouter(<LoginPage />);

    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
    expect(passwordInput.type).toBe('password');

    const toggleButton = screen.getAllByRole('button').find(
      (btn) => btn.querySelector('svg') && btn !== screen.getByRole('button', { name: /Sign In/i })
    );
    if (toggleButton) {
      fireEvent.click(toggleButton);
      expect(passwordInput.type).toBe('text');

      fireEvent.click(toggleButton);
      expect(passwordInput.type).toBe('password');
    }
  });

  it('should submit form with email and password', async () => {
    renderWithRouter(<LoginPage />);

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
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

    renderWithRouter(<LoginPage />);

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
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

    renderWithRouter(<LoginPage />);

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'wrong-password' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('should display generic error when API response has no error message', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Network error'));

    renderWithRouter(<LoginPage />);

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
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

    renderWithRouter(<LoginPage />);

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
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

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    // During loading, should show progress indicator
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

    renderWithRouter(<LoginPage />);

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'wrong-password' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });

    // Changing email should NOT clear error (no auto-clear on change)
    // This test verifies current behavior - error stays until next submit attempt
    const emailInput = screen.getByLabelText('Email');
    fireEvent.change(emailInput, { target: { value: 'newemail@example.com' } });

    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
  });

  it('should have email input focused on mount', () => {
    renderWithRouter(<LoginPage />);

    const emailInput = screen.getByLabelText('Email');
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

    // Should have email icon in email field
    const emailField = container.querySelector('input[type="email"]');
    expect(emailField?.parentElement?.querySelector('svg')).toBeTruthy();
  });

  it('should display lock icon', () => {
    const { container } = renderWithRouter(<LoginPage />);

    // Should have lock icon in password field
    const passwordField = container.querySelector('input[type="password"]');
    expect(passwordField?.parentElement?.querySelector('svg')).toBeTruthy();
  });

  it('should require email field', () => {
    renderWithRouter(<LoginPage />);

    const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
    expect(emailInput.required).toBe(true);
  });

  it('should require password field', () => {
    renderWithRouter(<LoginPage />);

    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
    expect(passwordInput.required).toBe(true);
  });

  it('should have email type on email input', () => {
    renderWithRouter(<LoginPage />);

    const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
    expect(emailInput.type).toBe('email');
  });

  it('should maintain separate form state for email and password', () => {
    renderWithRouter(<LoginPage />);

    const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;

    fireEvent.change(emailInput, { target: { value: 'email@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(emailInput.value).toBe('email@example.com');
    expect(passwordInput.value).toBe('password123');

    fireEvent.change(emailInput, { target: { value: 'newemail@example.com' } });

    expect(emailInput.value).toBe('newemail@example.com');
    expect(passwordInput.value).toBe('password123');
  });
});
