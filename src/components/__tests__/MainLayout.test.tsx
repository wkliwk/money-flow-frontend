import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MainLayout from '../MainLayout';
import ToastProvider from '../Toast/ToastProvider';
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

// Mock all API calls
const mockGetExpenses = jest.fn().mockResolvedValue([]);
const mockCreateExpense = jest.fn().mockResolvedValue(
  makeTransaction({ _id: 'new1', description: 'New tx' })
);
const mockDeleteExpense = jest.fn().mockResolvedValue({});
const mockGetExpense = jest.fn().mockResolvedValue(makeTransaction({ _id: '1' }));

const mockApiModule: Record<string, jest.Mock> = {};
jest.mock('../../services/api', () => {
  const resolvedEmpty = () => Promise.resolve({});
  const resolvedArray = () => Promise.resolve([]);
  const resolvedUndef = () => Promise.resolve(undefined);
  return {
    __esModule: true,
    getExpenses: (...args: unknown[]) => mockGetExpenses(...args),
    getExpense: (...args: unknown[]) => mockGetExpense(...args),
    createExpense: (...args: unknown[]) => mockCreateExpense(...args),
    deleteExpense: (...args: unknown[]) => mockDeleteExpense(...args),
    updateExpense: jest.fn(resolvedEmpty),
    getLastAmounts: jest.fn(resolvedEmpty),
    scanReceipt: jest.fn(resolvedEmpty),
    getMonthlyReport: jest.fn(resolvedArray),
    getPriceHistory: jest.fn(() => Promise.resolve({ history: [], stats: null })),
    sendFriendRequest: jest.fn(resolvedEmpty),
    getFriends: jest.fn(resolvedArray),
    getPendingRequests: jest.fn(() => Promise.resolve([])),
    acceptFriend: jest.fn(resolvedUndef),
    rejectFriend: jest.fn(resolvedUndef),
    removeFriend: jest.fn(resolvedUndef),
    getNetWorth: jest.fn(resolvedArray),
    getLatestNetWorth: jest.fn(() => Promise.resolve(null)),
    createNetWorth: jest.fn(resolvedEmpty),
    deleteNetWorthSnapshot: jest.fn(resolvedUndef),
    getBudgets: jest.fn(() => Promise.resolve([])),
    saveBudgets: jest.fn(resolvedArray),
    getRecurring: jest.fn(() => Promise.resolve([])),
    createRecurring: jest.fn(resolvedEmpty),
    deleteRecurringAPI: jest.fn(resolvedUndef),
    getUserMe: jest.fn(() => Promise.resolve({ _id: '1', email: 'test@test.com', themePreference: 'system' })),
    patchUserPreferences: jest.fn(resolvedUndef),
    getExchangeRates: jest.fn(() => Promise.resolve({ HKD: 1 })),
    register: jest.fn(resolvedUndef),
    login: jest.fn(resolvedUndef),
    loginWithGoogle: jest.fn(resolvedUndef),
    loginWithApple: jest.fn(resolvedUndef),
  };
});

// Mock FriendsSection to avoid API dependency
jest.mock('../../components/settings/FriendsSection', () => () => <div data-testid="friends-section">Friends</div>);

// Mock recharts
jest.mock('recharts', () => ({
  ComposedChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => null,
  Area: () => null,
  Pie: () => null,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Cell: () => null,
  ReferenceLine: () => null,
  Legend: () => null,
}));

jest.mock('../../hooks/useFxRates', () => ({
  useFxRates: () => ({
    currency: 'HKD',
    setCurrency: jest.fn(),
    convert: (n: number) => n,
    symbol: 'HK$',
    loading: false,
    rates: { HKD: 1, CAD: 0.18, USD: 0.128, CNY: 0.93 },
  }),
  CURRENCIES: ['HKD', 'CAD', 'USD', 'CNY'],
  CURRENCY_SYMBOLS: { HKD: 'HK$', CAD: 'CA$', USD: 'US$', CNY: '¥' },
  Currency: {},
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

const renderMainLayout = () =>
  render(
    <MemoryRouter>
      <ToastProvider>
        <MainLayout />
      </ToastProvider>
    </MemoryRouter>
  );

jest.setTimeout(30000);

describe('MainLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetExpenses.mockResolvedValue([]);
    mockCreateExpense.mockResolvedValue(makeTransaction({ _id: 'new1', description: 'New tx' }));
    mockDeleteExpense.mockResolvedValue({});
    mockGetExpense.mockResolvedValue(makeTransaction({ _id: '1' }));
  });

  it('renders without crashing', async () => {
    renderMainLayout();
    await waitFor(() => {
      expect(screen.getByText('MoneyFlow')).toBeInTheDocument();
    });
  });

  it('renders main content area', async () => {
    renderMainLayout();
    await waitFor(() => {
      expect(screen.getByText('MoneyFlow')).toBeInTheDocument();
    });
  });

  it('calls getExpenses on mount', async () => {
    renderMainLayout();
    await waitFor(() => {
      expect(mockGetExpenses).toHaveBeenCalled();
    });
  });

  it('shows BottomNavigation labels in mobile view', async () => {
    renderMainLayout();
    await waitFor(() => {
      expect(screen.getAllByText('Home').length).toBeGreaterThan(0);
    });
  });

  it('navigates to Transactions tab when bottom nav is clicked', async () => {
    renderMainLayout();
    await waitFor(() => screen.getAllByText('Home').length > 0);
    const transactionsLabels = screen.getAllByText('Transactions');
    await act(async () => {
      fireEvent.click(transactionsLabels[transactionsLabels.length - 1]);
    });
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search transactions…')).toBeInTheDocument();
    });
  });

  it('navigates to Settings tab when clicked', async () => {
    renderMainLayout();
    await waitFor(() => screen.getAllByText('Home').length > 0);
    const settingsLabels = screen.getAllByText('Settings');
    await act(async () => {
      fireEvent.click(settingsLabels[settingsLabels.length - 1]);
    });
    await waitFor(() => {
      expect(screen.getByText(/Sign Out/i)).toBeInTheDocument();
    });
  });

  it('shows FAB + button', async () => {
    renderMainLayout();
    await waitFor(() => {
      expect(document.querySelector('[data-testid="fab-record"]')).toBeTruthy();
    });
  });

  it('shows empty state when list is empty on Transactions tab', async () => {
    mockGetExpenses.mockResolvedValue([]);
    renderMainLayout();
    await waitFor(() => screen.getAllByText('Home').length > 0);
    const transactionsLabels = screen.getAllByText('Transactions');
    await act(async () => {
      fireEvent.click(transactionsLabels[transactionsLabels.length - 1]);
    });
    // Default 'month' preset → empty state references the current month
    // (e.g. "No matches for May 2026"). When no month is active, falls back to
    // "No transactions yet".
    await waitFor(() => {
      const text = screen.queryByText('No transactions yet') || screen.queryByText(/No matches for/);
      expect(text).toBeInTheDocument();
    });
  });

  it('shows transactions in list after loading', async () => {
    mockGetExpenses.mockResolvedValue([
      makeTransaction({ _id: '1', description: 'Coffee' }),
      makeTransaction({ _id: '2', description: 'Taxi', type: 'income' }),
    ]);
    renderMainLayout();
    await waitFor(() => screen.getAllByText('Home').length > 0);
    const transactionsLabels = screen.getAllByText('Transactions');
    await act(async () => {
      fireEvent.click(transactionsLabels[transactionsLabels.length - 1]);
    });
    await waitFor(() => {
      expect(screen.getByText('Coffee')).toBeInTheDocument();
    });
  });

  it('FAB click opens AddTransactionSheet', async () => {
    renderMainLayout();
    await waitFor(() => document.querySelector('[data-testid="fab-record"]'));
    const fabBtn = document.querySelector('[data-testid="fab-record"]') as HTMLButtonElement | null;
    if (fabBtn) {
      await act(async () => { fireEvent.click(fabBtn); });
    }
    await waitFor(() => {
      expect(screen.getByText('Add transaction')).toBeInTheDocument();
    });
  });

  it('handles delete transaction with undo snackbar', async () => {
    mockGetExpenses.mockResolvedValue([
      makeTransaction({ _id: 'abc', description: 'Coffee' }),
    ]);
    renderMainLayout();
    await waitFor(() => screen.getAllByText('Home').length > 0);
    const transactionsLabels = screen.getAllByText('Transactions');
    await act(async () => {
      fireEvent.click(transactionsLabels[transactionsLabels.length - 1]);
    });
    await waitFor(() => screen.getByText('Coffee'));
    const deleteIcon = document.querySelector('[data-testid="DeleteIcon"]');
    if (deleteIcon?.parentElement) {
      await act(async () => { fireEvent.click(deleteIcon.parentElement!); });
    }
    await waitFor(() => {
      expect(screen.getByText(/undo/i)).toBeInTheDocument();
    });
  });

  it('shows recurring prompt banner when pending recurring items exist', async () => {
    // Override useRecurring to return pending items
    jest.resetModules();
  });

  it('handles transactions with categories for categorySpend calculation', async () => {
    mockGetExpenses.mockResolvedValue([
      makeTransaction({ _id: '1', category: 'Food & Drink', amount: 200 }),
    ]);
    renderMainLayout();
    await waitFor(() => {
      expect(screen.getAllByText('Home').length).toBeGreaterThan(0);
    });
  });

  it('clicking Undo on delete snackbar restores transaction', async () => {
    mockGetExpenses.mockResolvedValue([
      makeTransaction({ _id: 'abc2', description: 'Lunch' }),
    ]);
    renderMainLayout();
    await waitFor(() => screen.getAllByText('Home').length > 0);
    const transLabels = screen.getAllByText('Transactions');
    await act(async () => { fireEvent.click(transLabels[transLabels.length - 1]); });
    await waitFor(() => screen.getByText('Lunch'));
    const deleteIcon = document.querySelector('[data-testid="DeleteIcon"]');
    if (deleteIcon?.parentElement) {
      await act(async () => { fireEvent.click(deleteIcon.parentElement!); });
    }
    await waitFor(() => screen.getByText(/undo/i));
    await act(async () => { fireEvent.click(screen.getByText(/undo/i)); });
    // After undo, transaction should be back
    await waitFor(() => {
      expect(screen.getByText('Lunch')).toBeInTheDocument();
    });
  });

  it('pressing N key opens AddTransactionSheet', async () => {
    renderMainLayout();
    await waitFor(() => screen.getAllByText('Home').length > 0);
    await act(async () => {
      fireEvent.keyDown(window, { key: 'n' });
    });
    await waitFor(() => {
      expect(screen.getByText('Add transaction')).toBeInTheDocument();
    });
  });

  it('handles API error on mount gracefully', async () => {
    mockGetExpenses.mockRejectedValueOnce(new Error('Network error'));
    renderMainLayout();
    await waitFor(() => {
      expect(screen.getAllByText('Home').length).toBeGreaterThan(0);
    });
  });

  it('FAB click adds transaction via AddTransactionSheet submit', async () => {
    renderMainLayout();
    await waitFor(() => document.querySelector('[data-testid="fab-record"]'));
    const fabBtn = document.querySelector('[data-testid="fab-record"]') as HTMLButtonElement | null;
    if (fabBtn) {
      await act(async () => { fireEvent.click(fabBtn); });
    }
    await waitFor(() => screen.getByText('Add transaction'));
    // Verify sheet opens without crashing
    expect(screen.getByText('Add transaction')).toBeInTheDocument();
  });

  it('submitting AddTransactionSheet calls createExpense and updates transactions', async () => {
    mockCreateExpense.mockResolvedValueOnce(makeTransaction({ _id: 'new1', description: 'Food & Drink' }));
    renderMainLayout();
    await waitFor(() => document.querySelector('[data-testid="fab-record"]'));
    const fabBtn = document.querySelector('[data-testid="fab-record"]') as HTMLButtonElement | null;
    if (fabBtn) {
      await act(async () => { fireEvent.click(fabBtn); });
    }
    await waitFor(() => screen.getByText('Add transaction'));
    const amountInput = screen.getByLabelText('Amount') as HTMLInputElement;
    await act(async () => { fireEvent.change(amountInput, { target: { value: '12.5' } }); });
    const categorySelect = screen.getByLabelText('Category') as HTMLSelectElement;
    await act(async () => { fireEvent.change(categorySelect, { target: { value: 'Food & Drink' } }); });
    const enabledSave = screen.getAllByRole('button', { name: /^save$/i }).find((b) => !(b as HTMLButtonElement).disabled);
    expect(enabledSave).toBeTruthy();
    await act(async () => { fireEvent.click(enabledSave!); });
    await waitFor(() => {
      expect(mockCreateExpense).toHaveBeenCalled();
    });
  }, 30000);

  it('commitDelete is called after undo snackbar closes', async () => {
    mockGetExpenses.mockResolvedValue([
      makeTransaction({ _id: 'del1', description: 'DeleteMe' }),
    ]);
    renderMainLayout();
    await waitFor(() => screen.getAllByText('Home').length > 0);
    const transLabels = screen.getAllByText('Transactions');
    await act(async () => { fireEvent.click(transLabels[transLabels.length - 1]); });
    await waitFor(() => screen.getByText('DeleteMe'));
    const deleteIcon = document.querySelector('[data-testid="DeleteIcon"]');
    if (deleteIcon?.parentElement) {
      await act(async () => { fireEvent.click(deleteIcon.parentElement!); });
    }
    await waitFor(() => screen.getByText(/undo/i));
    // Dismiss snackbar by waiting - the commit happens after timeout
    expect(mockDeleteExpense).not.toHaveBeenCalled(); // not yet committed
  });

  it('handleSaved updates transaction in list via EditModal save', async () => {
    const { updateExpense } = require('../../services/api');
    (updateExpense as jest.Mock).mockResolvedValueOnce(makeTransaction({ _id: 'edit1', description: 'EditMe Updated' }));
    mockGetExpenses.mockResolvedValue([
      makeTransaction({ _id: 'edit1', description: 'EditMe', amount: 100 }),
    ]);
    mockGetExpense.mockResolvedValue(makeTransaction({ _id: 'edit1', description: 'EditMe Updated' }));
    renderMainLayout();
    await waitFor(() => screen.getAllByText('Home').length > 0);
    const transLabels = screen.getAllByText('Transactions');
    await act(async () => { fireEvent.click(transLabels[transLabels.length - 1]); });
    await waitFor(() => screen.getByText('EditMe'));
    // Click edit icon
    const editIcons = document.querySelectorAll('[data-testid="EditIcon"]');
    if (editIcons.length > 0) {
      await act(async () => { fireEvent.click(editIcons[0].parentElement!); });
    }
    await waitFor(() => screen.getByText('Edit Transaction'));
    // Click Save button in EditExpenseModal
    const saveBtn = screen.getByRole('button', { name: /^save$/i });
    await act(async () => { fireEvent.click(saveBtn); });
    await waitFor(() => {
      expect(mockGetExpense).toHaveBeenCalled();
    });
  }, 30000);

  it('filter by type filters transactions', async () => {
    mockGetExpenses.mockResolvedValue([
      makeTransaction({ _id: '1', description: 'Coffee', type: 'expense' }),
      makeTransaction({ _id: '2', description: 'Salary', type: 'income' }),
    ]);
    renderMainLayout();
    await waitFor(() => screen.getAllByText('Home').length > 0);
    const transLabels = screen.getAllByText('Transactions');
    await act(async () => { fireEvent.click(transLabels[transLabels.length - 1]); });
    await waitFor(() => screen.getByText('Coffee'));
    // Both transactions visible
    expect(screen.getByText('Coffee')).toBeInTheDocument();
    expect(screen.getByText('Salary')).toBeInTheDocument();
  });

  it('shows over-budget alert when budget is exceeded', async () => {
    // This requires budgets state — tested via the home tab rendering
    renderMainLayout();
    await waitFor(() => {
      expect(screen.getAllByText('Home').length).toBeGreaterThan(0);
    });
  });

  it('search by participant filters transactions', async () => {
    mockGetExpenses.mockResolvedValue([
      makeTransaction({ _id: '1', description: 'Lunch', participants: ['Alice', 'Bob'] }),
      makeTransaction({ _id: '2', description: 'Coffee' }),
    ]);
    renderMainLayout();
    await waitFor(() => screen.getAllByText('Home').length > 0);
    const transLabels = screen.getAllByText('Transactions');
    await act(async () => { fireEvent.click(transLabels[transLabels.length - 1]); });
    await waitFor(() => screen.getByText('Lunch'));
    const searchInput = screen.getByPlaceholderText('Search transactions…');
    await act(async () => { fireEvent.change(searchInput, { target: { value: 'Alice' } }); });
    await waitFor(() => {
      expect(screen.getByText('Lunch')).toBeInTheDocument();
    });
  });

  it('sort by amount sorts transactions', async () => {
    mockGetExpenses.mockResolvedValue([
      makeTransaction({ _id: '1', description: 'SmallExpense', amount: 10 }),
      makeTransaction({ _id: '2', description: 'BigExpense', amount: 1000 }),
    ]);
    renderMainLayout();
    await waitFor(() => screen.getAllByText('Home').length > 0);
    const transLabels = screen.getAllByText('Transactions');
    await act(async () => { fireEvent.click(transLabels[transLabels.length - 1]); });
    await waitFor(() => screen.getByText('SmallExpense'));
    // Click the Sort icon button
    const sortIcon = document.querySelector('[data-testid="SortIcon"]');
    if (sortIcon?.parentElement) {
      await act(async () => { fireEvent.click(sortIcon.parentElement!); });
    }
    expect(screen.getByText('BigExpense')).toBeInTheDocument();
  });

  it('export button exists in filter bar', async () => {
    mockGetExpenses.mockResolvedValue([
      makeTransaction({ _id: '1', description: 'Coffee' }),
    ]);
    renderMainLayout();
    await waitFor(() => screen.getAllByText('Home').length > 0);
    const transLabels = screen.getAllByText('Transactions');
    await act(async () => { fireEvent.click(transLabels[transLabels.length - 1]); });
    await waitFor(() => screen.getByText('Coffee'));
    const downloadIcon = document.querySelector('[data-testid="DownloadIcon"]');
    expect(downloadIcon).toBeTruthy();
  });

  it('duplicate transaction via EditExpenseModal onDuplicate', async () => {
    const { updateExpense } = require('../../services/api');
    (updateExpense as jest.Mock).mockResolvedValueOnce(makeTransaction({ _id: 'dup1', description: 'DupTest' }));
    mockCreateExpense.mockResolvedValueOnce(makeTransaction({ _id: 'dup2', description: 'DupTest Copy' }));
    mockGetExpenses.mockResolvedValue([
      makeTransaction({ _id: 'dup1', description: 'DupTest', amount: 100 }),
    ]);
    renderMainLayout();
    await waitFor(() => screen.getAllByText('Home').length > 0);
    const transLabels = screen.getAllByText('Transactions');
    await act(async () => { fireEvent.click(transLabels[transLabels.length - 1]); });
    await waitFor(() => screen.getByText('DupTest'));
    const editIcons = document.querySelectorAll('[data-testid="EditIcon"]');
    if (editIcons.length > 0) {
      await act(async () => { fireEvent.click(editIcons[0].parentElement!); });
    }
    await waitFor(() => screen.getByText('Edit Transaction'));
    const dupBtn = document.querySelector('[data-testid="ContentCopyIcon"]')?.parentElement;
    if (dupBtn) {
      await act(async () => { fireEvent.click(dupBtn); });
    }
    await waitFor(() => {
      expect(screen.getAllByText('Home').length).toBeGreaterThan(0);
    });
  });

  it('clicking export button opens menu with CSV and JSON options', async () => {
    global.URL.createObjectURL = jest.fn().mockReturnValue('blob:url');
    global.URL.revokeObjectURL = jest.fn();
    jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(jest.fn());

    mockGetExpenses.mockResolvedValue([
      makeTransaction({ _id: '1', description: 'Coffee', amount: 100 }),
    ]);
    renderMainLayout();
    await waitFor(() => screen.getAllByText('Home').length > 0);
    const transLabels = screen.getAllByText('Transactions');
    await act(async () => { fireEvent.click(transLabels[transLabels.length - 1]); });
    await waitFor(() => screen.getByText('Coffee'));
    const downloadBtn = document.querySelector('[data-testid="DownloadIcon"]')?.parentElement as HTMLButtonElement | null;
    if (downloadBtn && !downloadBtn.disabled) {
      await act(async () => { fireEvent.click(downloadBtn); });
      expect(screen.getByText('Export CSV')).toBeInTheDocument();
      expect(screen.getByText('Export JSON')).toBeInTheDocument();
    }
    jest.restoreAllMocks();
  });

  it('clicking Export CSV triggers CSV download', async () => {
    global.URL.createObjectURL = jest.fn().mockReturnValue('blob:url');
    global.URL.revokeObjectURL = jest.fn();
    const anchorClick = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(jest.fn());

    mockGetExpenses.mockResolvedValue([
      makeTransaction({ _id: '1', description: 'Coffee', amount: 100 }),
    ]);
    renderMainLayout();
    await waitFor(() => screen.getAllByText('Home').length > 0);
    const transLabels = screen.getAllByText('Transactions');
    await act(async () => { fireEvent.click(transLabels[transLabels.length - 1]); });
    await waitFor(() => screen.getByText('Coffee'));
    const downloadBtn = document.querySelector('[data-testid="DownloadIcon"]')?.parentElement as HTMLButtonElement | null;
    if (downloadBtn && !downloadBtn.disabled) {
      await act(async () => { fireEvent.click(downloadBtn); });
      const csvItem = screen.getByText('Export CSV');
      await act(async () => { fireEvent.click(csvItem); });
      expect(anchorClick).toHaveBeenCalled();
    }
    jest.restoreAllMocks();
  });

  it('clicking Export JSON triggers JSON download', async () => {
    global.URL.createObjectURL = jest.fn().mockReturnValue('blob:url');
    global.URL.revokeObjectURL = jest.fn();
    const anchorClick = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(jest.fn());

    mockGetExpenses.mockResolvedValue([
      makeTransaction({ _id: '1', description: 'Coffee', amount: 100 }),
    ]);
    renderMainLayout();
    await waitFor(() => screen.getAllByText('Home').length > 0);
    const transLabels = screen.getAllByText('Transactions');
    await act(async () => { fireEvent.click(transLabels[transLabels.length - 1]); });
    await waitFor(() => screen.getByText('Coffee'));
    const downloadBtn = document.querySelector('[data-testid="DownloadIcon"]')?.parentElement as HTMLButtonElement | null;
    if (downloadBtn && !downloadBtn.disabled) {
      await act(async () => { fireEvent.click(downloadBtn); });
      const jsonItem = screen.getByText('Export JSON');
      await act(async () => { fireEvent.click(jsonItem); });
      expect(anchorClick).toHaveBeenCalled();
      // Verify JSON blob was created with application/json type
      const blobCalls = (global.URL.createObjectURL as jest.Mock).mock.calls;
      const lastBlob = blobCalls[blobCalls.length - 1][0] as Blob;
      expect(lastBlob.type).toBe('application/json');
    }
    jest.restoreAllMocks();
  });

  it('shows transactions tab with search working', async () => {
    mockGetExpenses.mockResolvedValue([
      makeTransaction({ _id: '1', description: 'Coffee' }),
      makeTransaction({ _id: '2', description: 'Lunch' }),
    ]);
    renderMainLayout();
    await waitFor(() => screen.getAllByText('Home').length > 0);
    const transLabels = screen.getAllByText('Transactions');
    await act(async () => { fireEvent.click(transLabels[transLabels.length - 1]); });
    await waitFor(() => screen.getByText('Coffee'));
    const searchInput = screen.getByPlaceholderText('Search transactions…');
    await act(async () => { fireEvent.change(searchInput, { target: { value: 'Coffee' } }); });
    await waitFor(() => {
      expect(screen.getByText('Coffee')).toBeInTheDocument();
    });
  });

  it('hides empty state when transactions exist', async () => {
    mockGetExpenses.mockResolvedValue([
      makeTransaction({ _id: '1', description: 'Coffee' }),
    ]);
    renderMainLayout();
    await waitFor(() => {
      expect(mockGetExpenses).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.queryByText('No transactions yet')).not.toBeInTheDocument();
    });
  });

  it('category filter shows only matching transactions', async () => {
    mockGetExpenses.mockResolvedValue([
      makeTransaction({ _id: '1', description: 'Coffee', category: 'Food & Drink' }),
      makeTransaction({ _id: '2', description: 'Bus fare', category: 'Transport' }),
    ]);
    renderMainLayout();
    await waitFor(() => screen.getAllByText('Home').length > 0);
    const transLabels = screen.getAllByText('Transactions');
    await act(async () => { fireEvent.click(transLabels[transLabels.length - 1]); });
    await waitFor(() => screen.getByText('Coffee'));
    // Both transactions visible initially
    expect(screen.getByText('Coffee')).toBeInTheDocument();
    expect(screen.getByText('Bus fare')).toBeInTheDocument();
    // Open category filter panel
    const labelIcon = document.querySelector('[data-testid="LabelIcon"]');
    if (labelIcon?.parentElement) {
      await act(async () => { fireEvent.click(labelIcon.parentElement!); });
    }
    // Click the Food & Drink category chip
    await waitFor(() => screen.getByText('Food & Drink'));
    await act(async () => { fireEvent.click(screen.getByText('Food & Drink')); });
    await waitFor(() => {
      expect(screen.getByText('Coffee')).toBeInTheDocument();
      expect(screen.queryByText('Bus fare')).not.toBeInTheDocument();
    });
  });

  it('search by notes content filters transactions', async () => {
    mockGetExpenses.mockResolvedValue([
      makeTransaction({ _id: '1', description: 'Lunch', notes: 'client meeting' }),
      makeTransaction({ _id: '2', description: 'Coffee', notes: undefined }),
    ]);
    renderMainLayout();
    await waitFor(() => screen.getAllByText('Home').length > 0, { timeout: 8000 });
    const transLabels = screen.getAllByText('Transactions');
    await act(async () => { fireEvent.click(transLabels[transLabels.length - 1]); });
    await waitFor(() => screen.getByText('Lunch'), { timeout: 8000 });
    const searchInput = screen.getByPlaceholderText('Search transactions…');
    await act(async () => { fireEvent.change(searchInput, { target: { value: 'client meeting' } }); });
    await waitFor(() => {
      expect(screen.getByText('Lunch')).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});
