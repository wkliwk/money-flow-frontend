import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import NlpInput from '../NlpInput';
import * as api from '../../../services/api';

jest.mock('../../../services/api', () => ({
  parseTransactionText: jest.fn(),
}));

const mockedParse = api.parseTransactionText as jest.MockedFunction<typeof api.parseTransactionText>;

const typeAndSubmit = async (value: string) => {
  const input = screen.getByPlaceholderText(/Quick Entry|今日同Casey|食咗麥當勞/i);
  await act(async () => { fireEvent.change(input, { target: { value } }); });
  await act(async () => { fireEvent.keyDown(input, { key: 'Enter' }); });
};

describe('NlpInput error handling', () => {
  const mockOnParsed = jest.fn();

  beforeEach(() => {
    mockOnParsed.mockClear();
    mockedParse.mockReset();
  });

  test('shows server error message when API returns an error string', async () => {
    mockedParse.mockRejectedValueOnce({
      response: { status: 400, data: { error: 'Amount is required' } },
    });
    render(<NlpInput onParsed={mockOnParsed} />);
    await typeAndSubmit('garbage');
    await waitFor(() => {
      expect(screen.getByText('Amount is required')).toBeInTheDocument();
    });
    expect(mockOnParsed).not.toHaveBeenCalled();
  });

  test('shows session expired message on 401', async () => {
    mockedParse.mockRejectedValueOnce({ response: { status: 401, data: {} } });
    render(<NlpInput onParsed={mockOnParsed} />);
    await typeAndSubmit('coffee 30');
    await waitFor(() => {
      expect(screen.getByText(/Session expired/i)).toBeInTheDocument();
    });
  });

  test('shows network error message on Network Error', async () => {
    mockedParse.mockRejectedValueOnce(Object.assign(new Error('Network Error'), {}));
    render(<NlpInput onParsed={mockOnParsed} />);
    await typeAndSubmit('lunch 50');
    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });
  });

  test('shows rate-limit message on 429', async () => {
    mockedParse.mockRejectedValueOnce({ response: { status: 429, data: {} } });
    render(<NlpInput onParsed={mockOnParsed} />);
    await typeAndSubmit('tea 20');
    await waitFor(() => {
      expect(screen.getByText(/Too many requests/i)).toBeInTheDocument();
    });
  });

  test('falls back to generic message when no info available', async () => {
    mockedParse.mockRejectedValueOnce({});
    render(<NlpInput onParsed={mockOnParsed} />);
    await typeAndSubmit('xxx');
    await waitFor(() => {
      expect(screen.getByText(/Could not parse/i)).toBeInTheDocument();
    });
  });
});
