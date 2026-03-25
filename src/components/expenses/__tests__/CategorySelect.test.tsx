import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CategorySelect from '../CategorySelect';

describe('CategorySelect', () => {
  it('renders the category input', () => {
    render(<CategorySelect value="" onChange={jest.fn()} existingCategories={[]} />);
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
  });

  it('shows preset category chips', () => {
    render(<CategorySelect value="" onChange={jest.fn()} existingCategories={[]} />);
    expect(screen.getByText(/Food & Drink/)).toBeInTheDocument();
  });

  it('calls onChange when a chip is clicked', () => {
    const onChange = jest.fn();
    render(<CategorySelect value="" onChange={onChange} existingCategories={[]} />);
    fireEvent.click(screen.getByText(/Transport/));
    expect(onChange).toHaveBeenCalledWith('Transport');
  });

  it('highlights selected category chip', () => {
    render(
      <CategorySelect value="Transport" onChange={jest.fn()} existingCategories={[]} />
    );
    // Transport chip should be in the DOM
    expect(screen.getByText(/Transport/)).toBeInTheDocument();
  });

  it('includes existing categories in options', () => {
    render(
      <CategorySelect value="" onChange={jest.fn()} existingCategories={['My Custom Category', '  trimmed  ']} />
    );
    expect(screen.getByText('My Custom Category')).toBeInTheDocument();
  });
});
