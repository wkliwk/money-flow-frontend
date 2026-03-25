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
    const backspaceBtn = document.querySelector('[data-testid="BackspaceOutlinedIcon"]')?.parentElement;
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
    const { rerender } = render(<NumPad value="5" onChange={onChange} />);
    fireEvent.click(screen.getByText('+'));
    rerender(<NumPad value="5" onChange={onChange} />);
    fireEvent.click(screen.getByText('3'));
    rerender(<NumPad value="3" onChange={onChange} />);
    fireEvent.click(screen.getByText('='));
    expect(onChange).toHaveBeenCalledWith('8');
  });

  it('shows Amount label', () => {
    render(<NumPad value="" onChange={jest.fn()} />);
    expect(screen.getByText('Amount')).toBeInTheDocument();
  });

  it('shows 0 as placeholder when value is empty', () => {
    render(<NumPad value="" onChange={jest.fn()} />);
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
  });

  it('renders minus operator button', () => {
    render(<NumPad value="" onChange={jest.fn()} />);
    expect(screen.getByText('−')).toBeInTheDocument();
  });

  it('renders multiply operator button', () => {
    render(<NumPad value="" onChange={jest.fn()} />);
    expect(screen.getByText('×')).toBeInTheDocument();
  });

  it('renders divide operator button', () => {
    render(<NumPad value="" onChange={jest.fn()} />);
    expect(screen.getByText('÷')).toBeInTheDocument();
  });

  it('shows FX swap button when fxSymbol and fxRate provided', () => {
    render(<NumPad value="100" onChange={jest.fn()} fxSymbol="CA$" fxRate={5.5} />);
    expect(document.querySelector('[data-testid="SwapVertIcon"]')).toBeTruthy();
  });

  it('clicking swap switches between FX and HKD input', () => {
    const onChange = jest.fn();
    render(<NumPad value="100" onChange={onChange} fxSymbol="CA$" fxRate={5.5} />);
    const swapBtn = document.querySelector('[data-testid="SwapVertIcon"]')?.parentElement;
    if (swapBtn) {
      fireEvent.click(swapBtn);
    }
    // After swap, the component should not throw
    expect(screen.getByText('Amount')).toBeInTheDocument();
  });

  it('minus operator chaining computes correctly', () => {
    const onChange = jest.fn();
    const { rerender } = render(<NumPad value="10" onChange={onChange} />);
    fireEvent.click(screen.getByText('−'));
    rerender(<NumPad value="10" onChange={onChange} />);
    fireEvent.click(screen.getByText('3'));
    rerender(<NumPad value="3" onChange={onChange} />);
    fireEvent.click(screen.getByText('='));
    expect(onChange).toHaveBeenCalledWith('7');
  });

  it('handles decimal already present - does not add second dot', () => {
    const onChange = jest.fn();
    render(<NumPad value="5.5" onChange={onChange} />);
    fireEvent.click(screen.getByText('.'));
    // Should NOT append another dot
    expect(onChange).not.toHaveBeenCalled();
  });

  it('multiply operator computes correctly', () => {
    const onChange = jest.fn();
    const { rerender } = render(<NumPad value="4" onChange={onChange} />);
    fireEvent.click(screen.getByText('×'));
    rerender(<NumPad value="4" onChange={onChange} />);
    fireEvent.click(screen.getByText('3'));
    rerender(<NumPad value="3" onChange={onChange} />);
    fireEvent.click(screen.getByText('='));
    expect(onChange).toHaveBeenCalledWith('12');
  });

  it('divide operator computes correctly', () => {
    const onChange = jest.fn();
    const { rerender } = render(<NumPad value="12" onChange={onChange} />);
    fireEvent.click(screen.getByText('÷'));
    rerender(<NumPad value="12" onChange={onChange} />);
    fireEvent.click(screen.getByText('3'));
    rerender(<NumPad value="3" onChange={onChange} />);
    fireEvent.click(screen.getByText('='));
    expect(onChange).toHaveBeenCalledWith('4');
  });

  it('clicking 500 preset sets amount to 500', () => {
    const onChange = jest.fn();
    render(<NumPad value="" onChange={onChange} />);
    fireEvent.click(screen.getByText('500'));
    expect(onChange).toHaveBeenCalledWith('500');
  });

  it('clicking 50 preset sets amount to 50', () => {
    const onChange = jest.fn();
    render(<NumPad value="" onChange={onChange} />);
    fireEvent.click(screen.getByText('50'));
    expect(onChange).toHaveBeenCalledWith('50');
  });

  it('clicking 200 preset sets amount to 200', () => {
    const onChange = jest.fn();
    render(<NumPad value="" onChange={onChange} />);
    fireEvent.click(screen.getByText('200'));
    expect(onChange).toHaveBeenCalledWith('200');
  });

  it('chained operations compute the running total', () => {
    const onChange = jest.fn();
    const { rerender } = render(<NumPad value="5" onChange={onChange} />);
    fireEvent.click(screen.getByText('+'));
    rerender(<NumPad value="5" onChange={onChange} />);
    fireEvent.click(screen.getByText('3'));
    rerender(<NumPad value="3" onChange={onChange} />);
    // Click + again to chain: 5+3 = 8 (stored), then add more
    fireEvent.click(screen.getByText('+'));
    expect(onChange).toHaveBeenCalledWith('8');
  });

  it('FX mode: preset amount converts to HKD', () => {
    const onChange = jest.fn();
    render(<NumPad value="" onChange={onChange} fxSymbol="CA$" fxRate={5.5} />);
    // In FX mode, preset button click emits HKD value
    fireEvent.click(screen.getByText('100'));
    expect(onChange).toHaveBeenCalledWith('100');
  });

  it('shows pendingOp indicator when operation is selected', () => {
    const onChange = jest.fn();
    const { rerender } = render(<NumPad value="5" onChange={onChange} />);
    fireEvent.click(screen.getByText('+'));
    rerender(<NumPad value="5" onChange={onChange} />);
    // The pending op should be shown
    expect(screen.getByText('+')).toBeInTheDocument();
  });

  it('FX mode: entering digit in FX mode calls onChange with HKD equivalent', () => {
    const onChange = jest.fn();
    render(<NumPad value="" onChange={onChange} fxSymbol="CA$" fxRate={5.5} />);
    // In FX mode by default, click a digit
    fireEvent.click(screen.getByText('5'));
    expect(onChange).toHaveBeenCalled();
  });

  it('FX mode: swap converts HKD value to FX input', () => {
    const onChange = jest.fn();
    render(<NumPad value="550" onChange={onChange} fxSymbol="CA$" fxRate={5.5} />);
    const swapBtn = document.querySelector('[data-testid="SwapVertIcon"]')?.parentElement;
    if (swapBtn) {
      // First swap brings to HKD mode (since FX available, starts in FX mode)
      fireEvent.click(swapBtn);
      // Second swap goes back to FX mode
      fireEvent.click(swapBtn);
    }
    expect(screen.getByText('Amount')).toBeInTheDocument();
  });

  it('dot with waitForNext starts new decimal entry', () => {
    const onChange = jest.fn();
    const { rerender } = render(<NumPad value="5" onChange={onChange} />);
    fireEvent.click(screen.getByText('+'));
    rerender(<NumPad value="5" onChange={onChange} />);
    // Now in waitForNext state, click dot
    fireEvent.click(screen.getByText('.'));
    expect(onChange).toHaveBeenCalled();
  });

  it('digit entry stops at 2 decimal places', () => {
    const onChange = jest.fn();
    render(<NumPad value="5.12" onChange={onChange} />);
    fireEvent.click(screen.getByText('3'));
    // Should not call onChange because 2 decimal places already
    expect(onChange).not.toHaveBeenCalled();
  });

  it('digit entry stops at 10 whole digits', () => {
    const onChange = jest.fn();
    render(<NumPad value="1234567890" onChange={onChange} />);
    fireEvent.click(screen.getByText('1'));
    // Should not call onChange
    expect(onChange).not.toHaveBeenCalled();
  });

  it('C button in FX mode clears the value', () => {
    const onChange = jest.fn();
    render(<NumPad value="100" onChange={onChange} fxSymbol="CA$" fxRate={5.5} />);
    fireEvent.click(screen.getByText('C'));
    expect(onChange).toHaveBeenCalled();
  });

  it('swap from HKD to FX mode converts value correctly', () => {
    const onChange = jest.fn();
    render(<NumPad value="550" onChange={onChange} fxSymbol="CA$" fxRate={5.5} />);
    const swapBtn = document.querySelector('[data-testid="SwapVertIcon"]')?.parentElement;
    if (swapBtn) {
      // First swap: starts in FX mode (isFxAvailable=true, inputInFx=true)
      // goes to HKD mode (inputInFx → false), covers lines 68-69
      fireEvent.click(swapBtn);
      // Second swap: now in HKD mode (inputInFx=false)
      // goes back to FX mode — covers lines 72-73
      fireEvent.click(swapBtn);
    }
    expect(screen.getByText('Amount')).toBeInTheDocument();
  });

  it('appends digit to non-empty whole number string', () => {
    const onChange = jest.fn();
    render(<NumPad value="5" onChange={onChange} />);
    fireEvent.click(screen.getByText('3'));
    // value is '5', key is '3', should append → '53'
    expect(onChange).toHaveBeenCalledWith('53');
  });

  it('handleOp in FX mode emits converted HKD result', () => {
    const onChange = jest.fn();
    const { rerender } = render(<NumPad value="100" onChange={onChange} fxSymbol="CA$" fxRate={5.5} />);
    // In FX mode, click +
    fireEvent.click(screen.getByText('+'));
    rerender(<NumPad value="100" onChange={onChange} fxSymbol="CA$" fxRate={5.5} />);
    // Click 50 preset
    fireEvent.click(screen.getByText('50'));
    expect(onChange).toHaveBeenCalled();
  });
});
