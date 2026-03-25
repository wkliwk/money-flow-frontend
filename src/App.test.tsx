import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./components/auth/LoginPage', () => () => <div>LoginPage</div>);
jest.mock('./components/auth/RegisterPage', () => () => <div>RegisterPage</div>);
jest.mock('./components/MainLayout', () => () => <div>MainLayout</div>);
jest.mock('./components/common/ProtectedRoute', () => ({ children }: { children: React.ReactElement }) => children);

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(document.body).toBeTruthy();
  });

  it('renders MainLayout on root path', () => {
    render(<App />);
    expect(screen.getByText('MainLayout')).toBeInTheDocument();
  });
});
