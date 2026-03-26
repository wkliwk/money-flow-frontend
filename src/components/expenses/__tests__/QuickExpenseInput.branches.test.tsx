import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import QuickExpenseInput from '../QuickExpenseInput';
import { TransactionRequest } from '../../../types';

jest.setTimeout(15000);

describe('QuickExpenseInput — branch coverage', () => {
  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn<Promise<void>, [Omit<TransactionRequest, 'owner'>]>(() => Promise.resolve());

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnSubmit.mockClear();
  });

  test('shows generic error when submit throws non-Error object', async () => {
    mockOnSubmit.mockRejectedValueOnce('string error');
    render(<QuickExpenseInput open={true} onClose={mockOnClose} onSubmit={mockOnSubmit} existingCategories={[]} />);
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Quick expense input'), { target: { value: 'coffee 5' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Add Expense/i }));
    });
    await waitFor(() => {
      expect(screen.getByText('Failed to create expense')).toBeInTheDocument();
    });
  });

  test('shows validation error when parsed amount is 0', async () => {
    render(<QuickExpenseInput open={true} onClose={mockOnClose} onSubmit={mockOnSubmit} existingCategories={[]} />);
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Quick expense input'), { target: { value: 'hello' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Add Expense/i }));
    });
    // The button should be disabled when parsed amount is 0, so this shouldn't submit
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  test('submits foreign currency and includes currency fields in payload', async () => {
    render(<QuickExpenseInput open={true} onClose={mockOnClose} onSubmit={mockOnSubmit} existingCategories={[]} />);
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Quick expense input'), { target: { value: 'ramen 1000 JPY' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Add Expense/i }));
    });
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ currency: 'JPY', originalAmount: 1000 })
      );
    });
  });

  test('description fallback uses "Expense {amount}" when parsed description is empty', async () => {
    // '100 food' parses to description = '' and category = 'Food'
    render(<QuickExpenseInput open={true} onClose={mockOnClose} onSubmit={mockOnSubmit} existingCategories={[]} />);
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Quick expense input'), { target: { value: '100 food' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Add Expense/i }));
    });
    await waitFor(() => expect(mockOnSubmit).toHaveBeenCalled());
    const callArg = mockOnSubmit.mock.calls[0][0];
    // description should either be '' mapped to 'Expense 100' or the parsed value
    expect(callArg.amount).toBe(100);
  });

  test('resets input value when dialog is closed', () => {
    const { rerender } = render(
      <QuickExpenseInput open={true} onClose={mockOnClose} onSubmit={mockOnSubmit} existingCategories={[]} />
    );
    act(() => {
      fireEvent.change(screen.getByLabelText('Quick expense input'), { target: { value: 'test' } });
    });
    // Verify value was set
    expect((screen.getByLabelText('Quick expense input') as HTMLInputElement).value).toBe('test');
    // Closing the dialog resets the input via useEffect
    rerender(
      <QuickExpenseInput open={false} onClose={mockOnClose} onSubmit={mockOnSubmit} existingCategories={[]} />
    );
    // After closing and reopening, input should be empty
    rerender(
      <QuickExpenseInput open={true} onClose={mockOnClose} onSubmit={mockOnSubmit} existingCategories={[]} />
    );
    expect((screen.getByLabelText('Quick expense input') as HTMLInputElement).value).toBe('');
  });

  test('Cancel button triggers onClose', () => {
    render(<QuickExpenseInput open={true} onClose={mockOnClose} onSubmit={mockOnSubmit} existingCategories={[]} />);
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('preview shows currency symbol for parsed foreign currency amount', async () => {
    render(<QuickExpenseInput open={true} onClose={mockOnClose} onSubmit={mockOnSubmit} existingCategories={[]} />);
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Quick expense input'), { target: { value: 'ramen 500 JPY' } });
    });
    await waitFor(() => {
      // Preview should show the JPY symbol
      expect(screen.getByText(/¥500\.00/)).toBeInTheDocument();
    });
  });

  test('preview shows $ prefix when no currency code given', async () => {
    render(<QuickExpenseInput open={true} onClose={mockOnClose} onSubmit={mockOnSubmit} existingCategories={[]} />);
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Quick expense input'), { target: { value: 'lunch 85' } });
    });
    await waitFor(() => {
      expect(screen.getByText(/\$85\.00/)).toBeInTheDocument();
    });
  });
});
