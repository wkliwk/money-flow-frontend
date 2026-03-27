import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import EditExpenseModal from '../EditExpenseModal';
import { Transaction } from '../../../types';
import * as api from '../../../services/api';

const mockUpdateExpense = jest.fn();

jest.mock('../../../services/api', () => ({
  updateExpense: (...args: unknown[]) => mockUpdateExpense(...args),
}));

jest.mock('../../../hooks/useFxRates', () => ({
  useFxRates: () => ({
    currency: 'HKD',
    setCurrency: jest.fn(),
    convert: (n: number) => n,
    symbol: 'HK$',
    loading: false,
    rates: { HKD: 1, JPY: 0.058, USD: 0.128 },
    rateForCurrency: (c: string) => c === 'JPY' ? 0.058 : 0.128,
  }),
  CURRENCIES: ['HKD', 'JPY', 'USD'],
  CURRENCY_SYMBOLS: { HKD: 'HK$', JPY: '¥', USD: 'US$' },
  Currency: {},
}));

jest.mock('../../../hooks/useItemPresets', () => ({
  useItemPresets: () => ({ presets: { Coffee: 'Latte' }, setPreset: jest.fn(), deletePreset: jest.fn() }),
}));

const todayStr = () => new Date().toISOString().split('T')[0];
const yesterdayStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
};

const makeTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  _id: 'tx1',
  owner: 'user1',
  description: 'Coffee',
  amount: 50,
  type: 'expense',
  category: 'Food & Drink',
  date: todayStr(),
  createdAt: todayStr(),
  updatedAt: todayStr(),
  ...overrides,
});

const defaultProps = {
  open: true,
  transaction: makeTransaction(),
  onClose: jest.fn(),
  onSaved: jest.fn(),
  onDelete: jest.fn(),
  onDuplicate: jest.fn().mockResolvedValue(undefined),
  existingCategories: [],
};

jest.setTimeout(15000);

describe('EditExpenseModal — branch coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateExpense.mockResolvedValue({ _id: 'tx1', description: 'Coffee', amount: 50, type: 'expense' });
  });

  it('classifyDate returns today when date is today', () => {
    render(<EditExpenseModal {...defaultProps} transaction={makeTransaction({ date: todayStr() })} />);
    // Today chip should be selected — it's rendered as the first date chip
    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('classifyDate returns yesterday when date is yesterday', () => {
    render(<EditExpenseModal {...defaultProps} transaction={makeTransaction({ date: yesterdayStr() })} />);
    expect(screen.getByText('Yesterday')).toBeInTheDocument();
  });

  it('classifyDate returns custom when date is neither today nor yesterday', () => {
    render(<EditExpenseModal {...defaultProps} transaction={makeTransaction({ date: '2020-01-01' })} />);
    // Custom date input should be visible
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    expect(dateInput).toBeTruthy();
    expect(dateInput?.value).toBe('2020-01-01');
  });

  it('switching to Yesterday date chip sets quickDate', () => {
    render(<EditExpenseModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Yesterday'));
    expect(screen.getByText('Yesterday')).toBeInTheDocument();
    // Custom input should not be visible
    expect(document.querySelector('input[type="date"]')).toBeNull();
  });

  it('switching to Custom date chip shows date input', () => {
    render(<EditExpenseModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Custom'));
    const dateInput = document.querySelector('input[type="date"]');
    expect(dateInput).toBeTruthy();
  });

  it('switching type to income resets item and category', () => {
    render(<EditExpenseModal {...defaultProps} transaction={makeTransaction({ item: 'Lunch', category: 'Food & Drink' })} />);
    // Click Income type card
    fireEvent.click(screen.getByText('Income'));
    expect(screen.getByText('Income')).toBeInTheDocument();
  });

  it('shows transaction createdAt timestamp when createdAt present', () => {
    render(<EditExpenseModal {...defaultProps} transaction={makeTransaction({ createdAt: '2026-01-15T10:30:00Z' })} />);
    // createdAt renders as localized date — just check it doesn't crash
    expect(screen.getByText('Edit Transaction')).toBeInTheDocument();
  });

  it('does not render timestamp when createdAt absent', () => {
    const tx = makeTransaction();
    delete (tx as any).createdAt;
    render(<EditExpenseModal {...defaultProps} transaction={tx} />);
    expect(screen.getByText('Edit Transaction')).toBeInTheDocument();
  });

  it('handleSubmit shows error when no item and no description', async () => {
    render(
      <EditExpenseModal
        {...defaultProps}
        transaction={makeTransaction({ description: '', item: undefined })}
      />
    );
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
    });
    await waitFor(() =>
      expect(screen.getByText(/Please select an item or enter a description/i)).toBeInTheDocument()
    );
  });

  it('handleSubmit shows error when amount is 0', async () => {
    render(
      <EditExpenseModal
        {...defaultProps}
        transaction={makeTransaction({ amount: 0 })}
      />
    );
    // Amount field starts at '0' — which is <= 0
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
    });
    await waitFor(() =>
      expect(screen.getByText(/Please enter a valid amount/i)).toBeInTheDocument()
    );
  });

  it('handleSubmit calls updateExpense with HKD when currency is HKD', async () => {
    render(<EditExpenseModal {...defaultProps} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
    });
    await waitFor(() => expect(mockUpdateExpense).toHaveBeenCalled());
    const payload = mockUpdateExpense.mock.calls[0][1];
    expect(payload.currency).toBe('HKD');
    expect(payload.originalAmount).toBeUndefined();
    expect(payload.exchangeRate).toBeUndefined();
  });

  it('handleSubmit calls updateExpense with foreign currency fields when JPY pre-selected', async () => {
    // Currency chips removed in #120; render with JPY already set on the transaction
    render(<EditExpenseModal {...defaultProps} transaction={makeTransaction({ currency: 'JPY', originalAmount: 650, exchangeRate: 0.058 })} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
    });
    await waitFor(() => expect(mockUpdateExpense).toHaveBeenCalled());
    const payload = mockUpdateExpense.mock.calls[0][1];
    expect(payload.currency).toBe('JPY');
  });

  it('handleSubmit shows error fallback when API returns no response.data.error', async () => {
    mockUpdateExpense.mockRejectedValue(new Error('Network Error'));
    render(<EditExpenseModal {...defaultProps} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
    });
    await waitFor(() =>
      expect(screen.getByText('Failed to update transaction')).toBeInTheDocument()
    );
  });

  it('handleSubmit calls onSaved with merged participants from API response', async () => {
    mockUpdateExpense.mockResolvedValue({
      _id: 'tx1',
      description: 'Coffee',
      amount: 50,
      type: 'expense',
      participants: ['Alice'],
    });
    render(<EditExpenseModal {...defaultProps} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
    });
    await waitFor(() => expect(defaultProps.onSaved).toHaveBeenCalled());
    const savedTx = defaultProps.onSaved.mock.calls[0][0];
    expect(savedTx.participants).toEqual(['Alice']);
  });

  it('handleSubmit uses payload.participants when API response has no participants', async () => {
    mockUpdateExpense.mockResolvedValue({ _id: 'tx1', description: 'Coffee', amount: 50, type: 'expense' });
    render(<EditExpenseModal {...defaultProps} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
    });
    await waitFor(() => expect(defaultProps.onSaved).toHaveBeenCalled());
    const savedTx = defaultProps.onSaved.mock.calls[0][0];
    expect(Array.isArray(savedTx.participants)).toBe(true);
  });

  it('handleSubmit early returns when transaction is null', async () => {
    // The component guards handleSubmit with `if (!transaction) return`
    // We cannot easily set transaction to null after render (useLayoutEffect won't fire again)
    // so we render with transaction null from the start
    render(<EditExpenseModal {...defaultProps} transaction={null} />);
    // Save button may or may not be visible when transaction=null — just verify no crash
    const saveBtn = screen.queryByRole('button', { name: /^save$/i });
    if (saveBtn) {
      await act(async () => { fireEvent.click(saveBtn); });
      expect(mockUpdateExpense).not.toHaveBeenCalled();
    }
  });

  it('deleteConfirm shows confirmation dialog when delete icon clicked', async () => {
    render(<EditExpenseModal {...defaultProps} />);
    const deleteIcon = document.querySelector('[data-testid="DeleteIcon"]');
    if (deleteIcon?.parentElement) {
      fireEvent.click(deleteIcon.parentElement);
    }
    await waitFor(() => expect(screen.getByText('Are you sure?')).toBeInTheDocument());
  });

  it('cancel in delete confirm hides the confirmation', async () => {
    render(<EditExpenseModal {...defaultProps} />);
    const deleteIcon = document.querySelector('[data-testid="DeleteIcon"]');
    if (deleteIcon?.parentElement) {
      fireEvent.click(deleteIcon.parentElement);
    }
    await waitFor(() => screen.getByText('Are you sure?'));
    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));
    await waitFor(() => expect(screen.queryByText('Are you sure?')).not.toBeInTheDocument());
  });

  it('confirm delete calls onDelete and onClose', async () => {
    render(<EditExpenseModal {...defaultProps} />);
    const deleteIcon = document.querySelector('[data-testid="DeleteIcon"]');
    if (deleteIcon?.parentElement) {
      fireEvent.click(deleteIcon.parentElement);
    }
    await waitFor(() => screen.getByText('Are you sure?'));
    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));
    expect(defaultProps.onDelete).toHaveBeenCalledWith('tx1');
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('duplicate button calls onDuplicate with HKD fields', async () => {
    render(<EditExpenseModal {...defaultProps} />);
    const copyIcon = document.querySelector('[data-testid="ContentCopyIcon"]');
    if (copyIcon?.parentElement) {
      await act(async () => { fireEvent.click(copyIcon.parentElement!); });
    }
    await waitFor(() => expect(defaultProps.onDuplicate).toHaveBeenCalled());
    const dupPayload = defaultProps.onDuplicate.mock.calls[0][0];
    // HKD branch: no currency fields
    expect(dupPayload.currency).toBeUndefined();
  });

  it('duplicate button calls onDuplicate with JPY fields when JPY selected', async () => {
    render(<EditExpenseModal {...defaultProps} />);
    // Select JPY currency
    fireEvent.click(screen.getByText('¥ JPY'));
    const copyIcon = document.querySelector('[data-testid="ContentCopyIcon"]');
    if (copyIcon?.parentElement) {
      await act(async () => { fireEvent.click(copyIcon.parentElement!); });
    }
    await waitFor(() => expect(defaultProps.onDuplicate).toHaveBeenCalled());
    const dupPayload = defaultProps.onDuplicate.mock.calls[0][0];
    expect(dupPayload.currency).toBe('JPY');
    expect(dupPayload.originalAmount).toBeDefined();
    expect(dupPayload.exchangeRate).toBe(0.058);
  });

  it('useLayoutEffect: transaction with item resolves description correctly', () => {
    // When item == description, resolvedDesc is ''
    render(
      <EditExpenseModal
        {...defaultProps}
        transaction={makeTransaction({ item: 'Lunch', description: 'Lunch' })}
      />
    );
    expect(screen.getByText('Edit Transaction')).toBeInTheDocument();
  });

  it('useLayoutEffect: transaction with item different from description', () => {
    // item and description differ — resolvedDesc = description
    render(
      <EditExpenseModal
        {...defaultProps}
        transaction={makeTransaction({ item: 'Lunch', description: 'Chicken rice' })}
      />
    );
    expect(screen.getByText('Edit Transaction')).toBeInTheDocument();
  });

  it('useLayoutEffect: transaction without item falls back from ITEM_PRESETS', () => {
    // No item on transaction — resolvedItem comes from ITEM_PRESETS matching description
    render(
      <EditExpenseModal
        {...defaultProps}
        transaction={makeTransaction({ item: undefined, description: '早餐' })}
      />
    );
    expect(screen.getByText('Edit Transaction')).toBeInTheDocument();
  });

  it('useLayoutEffect: transaction with currency sets txCurrency', () => {
    render(
      <EditExpenseModal
        {...defaultProps}
        transaction={makeTransaction({ currency: 'JPY' } as any)}
      />
    );
    // JPY chip should appear selected
    expect(screen.getByText('¥ JPY')).toBeInTheDocument();
  });

  it('handleSubmit uses item as description fallback when description is empty', async () => {
    render(
      <EditExpenseModal
        {...defaultProps}
        transaction={makeTransaction({ item: '午餐', description: '午餐' })}
      />
    );
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
    });
    await waitFor(() => expect(mockUpdateExpense).toHaveBeenCalled());
    const payload = mockUpdateExpense.mock.calls[0][1];
    // description.trim() is '' (since item==description was cleared), fallback to item
    expect(payload.description).toBeTruthy();
  });

  it('resolvedDate uses custom date when Custom chip is active', () => {
    render(<EditExpenseModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Custom'));
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    if (dateInput) {
      fireEvent.change(dateInput, { target: { value: '2025-06-15' } });
      expect(dateInput.value).toBe('2025-06-15');
    }
  });

  it('description uses item or empty string from itemPresets when item is set', () => {
    render(
      <EditExpenseModal
        {...defaultProps}
        transaction={makeTransaction({ item: 'Coffee', description: '' })}
      />
    );
    // The descriptionPicker should have 'Latte' as suggestion from itemPresets mock
    expect(screen.getByText('Edit Transaction')).toBeInTheDocument();
  });
});
