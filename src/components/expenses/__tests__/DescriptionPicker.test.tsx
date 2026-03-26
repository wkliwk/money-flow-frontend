import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import DescriptionPicker from '../DescriptionPicker';

describe('DescriptionPicker', () => {
  it('renders the custom input', () => {
    render(<DescriptionPicker value="" onChange={jest.fn()} suggestions={[]} />);
    expect(screen.getByPlaceholderText(/McDonald/)).toBeInTheDocument();
  });

  it('shows suggestion chips', () => {
    render(
      <DescriptionPicker
        value=""
        onChange={jest.fn()}
        suggestions={['Morning latte', 'Lunch']}
      />
    );
    expect(screen.getByText('Morning latte')).toBeInTheDocument();
    expect(screen.getByText('Lunch')).toBeInTheDocument();
  });

  it('calls onChange when suggestion chip is clicked', () => {
    const onChange = jest.fn();
    render(
      <DescriptionPicker
        value=""
        onChange={onChange}
        suggestions={['Morning latte']}
      />
    );
    fireEvent.click(screen.getByText('Morning latte'));
    expect(onChange).toHaveBeenCalledWith('Morning latte');
  });

  it('deselects chip when already selected chip is clicked', () => {
    const onChange = jest.fn();
    render(
      <DescriptionPicker
        value="Morning latte"
        onChange={onChange}
        suggestions={['Morning latte']}
      />
    );
    fireEvent.click(screen.getByText('Morning latte'));
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('adds custom note via Enter key', () => {
    const onChange = jest.fn();
    render(<DescriptionPicker value="" onChange={onChange} suggestions={[]} />);
    const input = screen.getByPlaceholderText(/McDonald/);
    fireEvent.change(input, { target: { value: 'Custom note' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith('Custom note');
  });

  it('adds custom note via add button click', () => {
    const onChange = jest.fn();
    render(<DescriptionPicker value="" onChange={onChange} suggestions={[]} />);
    const input = screen.getByPlaceholderText(/McDonald/);
    fireEvent.change(input, { target: { value: 'Button note' } });
    const addBtn = document.querySelector('[data-testid="AddIcon"]')?.parentElement;
    if (addBtn) fireEvent.click(addBtn);
    expect(onChange).toHaveBeenCalledWith('Button note');
  });

  it('clears custom input when empty string typed and calls onChange with empty', () => {
    const onChange = jest.fn();
    render(<DescriptionPicker value="" onChange={onChange} suggestions={[]} />);
    const input = screen.getByPlaceholderText(/McDonald/);
    fireEvent.change(input, { target: { value: 'hello' } });
    fireEvent.change(input, { target: { value: '' } });
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('shows category suggestion chip after debounce fires', () => {
    jest.useFakeTimers();
    const onCategorySelect = jest.fn();
    render(
      <DescriptionPicker
        value="coffee"
        onChange={jest.fn()}
        suggestions={[]}
        categoriesByDescription={{ coffee: 'Food & Drink' }}
        onCategorySelect={onCategorySelect}
      />
    );
    act(() => { jest.advanceTimersByTime(400); });
    expect(screen.getByText(/Category: Food & Drink/)).toBeInTheDocument();
    jest.useRealTimers();
  });

  it('clicking category suggestion chip calls onCategorySelect', () => {
    jest.useFakeTimers();
    const onCategorySelect = jest.fn();
    render(
      <DescriptionPicker
        value="coffee"
        onChange={jest.fn()}
        suggestions={[]}
        categoriesByDescription={{ coffee: 'Food & Drink' }}
        onCategorySelect={onCategorySelect}
      />
    );
    act(() => { jest.advanceTimersByTime(400); });
    fireEvent.click(screen.getByText(/Category: Food & Drink/));
    expect(onCategorySelect).toHaveBeenCalledWith('Food & Drink');
    jest.useRealTimers();
  });
});
