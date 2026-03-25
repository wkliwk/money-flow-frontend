import React from 'react';
import { render, screen } from '@testing-library/react';
import SettingsPage from '../SettingsPage';

jest.mock('../../../hooks/useFxRates', () => ({
  useFxRates: () => ({
    symbol: 'HK$',
    convert: (n: number) => n,
    currency: 'HKD',
    setCurrency: jest.fn(),
    loading: false,
    rates: { HKD: 1, CAD: 0.18, USD: 0.128, CNY: 0.93 },
  }),
  CURRENCIES: ['HKD', 'CAD', 'USD', 'CNY'],
  CURRENCY_SYMBOLS: { HKD: 'HK$', CAD: 'CA$', USD: 'US$', CNY: '¥' },
  Currency: {},
}));

jest.mock('../../../hooks/useBudgets', () => ({
  useBudgets: () => ({ budgets: {}, setBudget: jest.fn() }),
  BUDGET_CATEGORIES: ['Food & Drink', 'Transport', 'Shopping'],
}));

jest.mock('../../../hooks/useRecurring', () => ({
  useRecurring: () => ({ items: [], addItem: jest.fn(), deleteItem: jest.fn() }),
  RecurringItem: {},
}));

describe('SettingsPage', () => {
  const defaultProps = {
    currency: 'HKD',
    onCurrencyChange: jest.fn(),
  };

  it('renders without crashing', () => {
    render(<SettingsPage {...defaultProps} />);
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('shows Display Currency section', () => {
    render(<SettingsPage {...defaultProps} />);
    expect(screen.getByText('Display Currency')).toBeInTheDocument();
  });

  it('shows Monthly Budgets section', () => {
    render(<SettingsPage {...defaultProps} />);
    expect(screen.getByText('Monthly Budgets')).toBeInTheDocument();
  });

  it('shows currency chips', () => {
    render(<SettingsPage {...defaultProps} />);
    expect(screen.getByText('HK$ HKD')).toBeInTheDocument();
    expect(screen.getByText('CA$ CAD')).toBeInTheDocument();
  });

  it('shows Sign Out button', () => {
    render(<SettingsPage {...defaultProps} />);
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });

  it('shows Add recurring button', () => {
    render(<SettingsPage {...defaultProps} />);
    expect(screen.getByText('Add recurring')).toBeInTheDocument();
  });
});
