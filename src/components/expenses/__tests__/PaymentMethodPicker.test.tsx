import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PaymentMethodPicker from '../PaymentMethodPicker';
import { PAYMENT_METHODS, PaymentMethod } from '../../../types';

describe('PaymentMethodPicker', () => {
  it('renders all payment method options', () => {
    render(<PaymentMethodPicker value={null} onChange={jest.fn()} />);
    PAYMENT_METHODS.forEach((m) => {
      expect(screen.getByText(m)).toBeInTheDocument();
    });
  });

  it('renders the label', () => {
    render(<PaymentMethodPicker value={null} onChange={jest.fn()} />);
    expect(screen.getByText('Payment Method')).toBeInTheDocument();
  });

  it('calls onChange with payment method when clicked', () => {
    const onChange = jest.fn();
    render(<PaymentMethodPicker value={null} onChange={onChange} />);
    fireEvent.click(screen.getByText('Octopus'));
    expect(onChange).toHaveBeenCalledWith('Octopus');
  });

  it('calls onChange with null when same method is clicked (deselect)', () => {
    const onChange = jest.fn();
    render(<PaymentMethodPicker value={'Octopus' as PaymentMethod} onChange={onChange} />);
    fireEvent.click(screen.getByText('Octopus'));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('calls onChange with new method when different method is clicked', () => {
    const onChange = jest.fn();
    render(<PaymentMethodPicker value={'Cash' as PaymentMethod} onChange={onChange} />);
    fireEvent.click(screen.getByText('PayMe'));
    expect(onChange).toHaveBeenCalledWith('PayMe');
  });
});
