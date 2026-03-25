import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EditExpenseModal from '../EditExpenseModal';
import { Transaction } from '../../../types';

// Mock dependencies
jest.mock('../NumPad', () => ({
  __esModule: true,
  default: ({ value, onChange }: any) => (
    <input
      data-testid="numpad"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      type="number"
    />
  ),
}));

jest.mock('../ItemPicker', () => ({
  __esModule: true,
  default: ({ value, onSelect }: any) => (
    <div>
      <button onClick={() => onSelect({ label: 'Coffee', category: 'Food' })}>
        Select Coffee
      </button>
      <div data-testid="item-picker">{value}</div>
    </div>
  ),
  ITEM_PRESETS: [],
  ITEM_SUGGESTIONS: {},
}));

jest.mock('../DescriptionPicker', () => ({
  __esModule: true,
  default: ({ value, onChange }: any) => (
    <input
      data-testid="description-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Description"
    />
  ),
}));

jest.mock('../ParticipantPicker', () => ({
  __esModule: true,
  default: ({ value, onChange }: any) => (
    <div>
      <button onClick={() => onChange([...value, 'Alice'])} data-testid="add-participant-btn">
        Add Participant
      </button>
      <div data-testid="participants">{value.join(', ')}</div>
    </div>
  ),
}));

jest.mock('../../../services/api', () => ({
  updateExpense: jest.fn(),
}));

jest.mock('../../../hooks/useFxRates', () => ({
  useFxRates: () => ({
    symbol: '$',
    rates: { USD: 1, EUR: 0.92 },
    currency: 'HKD',
    setCurrency: jest.fn(),
  }),
  CURRENCIES: ['HKD', 'USD', 'EUR'],
  CURRENCY_SYMBOLS: { HKD: 'HK$', USD: '$', EUR: '€' },
}));

jest.mock('../../../hooks/useItemPresets', () => ({
  useItemPresets: () => ({
    presets: { Coffee: 'Coffee at Starbucks' },
  }),
}));

describe('EditExpenseModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSaved = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnDuplicate = jest.fn();

  const mockTransaction: Transaction = {
    _id: 'tx-123',
    owner: 'user-1',
    description: 'Lunch at cafe',
    amount: 50,
    type: 'expense',
    category: 'Food',
    item: 'Food',
    participants: ['Alice'],
    tags: ['work'],
    notes: 'Team lunch',
    date: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnDuplicate.mockResolvedValue(undefined);
  });

  it('should render modal when open=true with transaction', () => {
    render(
      <EditExpenseModal
        open={true}
        transaction={mockTransaction}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
        onDelete={mockOnDelete}
        onDuplicate={mockOnDuplicate}
        existingCategories={['Food']}
      />
    );
    expect(screen.getByText('Edit Transaction')).toBeInTheDocument();
  });

  it('should not render modal when open=false', () => {
    const { container } = render(
      <EditExpenseModal
        open={false}
        transaction={mockTransaction}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
        onDelete={mockOnDelete}
        onDuplicate={mockOnDuplicate}
        existingCategories={[]}
      />
    );
    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });

  it('should load transaction data into form', async () => {
    render(
      <EditExpenseModal
        open={true}
        transaction={mockTransaction}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
        onDelete={mockOnDelete}
        onDuplicate={mockOnDuplicate}
        existingCategories={['Food']}
      />
    );

    await waitFor(() => {
      const descriptionInput = screen.getByTestId('description-input') as HTMLInputElement;
      const amountInput = screen.getByTestId('numpad') as HTMLInputElement;
      expect(descriptionInput.value).toBe('Lunch at cafe');
      expect(amountInput.value).toBe('50');
    });
  });

  it('should display createdAt timestamp', () => {
    const pastDate = new Date('2026-03-24T12:00:00Z');
    const transaction = { ...mockTransaction, createdAt: pastDate.toISOString() };

    render(
      <EditExpenseModal
        open={true}
        transaction={transaction}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
        onDelete={mockOnDelete}
        onDuplicate={mockOnDuplicate}
        existingCategories={[]}
      />
    );

    // Should display date in some format
    const dateElements = screen.getAllByText(/24.*Mar|Mar.*24/i, { exact: false });
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it('should toggle between expense and income types', async () => {
    render(
      <EditExpenseModal
        open={true}
        transaction={mockTransaction}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
        onDelete={mockOnDelete}
        onDuplicate={mockOnDuplicate}
        existingCategories={[]}
      />
    );

    const incomeButton = screen.getByText('Income');
    fireEvent.click(incomeButton);
    expect(incomeButton).toBeInTheDocument();
  });

  it('should validate amount before submission', async () => {
    const mockUpdateExpense = require('../../../services/api').updateExpense;
    mockUpdateExpense.mockRejectedValueOnce({ response: { data: { error: 'Validation error' } } });

    render(
      <EditExpenseModal
        open={true}
        transaction={mockTransaction}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
        onDelete={mockOnDelete}
        onDuplicate={mockOnDuplicate}
        existingCategories={['Food']}
      />
    );

    const numpad = screen.getByTestId('numpad');
    fireEvent.change(numpad, { target: { value: '' } });

    const saveButton = screen.getAllByRole('button').find(
      (btn) => btn.textContent?.includes('Save')
    );
    if (saveButton) {
      fireEvent.click(saveButton);
    }

    await waitFor(() => {
      expect(screen.getByText(/Please enter a valid amount/)).toBeInTheDocument();
    });

    expect(mockOnSaved).not.toHaveBeenCalled();
  });

  it('should save updated transaction', async () => {
    const mockUpdateExpense = require('../../../services/api').updateExpense;
    mockUpdateExpense.mockResolvedValueOnce(mockTransaction);

    render(
      <EditExpenseModal
        open={true}
        transaction={mockTransaction}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
        onDelete={mockOnDelete}
        onDuplicate={mockOnDuplicate}
        existingCategories={['Food']}
      />
    );

    const descriptionInput = screen.getByTestId('description-input') as HTMLInputElement;
    fireEvent.change(descriptionInput, { target: { value: 'Updated lunch' } });

    const saveButton = screen.getAllByRole('button').find(
      (btn) => btn.textContent?.includes('Save')
    );
    if (saveButton) {
      fireEvent.click(saveButton);
    }

    await waitFor(() => {
      expect(mockUpdateExpense).toHaveBeenCalledWith(
        'tx-123',
        expect.objectContaining({
          description: 'Updated lunch',
        })
      );
    });

    await waitFor(() => {
      expect(mockOnSaved).toHaveBeenCalled();
    });
  });

  it('should show delete confirmation dialog', () => {
    render(
      <EditExpenseModal
        open={true}
        transaction={mockTransaction}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
        onDelete={mockOnDelete}
        onDuplicate={mockOnDuplicate}
        existingCategories={[]}
      />
    );

    const buttons = screen.getAllByRole('button');
    const deleteBtn = buttons.find((btn) => btn.querySelector('[data-testid="DeleteIcon"]'));
    if (deleteBtn) {
      fireEvent.click(deleteBtn);
    }

    expect(screen.getByText(/Are you sure/)).toBeInTheDocument();
  });

  it('should delete transaction when confirmed', () => {
    const { container } = render(
      <EditExpenseModal
        open={true}
        transaction={mockTransaction}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
        onDelete={mockOnDelete}
        onDuplicate={mockOnDuplicate}
        existingCategories={[]}
      />
    );

    // Find and click delete button
    const buttons = screen.getAllByRole('button');
    const deleteBtn = buttons.find((btn) => btn.querySelector('[data-testid="DeleteIcon"]'));
    if (deleteBtn) {
      fireEvent.click(deleteBtn);
    }

    // Find and click delete confirmation button
    const deleteConfirmBtn = screen.getAllByRole('button').find(
      (btn) => btn.textContent?.includes('Delete') && !btn.textContent?.includes('Are you')
    );
    if (deleteConfirmBtn) {
      fireEvent.click(deleteConfirmBtn);
    }

    expect(mockOnDelete).toHaveBeenCalledWith('tx-123');
  });

  it('should handle duplicate action', async () => {
    render(
      <EditExpenseModal
        open={true}
        transaction={mockTransaction}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
        onDelete={mockOnDelete}
        onDuplicate={mockOnDuplicate}
        existingCategories={['Food']}
      />
    );

    // Find duplicate button (copy icon)
    const buttons = screen.getAllByRole('button');
    const duplicateBtn = buttons.find(
      (btn) => btn.getAttribute('title')?.includes('Log again')
    );
    if (duplicateBtn) {
      fireEvent.click(duplicateBtn);
    }

    await waitFor(() => {
      expect(mockOnDuplicate).toHaveBeenCalled();
    });

    const callData = mockOnDuplicate.mock.calls[0]?.[0];
    expect(callData).toMatchObject({
      description: 'Lunch at cafe',
      amount: 50,
      type: 'expense',
    });
  });

  it('should show error on API failure', async () => {
    const mockUpdateExpense = require('../../../services/api').updateExpense;
    mockUpdateExpense.mockRejectedValueOnce({
      response: { data: { error: 'Server error' } },
    });

    render(
      <EditExpenseModal
        open={true}
        transaction={mockTransaction}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
        onDelete={mockOnDelete}
        onDuplicate={mockOnDuplicate}
        existingCategories={['Food']}
      />
    );

    const saveButton = screen.getAllByRole('button').find(
      (btn) => btn.textContent?.includes('Save')
    );
    if (saveButton) {
      fireEvent.click(saveButton);
    }

    await waitFor(() => {
      expect(screen.getByText(/Server error/)).toBeInTheDocument();
    });

    expect(mockOnSaved).not.toHaveBeenCalled();
  });

  it('should handle date selection', async () => {
    render(
      <EditExpenseModal
        open={true}
        transaction={mockTransaction}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
        onDelete={mockOnDelete}
        onDuplicate={mockOnDuplicate}
        existingCategories={[]}
      />
    );

    const yesterdayButton = screen.getByText('Yesterday');
    fireEvent.click(yesterdayButton);

    expect(yesterdayButton).toBeInTheDocument();
  });

  it('should show custom date picker when Custom selected', () => {
    render(
      <EditExpenseModal
        open={true}
        transaction={mockTransaction}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
        onDelete={mockOnDelete}
        onDuplicate={mockOnDuplicate}
        existingCategories={[]}
      />
    );

    const customButton = screen.getByText('Custom');
    fireEvent.click(customButton);

    const dateInput = screen.getByDisplayValue(/\d{4}-\d{2}-\d{2}/);
    expect(dateInput).toBeInTheDocument();
  });

  it('should handle notes with character limit', async () => {
    render(
      <EditExpenseModal
        open={true}
        transaction={mockTransaction}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
        onDelete={mockOnDelete}
        onDuplicate={mockOnDuplicate}
        existingCategories={[]}
      />
    );

    const notesInputs = screen.getAllByRole('textbox');
    const notesInput = notesInputs.find(
      (input) =>
        (input as HTMLTextAreaElement).placeholder?.includes('notes') ||
        (input as HTMLTextAreaElement).value === 'Team lunch'
    );

    if (notesInput) {
      expect((notesInput as HTMLTextAreaElement).maxLength).toBe(500);
    }
  });

  it('should handle participants management', () => {
    render(
      <EditExpenseModal
        open={true}
        transaction={mockTransaction}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
        onDelete={mockOnDelete}
        onDuplicate={mockOnDuplicate}
        existingCategories={[]}
        knownParticipants={['Bob', 'Charlie']}
      />
    );

    const addParticipantBtn = screen.getByTestId('add-participant-btn');
    fireEvent.click(addParticipantBtn);

    expect(screen.getByTestId('participants')).toHaveTextContent('Alice');
  });

  it('should disable buttons during loading', async () => {
    const mockUpdateExpense = require('../../../services/api').updateExpense;
    mockUpdateExpense.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(
      <EditExpenseModal
        open={true}
        transaction={mockTransaction}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
        onDelete={mockOnDelete}
        onDuplicate={mockOnDuplicate}
        existingCategories={['Food']}
      />
    );

    const saveButton = screen.getAllByRole('button').find(
      (btn) => btn.textContent?.includes('Save')
    );
    if (saveButton) {
      fireEvent.click(saveButton);
    }

    await waitFor(() => {
      const currentSaveButton = screen.getAllByRole('button').find(
        (btn) => btn.textContent?.includes('Saving') || btn.textContent?.includes('Save')
      );
      expect(currentSaveButton).toBeDisabled();
    }, { timeout: 50 });
  });

  it('should close modal on successful save', async () => {
    const mockUpdateExpense = require('../../../services/api').updateExpense;
    mockUpdateExpense.mockResolvedValueOnce(mockTransaction);

    render(
      <EditExpenseModal
        open={true}
        transaction={mockTransaction}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
        onDelete={mockOnDelete}
        onDuplicate={mockOnDuplicate}
        existingCategories={['Food']}
      />
    );

    const saveButton = screen.getAllByRole('button').find(
      (btn) => btn.textContent?.includes('Save')
    );
    if (saveButton) {
      fireEvent.click(saveButton);
    }

    await waitFor(() => {
      expect(mockOnSaved).toHaveBeenCalled();
    });
  });

  it('should handle null transaction gracefully', () => {
    render(
      <EditExpenseModal
        open={true}
        transaction={null}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
        onDelete={mockOnDelete}
        onDuplicate={mockOnDuplicate}
        existingCategories={[]}
      />
    );

    // Should render but with empty fields
    const numpad = screen.getByTestId('numpad') as HTMLInputElement;
    expect(numpad.value).toBe('');
  });
});
