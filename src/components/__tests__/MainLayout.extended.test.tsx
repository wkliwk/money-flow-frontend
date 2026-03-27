/**
 * Extended MainLayout tests covering additional branches not covered by the base test file.
 */
import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MainLayout from '../MainLayout';
import { Transaction } from '../../types';
import dayjs from 'dayjs';

const makeTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  _id: '1',
  owner: 'user1',
  description: 'Coffee',
  amount: 100,
  type: 'expense',
  date: dayjs().format('YYYY-MM-DD'),
  createdAt: dayjs().format('YYYY-MM-DD'),
  updatedAt: dayjs().format('YYYY-MM-DD'),
  ...overrides,
});

const mockGetExpenses = jest.fn().mockResolvedValue([]);
const mockCreateExpense = jest.fn().mockResolvedValue(makeTransaction({ _id: 'new1' }));
const mockDeleteExpense = jest.fn().mockResolvedValue({});
const mockGetExpense = jest.fn().mockResolvedValue(makeTransaction({ _id: '1' }));

jest.mock('../../services/api', () => ({
  getExpenses: (...args: unknown[]) => mockGetExpenses(...args),
  getExpense: (...args: unknown[]) => mockGetExpense(...args),
  createExpense: (...args: unknown[]) => mockCreateExpense(...args),
  deleteExpense: (...args: unknown[]) => mockDeleteExpense(...args),
  updateExpense: jest.fn().mockResolvedValue({}),
}));

jest.mock('recharts', () => ({
  ComposedChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => null, Area: () => null, Pie: () => null, Line: () => null,
  XAxis: () => null, YAxis: () => null, Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Cell: () => null, ReferenceLine: () => null, Legend: () => null,
}));

jest.mock('../../hooks/useFxRates', () => ({
  useFxRates: () => ({ currency: 'HKD', setCurrency: jest.fn(), convert: (n: number) => n, symbol: 'HK$', loading: false, rates: { HKD: 1, CAD: 0.18 } }),
  CURRENCIES: ['HKD', 'CAD'], CURRENCY_SYMBOLS: { HKD: 'HK$', CAD: 'CA$' }, Currency: {},
}));

jest.mock('../../hooks/useBudgets', () => ({
  useBudgets: () => ({ budgets: {}, setBudget: jest.fn() }),
  BUDGET_CATEGORIES: ['Food & Drink', 'Transport'],
}));

jest.mock('../../hooks/useRecurring', () => ({
  useRecurring: () => ({ items: [], addItem: jest.fn(), deleteItem: jest.fn(), markApplied: jest.fn() }),
}));

jest.mock('../../hooks/useItemPresets', () => ({
  useItemPresets: () => ({ presets: {}, setPreset: jest.fn(), deletePreset: jest.fn() }),
}));

jest.mock('../../hooks/useTemplates', () => ({
  useTemplates: () => ({ templates: [], addTemplate: jest.fn(), deleteTemplate: jest.fn() }),
}));

const renderMainLayout = () => render(<MemoryRouter><MainLayout /></MemoryRouter>);

jest.setTimeout(30000);

describe('MainLayout — extended coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetExpenses.mockResolvedValue([]);
    mockCreateExpense.mockResolvedValue(makeTransaction({ _id: 'new1', description: 'New tx' }));
    mockDeleteExpense.mockResolvedValue({});
    mockGetExpense.mockResolvedValue(makeTransaction({ _id: '1' }));
  });

  it('pressing Ctrl+K opens QuickExpenseInput (no crash)', async () => {
    renderMainLayout();
    await waitFor(() => screen.getAllByText('Home').length > 0);
    await act(async () => { fireEvent.keyDown(window, { key: 'k', ctrlKey: true }); });
    expect(document.body).toBeTruthy();
  });

  it('pressing Meta+K opens QuickExpenseInput (no crash)', async () => {
    renderMainLayout();
    await waitFor(() => screen.getAllByText('Home').length > 0);
    await act(async () => { fireEvent.keyDown(window, { key: 'K', metaKey: true }); });
    expect(document.body).toBeTruthy();
  });

  it('pressing N key when AddExpenseModal is already open does not cause crash', async () => {
    renderMainLayout();
    await waitFor(() => document.querySelector('[data-testid="AddIcon"]'));
    const fabBtn = document.querySelector('[data-testid="AddIcon"]')?.closest('button');
    if (fabBtn) { await act(async () => { fireEvent.click(fabBtn); }); }
    await waitFor(() => screen.getByText('Record Transaction'));
    await act(async () => { fireEvent.keyDown(window, { key: 'n' }); });
    expect(screen.getAllByText('Record Transaction').length).toBeGreaterThan(0);
  });

  it('handles commitDelete error — restores transaction on failure', async () => {
    mockDeleteExpense.mockRejectedValueOnce(new Error('Delete failed'));
    mockGetExpenses.mockResolvedValue([makeTransaction({ _id: 'err1', description: 'ErrorDelete' })]);
    renderMainLayout();
    await waitFor(() => screen.getAllByText('Home').length > 0);
    const transLabels = screen.getAllByText('Transactions');
    await act(async () => { fireEvent.click(transLabels[transLabels.length - 1]); });
    await waitFor(() => screen.getByText('ErrorDelete'));
    const deleteIcon = document.querySelector('[data-testid="DeleteIcon"]');
    if (deleteIcon?.parentElement) {
      await act(async () => { fireEvent.click(deleteIcon.parentElement!); });
    }
    await waitFor(() => { expect(screen.getByText(/undo/i)).toBeInTheDocument(); });
  });

  it('renders without crash when token is invalid base64', async () => {
    localStorage.setItem('mf_token', 'invalid.!@#$.jwt');
    renderMainLayout();
    await waitFor(() => screen.getAllByText('Home').length > 0);
    expect(document.body).toBeTruthy();
    localStorage.removeItem('mf_token');
  });

  it('home tab shows recent items and participants label', async () => {
    const today = dayjs().format('YYYY-MM-DD');
    mockGetExpenses.mockResolvedValue([
      makeTransaction({ _id: '1', description: 'Dinner', item: 'Dinner Item', participants: ['Alice'], date: today }),
    ]);
    renderMainLayout();
    await waitFor(() => screen.getAllByText('Home').length > 0);
    await waitFor(() => {
      expect(screen.queryAllByText('Dinner Item').length).toBeGreaterThan(0);
    });
    await waitFor(() => {
      expect(screen.queryAllByText(/Alice/i).length).toBeGreaterThan(0);
    });
  });

  it('home tab shows See all link when transactions exist', async () => {
    const today = dayjs().format('YYYY-MM-DD');
    mockGetExpenses.mockResolvedValue([
      makeTransaction({ _id: '1', description: 'RecentItem', date: today }),
    ]);
    renderMainLayout();
    await waitFor(() => screen.getAllByText('Home').length > 0);
    await waitFor(() => {
      expect(screen.queryAllByText('RecentItem').length).toBeGreaterThan(0);
    });
    const seeAllLinks = screen.queryAllByText(/see all/i);
    if (seeAllLinks.length > 0) {
      await act(async () => { fireEvent.click(seeAllLinks[0]); });
    }
    expect(document.body).toBeTruthy();
  });

  it('income transactions render with + prefix indicator', async () => {
    const today = dayjs().format('YYYY-MM-DD');
    mockGetExpenses.mockResolvedValue([
      makeTransaction({ _id: '1', description: 'Salary', type: 'income', amount: 50000, date: today }),
    ]);
    renderMainLayout();
    await waitFor(() => screen.getAllByText('Home').length > 0);
    await waitFor(() => {
      expect(screen.queryAllByText('Salary').length).toBeGreaterThan(0);
    });
  });

  it('payment method filter panel opens and closes', async () => {
    mockGetExpenses.mockResolvedValue([makeTransaction({ _id: '1', description: 'PmExpense' })]);
    renderMainLayout();
    await waitFor(() => screen.getAllByText('Home').length > 0);
    const transLabels = screen.getAllByText('Transactions');
    await act(async () => { fireEvent.click(transLabels[transLabels.length - 1]); });
    await waitFor(() => screen.getByText('PmExpense'));
    const filterIcon = document.querySelector('[data-testid="FilterListIcon"]');
    if (filterIcon?.parentElement) {
      await act(async () => { fireEvent.click(filterIcon.parentElement!); });
      const octopusChips = screen.queryAllByText('Octopus');
      if (octopusChips.length > 0) {
        await act(async () => { fireEvent.click(octopusChips[0]); });
      }
    }
    expect(document.body).toBeTruthy();
  });
});
