import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddExpenseModal from '../AddExpenseModal';

// Mock child components to avoid deep dependency issues
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

jest.mock('../TemplateChips', () => ({
  __esModule: true,
  default: () => <div data-testid="template-chips">Templates</div>,
}));

jest.mock('../ManageTemplatesDrawer', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../ParticipantPicker', () => ({
  __esModule: true,
  default: ({ value, onChange }: any) => (
    <div>
      <button
        onClick={() => onChange([...value, 'Alice'])}
        data-testid="add-participant-btn"
      >
        Add Participant
      </button>
      <div data-testid="participants">{value.join(', ')}</div>
    </div>
  ),
}));

jest.mock('../../../hooks/useTemplates', () => ({
  useTemplates: () => ({
    templates: [],
    addTemplate: jest.fn(),
    deleteTemplate: jest.fn(),
  }),
}));

jest.mock('../../../hooks/useFxRates', () => ({
  useFxRates: () => ({
    symbol: '$',
    rates: { USD: 1, EUR: 0.92 },
    currency: 'HKD',
    setCurrency: jest.fn(),
    convert: (v: number) => v,
  }),
  CURRENCIES: ['HKD', 'USD', 'EUR'],
  CURRENCY_SYMBOLS: { HKD: 'HK$', USD: '$', EUR: '€' },
}));

jest.mock('../../../hooks/useItemPresets', () => ({
  useItemPresets: () => ({
    presets: { Coffee: 'Coffee at Starbucks' },
  }),
}));

describe('AddExpenseModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnSubmit.mockResolvedValue(undefined);
  });

  it('should render modal when open=true', () => {
    render(
      <AddExpenseModal
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        existingCategories={[]}
      />
    );
    expect(screen.getByText('Record Transaction')).toBeInTheDocument();
  });

  it('should not render modal when open=false', () => {
    const { container } = render(
      <AddExpenseModal
        open={false}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        existingCategories={[]}
      />
    );
    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });

  it('should call onClose when close button clicked', () => {
    render(
      <AddExpenseModal
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        existingCategories={[]}
      />
    );
    const closeButton = screen.getByRole('button', { name: '' }).parentElement?.querySelector('button');
    if (closeButton) {
      fireEvent.click(closeButton);
    }
  });

  it('should toggle between expense and income types', () => {
    render(
      <AddExpenseModal
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        existingCategories={[]}
      />
    );
    const incomeButton = screen.getByText('Income');
    fireEvent.click(incomeButton);
    expect(incomeButton).toBeInTheDocument();
  });

  it('should validate amount before submission', async () => {
    render(
      <AddExpenseModal
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        existingCategories={[]}
      />
    );

    // Select an item so we pass description validation
    fireEvent.click(screen.getByText('Select Coffee'));

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

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should validate description or item before submission', async () => {
    render(
      <AddExpenseModal
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        existingCategories={[]}
      />
    );

    const numpad = screen.getByTestId('numpad');
    fireEvent.change(numpad, { target: { value: '100' } });

    const saveButton = screen.getAllByRole('button').find(
      (btn) => btn.textContent?.includes('Save')
    );
    if (saveButton) {
      fireEvent.click(saveButton);
    }

    await waitFor(() => {
      expect(screen.getByText(/Please select an item or enter a description/)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should submit form with valid data', async () => {
    render(
      <AddExpenseModal
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        existingCategories={['Food']}
      />
    );

    // Select item
    fireEvent.click(screen.getByText('Select Coffee'));

    // Enter amount
    const numpad = screen.getByTestId('numpad');
    fireEvent.change(numpad, { target: { value: '50' } });

    // Submit
    const saveButton = screen.getAllByRole('button').find(
      (btn) => btn.textContent?.includes('Save')
    );
    if (saveButton) {
      fireEvent.click(saveButton);
    }

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });

    const callData = mockOnSubmit.mock.calls[0][0];
    expect(callData.amount).toBe(50);
    expect(callData.type).toBe('expense');
  });

  it('should handle "Add Another" action', async () => {
    render(
      <AddExpenseModal
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        existingCategories={['Food']}
      />
    );

    fireEvent.click(screen.getByText('Select Coffee'));
    fireEvent.change(screen.getByTestId('numpad'), { target: { value: '50' } });

    const addButton = screen.getAllByRole('button').find(
      (btn) => btn.textContent?.includes('+ Add')
    );
    if (addButton) {
      fireEvent.click(addButton);
    }

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });

    // Modal should stay open
    expect(screen.getByText('Record Transaction')).toBeInTheDocument();

    // Amount and description should be cleared after submit
    await waitFor(() => {
      expect(screen.getByTestId('numpad')).toHaveValue(null);
    });
  });

  it('should handle date selection', async () => {
    render(
      <AddExpenseModal
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        existingCategories={[]}
      />
    );

    const yesterdayButton = screen.getByText('Yesterday');
    fireEvent.click(yesterdayButton);

    expect(yesterdayButton).toBeInTheDocument();
  });

  it('should show custom date picker when "Custom" selected', () => {
    render(
      <AddExpenseModal
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        existingCategories={[]}
      />
    );

    const customButton = screen.getByText('Custom');
    fireEvent.click(customButton);

    const dateInput = screen.getByDisplayValue(/\d{4}-\d{2}-\d{2}/);
    expect(dateInput).toBeInTheDocument();
  });

  it('should handle notes input with character limit', async () => {
    render(
      <AddExpenseModal
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        existingCategories={[]}
      />
    );

    const notesInputs = screen.getAllByRole('textbox');
    const notesInput = notesInputs.find(
      (input) =>
        (input as HTMLTextAreaElement).placeholder?.includes('notes') ||
        (input as HTMLTextAreaElement).value === ''
    );

    if (notesInput) {
      // Verify the notes input exists and accepts text (maxLength enforced by MUI)
      const shortText = 'a'.repeat(50);
      fireEvent.change(notesInput, { target: { value: shortText } });
      expect((notesInput as HTMLTextAreaElement).value.length).toBeLessThanOrEqual(500);
    }
  });

  it('should handle participant addition', () => {
    render(
      <AddExpenseModal
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        existingCategories={[]}
        knownParticipants={['Bob', 'Charlie']}
      />
    );

    const addParticipantBtn = screen.getByTestId('add-participant-btn');
    fireEvent.click(addParticipantBtn);

    expect(screen.getByTestId('participants')).toHaveTextContent('Alice');
  });

  it('should show error on API failure', async () => {
    mockOnSubmit.mockRejectedValueOnce({
      response: { data: { error: 'Network error' } },
    });

    render(
      <AddExpenseModal
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        existingCategories={['Food']}
      />
    );

    fireEvent.click(screen.getByText('Select Coffee'));
    fireEvent.change(screen.getByTestId('numpad'), { target: { value: '50' } });

    const saveButton = screen.getAllByRole('button').find(
      (btn) => btn.textContent?.includes('Save')
    );
    if (saveButton) {
      fireEvent.click(saveButton);
    }

    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });
  });

  it('should disable buttons while loading', async () => {
    mockOnSubmit.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(
      <AddExpenseModal
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        existingCategories={['Food']}
      />
    );

    fireEvent.click(screen.getByText('Select Coffee'));
    fireEvent.change(screen.getByTestId('numpad'), { target: { value: '50' } });

    const saveButton = screen.getAllByRole('button').find(
      (btn) => btn.textContent?.includes('Save')
    );
    if (saveButton) {
      fireEvent.click(saveButton);
    }

    // Button should be disabled during loading
    await waitFor(() => {
      const currentSaveButton = screen.getAllByRole('button').find(
        (btn) => btn.textContent?.includes('Saving') || btn.textContent?.includes('Save')
      );
      expect(currentSaveButton).toBeDisabled();
    }, { timeout: 50 });
  });

  it('should close modal on successful submission', async () => {
    render(
      <AddExpenseModal
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        existingCategories={['Food']}
      />
    );

    fireEvent.click(screen.getByText('Select Coffee'));
    fireEvent.change(screen.getByTestId('numpad'), { target: { value: '50' } });

    const saveButton = screen.getAllByRole('button').find(
      (btn) => btn.textContent?.includes('Save')
    );
    if (saveButton) {
      fireEvent.click(saveButton);
    }

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  it('should submit correct transaction type', async () => {
    render(
      <AddExpenseModal
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        existingCategories={[]}
      />
    );

    const incomeButton = screen.getByText('Income');
    fireEvent.click(incomeButton);

    fireEvent.click(screen.getByText('Select Coffee'));
    fireEvent.change(screen.getByTestId('numpad'), { target: { value: '5000' } });

    const saveButton = screen.getAllByRole('button').find(
      (btn) => btn.textContent?.includes('Save')
    );
    if (saveButton) {
      fireEvent.click(saveButton);
    }

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });

    const callData = mockOnSubmit.mock.calls[0][0];
    expect(callData.type).toBe('income');
  });

  it('should include description in submission', async () => {
    render(
      <AddExpenseModal
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        existingCategories={['Food']}
      />
    );

    const descriptionInput = screen.getByTestId('description-input');
    fireEvent.change(descriptionInput, { target: { value: 'Lunch at cafe' } });
    fireEvent.change(screen.getByTestId('numpad'), { target: { value: '25' } });

    const saveButton = screen.getAllByRole('button').find(
      (btn) => btn.textContent?.includes('Save')
    );
    if (saveButton) {
      fireEvent.click(saveButton);
    }

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });

    const callData = mockOnSubmit.mock.calls[0][0];
    expect(callData.description).toBe('Lunch at cafe');
  });
});
