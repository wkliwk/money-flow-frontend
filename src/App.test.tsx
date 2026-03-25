import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('./axiosInstance', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  },
}));

jest.mock('./services/auth', () => ({
  getToken: jest.fn(() => null),
  setToken: jest.fn(),
  clearToken: jest.fn(),
  isAuthenticated: jest.fn(() => false),
}));

jest.mock('./services/api', () => ({
  login: jest.fn(),
  register: jest.fn(),
  getExpenses: jest.fn(),
}));

jest.mock('posthog-js', () => ({
  init: jest.fn(),
  capture: jest.fn(),
  identify: jest.fn(),
}));

jest.mock('jspdf', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    addImage: jest.fn(),
    save: jest.fn(),
    setFontSize: jest.fn(),
    text: jest.fn(),
  })),
}));

jest.mock('html2canvas', () => jest.fn().mockResolvedValue({
  toDataURL: jest.fn(() => 'data:image/png;base64,'),
}));

import App from './App';

describe('App', () => {
  it('renders without crashing', () => {
    const { container } = render(<App />);
    expect(container).toBeInTheDocument();
  });

  it('renders the login page by default when unauthenticated', () => {
    render(<App />);
    expect(screen.getByText('Money Flow')).toBeInTheDocument();
  });
});
