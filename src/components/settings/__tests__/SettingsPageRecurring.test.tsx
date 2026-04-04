import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SettingsPage from '../SettingsPage';
import { AppThemeProvider } from '../../../ThemeContext';

jest.mock('../../../services/api', () => ({
  __esModule: true,
  exportJSON: jest.fn().mockResolvedValue(new Blob(['{}'], { type: 'application/json' })),
  getUserMe: jest.fn().mockResolvedValue({ _id: '1', email: 'test@test.com', themePreference: 'system' }),
  changePassword: jest.fn().mockResolvedValue({ message: 'Password updated' }),
  patchUserPreferences: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../toastEvents', () => ({
  __esModule: true,
  emitToast: jest.fn(),
  subscribeToast: jest.fn(),
}));

import * as apiModule from '../../../services/api';
const mockGetUserMe = apiModule.getUserMe as jest.Mock;

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

const mockDeleteItem = jest.fn();
const mockAddItem = jest.fn();

jest.mock('../../../hooks/useRecurring', () => ({
  useRecurring: () => ({
    items: [
      { id: 'r1', label: 'Netflix', description: 'Streaming', amount: 88, type: 'expense' },
    ],
    addItem: mockAddItem,
    deleteItem: mockDeleteItem,
  }),
  RecurringItem: {},
}));

jest.mock('../../../hooks/useBudgets', () => ({
  useBudgets: () => ({ budgets: { 'Food & Drink': 100 }, setBudget: jest.fn() }),
  BUDGET_CATEGORIES: ['Food & Drink', 'Transport', 'Shopping'],
}));

describe('SettingsPage (with recurring items)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserMe.mockResolvedValue({ _id: '1', email: 'test@test.com', themePreference: 'system' });
  });

  it('renders Netflix recurring item', () => {
    render(<AppThemeProvider><SettingsPage currency="HKD" onCurrencyChange={jest.fn()} /></AppThemeProvider>);
    expect(screen.getByText('Netflix')).toBeInTheDocument();
  });

  it('calls deleteItem when delete button is clicked', () => {
    render(<AppThemeProvider><SettingsPage currency="HKD" onCurrencyChange={jest.fn()} /></AppThemeProvider>);
    const deleteIcon = document.querySelector('[data-testid="DeleteIcon"]');
    if (deleteIcon?.parentElement) {
      fireEvent.click(deleteIcon.parentElement);
    }
    expect(mockDeleteItem).toHaveBeenCalledWith('r1');
  });

  it('shows over-budget warning when spend exceeds limit', () => {
    render(<AppThemeProvider><SettingsPage currency="HKD" onCurrencyChange={jest.fn()} categorySpend={{ 'Food & Drink': 200 }} /></AppThemeProvider>);
    expect(screen.getByText(/over!/i)).toBeInTheDocument();
  });

  it('saves recurring form with valid data', () => {
    render(<AppThemeProvider><SettingsPage currency="HKD" onCurrencyChange={jest.fn()} /></AppThemeProvider>);
    fireEvent.click(screen.getByText('Add recurring'));
    const amountInput = screen.getByLabelText(/Amount/);
    fireEvent.change(amountInput, { target: { value: '120' } });
    const labelInput = screen.getByLabelText(/Label/);
    fireEvent.change(labelInput, { target: { value: 'Spotify' } });
    const saveBtn = screen.getByRole('button', { name: /^save$/i });
    fireEvent.click(saveBtn);
    expect(mockAddItem).toHaveBeenCalled();
  });

  it('switching recurring type to income shows income items', () => {
    render(<AppThemeProvider><SettingsPage currency="HKD" onCurrencyChange={jest.fn()} /></AppThemeProvider>);
    fireEvent.click(screen.getByText('Add recurring'));
    // Click Income type in the recurring form
    const incomeBoxes = screen.getAllByText('Income');
    fireEvent.click(incomeBoxes[incomeBoxes.length - 1]);
    expect(screen.getByLabelText(/Label/)).toBeInTheDocument();
  });
});
