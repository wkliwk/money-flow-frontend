import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ParticipantPicker from '../ParticipantPicker';

const setup = (props: Partial<React.ComponentProps<typeof ParticipantPicker>> = {}) => {
  const onChange = props.onChange || jest.fn();
  const utils = render(
    <ParticipantPicker
      value={props.value ?? []}
      onChange={onChange}
      suggestions={props.suggestions}
    />
  );
  const input = screen.getByPlaceholderText('Add person…');
  // The add button is the IconButton (not chip buttons)
  const addBtn = screen.getAllByRole('button').find((b) => b.querySelector('svg'))!;
  return { ...utils, input, addBtn, onChange };
};

describe('ParticipantPicker', () => {
  it('renders input and disabled add button when input is empty', () => {
    const { input, addBtn } = setup();
    expect(input).toBeInTheDocument();
    expect(addBtn).toBeDisabled();
  });

  it('enables add button when input has value', () => {
    const { input, addBtn } = setup();
    fireEvent.change(input, { target: { value: 'Alice' } });
    expect(addBtn).not.toBeDisabled();
  });

  it('adds participant on Add button click', () => {
    const { input, addBtn, onChange } = setup();
    fireEvent.change(input, { target: { value: 'Alice' } });
    fireEvent.click(addBtn);
    expect(onChange).toHaveBeenCalledWith(['Alice']);
  });

  it('adds participant on Enter key press', () => {
    const { input, onChange } = setup();
    fireEvent.change(input, { target: { value: 'Bob' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(['Bob']);
  });

  it('trims whitespace before storing', () => {
    const { input, addBtn, onChange } = setup();
    fireEvent.change(input, { target: { value: '  Alice  ' } });
    fireEvent.click(addBtn);
    expect(onChange).toHaveBeenCalledWith(['Alice']);
  });

  it('prevents duplicate names (case-insensitive)', () => {
    const onChange = jest.fn();
    render(<ParticipantPicker value={['Alice']} onChange={onChange} />);
    const input = screen.getByPlaceholderText('Add person…');
    fireEvent.change(input, { target: { value: 'alice' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('clears input after adding', () => {
    const { input, addBtn } = setup();
    fireEvent.change(input, { target: { value: 'Alice' } });
    fireEvent.click(addBtn);
    expect(input).toHaveValue('');
  });

  it('renders selected participants as chips', () => {
    render(<ParticipantPicker value={['Alice', 'Bob']} onChange={jest.fn()} />);
    expect(screen.getAllByText('Alice').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Bob').length).toBeGreaterThan(0);
  });

  it('removes participant when chip delete is clicked', () => {
    const onChange = jest.fn();
    render(<ParticipantPicker value={['Alice', 'Bob']} onChange={onChange} />);
    const deleteButtons = screen.getAllByRole('button', { name: /alice/i });
    // The delete icon button is within the chip
    const aliceChip = screen.getByText('Alice').closest('.MuiChip-root');
    const deleteIcon = aliceChip?.querySelector('.MuiChip-deleteIcon');
    if (deleteIcon) fireEvent.click(deleteIcon);
    expect(onChange).toHaveBeenCalledWith(['Bob']);
  });

  it('shows unselected suggestions as chips', () => {
    render(<ParticipantPicker value={['Alice']} onChange={jest.fn()} suggestions={['Alice', 'Bob', 'Charlie']} />);
    // Bob and Charlie should appear as clickable suggestions
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
    // Alice appears as selected chip only (1 instance)
    expect(screen.getAllByText('Alice')).toHaveLength(1);
  });

  it('adds suggestion to selection when clicked', () => {
    const onChange = jest.fn();
    render(<ParticipantPicker value={[]} onChange={onChange} suggestions={['Alice', 'Bob']} />);
    fireEvent.click(screen.getByText('Alice'));
    expect(onChange).toHaveBeenCalledWith(['Alice']);
  });

  it('does not show suggestion already in value', () => {
    render(<ParticipantPicker value={['Alice']} onChange={jest.fn()} suggestions={['Alice', 'Bob']} />);
    // Alice selected chip only, not duplicated in suggestions section
    expect(screen.getAllByText('Alice')).toHaveLength(1);
    // Bob is shown as suggestion
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('does not call onChange when input is empty and Enter is pressed', () => {
    const { input, onChange } = setup();
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).not.toHaveBeenCalled();
  });
});
