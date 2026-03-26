import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import QuickEntryBar from '../QuickEntryBar';
import { TransactionRequest } from '../../../types';

jest.setTimeout(15000);

describe('QuickEntryBar', () => {
  const mockOnSubmit = jest.fn<Promise<void>, [Omit<TransactionRequest, 'owner'>]>(() => Promise.resolve());
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => { mockOnSubmit.mockClear(); mockOnSuccess.mockClear(); mockOnError.mockClear(); });

  test('renders input', () => {
    render(<QuickEntryBar onSubmit={mockOnSubmit} onSuccess={mockOnSuccess} onError={mockOnError} />);
    expect(screen.getByLabelText('Quick expense entry')).toBeInTheDocument();
  });

  test('submits on Enter', async () => {
    render(<QuickEntryBar onSubmit={mockOnSubmit} onSuccess={mockOnSuccess} onError={mockOnError} />);
    const input = screen.getByLabelText('Quick expense entry');
    await act(async () => { fireEvent.change(input, { target: { value: 'lunch 85' } }); });
    await act(async () => { fireEvent.keyDown(input, { key: 'Enter' }); });
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({ description: 'lunch', amount: 85, category: 'Food', type: 'expense' }));
      expect(mockOnSuccess).toHaveBeenCalledWith('Added: lunch $85');
    });
  });

  test('submits on button click', async () => {
    render(<QuickEntryBar onSubmit={mockOnSubmit} onSuccess={mockOnSuccess} onError={mockOnError} />);
    await act(async () => { fireEvent.change(screen.getByLabelText('Quick expense entry'), { target: { value: 'coffee 30' } }); });
    await act(async () => { fireEvent.click(screen.getByLabelText('Submit quick expense')); });
    await waitFor(() => { expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({ description: 'coffee', amount: 30, category: 'Food' })); });
  });

  test('clears input after submit', async () => {
    render(<QuickEntryBar onSubmit={mockOnSubmit} onSuccess={mockOnSuccess} onError={mockOnError} />);
    const input = screen.getByLabelText('Quick expense entry') as HTMLInputElement;
    await act(async () => { fireEvent.change(input, { target: { value: 'lunch 85' } }); });
    await act(async () => { fireEvent.keyDown(input, { key: 'Enter' }); });
    await waitFor(() => { expect(input.value).toBe(''); });
  });

  test('calls onError on failure', async () => {
    mockOnSubmit.mockRejectedValueOnce(new Error('fail'));
    render(<QuickEntryBar onSubmit={mockOnSubmit} onSuccess={mockOnSuccess} onError={mockOnError} />);
    await act(async () => { fireEvent.change(screen.getByLabelText('Quick expense entry'), { target: { value: 'lunch 85' } }); });
    await act(async () => { fireEvent.keyDown(screen.getByLabelText('Quick expense entry'), { key: 'Enter' }); });
    await waitFor(() => { expect(mockOnError).toHaveBeenCalledWith('Failed to add expense'); });
  });

  test('no submit without amount', async () => {
    render(<QuickEntryBar onSubmit={mockOnSubmit} onSuccess={mockOnSuccess} onError={mockOnError} />);
    await act(async () => { fireEvent.change(screen.getByLabelText('Quick expense entry'), { target: { value: 'text' } }); });
    await act(async () => { fireEvent.keyDown(screen.getByLabelText('Quick expense entry'), { key: 'Enter' }); });
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  test('shows preview', async () => {
    render(<QuickEntryBar onSubmit={mockOnSubmit} onSuccess={mockOnSuccess} onError={mockOnError} />);
    await act(async () => { fireEvent.change(screen.getByLabelText('Quick expense entry'), { target: { value: 'taxi 50' } }); });
    await waitFor(() => { expect(screen.getByText(/taxi/)).toBeInTheDocument(); expect(screen.getByText(/Transport/)).toBeInTheDocument(); });
  });
});
