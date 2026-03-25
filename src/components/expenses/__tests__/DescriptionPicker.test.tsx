import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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
});
