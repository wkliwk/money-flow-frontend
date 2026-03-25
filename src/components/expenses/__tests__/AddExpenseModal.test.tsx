import React from 'react';
import { render, screen } from '@testing-library/react';
import AddExpenseModal from '../AddExpenseModal';

jest.mock('../../../hooks/useTemplates', () => ({
  useTemplates: () => ({ templates: [], addTemplate: jest.fn(), deleteTemplate: jest.fn() }),
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

const defaultProps = {
  open: true,
  onClose: jest.fn(),
  onSubmit: jest.fn().mockResolvedValue(undefined),
  existingCategories: [],
};

describe('AddExpenseModal', () => {
  it('renders without crashing when open', () => {
    render(<AddExpenseModal {...defaultProps} />);
    // Dialog renders in a portal - check body contains content
    expect(document.body).toBeTruthy();
  });

  it('shows expense/income type toggle', () => {
    render(<AddExpenseModal {...defaultProps} />);
    expect(screen.getByText('Expense')).toBeInTheDocument();
    expect(screen.getByText('Income')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<AddExpenseModal {...defaultProps} open={false} />);
    expect(screen.queryByText('Add Transaction')).not.toBeInTheDocument();
  });
});
