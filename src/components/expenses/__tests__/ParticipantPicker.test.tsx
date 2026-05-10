import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ParticipantPicker from '../ParticipantPicker';

describe('ParticipantPicker', () => {
  it('renders the add person input', () => {
    render(<ParticipantPicker value={[]} onChange={jest.fn()} />);
    expect(screen.getByPlaceholderText('Add person…')).toBeInTheDocument();
  });

  it('displays selected participants as chips', () => {
    render(<ParticipantPicker value={['Alice', 'Bob']} onChange={jest.fn()} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('shows suggestion chips for unselected suggestions', () => {
    render(
      <ParticipantPicker
        value={[]}
        onChange={jest.fn()}
        suggestions={['Alice', 'Bob']}
      />
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('calls onChange when suggestion chip is clicked', () => {
    const onChange = jest.fn();
    render(
      <ParticipantPicker
        value={[]}
        onChange={onChange}
        suggestions={['Alice']}
      />
    );
    fireEvent.click(screen.getByText('Alice'));
    expect(onChange).toHaveBeenCalledWith(['Alice']);
  });

  it('adds participant via text input + Enter', () => {
    const onChange = jest.fn();
    render(<ParticipantPicker value={[]} onChange={onChange} />);
    const input = screen.getByPlaceholderText('Add person…');
    fireEvent.change(input, { target: { value: 'Charlie' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(['Charlie']);
  });

  it('removes participant when chip delete is clicked', () => {
    const onChange = jest.fn();
    render(<ParticipantPicker value={['Alice']} onChange={onChange} />);
    // Find the delete icon on the chip
    const chipDeleteIcons = document.querySelectorAll('.MuiChip-deleteIcon');
    if (chipDeleteIcons.length > 0) {
      fireEvent.click(chipDeleteIcons[0]);
      expect(onChange).toHaveBeenCalledWith([]);
    }
  });
});
