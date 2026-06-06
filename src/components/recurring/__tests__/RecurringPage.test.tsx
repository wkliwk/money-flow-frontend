import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RecurringPage from '../RecurringPage';
import { useRecurring } from '../../../hooks/useRecurring';
import { useFxRates } from '../../../hooks/useFxRates';

jest.mock('../../../hooks/useRecurring', () => ({
  useRecurring: jest.fn(),
}));

jest.mock('../../../hooks/useFxRates', () => ({
  useFxRates: jest.fn(),
}));

describe('RecurringPage', () => {
  const mockedUseRecurring = useRecurring as jest.MockedFunction<
    typeof useRecurring
  >;
  const mockedUseFxRates = useFxRates as jest.MockedFunction<typeof useFxRates>;

  beforeEach(() => {
    mockedUseRecurring.mockReturnValue({
      items: [],
      addItem: jest.fn(),
      deleteItem: jest.fn(),
      markApplied: jest.fn(),
    });
    mockedUseFxRates.mockReturnValue({
      symbol: '$',
      convert: (value: number) => value,
      currency: 'HKD',
      setCurrency: jest.fn(),
      loading: false,
      rates: { HKD: 1 } as never,
      rateForCurrency: jest.fn(),
    } as ReturnType<typeof useFxRates>);
  });

  it('opens the add form and submits a recurring item', async () => {
    const addItem = jest.fn();
    mockedUseRecurring.mockReturnValue({
      items: [],
      addItem,
      deleteItem: jest.fn(),
      markApplied: jest.fn(),
    });

    render(<RecurringPage />);

    await userEvent.click(
      screen.getByRole('button', { name: /add recurring transaction/i }),
    );

    await userEvent.type(screen.getByLabelText('Label'), 'Spotify');
    await userEvent.type(screen.getByLabelText('Amount (HKD)'), '12');

    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));

    expect(addItem).toHaveBeenCalledWith(
      expect.objectContaining({
        label: 'Spotify',
        amount: 12,
        type: 'expense',
      }),
    );
    expect(screen.queryByText(/new recurring/i)).not.toBeInTheDocument();
  });
});
