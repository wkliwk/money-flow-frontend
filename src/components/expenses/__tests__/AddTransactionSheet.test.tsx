import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import AddTransactionSheet from '../AddTransactionSheet';

const defaultProps = {
  open: true,
  onClose: jest.fn(),
  onSubmit: jest.fn().mockResolvedValue(undefined),
  existingCategories: [],
};

jest.setTimeout(15000);

describe('AddTransactionSheet', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders header with Cancel, title and Save', () => {
    render(<AddTransactionSheet {...defaultProps} />);
    expect(screen.getByText('Add transaction')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /cancel/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /save/i }).length).toBeGreaterThan(0);
  });

  it('does not render when closed', () => {
    render(<AddTransactionSheet {...defaultProps} open={false} />);
    expect(screen.queryByText('Add transaction')).not.toBeInTheDocument();
  });

  it('autofocuses the amount input on open', async () => {
    render(<AddTransactionSheet {...defaultProps} />);
    const amountInput = screen.getByLabelText('Amount') as HTMLInputElement;
    await waitFor(() => {
      expect(document.activeElement).toBe(amountInput);
    });
  });

  it('disables Save when invalid (amount missing or category missing)', () => {
    render(<AddTransactionSheet {...defaultProps} />);
    const saveButtons = screen.getAllByRole('button', { name: /^save$/i });
    saveButtons.forEach((btn) => expect(btn).toBeDisabled());
  });

  it('shows inline error when amount is zero', () => {
    render(<AddTransactionSheet {...defaultProps} />);
    const amountInput = screen.getByLabelText('Amount');
    fireEvent.change(amountInput, { target: { value: '0' } });
    fireEvent.blur(amountInput);
    expect(screen.getByText('Amount must be greater than 0')).toBeInTheDocument();
  });

  it('shows inline error when amount is empty after blur', () => {
    render(<AddTransactionSheet {...defaultProps} />);
    const amountInput = screen.getByLabelText('Amount');
    fireEvent.blur(amountInput);
    expect(screen.getByText('Amount is required')).toBeInTheDocument();
  });

  it('enables Save when amount > 0 and category set', () => {
    render(<AddTransactionSheet {...defaultProps} />);
    const amountInput = screen.getByLabelText('Amount');
    fireEvent.change(amountInput, { target: { value: '12.50' } });
    const categorySelect = screen.getByLabelText('Category');
    fireEvent.change(categorySelect, { target: { value: 'Food & Drink' } });

    const saveButtons = screen.getAllByRole('button', { name: /^save$/i });
    // At least one Save button should be enabled
    expect(saveButtons.some((b) => !(b as HTMLButtonElement).disabled)).toBe(true);
  });

  it('calls onSubmit with parsed data on Save and closes', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const onClose = jest.fn();
    render(<AddTransactionSheet {...defaultProps} onSubmit={onSubmit} onClose={onClose} />);

    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '42.5' } });
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'Transport' } });

    const enabledSave = screen
      .getAllByRole('button', { name: /^save$/i })
      .find((b) => !(b as HTMLButtonElement).disabled)!;
    await act(async () => {
      fireEvent.click(enabledSave);
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const data = onSubmit.mock.calls[0][0];
    expect(data.amount).toBe(42.5);
    expect(data.category).toBe('Transport');
    expect(data.type).toBe('expense');
    expect(data.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('switches to income via toggle', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    render(<AddTransactionSheet {...defaultProps} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: /income/i }));
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'Salary' } });

    const enabledSave = screen
      .getAllByRole('button', { name: /^save$/i })
      .find((b) => !(b as HTMLButtonElement).disabled)!;
    await act(async () => {
      fireEvent.click(enabledSave);
    });

    expect(onSubmit.mock.calls[0][0].type).toBe('income');
  });

  it('shows submit error on failure (no rollback close)', async () => {
    const onSubmit = jest.fn().mockRejectedValue({ response: { data: { error: 'Server boom' } } });
    const onClose = jest.fn();
    render(<AddTransactionSheet {...defaultProps} onSubmit={onSubmit} onClose={onClose} />);

    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'Food & Drink' } });

    const enabledSave = screen
      .getAllByRole('button', { name: /^save$/i })
      .find((b) => !(b as HTMLButtonElement).disabled)!;
    await act(async () => {
      fireEvent.click(enabledSave);
    });

    await waitFor(() => expect(screen.getByText('Server boom')).toBeInTheDocument());
    expect(onClose).not.toHaveBeenCalled();
  });

  it('amount input uses inputMode=decimal', () => {
    render(<AddTransactionSheet {...defaultProps} />);
    const amountInput = screen.getByLabelText('Amount') as HTMLInputElement;
    expect(amountInput.getAttribute('inputmode')).toBe('decimal');
  });

  it('rejects non-numeric input in amount', () => {
    render(<AddTransactionSheet {...defaultProps} />);
    const amountInput = screen.getByLabelText('Amount') as HTMLInputElement;
    fireEvent.change(amountInput, { target: { value: 'abc1.2.3' } });
    expect(amountInput.value).toBe('1.23');
  });
});
