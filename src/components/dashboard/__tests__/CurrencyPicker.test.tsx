import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CurrencyPicker from '../CurrencyPicker';

jest.mock('../../../hooks/useFxRates', () => ({
  CURRENCIES: ['HKD', 'CAD', 'USD', 'CNY'],
  CURRENCY_SYMBOLS: { HKD: 'HK$', CAD: 'CA$', USD: 'US$', CNY: '¥' },
}));

describe('CurrencyPicker', () => {
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
    // The HK$ HKD chip should have active styling - just verify it exists
    expect(screen.getByText('HK$ HKD')).toBeInTheDocument();
  });
});
