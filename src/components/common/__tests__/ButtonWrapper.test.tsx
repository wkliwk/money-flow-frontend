import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ButtonWrapper from '../ButtonWrapper';

describe('ButtonWrapper', () => {
  it('renders the label', () => {
    render(<ButtonWrapper label="Save" onClick={jest.fn()} />);
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = jest.fn();
    render(<ButtonWrapper label="Save" onClick={onClick} />);
    fireEvent.click(screen.getByText('Save'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
