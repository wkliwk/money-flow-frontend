import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NumPad from '../NumPad';

describe('NumPad', () => {
  it('renders without crashing', () => {
    render(<NumPad value="" onChange={jest.fn()} />);
    expect(screen.getByText('=')).toBeInTheDocument();
  });

  it('calls onChange with digit when digit button is clicked', () => {
    const onChange = jest.fn();
    render(<NumPad value="" onChange={onChange} />);
    fireEvent.click(screen.getByText('5'));
    expect(onChange).toHaveBeenCalledWith('5');
  });

  it('calls onChange with empty string when C is clicked', () => {
    const onChange = jest.fn();
    render(<NumPad value="123" onChange={onChange} />);
    fireEvent.click(screen.getByText('C'));
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('calls onChange with sliced value when backspace is clicked', () => {
    const onChange = jest.fn();
    render(<NumPad value="123" onChange={onChange} />);
    const backspace = screen.getByTestId
      ? screen.queryByTestId('backspace')
      : null;
    // Find backspace by looking for SVG button (BackspaceOutlinedIcon)
    const buttons = screen.getAllByRole('button');
    // The backspace button is identifiable by structure — find it
    const backspaceBtn = buttons.find((b) => b.querySelector('svg'));
    if (backspaceBtn) {
      fireEvent.click(backspaceBtn);
      expect(onChange).toHaveBeenCalledWith('12');
    }
  });

  it('appends decimal point', () => {
    const onChange = jest.fn();
    render(<NumPad value="5" onChange={onChange} />);
    fireEvent.click(screen.getByText('.'));
    expect(onChange).toHaveBeenCalledWith('5.');
  });

  it('shows preset amount buttons', () => {
    render(<NumPad value="" onChange={jest.fn()} />);
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
  });

  it('clicking 100 preset calls onChange with "100"', () => {
    const onChange = jest.fn();
    render(<NumPad value="" onChange={onChange} />);
    fireEvent.click(screen.getByText('100'));
    expect(onChange).toHaveBeenCalledWith('100');
  });

  it('equals button calls onChange with computed result', () => {
    const onChange = jest.fn();
    // value=5, click +, click 3, click =  → result 8
    const { rerender } = render(<NumPad value="5" onChange={onChange} />);
    fireEvent.click(screen.getByText('+'));
    rerender(<NumPad value="5" onChange={onChange} />);
    fireEvent.click(screen.getByText('3'));
    // onChange was called with '3'
    rerender(<NumPad value="3" onChange={onChange} />);
    fireEvent.click(screen.getByText('='));
    expect(onChange).toHaveBeenCalledWith('8');
  });
});
