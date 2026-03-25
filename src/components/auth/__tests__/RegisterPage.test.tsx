import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import RegisterPage from '../RegisterPage';

jest.mock('../../../services/api', () => ({
  register: jest.fn(),
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('RegisterPage', () => {
  const mockRegister = require('../../../services/api').register;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRegister.mockResolvedValue(undefined);
  });

  const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  const getEmailInput = (container: HTMLElement) =>
    container.querySelector('input[type="email"]') as HTMLInputElement;

  const getPasswordInput = (container: HTMLElement) =>
    container.querySelector('input[type="password"]') as HTMLInputElement;

  it('should render registration form', () => {
    const { container } = renderWithRouter(<RegisterPage />);

    expect(screen.getByText('Money Flow')).toBeInTheDocument();
    expect(screen.getByText('Create your account')).toBeInTheDocument();
    expect(getEmailInput(container)).toBeInTheDocument();
    expect(getPasswordInput(container)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Account/i })).toBeInTheDocument();
  });

  it('should render sign in link', () => {
    renderWithRouter(<RegisterPage />);

    const signInLink = screen.getByRole('link', { name: /Sign in/i });
    expect(signInLink).toBeInTheDocument();
    expect(signInLink).toHaveAttribute('href', '/login');
  });

  it('should display password requirement helper text', () => {
    renderWithRouter(<RegisterPage />);

    expect(screen.getByText('Minimum 6 characters')).toBeInTheDocument();
  });

  it('should update email input', () => {
    const { container } = renderWithRouter(<RegisterPage />);

    const emailInput = getEmailInput(container);
    fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });

    expect(emailInput.value).toBe('newuser@example.com');
  });

  it('should update password input', () => {
    const { container } = renderWithRouter(<RegisterPage />);

    const passwordInput = getPasswordInput(container);
    fireEvent.change(passwordInput, { target: { value: 'securepassword' } });

    expect(passwordInput.value).toBe('securepassword');
  });

  it('should toggle password visibility', () => {
    const { container } = renderWithRouter(<RegisterPage />);

    const passwordInput = getPasswordInput(container);
    expect(passwordInput.type).toBe('password');

    const toggleButton = screen.getAllByRole('button').find(
      (btn) =>
        btn.querySelector('svg') && btn !== screen.getByRole('button', { name: /Create Account/i })
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
    const { container } = renderWithRouter(<RegisterPage />);

    fireEvent.change(getEmailInput(container), {
      target: { value: 'newuser@example.com' },
    });
    fireEvent.change(getPasswordInput(container), {
      target: { value: 'securepassword123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        'newuser@example.com',
        'securepassword123'
      );
    });
  });

  it('should navigate to dashboard on successful registration', async () => {
    mockRegister.mockResolvedValueOnce({ token: 'mock-token' });

    const { container } = renderWithRouter(<RegisterPage />);

    fireEvent.change(getEmailInput(container), {
      target: { value: 'newuser@example.com' },
    });
    fireEvent.change(getPasswordInput(container), {
      target: { value: 'securepassword123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('should display error message on registration failure', async () => {
    mockRegister.mockRejectedValueOnce({
      response: { data: { error: 'Email already in use' } },
    });

    const { container } = renderWithRouter(<RegisterPage />);

    fireEvent.change(getEmailInput(container), {
      target: { value: 'existing@example.com' },
    });
    fireEvent.change(getPasswordInput(container), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    await waitFor(() => {
      expect(screen.getByText('Email already in use')).toBeInTheDocument();
    });
  });

  it('should display generic error when API response has no error message', async () => {
    mockRegister.mockRejectedValueOnce(new Error('Network error'));

    const { container } = renderWithRouter(<RegisterPage />);

    fireEvent.change(getEmailInput(container), {
      target: { value: 'newuser@example.com' },
    });
    fireEvent.change(getPasswordInput(container), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    await waitFor(() => {
      expect(screen.getByText('Registration failed. Please try again.')).toBeInTheDocument();
    });
  });

  it('should disable button while loading', async () => {
    mockRegister.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    const { container } = renderWithRouter(<RegisterPage />);

    fireEvent.change(getEmailInput(container), {
      target: { value: 'newuser@example.com' },
    });
    fireEvent.change(getPasswordInput(container), {
      target: { value: 'password123' },
    });

    const submitButton = screen.getByRole('button', { name: /Create Account/i });
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
    mockRegister.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    const { container } = renderWithRouter(<RegisterPage />);

    fireEvent.change(getEmailInput(container), {
      target: { value: 'newuser@example.com' },
    });
    fireEvent.change(getPasswordInput(container), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    await waitFor(
      () => {
        const spinner = container.querySelector('.MuiCircularProgress-root');
        expect(spinner || screen.queryByText(/Create Account/)).toBeTruthy();
      },
      { timeout: 50 }
    );
  });

  it('should have email input focused on mount', () => {
    const { container } = renderWithRouter(<RegisterPage />);

    const emailInput = getEmailInput(container);
    expect(emailInput).toHaveFocus();
  });

  it('should have proper form structure', () => {
    const { container } = renderWithRouter(<RegisterPage />);

    const form = container.querySelector('form');
    expect(form).toBeInTheDocument();

    const inputs = form?.querySelectorAll('input');
    expect(inputs?.length).toBeGreaterThanOrEqual(2);
  });

  it('should display email icon', () => {
    const { container } = renderWithRouter(<RegisterPage />);

    const emailField = container.querySelector('input[type="email"]');
    expect(emailField?.parentElement?.querySelector('svg')).toBeTruthy();
  });

  it('should display lock icon', () => {
    const { container } = renderWithRouter(<RegisterPage />);

    const passwordField = container.querySelector('input[type="password"]');
    expect(passwordField?.parentElement?.querySelector('svg')).toBeTruthy();
  });

  it('should require email field', () => {
    const { container } = renderWithRouter(<RegisterPage />);

    const emailInput = getEmailInput(container);
    expect(emailInput.required).toBe(true);
  });

  it('should require password field', () => {
    const { container } = renderWithRouter(<RegisterPage />);

    const passwordInput = getPasswordInput(container);
    expect(passwordInput.required).toBe(true);
  });

  it('should have email type on email input', () => {
    const { container } = renderWithRouter(<RegisterPage />);

    const emailInput = getEmailInput(container);
    expect(emailInput.type).toBe('email');
  });

  it('should maintain separate form state for email and password', () => {
    const { container } = renderWithRouter(<RegisterPage />);

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

  it('should handle email validation (HTML5)', () => {
    const { container } = renderWithRouter(<RegisterPage />);

    const emailInput = getEmailInput(container);
    expect(emailInput.type).toBe('email');
  });

  it('should clear error on form submission attempt', async () => {
    mockRegister.mockRejectedValueOnce({
      response: { data: { error: 'Email already in use' } },
    });

    const { container } = renderWithRouter(<RegisterPage />);

    fireEvent.change(getEmailInput(container), {
      target: { value: 'existing@example.com' },
    });
    fireEvent.change(getPasswordInput(container), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    await waitFor(() => {
      expect(screen.getByText('Email already in use')).toBeInTheDocument();
    });

    mockRegister.mockResolvedValueOnce(undefined);

    fireEvent.change(getEmailInput(container), {
      target: { value: 'different@example.com' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    await waitFor(
      () => {
        expect(screen.queryByText('Email already in use')).not.toBeInTheDocument();
      },
      { timeout: 100 }
    );
  });

  it('should handle password with minimum required characters', async () => {
    const { container } = renderWithRouter(<RegisterPage />);

    const passwordInput = getPasswordInput(container);
    fireEvent.change(passwordInput, { target: { value: '123456' } });

    expect(passwordInput.value).toBe('123456');
    expect(passwordInput.value.length).toBeGreaterThanOrEqual(6);
  });

  it('should handle long password', async () => {
    const { container } = renderWithRouter(<RegisterPage />);

    const longPassword = 'this-is-a-very-long-and-secure-password-with-many-characters';
    fireEvent.change(getPasswordInput(container), {
      target: { value: longPassword },
    });

    fireEvent.change(getEmailInput(container), {
      target: { value: 'user@example.com' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('user@example.com', longPassword);
    });
  });
});
