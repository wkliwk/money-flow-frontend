import React from 'react';
import { render, screen } from '@testing-library/react';
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
    // Component should render without crashing even with null transaction
    expect(document.body).toBeTruthy();
  });
});
