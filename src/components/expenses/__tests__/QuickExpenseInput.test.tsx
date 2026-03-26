import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import QuickExpenseInput from '../QuickExpenseInput';
import { TransactionRequest } from '../../../types';

jest.setTimeout(15000);

describe('QuickExpenseInput', () => {
  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn<Promise<void>, [Omit<TransactionRequest, 'owner'>]>(() => Promise.resolve());
  beforeEach(() => { mockOnClose.mockClear(); mockOnSubmit.mockClear(); });

  test('renders when open', () => {
    render(<QuickExpenseInput open={true} onClose={mockOnClose} onSubmit={mockOnSubmit} existingCategories={[]} />);
    expect(screen.getByText('Quick Expense')).toBeInTheDocument();
    expect(screen.getByLabelText('Quick expense input')).toBeInTheDocument();
  });

  test('hidden when closed', () => {
    const { container } = render(<QuickExpenseInput open={false} onClose={mockOnClose} onSubmit={mockOnSubmit} existingCategories={[]} />);
    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });

  test('submits parsed data', async () => {
    render(<QuickExpenseInput open={true} onClose={mockOnClose} onSubmit={mockOnSubmit} existingCategories={[]} />);
    await act(async () => { fireEvent.change(screen.getByLabelText('Quick expense input'), { target: { value: 'coffee 5' } }); });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Add Expense/i })); });
    await waitFor(() => { expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({ description: 'coffee', amount: 5, category: 'Food', type: 'expense' })); });
  });

  test('closes after submit', async () => {
    render(<QuickExpenseInput open={true} onClose={mockOnClose} onSubmit={mockOnSubmit} existingCategories={[]} />);
    await act(async () => { fireEvent.change(screen.getByLabelText('Quick expense input'), { target: { value: 'lunch 85' } }); });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Add Expense/i })); });
    await waitFor(() => { expect(mockOnClose).toHaveBeenCalled(); });
  });

  test('Enter key submits', async () => {
    render(<QuickExpenseInput open={true} onClose={mockOnClose} onSubmit={mockOnSubmit} existingCategories={[]} />);
    await act(async () => { fireEvent.change(screen.getByLabelText('Quick expense input'), { target: { value: 'MTR 500 transport' } }); });
    await act(async () => { fireEvent.keyDown(screen.getByLabelText('Quick expense input'), { key: 'Enter' }); });
    await waitFor(() => { expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({ description: 'MTR', amount: 500, category: 'Transport' })); });
  });

  test('Escape closes', async () => {
    render(<QuickExpenseInput open={true} onClose={mockOnClose} onSubmit={mockOnSubmit} existingCategories={[]} />);
    await act(async () => { fireEvent.keyDown(screen.getByLabelText('Quick expense input'), { key: 'Escape' }); });
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('shows preview', async () => {
    render(<QuickExpenseInput open={true} onClose={mockOnClose} onSubmit={mockOnSubmit} existingCategories={[]} />);
    await act(async () => { fireEvent.change(screen.getByLabelText('Quick expense input'), { target: { value: 'taxi 15.50' } }); });
    await waitFor(() => { expect(screen.getByText('taxi')).toBeInTheDocument(); expect(screen.getByText(/15\.50/)).toBeInTheDocument(); expect(screen.getByText(/Transport/)).toBeInTheDocument(); });
  });

  test('disabled for empty', () => {
    render(<QuickExpenseInput open={true} onClose={mockOnClose} onSubmit={mockOnSubmit} existingCategories={[]} />);
    expect(screen.getByRole('button', { name: /Add Expense/i })).toBeDisabled();
  });

  test('handles error', async () => {
    mockOnSubmit.mockRejectedValueOnce(new Error('API Error'));
    render(<QuickExpenseInput open={true} onClose={mockOnClose} onSubmit={mockOnSubmit} existingCategories={[]} />);
    await act(async () => { fireEvent.change(screen.getByLabelText('Quick expense input'), { target: { value: 'coffee 5' } }); });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Add Expense/i })); });
    await waitFor(() => { expect(screen.getByText('API Error')).toBeInTheDocument(); });
    expect(mockOnClose).not.toHaveBeenCalled();
  });
});
