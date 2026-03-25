import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    const user = userEvent.setup();

    render(
      <QuickExpenseInput
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        existingCategories={existingCategories}
      />
    );

    const input = screen.getByPlaceholderText(/e.g. coffee 5 usd/);
    await user.type(input, 'coffee 5');

    const button = screen.getByRole('button', { name: /Add Expense/i });
    await user.click(button);

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
  });

  test('closes dialog after successful submit', async () => {
    const user = userEvent.setup();

    render(
      <QuickExpenseInput
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        existingCategories={existingCategories}
      />
    );

    const input = screen.getByPlaceholderText(/e.g. coffee 5 usd/);
    await user.type(input, 'lunch 12.50');

    const button = screen.getByRole('button', { name: /Add Expense/i });
    await user.click(button);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  test('submits with Enter key', async () => {
    const user = userEvent.setup();

    render(
      <QuickExpenseInput
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        existingCategories={existingCategories}
      />
    );

    const input = screen.getByPlaceholderText(/e.g. coffee 5 usd/);
    await user.type(input, 'groceries 45');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          item: 'groceries',
          amount: 45,
          category: 'groceries',
        })
      );
    });
  });

  test('closes dialog with Escape key', async () => {
    const user = userEvent.setup();

    render(
      <QuickExpenseInput
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        existingCategories={existingCategories}
      />
    );

    const input = screen.getByPlaceholderText(/e.g. coffee 5 usd/);
    await user.click(input);
    await user.keyboard('{Escape}');

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('shows preview of parsed expense', async () => {
    const user = userEvent.setup();

    render(
      <QuickExpenseInput
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        existingCategories={existingCategories}
      />
    );

    const input = screen.getByPlaceholderText(/e.g. coffee 5 usd/);
    await user.type(input, 'taxi 15.50');

    expect(screen.getByText('taxi')).toBeInTheDocument();
    expect(screen.getByText('$15.50')).toBeInTheDocument();
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
    const user = userEvent.setup();
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
    await user.type(input, 'coffee 5');

    const button = screen.getByRole('button', { name: /Add Expense/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });

    // Dialog should stay open on error
    expect(mockOnClose).not.toHaveBeenCalled();
  });
});
