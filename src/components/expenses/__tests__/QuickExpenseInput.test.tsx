import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import QuickExpenseInput from '../QuickExpenseInput';
import { TransactionRequest } from '../../../types';

describe('QuickExpenseInput', () => {
  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn<Promise<void>, [Omit<TransactionRequest, 'owner'>]>(() =>
    Promise.resolve()
  );
  const existingCategories = ['groceries', 'entertainment', 'food'];

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnSubmit.mockClear();
  });

  test('renders dialog when open', () => {
    render(
      <QuickExpenseInput
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        existingCategories={existingCategories}
      />
    );

    expect(screen.getByText('Quick Expense')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e.g. coffee 5 usd/)).toBeInTheDocument();
  });

  test('does not render when closed', () => {
    const { container } = render(
      <QuickExpenseInput
        open={false}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        existingCategories={existingCategories}
      />
    );

    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });

  test('submits expense with parsed data', async () => {
    render(
      <QuickExpenseInput
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        existingCategories={existingCategories}
      />
    );

    const input = screen.getByPlaceholderText(/e.g. coffee 5 usd/);
    await act(async () => {
      fireEvent.change(input, { target: { value: 'coffee 5' } });
    });

    const button = screen.getByRole('button', { name: /Add Expense/i });
    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          item: 'coffee',
          amount: 5,
          category: 'food',
          description: 'coffee',
        })
      );
    });
  }, 15000);

  test('closes dialog after successful submit', async () => {
    render(
      <QuickExpenseInput
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        existingCategories={existingCategories}
      />
    );

    const input = screen.getByPlaceholderText(/e.g. coffee 5 usd/);
    await act(async () => {
      fireEvent.change(input, { target: { value: 'lunch 12.50' } });
    });

    const button = screen.getByRole('button', { name: /Add Expense/i });
    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  }, 15000);

  test('submits with Enter key', async () => {
    render(
      <QuickExpenseInput
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        existingCategories={existingCategories}
      />
    );

    const input = screen.getByPlaceholderText(/e.g. coffee 5 usd/);
    await act(async () => {
      fireEvent.change(input, { target: { value: 'groceries 45' } });
    });
    await act(async () => {
      fireEvent.keyDown(input, { key: 'Enter' });
    });

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          item: 'groceries',
          amount: 45,
          category: 'groceries',
        })
      );
    });
  }, 15000);

  test('closes dialog with Escape key', async () => {
    render(
      <QuickExpenseInput
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        existingCategories={existingCategories}
      />
    );

    const input = screen.getByPlaceholderText(/e.g. coffee 5 usd/);
    await act(async () => {
      fireEvent.keyDown(input, { key: 'Escape' });
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('shows preview of parsed expense', async () => {
    render(
      <QuickExpenseInput
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        existingCategories={existingCategories}
      />
    );

    const input = screen.getByPlaceholderText(/e.g. coffee 5 usd/);
    await act(async () => {
      fireEvent.change(input, { target: { value: 'taxi 15.50' } });
    });

    await waitFor(() => {
      expect(screen.getByText('Preview:')).toBeInTheDocument();
    });
    // Item name is inside a <strong> tag
    expect(screen.getByText('taxi')).toBeInTheDocument();
    // Amount is rendered as "$15.50" but split across text nodes, so use container text
    expect(screen.getByText(/15\.50/)).toBeInTheDocument();
    expect(screen.getByText('transport')).toBeInTheDocument();
  });

  test('disables submit button for invalid amount', () => {
    render(
      <QuickExpenseInput
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        existingCategories={existingCategories}
      />
    );

    const button = screen.getByRole('button', { name: /Add Expense/i });
    expect(button).toBeDisabled();
  });

  test('handles submit error gracefully', async () => {
    const error = new Error('API Error');
    mockOnSubmit.mockRejectedValueOnce(error);

    render(
      <QuickExpenseInput
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        existingCategories={existingCategories}
      />
    );

    const input = screen.getByPlaceholderText(/e.g. coffee 5 usd/);
    await act(async () => {
      fireEvent.change(input, { target: { value: 'coffee 5' } });
    });

    const button = screen.getByRole('button', { name: /Add Expense/i });
    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });

    // Dialog should stay open on error
    expect(mockOnClose).not.toHaveBeenCalled();
  }, 15000);
});
