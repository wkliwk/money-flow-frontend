import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import NlpInput from '../NlpInput';
import { parseTransactionText } from '../../../services/api';

jest.mock('../../../services/api', () => ({
  parseTransactionText: jest.fn(),
}));

describe('NlpInput happy path', () => {
  const mockedParseTransactionText = parseTransactionText as jest.MockedFunction<
    typeof parseTransactionText
  >;

  beforeEach(() => {
    mockedParseTransactionText.mockReset();
  });

  it('calls onParsed with result and clears input on success', async () => {
    const onParsed = jest.fn();
    mockedParseTransactionText.mockResolvedValue({
      merchant: 'Coffee',
      amount: 35,
      category: 'Food & Drink',
    });

    render(<NlpInput onParsed={onParsed} />);

    const input = screen.getByRole('textbox');
    await act(async () => {
      fireEvent.change(input, { target: { value: 'coffee 35' } });
    });

    // NlpInput triggers parse on Enter key (no submit button)
    await act(async () => {
      fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });
    });

    await waitFor(() => {
      expect(mockedParseTransactionText).toHaveBeenCalledWith('coffee 35');
    });

    await waitFor(() => {
      expect(onParsed).toHaveBeenCalledWith(
        expect.objectContaining({ merchant: 'Coffee', amount: 35 }),
      );
    });

    await waitFor(() => {
      expect((input as HTMLInputElement).value).toBe('');
    });
  });
});
