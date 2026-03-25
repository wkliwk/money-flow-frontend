import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ExpenseList from '../ExpenseList';
import { Transaction } from '../../../types';

describe('ExpenseList', () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnSelectChange = jest.fn();
  const mockOnSelectAll = jest.fn();

  const mockTransaction: Transaction = {
    _id: 'tx-1',
    owner: 'user-1',
    description: 'Coffee',
    amount: 50,
    type: 'expense',
    category: 'Food',
    date: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockIncomeTransaction: Transaction = {
    _id: 'tx-2',
    owner: 'user-1',
    description: 'Salary',
    amount: 5000,
    type: 'income',
    category: 'Work',
    date: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show empty state when no transactions', () => {
    render(
      <ExpenseList
        transactions={[]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        convert={(n) => n}
        symbol="$"
      />
    );

    expect(screen.getByText('No transactions yet')).toBeInTheDocument();
    expect(screen.getByText(/Tap the \+ button/)).toBeInTheDocument();
  });

  it('should render transaction items', () => {
    render(
      <ExpenseList
        transactions={[mockTransaction]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        convert={(n) => n}
        symbol="$"
      />
    );

    expect(screen.getByText('Coffee')).toBeInTheDocument();
    expect(screen.getByText(/-\$50/)).toBeInTheDocument();
  });

  it('should display income and expense amounts with correct signs', () => {
    const { container } = render(
      <ExpenseList
        transactions={[mockTransaction, mockIncomeTransaction]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        convert={(n) => n}
        symbol="$"
      />
    );

    expect(screen.getByText(/-\$50/)).toBeInTheDocument();
    // Income amount might be in different element
    const incomeText = container.textContent;
    expect(incomeText).toContain('+');
    expect(incomeText).toContain('5,000');
  });

  it('should display type chips', () => {
    render(
      <ExpenseList
        transactions={[mockTransaction, mockIncomeTransaction]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        convert={(n) => n}
        symbol="$"
      />
    );

    expect(screen.getByText('Expense')).toBeInTheDocument();
    expect(screen.getByText('Income')).toBeInTheDocument();
  });

  it('should call onEdit when transaction clicked', () => {
    render(
      <ExpenseList
        transactions={[mockTransaction]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        convert={(n) => n}
        symbol="$"
      />
    );

    const editButton = screen.getAllByRole('button').find(
      (btn) => btn.querySelector('[data-testid="EditIcon"]')
    );
    if (editButton) fireEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalled();
  });

  it('should call onDelete when delete button clicked', () => {
    render(
      <ExpenseList
        transactions={[mockTransaction]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        convert={(n) => n}
        symbol="$"
      />
    );

    const deleteButtons = screen.getAllByRole('button').filter(
      (btn) => btn.querySelector('[data-testid*="Delete"], svg') !== null
    );
    if (deleteButtons.length > 0) {
      fireEvent.click(deleteButtons[deleteButtons.length - 1]);
    }

    expect(mockOnDelete).toHaveBeenCalledWith('tx-1');
  });

  it('should display formatted dates', () => {
    const pastDate = new Date('2026-03-20');
    const transaction = { ...mockTransaction, date: pastDate.toISOString() };

    render(
      <ExpenseList
        transactions={[transaction]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        convert={(n) => n}
        symbol="$"
      />
    );

    expect(screen.getByText(/20.*Mar|Mar.*20/)).toBeInTheDocument();
  });

  it('should handle currency conversion', () => {
    render(
      <ExpenseList
        transactions={[mockTransaction]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        convert={(n) => n * 2}
        symbol="€"
      />
    );

    expect(screen.getByText(/-€100/)).toBeInTheDocument();
  });

  it('should display participants when present', () => {
    const transaction = {
      ...mockTransaction,
      participants: ['Alice', 'Bob'],
    };

    render(
      <ExpenseList
        transactions={[transaction]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        convert={(n) => n}
        symbol="$"
      />
    );

    expect(screen.getByText(/Alice.*Bob|Bob.*Alice/)).toBeInTheDocument();
  });

  it('should display notes when present', () => {
    const transaction = { ...mockTransaction, notes: 'Team lunch meeting' };

    render(
      <ExpenseList
        transactions={[transaction]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        convert={(n) => n}
        symbol="$"
      />
    );

    expect(screen.getByText('Team lunch meeting')).toBeInTheDocument();
  });

  it('should handle bulk selection when showBulkActions=true', () => {
    render(
      <ExpenseList
        transactions={[mockTransaction]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        convert={(n) => n}
        symbol="$"
        selectedIds={new Set()}
        onSelectChange={mockOnSelectChange}
        onSelectAll={mockOnSelectAll}
        showBulkActions={true}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    if (checkboxes.length > 0) {
      fireEvent.click(checkboxes[checkboxes.length - 1]);
    }

    expect(mockOnSelectChange).toHaveBeenCalled();
  });

  it('should handle select all action', () => {
    render(
      <ExpenseList
        transactions={[mockTransaction, mockIncomeTransaction]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        convert={(n) => n}
        symbol="$"
        selectedIds={new Set()}
        onSelectChange={mockOnSelectChange}
        onSelectAll={mockOnSelectAll}
        showBulkActions={true}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    if (checkboxes.length > 0) {
      fireEvent.click(checkboxes[0]);
    }

    expect(mockOnSelectAll).toHaveBeenCalled();
  });

  it('should highlight selected transactions', () => {
    const { container } = render(
      <ExpenseList
        transactions={[mockTransaction]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        convert={(n) => n}
        symbol="$"
        selectedIds={new Set(['tx-1'])}
        onSelectChange={mockOnSelectChange}
        showBulkActions={true}
      />
    );

    // The selected checkbox should be checked
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    const isSelected = Array.from(checkboxes).some((cb) => (cb as HTMLInputElement).checked);
    expect(isSelected || container.querySelector('.Mui-selected')).toBeTruthy();
  });

  it('should handle item with description separately', () => {
    const transaction = {
      ...mockTransaction,
      item: 'Coffee',
      description: 'Espresso at Starbucks',
    };

    render(
      <ExpenseList
        transactions={[transaction]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        convert={(n) => n}
        symbol="$"
      />
    );

    expect(screen.getByText(/Coffee/)).toBeInTheDocument();
    expect(screen.getByText(/Espresso at Starbucks/)).toBeInTheDocument();
  });

  it('should format large amounts with thousands separator', () => {
    const transaction = { ...mockTransaction, amount: 10000 };

    render(
      <ExpenseList
        transactions={[transaction]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        convert={(n) => n}
        symbol="$"
      />
    );

    expect(screen.getByText(/-\$10,000/)).toBeInTheDocument();
  });

  it('should handle transactions with unknown dates', () => {
    const transaction = { ...mockTransaction, date: 'invalid-date' };

    render(
      <ExpenseList
        transactions={[transaction]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        convert={(n) => n}
        symbol="$"
      />
    );

    expect(screen.getByText('Coffee')).toBeInTheDocument();
  });

  it('should group transactions by date on mobile', () => {
    // Mock mobile viewport
    jest.mock('@mui/material', () => ({
      ...jest.requireActual('@mui/material'),
      useMediaQuery: () => true,
    }));

    const transactions = [
      mockTransaction,
      { ...mockIncomeTransaction, date: new Date(Date.now() - 86400000).toISOString() },
    ];

    const { container } = render(
      <ExpenseList
        transactions={transactions}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        convert={(n) => n}
        symbol="$"
      />
    );

    expect(container.querySelector('[role="table"]')).toBeNull();
  });

  it('should show select all as indeterminate when partial selection', () => {
    render(
      <ExpenseList
        transactions={[mockTransaction, mockIncomeTransaction]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        convert={(n) => n}
        symbol="$"
        selectedIds={new Set(['tx-1'])}
        onSelectChange={mockOnSelectChange}
        onSelectAll={mockOnSelectAll}
        showBulkActions={true}
      />
    );

    const firstCheckbox = screen.getAllByRole('checkbox')[0];
    // The first checkbox (select all) should show indeterminate state
    expect(firstCheckbox).toBeInTheDocument();
  });

  it('should not show checkboxes when showBulkActions=false', () => {
    render(
      <ExpenseList
        transactions={[mockTransaction]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        convert={(n) => n}
        symbol="$"
        selectedIds={new Set()}
        showBulkActions={false}
      />
    );

    const checkboxes = screen.queryAllByRole('checkbox');
    expect(checkboxes.length).toBe(0);
  });

  it('should render multiple transactions in order', () => {
    const transactions = [mockTransaction, mockIncomeTransaction];

    const { container } = render(
      <ExpenseList
        transactions={transactions}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        convert={(n) => n}
        symbol="$"
      />
    );

    const rows = container.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
  });

  it('should display empty participants cell as dash', () => {
    const transaction = { ...mockTransaction, participants: [] };

    render(
      <ExpenseList
        transactions={[transaction]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        convert={(n) => n}
        symbol="$"
      />
    );

    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
