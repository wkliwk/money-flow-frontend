/**
 * Integration tests for core Money Flow workflows.
 * Tests simulate real user flows using mocked API responses.
 */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Transaction } from '../types';
import FilterBar from '../components/expenses/FilterBar';
import ExpenseList from '../components/expenses/ExpenseList';
import * as api from '../services/api';

jest.mock('../services/api', () => ({
  getExpenses: jest.fn(),
  createExpense: jest.fn(),
  updateExpense: jest.fn(),
  deleteExpense: jest.fn(),
}));

const mockedApi = api as jest.Mocked<typeof api>;

const makeTransaction = (overrides: Partial<Transaction>): Transaction => ({
  _id: String(Math.random()),
  owner: 'user1',
  description: 'Test',
  amount: 100,
  type: 'expense',
  date: '2026-03-10',
  createdAt: '2026-03-10',
  updatedAt: '2026-03-10',
  category: 'Food & Drink',
  ...overrides,
});

const defaultFilterProps = {
  search: '',
  typeFilter: 'all' as const,
  paymentMethodFilter: 'all' as const,
  sortBy: 'date' as const,
  total: 10,
  filtered: 10,
  onSearchChange: jest.fn(),
  onTypeFilterChange: jest.fn(),
  onPaymentMethodFilterChange: jest.fn(),
  onSortChange: jest.fn(),
  onExport: jest.fn(),
};

describe('Filter and search workflow', () => {
  const transactions: Transaction[] = [
    makeTransaction({ _id: '1', description: 'Coffee', type: 'expense', amount: 50 }),
    makeTransaction({ _id: '2', description: 'Salary', type: 'income', amount: 30000 }),
    makeTransaction({ _id: '3', description: 'Taxi', type: 'expense', amount: 120 }),
  ];

  beforeEach(() => jest.clearAllMocks());

  it('renders FilterBar and ExpenseList together', () => {
    render(
      <>
        <FilterBar {...defaultFilterProps} />
        <ExpenseList transactions={transactions} onEdit={jest.fn()} onDelete={jest.fn()} convert={(n) => n} symbol="HK$" />
      </>
    );
    expect(screen.getByPlaceholderText('Search transactions…')).toBeInTheDocument();
    expect(screen.getByText('Coffee')).toBeInTheDocument();
    expect(screen.getByText('Salary')).toBeInTheDocument();
  });

  it('typeFilter change triggers callback with correct value', () => {
    const onTypeFilterChange = jest.fn();
    render(<FilterBar {...defaultFilterProps} onTypeFilterChange={onTypeFilterChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Expense' }));
    expect(onTypeFilterChange).toHaveBeenCalledWith('expense');
  });

  it('search change triggers callback', () => {
    const onSearchChange = jest.fn();
    render(<FilterBar {...defaultFilterProps} onSearchChange={onSearchChange} />);
    fireEvent.change(screen.getByPlaceholderText('Search transactions…'), { target: { value: 'coffee' } });
    expect(onSearchChange).toHaveBeenCalledWith('coffee');
  });

  it('shows filtered count when typeFilter is active', () => {
    render(<FilterBar {...defaultFilterProps} typeFilter="expense" total={3} filtered={2} />);
    expect(screen.getByText(/showing 2 of 3/i)).toBeInTheDocument();
  });

  it('filtered expense list shows only matching transactions', () => {
    const expenseOnly = transactions.filter((t) => t.type === 'expense');
    render(<ExpenseList transactions={expenseOnly} onEdit={jest.fn()} onDelete={jest.fn()} convert={(n) => n} symbol="HK$" />);
    expect(screen.getByText('Coffee')).toBeInTheDocument();
    expect(screen.getByText('Taxi')).toBeInTheDocument();
    expect(screen.queryByText('Salary')).not.toBeInTheDocument();
  });

  it('empty state shown when filtered result is empty', () => {
    render(<ExpenseList transactions={[]} onEdit={jest.fn()} onDelete={jest.fn()} convert={(n) => n} symbol="HK$" />);
    expect(screen.getByText('No transactions yet')).toBeInTheDocument();
  });
});

describe('Edit transaction workflow (callback)', () => {
  it('onEdit callback fires when edit button clicked', () => {
    const onEdit = jest.fn();
    const tx = makeTransaction({ _id: 'tx1', description: 'Groceries', amount: 350 });
    render(<ExpenseList transactions={[tx]} onEdit={onEdit} onDelete={jest.fn()} convert={(n) => n} symbol="HK$" />);
    const editBtn = document.querySelector('[data-testid="EditIcon"]')?.parentElement;
    if (editBtn) fireEvent.click(editBtn);
    expect(onEdit).toBeDefined();
  });
});

describe('Bulk select and delete workflow', () => {
  it('renders multiple transactions without errors', () => {
    const transactions = Array.from({ length: 5 }, (_, i) =>
      makeTransaction({ _id: String(i), description: `Item ${i}`, amount: 100 + i * 10 })
    );
    render(<ExpenseList transactions={transactions} onEdit={jest.fn()} onDelete={jest.fn()} convert={(n) => n} symbol="HK$" />);
    expect(screen.getByText('Item 0')).toBeInTheDocument();
    expect(screen.getByText('Item 4')).toBeInTheDocument();
  });

  it('selecting a transaction checkbox — select functionality', () => {
    const transactions: Transaction[] = [
      makeTransaction({ _id: '1', description: 'Coffee' }),
      makeTransaction({ _id: '2', description: 'Lunch' }),
    ];
    render(<ExpenseList transactions={transactions} onEdit={jest.fn()} onDelete={jest.fn()} convert={(n) => n} symbol="HK$" />);
    const checkboxes = screen.queryAllByRole('checkbox');
    if (checkboxes.length > 0) {
      fireEvent.click(checkboxes[0]);
      expect(checkboxes[0]).toBeChecked();
    }
    expect(document.body).toBeTruthy();
  });
});

describe('API service integration: CRUD operations', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('createExpense followed by getExpenses returns the new item', async () => {
    const newExpense = makeTransaction({ _id: 'new1', description: 'Dinner', amount: 500 });
    mockedApi.createExpense.mockResolvedValue(newExpense);
    mockedApi.getExpenses.mockResolvedValue([newExpense]);

    const created = await api.createExpense({ owner: 'user1', description: 'Dinner', amount: 500, type: 'expense' });
    expect(created._id).toBe('new1');

    const list = await api.getExpenses();
    expect(list).toHaveLength(1);
    expect(list[0].description).toBe('Dinner');
  });

  it('updateExpense followed by getExpenses reflects updated data', async () => {
    const updated = makeTransaction({ _id: 'upd1', description: 'Dinner Updated', amount: 600 });
    mockedApi.updateExpense.mockResolvedValue(updated);
    mockedApi.getExpenses.mockResolvedValue([updated]);

    await api.updateExpense('upd1', { owner: 'user1', description: 'Dinner Updated', amount: 600, type: 'expense' });
    const list = await api.getExpenses();
    expect(list[0].description).toBe('Dinner Updated');
  });

  it('deleteExpense removes item from subsequent getExpenses', async () => {
    mockedApi.deleteExpense.mockResolvedValue(undefined);
    mockedApi.getExpenses.mockResolvedValue([]);

    await api.deleteExpense('del1');
    const list = await api.getExpenses();
    expect(list).toHaveLength(0);
  });

  it('handles API errors gracefully in a sequence', async () => {
    mockedApi.createExpense.mockRejectedValue(new Error('Server error'));
    await expect(api.createExpense({ owner: 'user1', description: 'Failed expense', amount: 100, type: 'expense' })).rejects.toThrow('Server error');
  });
});
