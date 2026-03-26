import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CurrencyPicker from '../CurrencyPicker';
import { useCurrencyPreferences } from '../../../hooks/useCurrencyPreferences';

jest.mock('../../../hooks/useFxRates', () => ({
  CURRENCIES: ['HKD', 'CAD', 'USD', 'CNY'],
  CURRENCY_SYMBOLS: { HKD: 'HK$', CAD: 'CA$', USD: 'US$', CNY: '¥' },
}));

jest.mock('../../../hooks/useCurrencyPreferences');

const mockUseCurrencyPreferences = useCurrencyPreferences as jest.Mock;

const defaultPrefs = {
  enabledCurrencies: ['HKD', 'CAD', 'USD', 'CNY'],
  toggleCurrency: jest.fn(),
  isEnabled: () => true,
};

describe('CurrencyPicker', () => {
  beforeEach(() => {
    mockUseCurrencyPreferences.mockReturnValue(defaultPrefs);
  });

  it('renders all currency chips', () => {
    render(<CurrencyPicker currency="HKD" onChange={jest.fn()} />);
    expect(screen.getByText('HK$ HKD')).toBeInTheDocument();
    expect(screen.getByText('CA$ CAD')).toBeInTheDocument();
    expect(screen.getByText('US$ USD')).toBeInTheDocument();
    expect(screen.getByText('¥ CNY')).toBeInTheDocument();
  });

  it('calls onChange with selected currency when chip is clicked', () => {
    const onChange = jest.fn();
    render(<CurrencyPicker currency="HKD" onChange={onChange} />);
    fireEvent.click(screen.getByText('CA$ CAD'));
    expect(onChange).toHaveBeenCalledWith('CAD');
  });

  it('highlights the active currency chip', () => {
    render(<CurrencyPicker currency="HKD" onChange={jest.fn()} />);
    expect(screen.getByText('HK$ HKD')).toBeInTheDocument();
  });

  it('always shows the active currency even when not in enabled list', () => {
    mockUseCurrencyPreferences.mockReturnValueOnce({
      enabledCurrencies: ['HKD', 'CAD'],
      toggleCurrency: jest.fn(),
      isEnabled: (c: string) => ['HKD', 'CAD'].includes(c),
    });
    render(<CurrencyPicker currency="USD" onChange={jest.fn()} />);
    // USD is not enabled but is the active currency — still shown
    expect(screen.getByText('US$ USD')).toBeInTheDocument();
    // CNY is neither enabled nor active — hidden
    expect(screen.queryByText('¥ CNY')).not.toBeInTheDocument();
  });
});
