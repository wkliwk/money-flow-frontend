import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from './components/auth/LoginPage';

jest.mock('./services/api', () => ({ login: jest.fn(), register: jest.fn() }));

// Unauthenticated users see the login form
test('login page renders email and password fields', () => {
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
});
