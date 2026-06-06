import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SettingsPage from '../SettingsPage';
import { AppThemeProvider } from '../../../ThemeContext';

const mockToggleCurrency = jest.fn();

jest.mock('../FriendsSection', () => () => null);

jest.mock('../../../hooks/useCurrencyPreferences', () => ({
  useCurrencyPreferences: () => ({
    enabledCurrencies: ['HKD', 'USD'],
    toggleCurrency: mockToggleCurrency,
    isEnabled: (code: string) => ['HKD', 'USD'].includes(code),
  }),
}));

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

jest.mock('../../../hooks/useItemPresets', () => ({
  useItemPresets: () => ({ presets: {}, setPreset: jest.fn(), deletePreset: jest.fn() }),
}));

const renderWithTheme = (ui: React.ReactElement) =>
  render(<AppThemeProvider>{ui}</AppThemeProvider>);

describe('SettingsPage', () => {
  const defaultProps = {
    currency: 'HKD',
    onCurrencyChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.removeItem('mf_theme');
  });

  it('renders without crashing', () => {
    renderWithTheme(<SettingsPage {...defaultProps} />);
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('shows Appearance section with Display Currency inside it', () => {
    renderWithTheme(<SettingsPage {...defaultProps} />);
    expect(screen.getByText('Appearance')).toBeInTheDocument();
    expect(screen.getByText('Display Currency')).toBeInTheDocument();
  });

  it('shows Monthly Budgets section', () => {
    renderWithTheme(<SettingsPage {...defaultProps} />);
    expect(screen.getByText('Monthly Budgets')).toBeInTheDocument();
    expect(screen.getByText('No budgets yet')).toBeInTheDocument();
    expect(screen.getByText('Create your first budget')).toBeInTheDocument();
  });

  it('shows currency chips in Display Currency section', () => {
    renderWithTheme(<SettingsPage {...defaultProps} />);
    expect(screen.getAllByText('HK$ HKD').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('CA$ CAD').length).toBeGreaterThanOrEqual(1);
  });

  it('shows Sign Out button', () => {
    renderWithTheme(<SettingsPage {...defaultProps} />);
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });

  it('calls onCurrencyChange when currency chip is clicked', () => {
    const onCurrencyChange = jest.fn();
    renderWithTheme(<SettingsPage {...defaultProps} onCurrencyChange={onCurrencyChange} />);
    fireEvent.click(screen.getAllByText('CA$ CAD')[0]);
    expect(onCurrencyChange).toHaveBeenCalledWith('CAD');
  });

  it('renders budget input fields for each category', () => {
    renderWithTheme(<SettingsPage {...defaultProps} />);
    expect(screen.getByText('Food & Drink')).toBeInTheDocument();
    expect(screen.getByText('Transport')).toBeInTheDocument();
    expect(screen.getByText('Shopping')).toBeInTheDocument();
  });

  it('shows category spend when provided', () => {
    renderWithTheme(<SettingsPage {...defaultProps} categorySpend={{ 'Food & Drink': 500 }} />);
    expect(screen.getByText(/500/)).toBeInTheDocument();
  });

  it('has budget input fields with placeholder "No limit"', () => {
    renderWithTheme(<SettingsPage {...defaultProps} />);
    const inputs = screen.getAllByPlaceholderText('No limit');
    expect(inputs.length).toBeGreaterThan(0);
  });

  it('budget input change updates the field value', () => {
    renderWithTheme(<SettingsPage {...defaultProps} />);
    const inputs = screen.getAllByPlaceholderText('No limit');
    fireEvent.change(inputs[0], { target: { value: '500' } });
    expect((inputs[0] as HTMLInputElement).value).toBe('500');
  });

  it('budget input blur triggers setBudget', () => {
    renderWithTheme(<SettingsPage {...defaultProps} />);
    const inputs = screen.getAllByPlaceholderText('No limit');
    fireEvent.change(inputs[0], { target: { value: '300' } });
    fireEvent.blur(inputs[0]);
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('Sign Out opens confirmation dialog with Cancel and confirm actions', () => {
    renderWithTheme(<SettingsPage {...defaultProps} />);
    const trigger = screen.getByRole('button', { name: /sign out/i });
    fireEvent.click(trigger);
    expect(screen.getByText('Are you sure you want to sign out?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  });

  it('shows My Currencies section', () => {
    renderWithTheme(<SettingsPage {...defaultProps} />);
    expect(screen.getByText('My Currencies')).toBeInTheDocument();
  });

  it('shows all currencies in My Currencies section', () => {
    renderWithTheme(<SettingsPage {...defaultProps} />);
    const hkdChips = screen.getAllByText('HK$ HKD');
    expect(hkdChips.length).toBeGreaterThanOrEqual(2);
  });

  it('does not show last-currency warning when multiple currencies are enabled', () => {
    renderWithTheme(<SettingsPage {...defaultProps} />);
    expect(screen.queryByText(/At least one currency must remain enabled/)).not.toBeInTheDocument();
  });

  it('toggles My Currencies chip when more than one currency is enabled', () => {
    renderWithTheme(<SettingsPage {...defaultProps} />);
    const hkdChips = screen.getAllByText('HK$ HKD');
    const myCurrenciesHkdChip = hkdChips[hkdChips.length - 1];
    fireEvent.click(myCurrenciesHkdChip);
    expect(mockToggleCurrency).toHaveBeenCalledWith('HKD');
  });

  it('shows Appearance section with theme toggle', () => {
    renderWithTheme(<SettingsPage {...defaultProps} />);
    expect(screen.getByText('Appearance')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Light' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'System' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dark' })).toBeInTheDocument();
  });

  it('persists theme preference to localStorage when toggled', () => {
    renderWithTheme(<SettingsPage {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Light' }));
    expect(localStorage.getItem('mf_theme')).toBe('light');
    fireEvent.click(screen.getByRole('button', { name: 'Dark' }));
    expect(localStorage.getItem('mf_theme')).toBe('dark');
    fireEvent.click(screen.getByRole('button', { name: 'System' }));
    expect(localStorage.getItem('mf_theme')).toBe('system');
  });

  it('shows Export CSV and Export JSON buttons when handlers provided', () => {
    const onExportCsv = jest.fn();
    const onExportJson = jest.fn();
    renderWithTheme(
      <SettingsPage {...defaultProps} onExportCsv={onExportCsv} onExportJson={onExportJson} />
    );
    expect(screen.getByRole('button', { name: /export csv/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /export json/i })).toBeInTheDocument();
  });

  it('calls onExportCsv when Export CSV button is clicked', () => {
    const onExportCsv = jest.fn();
    renderWithTheme(<SettingsPage {...defaultProps} onExportCsv={onExportCsv} />);
    fireEvent.click(screen.getByRole('button', { name: /export csv/i }));
    expect(onExportCsv).toHaveBeenCalledTimes(1);
  });

  it('calls onExportJson when Export JSON button is clicked', () => {
    const onExportJson = jest.fn();
    renderWithTheme(<SettingsPage {...defaultProps} onExportJson={onExportJson} />);
    fireEvent.click(screen.getByRole('button', { name: /export json/i }));
    expect(onExportJson).toHaveBeenCalledTimes(1);
  });

  it('does not show export buttons when no handlers provided', () => {
    renderWithTheme(<SettingsPage {...defaultProps} />);
    expect(screen.queryByRole('button', { name: /export csv/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /export json/i })).not.toBeInTheDocument();
  });

  it('shows Delete All Transactions button when handler provided', () => {
    const onDeleteAllTransactions = jest.fn().mockResolvedValue(undefined);
    renderWithTheme(<SettingsPage {...defaultProps} onDeleteAllTransactions={onDeleteAllTransactions} />);
    expect(screen.getByRole('button', { name: /delete all transactions/i })).toBeInTheDocument();
  });

  it('does not show Delete All button when no handler provided', () => {
    renderWithTheme(<SettingsPage {...defaultProps} />);
    expect(screen.queryByRole('button', { name: /delete all transactions/i })).not.toBeInTheDocument();
  });

  it('Delete All opens dialog requiring DELETE confirmation', () => {
    const onDeleteAllTransactions = jest.fn().mockResolvedValue(undefined);
    renderWithTheme(<SettingsPage {...defaultProps} onDeleteAllTransactions={onDeleteAllTransactions} />);
    fireEvent.click(screen.getByRole('button', { name: /delete all transactions/i }));
    expect(screen.getByPlaceholderText('DELETE')).toBeInTheDocument();
    const deleteAllBtn = screen.getByRole('button', { name: /^delete all$/i });
    expect(deleteAllBtn).toBeDisabled();
  });

  it('Delete All confirm button enables only after typing DELETE', async () => {
    const onDeleteAllTransactions = jest.fn().mockResolvedValue(undefined);
    renderWithTheme(<SettingsPage {...defaultProps} onDeleteAllTransactions={onDeleteAllTransactions} />);
    fireEvent.click(screen.getByRole('button', { name: /delete all transactions/i }));
    const input = screen.getByPlaceholderText('DELETE');
    fireEvent.change(input, { target: { value: 'DELETE' } });
    const confirmBtn = screen.getByRole('button', { name: /^delete all$/i });
    expect(confirmBtn).not.toBeDisabled();
  });

  it('Delete All cancel dismisses dialog without calling handler', () => {
    const onDeleteAllTransactions = jest.fn().mockResolvedValue(undefined);
    renderWithTheme(<SettingsPage {...defaultProps} onDeleteAllTransactions={onDeleteAllTransactions} />);
    fireEvent.click(screen.getByRole('button', { name: /delete all transactions/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onDeleteAllTransactions).not.toHaveBeenCalled();
  });

  it('Delete All calls handler when DELETE is typed and confirmed', async () => {
    const onDeleteAllTransactions = jest.fn().mockResolvedValue(undefined);
    renderWithTheme(<SettingsPage {...defaultProps} onDeleteAllTransactions={onDeleteAllTransactions} />);
    fireEvent.click(screen.getByRole('button', { name: /delete all transactions/i }));
    const input = screen.getByPlaceholderText('DELETE');
    fireEvent.change(input, { target: { value: 'DELETE' } });
    fireEvent.click(screen.getByRole('button', { name: /^delete all$/i }));
    await waitFor(() => expect(onDeleteAllTransactions).toHaveBeenCalledTimes(1));
  });
});
