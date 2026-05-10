import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PaymentMethodPicker, { getPaymentMethodIcon } from '../PaymentMethodPicker';
import { PAYMENT_METHOD_LABELS } from '../../../types';

describe('PaymentMethodPicker', () => {
  it('renders all payment method options', () => {
    render(<PaymentMethodPicker value={null} onChange={jest.fn()} />);
    Object.values(PAYMENT_METHOD_LABELS).forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
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
    expect(onChange).toHaveBeenCalledWith('octopus');
  });

  it('calls onChange with null when same method is clicked (deselect)', () => {
    const onChange = jest.fn();
    render(<PaymentMethodPicker value="octopus" onChange={onChange} />);
    fireEvent.click(screen.getByText('Octopus'));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('calls onChange with new method when different method is clicked', () => {
    const onChange = jest.fn();
    render(<PaymentMethodPicker value="cash" onChange={onChange} />);
    fireEvent.click(screen.getByText('PayMe'));
    expect(onChange).toHaveBeenCalledWith('payme');
  });

  it('getPaymentMethodIcon returns a React node for known method', () => {
    const icon = getPaymentMethodIcon('cash');
    expect(icon).toBeTruthy();
  });
});
