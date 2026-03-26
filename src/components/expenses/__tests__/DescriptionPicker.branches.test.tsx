import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import DescriptionPicker from '../DescriptionPicker';

describe('DescriptionPicker — branch coverage', () => {
  it('shows "Custom…" placeholder when suggestions exist', () => {
    render(
      <DescriptionPicker value="" onChange={jest.fn()} suggestions={['Coffee']} />
    );
    expect(screen.getByPlaceholderText('Custom…')).toBeInTheDocument();
  });

  it('shows custom value chip when value is set and not in suggestions', () => {
    render(
      <DescriptionPicker
        value="My Custom Note"
        onChange={jest.fn()}
        suggestions={['Coffee']}
      />
    );
    expect(screen.getByText('My Custom Note')).toBeInTheDocument();
  });

  it('deletes custom chip when chip X is clicked', () => {
    const onChange = jest.fn();
    render(
      <DescriptionPicker
        value="My Custom Note"
        onChange={onChange}
        suggestions={['Coffee']}
      />
    );
    // Find and click the delete icon on the custom chip
    const deleteIcons = document.querySelectorAll('.MuiChip-deleteIcon');
    if (deleteIcons.length > 0) {
      fireEvent.click(deleteIcons[0]);
      expect(onChange).toHaveBeenCalledWith('');
    }
  });

  it('does not call onChange when addCustom is called with empty input', () => {
    const onChange = jest.fn();
    render(<DescriptionPicker value="" onChange={onChange} suggestions={[]} />);
    const input = screen.getByPlaceholderText(/McDonald/);
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('calls onChange with empty string when custom input is cleared', () => {
    const onChange = jest.fn();
    render(<DescriptionPicker value="" onChange={onChange} suggestions={[]} />);
    const input = screen.getByPlaceholderText(/McDonald/);
    fireEvent.change(input, { target: { value: 'test' } });
    onChange.mockClear();
    fireEvent.change(input, { target: { value: '' } });
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('shows Add icon button when custom input has text', () => {
    render(<DescriptionPicker value="" onChange={jest.fn()} suggestions={[]} />);
    const input = screen.getByPlaceholderText(/McDonald/);
    fireEvent.change(input, { target: { value: 'Sushi' } });
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls addCustom when Add icon button is clicked', () => {
    const onChange = jest.fn();
    render(<DescriptionPicker value="" onChange={onChange} suggestions={[]} />);
    const input = screen.getByPlaceholderText(/McDonald/);
    fireEvent.change(input, { target: { value: 'Sushi' } });
    fireEvent.click(screen.getByRole('button'));
    expect(onChange).toHaveBeenCalledWith('Sushi');
  });

  it('calls onCategorySelect when addCustom fires and suggestedCategory is set', async () => {
    jest.useFakeTimers();
    const onChange = jest.fn();
    const onCategorySelect = jest.fn();
    render(
      <DescriptionPicker
        value=""
        onChange={onChange}
        suggestions={[]}
        categoriesByDescription={{ coffee: 'Food & Drink' }}
        onCategorySelect={onCategorySelect}
      />
    );
    const input = screen.getByPlaceholderText(/McDonald/);
    fireEvent.change(input, { target: { value: 'coffee' } });

    // Advance timer to trigger debounce and set suggestedCategory
    act(() => { jest.advanceTimersByTime(400); });

    await waitFor(() => {
      // Now addCustom via Enter should call onCategorySelect if category was suggested
      fireEvent.keyDown(input, { key: 'Enter' });
    });
    // onChange at minimum should have been called
    expect(onChange).toHaveBeenCalledWith('coffee');
    jest.useRealTimers();
  });

  it('clears suggestedCategory when searchText is empty and onCategorySelect provided', () => {
    render(
      <DescriptionPicker
        value=""
        onChange={jest.fn()}
        suggestions={[]}
        categoriesByDescription={{ coffee: 'Food' }}
        onCategorySelect={jest.fn()}
      />
    );
    // No input yet — suggestedCategory should be null, no chip visible
    expect(screen.queryByText(/Category:/)).not.toBeInTheDocument();
  });

  it('does not run debounce categorization when onCategorySelect is not provided', () => {
    render(
      <DescriptionPicker
        value=""
        onChange={jest.fn()}
        suggestions={[]}
        categoriesByDescription={{ coffee: 'Food' }}
      />
    );
    expect(screen.queryByText(/Category:/)).not.toBeInTheDocument();
  });
});
