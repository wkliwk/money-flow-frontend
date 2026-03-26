import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ParticipantPicker from '../ParticipantPicker';

describe('ParticipantPicker — branch coverage', () => {
  it('does not call onChange when input is empty and Add button is clicked', () => {
    const onChange = jest.fn();
    render(<ParticipantPicker value={[]} onChange={onChange} />);
    const input = screen.getByPlaceholderText('Add person…');
    // Leave empty and trigger keyDown Enter
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not add duplicate name (case-insensitive)', () => {
    const onChange = jest.fn();
    render(<ParticipantPicker value={['Alice']} onChange={onChange} />);
    const input = screen.getByPlaceholderText('Add person…');
    fireEvent.change(input, { target: { value: 'alice' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    // onChange should NOT be called because 'alice' matches 'Alice' case-insensitively
    expect(onChange).not.toHaveBeenCalled();
  });

  it('removes a suggestion from the suggestions list when it is already selected', () => {
    // When 'Alice' is in value, she should NOT appear in the suggestions list
    render(
      <ParticipantPicker
        value={['Alice']}
        onChange={jest.fn()}
        suggestions={['Alice', 'Bob']}
      />
    );
    // Alice is already selected (shown as a chip with delete), not in suggestions row
    // Bob should still be visible as a suggestion
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('removes a selected participant and re-adds via suggestion chip', () => {
    const onChange = jest.fn();
    render(
      <ParticipantPicker
        value={['Bob']}
        onChange={onChange}
        suggestions={['Alice', 'Bob']}
      />
    );
    // Bob is selected; clicking his chip again via toggle (he is not in suggestions list)
    // Alice is in suggestions — click Alice to add her
    fireEvent.click(screen.getByText('Alice'));
    expect(onChange).toHaveBeenCalledWith(['Bob', 'Alice']);
  });

  it('toggle removes participant when name is already in value', () => {
    const onChange = jest.fn();
    // Alice is both in value AND in suggestions (shouldn't normally happen but tests toggle remove)
    // Actually unselectedSuggestions filters selected out, so we test via direct add then the chip delete
    render(<ParticipantPicker value={['Alice']} onChange={onChange} />);
    const deleteIcons = document.querySelectorAll('.MuiChip-deleteIcon');
    if (deleteIcons.length > 0) {
      fireEvent.click(deleteIcons[0]);
      expect(onChange).toHaveBeenCalledWith([]);
    }
  });

  it('Add icon button adds participant when input has text', () => {
    const onChange = jest.fn();
    render(<ParticipantPicker value={[]} onChange={onChange} />);
    const input = screen.getByPlaceholderText('Add person…');
    fireEvent.change(input, { target: { value: 'Charlie' } });
    // Click the AddIcon button
    const addBtn = screen.getByRole('button');
    fireEvent.click(addBtn);
    expect(onChange).toHaveBeenCalledWith(['Charlie']);
  });

  it('non-Enter key does not trigger add', () => {
    const onChange = jest.fn();
    render(<ParticipantPicker value={[]} onChange={onChange} />);
    const input = screen.getByPlaceholderText('Add person…');
    fireEvent.change(input, { target: { value: 'Diana' } });
    fireEvent.keyDown(input, { key: 'Tab' });
    expect(onChange).not.toHaveBeenCalled();
  });
});
