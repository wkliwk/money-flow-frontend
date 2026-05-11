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

  it('submits parsed text and clears the input', async () => {
    const onParsed = jest.fn();
    mockedParseTransactionText.mockResolvedValue({
      merchant: 'McDonalds',
      amount: 65,
      currency: 'HKD',
      category: 'Food',
    });

    render(<NlpInput onParsed={onParsed} />);

    const input = screen.getByPlaceholderText(/麥當勞/i);
    await act(async () => {
      fireEvent.change(input, {
        target: { value: '今日同Casey食咗麥當勞 $65' },
      });
    });
    await act(async () => {
      fireEvent.keyDown(input, { key: 'Enter' });
    });

    await waitFor(() => {
      expect(onParsed).toHaveBeenCalledWith({
        merchant: 'McDonalds',
        amount: 65,
        currency: 'HKD',
        category: 'Food',
      });
    });

    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });
});
