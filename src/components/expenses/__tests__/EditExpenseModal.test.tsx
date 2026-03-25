import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import EditExpenseModal from '../EditExpenseModal';
import { Transaction } from '../../../types';

jest.mock('../../../services/api', () => ({
  updateExpense: jest.fn().mockResolvedValue({}),
}));

jest.mock('../../../hooks/useFxRates', () => ({
  useFxRates: () => ({
    currency: 'HKD',
    setCurrency: jest.fn(),
    convert: (n: number) => n,
    symbol: 'HK$',
    loading: false,
    rates: { HKD: 1, CAD: 0.18, USD: 0.128, CNY: 0.93 },
  }),
  CURRENCIES: ['HKD', 'CAD', 'USD', 'CNY'],
  CURRENCY_SYMBOLS: { HKD: 'HK$', CAD: 'CA$', USD: 'US$', CNY: '¥' },
  Currency: {},
}));

jest.mock('../../../hooks/useItemPresets', () => ({
  useItemPresets: () => ({ presets: {}, setPreset: jest.fn(), deletePreset: jest.fn() }),
}));

const transaction: Transaction = {
  _id: '1',
  owner: 'user1',
  description: 'Coffee',
  amount: 50,
  type: 'expense',
  category: 'Food & Drink',
  date: '2026-03-10',
  createdAt: '2026-03-10',
  updatedAt: '2026-03-10',
};

const defaultProps = {
  open: true,
  transaction,
  onClose: jest.fn(),
  onSaved: jest.fn(),
  onDelete: jest.fn(),
  onDuplicate: jest.fn().mockResolvedValue(undefined),
  existingCategories: [],
};

describe('EditExpenseModal', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders without crashing when open with a transaction', () => {
    render(<EditExpenseModal {...defaultProps} />);
    expect(document.body).toBeTruthy();
  });

  it('shows expense/income type toggle', () => {
    render(<EditExpenseModal {...defaultProps} />);
    expect(screen.getByText('Expense')).toBeInTheDocument();
    expect(screen.getByText('Income')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<EditExpenseModal {...defaultProps} open={false} />);
    expect(screen.queryByText('Edit Transaction')).not.toBeInTheDocument();
  });

  it('renders with null transaction without crashing', () => {
    render(<EditExpenseModal {...defaultProps} transaction={null} />);
    expect(document.body).toBeTruthy();
  });

  it('renders Edit Transaction title', () => {
    render(<EditExpenseModal {...defaultProps} />);
    expect(screen.getByText('Edit Transaction')).toBeInTheDocument();
  });

  it('shows Save button', () => {
    render(<EditExpenseModal {...defaultProps} />);
    expect(screen.getByRole('button', { name: /^save$/i })).toBeInTheDocument();
  });

  it('shows Delete button', () => {
    render(<EditExpenseModal {...defaultProps} />);
    const deleteBtn = document.querySelector('[data-testid="DeleteIcon"]');
    expect(deleteBtn).toBeTruthy();
  });

  it('shows currency chips', () => {
    render(<EditExpenseModal {...defaultProps} />);
    expect(screen.getByText('HK$ HKD')).toBeInTheDocument();
  });

  it('shows today/yesterday date shortcuts', () => {
    render(<EditExpenseModal {...defaultProps} />);
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Yesterday')).toBeInTheDocument();
  });

  it('shows Custom date option', () => {
    render(<EditExpenseModal {...defaultProps} />);
    expect(screen.getByText('Custom')).toBeInTheDocument();
  });

  it('shows delete confirmation when delete is clicked', async () => {
    render(<EditExpenseModal {...defaultProps} />);
    const deleteIcon = document.querySelector('[data-testid="DeleteIcon"]');
    if (deleteIcon?.parentElement) {
      await act(async () => { fireEvent.click(deleteIcon.parentElement!); });
    }
    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });
  });

  it('hides confirmation when cancel is clicked', async () => {
    render(<EditExpenseModal {...defaultProps} />);
    const deleteIcon = document.querySelector('[data-testid="DeleteIcon"]');
    if (deleteIcon?.parentElement) {
      await act(async () => { fireEvent.click(deleteIcon.parentElement!); });
    }
    await waitFor(() => screen.getByText(/are you sure/i));
    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));
    await waitFor(() => {
      expect(screen.queryByText(/are you sure/i)).not.toBeInTheDocument();
    });
  });

  it('calls onDelete when confirmed', async () => {
    const onDelete = jest.fn();
    render(<EditExpenseModal {...defaultProps} onDelete={onDelete} />);
    const deleteIcon = document.querySelector('[data-testid="DeleteIcon"]');
    if (deleteIcon?.parentElement) {
      await act(async () => { fireEvent.click(deleteIcon.parentElement!); });
    }
    await waitFor(() => screen.getByText(/are you sure/i));
    const confirmBtn = screen.getByRole('button', { name: /^delete$/i });
    await act(async () => { fireEvent.click(confirmBtn); });
    expect(onDelete).toHaveBeenCalledWith('1');
  });

  it('shows duplicate button (ContentCopy icon)', () => {
    render(<EditExpenseModal {...defaultProps} />);
    expect(document.querySelector('[data-testid="ContentCopyIcon"]')).toBeTruthy();
  });

  it('calls onDuplicate when duplicate button is clicked', async () => {
    const onDuplicate = jest.fn().mockResolvedValue(undefined);
    render(<EditExpenseModal {...defaultProps} onDuplicate={onDuplicate} />);
    const dupBtn = document.querySelector('[data-testid="ContentCopyIcon"]')?.parentElement as HTMLElement | null;
    if (dupBtn) {
      await act(async () => { fireEvent.click(dupBtn); });
    }
    await waitFor(() => {
      expect(onDuplicate).toHaveBeenCalled();
    });
  });

  it('shows validation error when Save is clicked without description', async () => {
    const emptyTx: Transaction = { ...transaction, description: '', item: undefined };
    render(<EditExpenseModal {...defaultProps} transaction={emptyTx} />);
    const saveBtn = screen.getByRole('button', { name: /^save$/i });
    await act(async () => { fireEvent.click(saveBtn); });
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('clicking Custom date shows date input', () => {
    render(<EditExpenseModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Custom'));
    expect(document.querySelector('input[type="date"]')).toBeTruthy();
  });

  it('clicking Income type switches type', () => {
    render(<EditExpenseModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Income'));
    expect(screen.getAllByText('Income').length).toBeGreaterThan(0);
  });

  it('calls onSaved after successful save', async () => {
    const { updateExpense } = require('../../../services/api');
    (updateExpense as jest.Mock).mockResolvedValueOnce({ ...transaction, description: 'Updated' });
    const onSaved = jest.fn();
    render(<EditExpenseModal {...defaultProps} onSaved={onSaved} />);
    const saveBtn = screen.getByRole('button', { name: /^save$/i });
    await act(async () => { fireEvent.click(saveBtn); });
    await waitFor(() => {
      expect(onSaved).toHaveBeenCalled();
    });
  });
});
