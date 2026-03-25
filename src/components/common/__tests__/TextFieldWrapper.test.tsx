import React from 'react';
import { render, screen } from '@testing-library/react';
import TextFieldWrapper from '../TextFieldWrapper';

describe('TextFieldWrapper', () => {
  it('renders with the given label', () => {
    render(<TextFieldWrapper label="Amount" type="number" value="100" onChange={jest.fn()} />);
    expect(screen.getByLabelText('Amount')).toBeInTheDocument();
  });
});
