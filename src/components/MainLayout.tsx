import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Container,
  CircularProgress,
  Button,
  Fab,
  useMediaQuery,
  useTheme,
  BottomNavigation,
  BottomNavigationAction,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Card,
  CardActionArea,
  CardContent,
  Menu,
  MenuItem,
} from '@mui/material';
import useToast from '../hooks/useToast';
import AddIcon from '@mui/icons-material/Add';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import BarChartIcon from '@mui/icons-material/BarChart';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import TableChartIcon from '@mui/icons-material/TableChart';
import DataObjectIcon from '@mui/icons-material/DataObject';
import RepeatIcon from '@mui/icons-material/Repeat';
import SavingsIcon from '@mui/icons-material/Savings';
import dayjs, { Dayjs } from 'dayjs';
import { Transaction, TransactionRequest, TransactionType, PaymentMethod } from '../types';
import { getExpenses, getExpense, createExpense, deleteExpense, scanReceipt, getLastAmounts, ReceiptScanResult } from '../services/api';
import { useTags } from '../hooks/useTags';
import SummaryCards from './dashboard/SummaryCards';
import DashboardSkeleton from './dashboard/DashboardSkeleton';
import DateRangeControl, { DatePreset } from './dashboard/DateRangeControl';
import MobileHero from './dashboard/MobileHero';
import CategoryChart from './dashboard/CategoryChart';
import TrendsChart from './dashboard/TrendsChart';
import BudgetProgress from './dashboard/BudgetProgress';
import SpendingInsights from './dashboard/SpendingInsights';
import SpendingBreakdown from './dashboard/SpendingBreakdown';
import PeopleBreakdown from './dashboard/PeopleBreakdown';
import ExpenseList from './expenses/ExpenseList';
import EmptyState from './EmptyState';
import FilterBar from './expenses/FilterBar';
import AddExpenseModal, { ReceiptPrefill } from './expenses/AddExpenseModal';
import AddTransactionSheet from './expenses/AddTransactionSheet';
import ReceiptScanButton from './expenses/ReceiptScanButton';
import EditExpenseModal from './expenses/EditExpenseModal';
import QuickExpenseInput from './expenses/QuickExpenseInput';
import { useFxRates } from '../hooks/useFxRates';
import { Currency } from '../hooks/useFxRates';
import { useRecurring } from '../hooks/useRecurring';
const NetWorthPage = React.lazy(() => import('./networth/NetWorthPage'));
const SettingsPage = React.lazy(() => import('./settings/SettingsPage'));
const RecurringPage = React.lazy(() => import('./recurring/RecurringPage'));
import { useBudgets } from '../hooks/useBudgets';
import OnboardingFlow, { isOnboardingComplete, markOnboardingComplete } from './onboarding/OnboardingFlow';
const SpendingInsightsPage = React.lazy(() => import('./insights/SpendingInsightsPage'));
import SpendingPulse from './dashboard/SpendingPulse';
import { useSmartSuggestions } from '../hooks/useSmartSuggestions';
const GoalsPage = React.lazy(() => import('./goals/GoalsPage'));
const ReportsPage = React.lazy(() => import('./reports/ReportsPage'));
import AssessmentIcon from '@mui/icons-material/Assessment';

function getOwnerFromToken(): string {
  try {
    const token = localStorage.getItem('mf_token');
    if (!token) return '';
    return JSON.parse(atob(token.split('.')[1])).userId || '';
  } catch {
    return '';
  }
}

interface MainLayoutProps {
  initialTab?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
}

const MainLayout: React.FC<MainLayoutProps> = ({ initialTab = 0 }) => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('sm'));
  const { currency, setCurrency, convert, symbol } = useFxRates();
  const { items: recurringItems, markApplied } = useRecurring();
  const { budgets } = useBudgets();
  const { tags, addTag } = useTags();
  const [activeTab, setActiveTab] = useState<0 | 1 | 2 | 3 | 4 | 5 | 6 | 7>(initialTab);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => { window.removeEventListener('offline', goOffline); window.removeEventListener('online', goOnline); };
  }, []);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [datePreset, setDatePreset] = useState<DatePreset>(() => {
    const saved = localStorage.getItem('mf_date_preset') as DatePreset | null;
    return saved ?? 'month';
  });
  const [selectedMonth, setSelectedMonth] = useState<Dayjs | null>(() => {
    const monthParam = searchParams.get('month');
    if (monthParam && /^\d{4}-(0[1-9]|1[0-2])$/.test(monthParam)) {
      const parsed = dayjs(`${monthParam}-01`);
      if (parsed.isValid()) return parsed.startOf('month');
    }
    return dayjs();
  });
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<PaymentMethod | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string | 'all'>('all');
  const [tagFilter, setTagFilter] = useState<string | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addReceiptOpen, setAddReceiptOpen] = useState(false);
  const [quickExpenseOpen, setQuickExpenseOpen] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const toast = useToast();
  const pendingDelete = useRef<Transaction | null>(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [receiptPrefill, setReceiptPrefill] = useState<ReceiptPrefill | undefined>(undefined);
  const receiptImageUrlRef = useRef<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [onboardingOpen, setOnboardingOpen] = useState(() => !isOnboardingComplete());

  const handleOnboardingDismiss = useCallback(() => {
    markOnboardingComplete();
    setOnboardingOpen(false);
  }, []);

  const handleOnboardingFab = useCallback(() => {
    markOnboardingComplete();
    setOnboardingOpen(false);
    setAddOpen(true);
  }, []);

  const showSnackbar = useCallback(
    (message: string, severity: 'success' | 'error' = 'success') => {
      if (severity === 'error') toast.error(message);
      else toast.success(message);
    },
    [toast]
  );

  const fetchTransactions = async () => {
    try {
      const data = await getExpenses();
      setTransactions(data);
    } catch {
      showSnackbar('Failed to load transactions', 'error');
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Sync selectedMonth -> URL (?month=YYYY-MM) for back/forward + shareable links.
  useEffect(() => {
    const current = searchParams.get('month');
    if (datePreset === 'month' && selectedMonth) {
      const next = selectedMonth.format('YYYY-MM');
      if (current !== next) {
        const params = new URLSearchParams(searchParams);
        params.set('month', next);
        setSearchParams(params, { replace: true });
      }
    } else if (current) {
      const params = new URLSearchParams(searchParams);
      params.delete('month');
      setSearchParams(params, { replace: true });
    }
  }, [selectedMonth, datePreset, searchParams, setSearchParams]);

  // Sync URL -> selectedMonth (handles browser back/forward).
  useEffect(() => {
    const monthParam = searchParams.get('month');
    if (!monthParam || !/^\d{4}-(0[1-9]|1[0-2])$/.test(monthParam)) return;
    const parsed = dayjs(`${monthParam}-01`);
    if (!parsed.isValid()) return;
    const normalised = parsed.startOf('month');
    if (!selectedMonth || !selectedMonth.isSame(normalised, 'month')) {
      setSelectedMonth(normalised);
      if (datePreset !== 'month') {
        setDatePreset('month');
        localStorage.setItem('mf_date_preset', 'month');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;

      // Cmd+K / Ctrl+K for quick expense
      if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey) && !e.altKey) {
        e.preventDefault();
        if (!addOpen && !addReceiptOpen && !editTransaction && !quickExpenseOpen) {
          setQuickExpenseOpen(true);
        }
        return;
      }

      // 'n' for normal add expense
      if (e.key !== 'n' || e.ctrlKey || e.metaKey || e.altKey) return;
      if (addOpen || addReceiptOpen || editTransaction) return;
      setAddOpen(true);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [addOpen, addReceiptOpen, editTransaction, quickExpenseOpen]);

  const handleAdd = async (data: Omit<TransactionRequest, 'owner'>) => {
    const owner = getOwnerFromToken();
    const created = await createExpense({ ...data, owner });
    setTransactions((prev) => [created, ...prev]);
    // Clean up receipt object URL if it was used
    if (receiptImageUrlRef.current) {
      URL.revokeObjectURL(receiptImageUrlRef.current);
      receiptImageUrlRef.current = null;
    }
    setReceiptPrefill(undefined);
    showSnackbar('Transaction added');
  };

  // Optimistic insert for the redesigned AddTransactionSheet (issue #286).
  // Inserts a temporary transaction immediately, then replaces with the
  // server-returned record on success, or rolls back on error.
  const handleAddOptimistic = async (data: Omit<TransactionRequest, 'owner'>) => {
    const owner = getOwnerFromToken();
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const nowIso = new Date().toISOString();
    const optimistic: Transaction = {
      _id: tempId,
      owner,
      description: data.description,
      amount: data.amount,
      type: data.type,
      category: data.category,
      item: data.item,
      participants: data.participants,
      splitBill: data.splitBill,
      paymentMethod: data.paymentMethod ?? null,
      currency: data.currency,
      originalAmount: data.originalAmount,
      exchangeRate: data.exchangeRate,
      notes: data.notes,
      tags: [],
      date: data.date || new Date().toISOString().split('T')[0],
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    setTransactions((prev) => [optimistic, ...prev]);
    try {
      const created = await createExpense({ ...data, owner });
      setTransactions((prev) => prev.map((t) => (t._id === tempId ? created : t)));
      showSnackbar('Transaction added');
    } catch (err) {
      // Rollback
      setTransactions((prev) => prev.filter((t) => t._id !== tempId));
      showSnackbar('Failed to add transaction', 'error');
      throw err;
    }
  };

  const handleScanReceipt = async (file: File) => {
    setScanLoading(true);
    // Create object URL for image preview
    const previewUrl = URL.createObjectURL(file);
    receiptImageUrlRef.current = previewUrl;
    try {
      const result: ReceiptScanResult = await scanReceipt(file);
      setReceiptPrefill({
        amount: result.amount,
        description: result.description || result.merchant || '',
        category: result.category,
        date: result.date,
        confidence: result.confidence,
        imagePreviewUrl: previewUrl,
      });
      setAddReceiptOpen(true);
    } catch {
      URL.revokeObjectURL(previewUrl);
      receiptImageUrlRef.current = null;
      showSnackbar('Could not read receipt — fill in manually', 'error');
      setReceiptPrefill(undefined);
      setAddReceiptOpen(true);
    } finally {
      setScanLoading(false);
    }
  };

  const commitDelete = useCallback(
    async (t: Transaction) => {
      try {
        await deleteExpense(t._id);
      } catch {
        setTransactions((prev) => [t, ...prev]);
        toast.error('Failed to delete transaction');
      }
    },
    [toast]
  );

  const handleDelete = useCallback(
    (id: string) => {
      const tx = transactions.find((t) => t._id === id);
      if (!tx) return;
      setTransactions((prev) => prev.filter((t) => t._id !== id));
      pendingDelete.current = tx;
      const label = tx.item || tx.description || 'Transaction';
      const sign = tx.type === 'income' ? '+' : '-';
      const amount = `${symbol}${convert(tx.amount).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
      const message = `Deleted "${label}" (${sign}${amount})`;
      toast.success(message, {
        duration: 5000,
        action: {
          label: 'Undo',
          onClick: () => {
            if (pendingDelete.current?._id !== tx._id) return;
            pendingDelete.current = null;
            setTransactions((prev) =>
              [tx, ...prev].sort(
                (a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime()
              )
            );
          },
        },
        onTimeout: () => {
          if (pendingDelete.current?._id !== tx._id) return;
          pendingDelete.current = null;
          commitDelete(tx);
        },
      });
    },
    [toast, commitDelete, symbol, convert, transactions]
  );

  const handleSaved = async (updated: Transaction) => {
    // Optimistic update for immediate UI feedback
    setTransactions((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
    showSnackbar('Transaction updated');
    // Re-fetch from server to guarantee all fields (e.g. participants) are in sync
    try {
      const fresh = await getExpense(updated._id);
      setTransactions((prev) => prev.map((t) => (t._id === fresh._id ? fresh : t)));
    } catch {}
  };

  const existingCategories = useMemo(
    () => Array.from(new Set(transactions.map((t) => t.category).filter(Boolean) as string[])),
    [transactions]
  );

  const recentItems = useMemo(() => {
    const seen: string[] = [];
    [...transactions].sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime())
      .forEach((t) => { if (t.item && !seen.includes(t.item)) seen.push(t.item); });
    return seen.slice(0, 5);
  }, [transactions]);

  const knownParticipants = useMemo(() => {
    const seen = new Set<string>();
    transactions.forEach((t) => (t.participants ?? []).forEach((p) => seen.add(p)));
    return Array.from(seen).slice(0, 10);
  }, [transactions]);

  const descriptionsByItem = useMemo(() => {
    const map: Record<string, string[]> = {};
    transactions.forEach((t) => {
      const key = t.item || '';
      if (!key || !t.description?.trim()) return;
      if (!map[key]) map[key] = [];
      if (!map[key].includes(t.description.trim())) map[key].push(t.description.trim());
    });
    return map;
  }, [transactions]);

  // description/item → most recent amount (fetched from API for full history coverage)
  const [amountsByDescription, setAmountsByDescription] = useState<Record<string, number>>({});
  useEffect(() => {
    try {
      const result = getLastAmounts();
      if (result && typeof result.then === 'function') {
        result.then(setAmountsByDescription).catch(() => {});
      }
    } catch {
      // Silently handle mock/test environments
    }
  }, [transactions.length]);

  // description → most recent category used for that description (for smart categorization)
  const categoriesByDescription = useMemo(() => {
    const map: Record<string, string> = {};
    // Sort newest first so first hit is most recent
    [...transactions].sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime())
      .forEach((t) => {
        const key = (t.description?.trim() || t.item || '').toLowerCase();
        if (key && t.category && !map[key]) map[key] = t.category;
      });
    return map;
  }, [transactions]);

  const smartSuggestions = useSmartSuggestions(transactions);

  const handlePresetChange = (p: DatePreset) => {
    setDatePreset(p);
    localStorage.setItem('mf_date_preset', p);
    if (p === 'month' && !selectedMonth) setSelectedMonth(dayjs());
  };

  const handleCustomChange = (start: string, end: string) => {
    setCustomStart(start);
    setCustomEnd(end);
  };

  const monthFiltered = useMemo(() => {
    if (datePreset === 'all-time') return transactions;
    if (datePreset === 'week') {
      const start = dayjs().startOf('week');
      return transactions.filter((t) => {
        const d = dayjs(t.date || t.createdAt);
        return d.isValid() && !d.isBefore(start);
      });
    }
    if (datePreset === 'last-month') {
      const lm = dayjs().subtract(1, 'month');
      return transactions.filter((t) => {
        const d = dayjs(t.date || t.createdAt);
        return d.isValid() && d.isSame(lm, 'month');
      });
    }
    if (datePreset === 'custom' && customStart && customEnd) {
      const start = dayjs(customStart).startOf('day');
      const end = dayjs(customEnd).endOf('day');
      return transactions.filter((t) => {
        const d = dayjs(t.date || t.createdAt);
        return d.isValid() && !d.isBefore(start) && !d.isAfter(end);
      });
    }
    // 'month' preset (or custom with no dates yet)
    if (!selectedMonth) return transactions;
    return transactions.filter((t) => {
      const d = dayjs(t.date || t.createdAt);
      return d.isValid() && d.isSame(selectedMonth, 'month');
    });
  }, [transactions, datePreset, selectedMonth, customStart, customEnd]);

  const prevMonthFiltered = useMemo(() => {
    if (datePreset !== 'month' || !selectedMonth) return [];
    const prev = selectedMonth.subtract(1, 'month');
    return transactions.filter((t) => {
      const d = dayjs(t.date || t.createdAt);
      return d.isValid() && d.isSame(prev, 'month');
    });
  }, [transactions, datePreset, selectedMonth]);

  const streak = useMemo(() => {
    const days = new Set(transactions.map((t) => dayjs(t.date || t.createdAt).format('YYYY-MM-DD')));
    let count = 0;
    let cursor = dayjs();
    if (!days.has(cursor.format('YYYY-MM-DD'))) cursor = cursor.subtract(1, 'day');
    while (days.has(cursor.format('YYYY-MM-DD'))) {
      count++;
      cursor = cursor.subtract(1, 'day');
    }
    return count;
  }, [transactions]);

  const currentMonthKey = dayjs().format('YYYY-MM');
  const pendingRecurring = useMemo(
    () => recurringItems.filter((r) => r.lastApplied !== currentMonthKey),
    [recurringItems, currentMonthKey]
  );

  const recurringLabels = useMemo(
    () => new Set(recurringItems.flatMap((r) => [r.label, r.item, r.description].filter(Boolean) as string[])),
    [recurringItems]
  );

  const applyRecurring = async () => {
    const owner = getOwnerFromToken();
    for (const r of pendingRecurring) {
      await createExpense({
        description: r.description || r.label,
        amount: r.amount,
        type: r.type,
        item: r.item,
        category: r.category,
        participants: r.participants,
        date: dayjs().format('YYYY-MM-DD'),
        owner,
      });
    }
    markApplied(pendingRecurring.map((r) => r.id), currentMonthKey);
    await fetchTransactions();
    showSnackbar(`${pendingRecurring.length} recurring transaction${pendingRecurring.length > 1 ? 's' : ''} added`);
  };

  const categorySpend = useMemo(() => {
    const map: Record<string, number> = {};
    monthFiltered.filter((t) => t.type === 'expense').forEach((t) => {
      const cat = t.category || 'Other';
      map[cat] = (map[cat] || 0) + t.amount;
    });
    return map;
  }, [monthFiltered]);

  const filteredTransactions = useMemo(() => {
    const pool = search !== '' ? transactions : monthFiltered;
    const filtered = pool.filter((t) => {
      const searchLow = search.toLowerCase();
      const matchesSearch =
        search === '' ||
        (t.description || '').toLowerCase().includes(searchLow) ||
        (t.item || '').toLowerCase().includes(searchLow) ||
        (t.category || '').toLowerCase().includes(searchLow) ||
        (t.participants || []).some((p) => p.toLowerCase().includes(searchLow)) ||
        (t.notes || '').toLowerCase().includes(searchLow) ||
        (t.tags || []).some((tag) => tag.name.toLowerCase().includes(searchLow));
      const matchesType = typeFilter === 'all' || t.type === typeFilter;
      const matchesPayment = paymentMethodFilter === 'all' || t.paymentMethod === paymentMethodFilter;
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
      const matchesTag = tagFilter === 'all' || (t.tags || []).some((tag) => tag._id === tagFilter);
      return matchesSearch && matchesType && matchesPayment && matchesCategory && matchesTag;
    });
    if (sortBy === 'amount') {
      return [...filtered].sort((a, b) => b.amount - a.amount);
    }
    return filtered;
  }, [transactions, monthFiltered, search, typeFilter, paymentMethodFilter, categoryFilter, tagFilter, sortBy]);

  const handleExport = () => {
    const header = ['Date', 'Item', 'Description', 'Type', 'Category', 'Amount', 'Payment Method', 'Participants'];
    const rows = filteredTransactions.map((t) => [
      new Date(t.date || t.createdAt).toISOString().split('T')[0],
      t.item ? `"${t.item.replace(/"/g, '""')}"` : '',
      `"${t.description.replace(/"/g, '""')}"`,
      t.type,
      t.category ? `"${t.category.replace(/"/g, '""')}"` : '',
      t.amount,
      t.paymentMethod || '',
      t.participants?.length ? `"${t.participants.join(', ')}"` : '',
    ]);
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileSuffix = datePreset === 'month' && selectedMonth
      ? selectedMonth.format('YYYY-MM')
      : datePreset === 'last-month' ? dayjs().subtract(1, 'month').format('YYYY-MM')
      : datePreset === 'week' ? `week-${dayjs().startOf('week').format('YYYY-MM-DD')}`
      : datePreset === 'custom' && customStart ? `${customStart}_${customEnd}`
      : 'all';
    a.download = search ? 'money-flow-search.csv' : `money-flow-${fileSuffix}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    const fileSuffix = datePreset === 'month' && selectedMonth
      ? selectedMonth.format('YYYY-MM')
      : datePreset === 'last-month' ? dayjs().subtract(1, 'month').format('YYYY-MM')
      : datePreset === 'week' ? `week-${dayjs().startOf('week').format('YYYY-MM-DD')}`
      : datePreset === 'custom' && customStart ? `${customStart}_${customEnd}`
      : 'all';
    const payload = {
      exportDate: new Date().toISOString(),
      transactionCount: filteredTransactions.length,
      filters: {
        from: customStart || null,
        to: customEnd || null,
        type: typeFilter === 'all' ? null : typeFilter,
      },
      transactions: filteredTransactions,
    };
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = search ? 'money-flow-search.json' : `money-flow-${fileSuffix}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const navItems = [
    { label: 'Home', icon: <DashboardIcon /> },
    { label: 'Transactions', icon: <ReceiptLongIcon /> },
    { label: 'Net Worth', icon: <AccountBalanceIcon /> },
    { label: 'Insights', icon: <BarChartIcon /> },
    { label: 'Recurring', icon: <RepeatIcon /> },
    { label: 'Goals', icon: <SavingsIcon /> },
    { label: 'Reports', icon: <AssessmentIcon /> },
    { label: 'Settings', icon: <SettingsIcon /> },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{ ml: { sm: '220px' }, width: { sm: 'calc(100% - 220px)' } }}
      >
        <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
              fontWeight: 700,
              letterSpacing: '-0.01em',
              color: 'primary.main',
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.success.main} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Money Flow
          </Typography>
          {isOffline && (
            <Typography sx={{ fontSize: '0.68rem', color: 'warning.main', fontWeight: 600, letterSpacing: '0.04em', px: 1, py: 0.25, borderRadius: 1, bgcolor: theme.palette.mode === 'dark' ? 'rgba(251,191,36,0.1)' : 'rgba(245,158,11,0.12)', border: theme.palette.mode === 'dark' ? '1px solid rgba(251,191,36,0.2)' : '1px solid rgba(245,158,11,0.25)' }}>
              Offline
            </Typography>
          )}
          <Button
            startIcon={<FileDownloadIcon />}
            onClick={(e) => setExportMenuAnchor(e.currentTarget)}
            disabled={transactions.length === 0}
            sx={{ ml: 2, fontSize: '0.75rem' }}
            variant="outlined"
            size="small"
            aria-haspopup="true"
            aria-expanded={Boolean(exportMenuAnchor)}
          >
            Export
          </Button>
          <Menu
            anchorEl={exportMenuAnchor}
            open={Boolean(exportMenuAnchor)}
            onClose={() => setExportMenuAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem
              onClick={() => {
                setExportMenuAnchor(null);
                handleExport();
              }}
              dense
            >
              <ListItemIcon>
                <TableChartIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Export CSV</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={() => {
                setExportMenuAnchor(null);
                handleExportJson();
              }}
              dense
            >
              <ListItemIcon>
                <DataObjectIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Export JSON</ListItemText>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Desktop permanent drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          width: 220,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 220,
            boxSizing: 'border-box',
            top: '64px',
            height: 'calc(100% - 64px)',
            bgcolor: 'background.paper',
            borderRight: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.1)' : 'rgba(148,163,184,0.15)'}`,
          },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <List>
            {navItems.map((item, index) => (
              <ListItemButton
                key={item.label}
                selected={activeTab === index}
                onClick={() => setActiveTab(index as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7)}
                sx={{
                  '&.Mui-selected': { bgcolor: theme.palette.mode === 'dark' ? 'rgba(129,140,248,0.1)' : 'rgba(99,102,241,0.12)', color: 'primary.main' },
                  '&.Mui-selected .MuiListItemIcon-root': { color: 'primary.main' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: activeTab === index ? 700 : 400,
                  }}
                />
              </ListItemButton>
            ))}
          </List>
          <Box sx={{ mt: 'auto', px: 2, pb: 2 }}>
            <Typography
              variant="caption"
              sx={{ color: 'text.disabled', fontSize: '0.7rem', userSelect: 'none' }}
            >
              v{process.env.VITE_VERSION ?? '1.0.0'}
            </Typography>
          </Box>
        </Box>
      </Drawer>

      {/* Main content offset by drawer on desktop */}
      <Box sx={{ ml: { sm: '220px' } }}>
        <Container
          maxWidth="lg"
          sx={{
            py: { xs: 2, sm: 4 },
            px: { xs: 1.5, sm: 3 },
            pb: { xs: 'calc(56px + 20px + env(safe-area-inset-bottom))', sm: 4 },
          }}
        >
          {activeTab === 0 && (
            <>
              {initialLoading ? (
                <DashboardSkeleton />
              ) : transactions.length === 0 ? (
                <EmptyState
                  heading="No transactions yet"
                  subtext="Track your first expense to see your spending here."
                  ctaLabel="Add transaction"
                  onCta={() => setAddOpen(true)}
                />
              ) : (<>
              {/* Recurring prompt banner */}
              {pendingRecurring.length > 0 && (
                <Box sx={{ mb: 2, py: 1.5, px: 2, borderRadius: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(129,140,248,0.08)' : 'rgba(99,102,241,0.1)', border: theme.palette.mode === 'dark' ? '1px solid rgba(129,140,248,0.2)' : '1px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                  <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', flex: 1 }}>
                    {pendingRecurring.length} recurring transaction{pendingRecurring.length > 1 ? 's' : ''} pending for {dayjs().format('MMMM')}
                  </Typography>
                  <Button size="small" variant="contained" onClick={applyRecurring} sx={{ fontSize: '0.75rem', px: 1.5, flexShrink: 0 }}>
                    Apply
                  </Button>
                </Box>
              )}

              {/* Budget alerts — over limit + approaching limit */}
              {(() => {
                const overBudget = Object.entries(budgets).filter(([cat, limit]) => limit > 0 && (categorySpend[cat] || 0) > limit);
                const nearBudget = Object.entries(budgets).filter(([cat, limit]) => {
                  const spent = categorySpend[cat] || 0;
                  return limit > 0 && spent >= limit * 0.8 && spent <= limit;
                });
                if (overBudget.length === 0 && nearBudget.length === 0) return null;
                return (
                  <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {overBudget.length > 0 && (
                      <Box sx={{ py: 1.25, px: 2, borderRadius: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(251,113,133,0.07)' : 'rgba(244,63,94,0.08)', border: theme.palette.mode === 'dark' ? '1px solid rgba(251,113,133,0.2)' : '1px solid rgba(244,63,94,0.25)', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ fontSize: '0.82rem', color: 'error.light', fontWeight: 600 }}>⚠</Typography>
                        <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>
                          Over budget: {overBudget.map(([cat, limit]) => `${cat} (+${symbol}${convert((categorySpend[cat] || 0) - limit).toLocaleString(undefined, { maximumFractionDigits: 0 })})`).join(', ')}
                        </Typography>
                      </Box>
                    )}
                    {nearBudget.length > 0 && (
                      <Box sx={{ py: 1.25, px: 2, borderRadius: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(251,191,36,0.07)' : 'rgba(245,158,11,0.08)', border: theme.palette.mode === 'dark' ? '1px solid rgba(251,191,36,0.2)' : '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ fontSize: '0.82rem', color: 'warning.main', fontWeight: 600 }}>⚡</Typography>
                        <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>
                          Near limit: {nearBudget.map(([cat, limit]) => `${cat} (${Math.round(((categorySpend[cat] || 0) / limit) * 100)}%)`).join(', ')}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                );
              })()}

              <SpendingPulse />

              {/* Mobile: preset chips + hero card */}
              <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
                <Box sx={{ mb: 1.5 }}>
                  <DateRangeControl
                    preset={datePreset}
                    selectedMonth={selectedMonth}
                    customStart={customStart}
                    customEnd={customEnd}
                    currency={currency}
                    onPresetChange={handlePresetChange}
                    onMonthChange={setSelectedMonth}
                    onCustomChange={handleCustomChange}
                    onCurrencyChange={setCurrency}
                  />
                </Box>
                <MobileHero
                  transactions={monthFiltered}
                  prevMonthTransactions={prevMonthFiltered}
                  streak={streak}
                  selectedMonth={selectedMonth}
                  onChange={setSelectedMonth}
                  currency={currency}
                  onCurrencyChange={setCurrency}
                  convert={convert}
                  symbol={symbol}
                />
                <SpendingInsights transactions={monthFiltered} prevMonthTransactions={prevMonthFiltered} convert={convert} symbol={symbol} />
                <BudgetProgress budgets={budgets} categorySpend={categorySpend} convert={convert} symbol={symbol} onCategoryClick={(cat) => { setSearch(cat); setActiveTab(1); }} />
                <SpendingBreakdown transactions={monthFiltered} prevMonthTransactions={prevMonthFiltered} convert={convert} symbol={symbol} onItemClick={(name) => { setSearch(name); setActiveTab(1); }} />
                <PeopleBreakdown transactions={monthFiltered} convert={convert} symbol={symbol} onPersonClick={(name) => { setSearch(name); setActiveTab(1); }} />
                {monthFiltered.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700 }}>Recent</Typography>
                      <Typography variant="caption" onClick={() => setActiveTab(1)} sx={{ color: 'primary.main', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600 }}>See all →</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {monthFiltered.slice(0, 5).map((t) => (
                        <Card key={t._id} sx={{ border: `1px solid ${theme.palette.divider}`, background: theme.palette.mode === 'dark' ? 'rgba(30,41,59,0.5)' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)' }}>
                          <CardActionArea onClick={() => setEditTransaction(t)} sx={{ p: 0 }}>
                            <CardContent sx={{ p: '12px 16px', '&:last-child': { pb: '12px' } }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                  <Typography fontWeight={600} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.88rem' }}>
                                    {t.item || t.description}
                                  </Typography>
                                  {t.item && t.description && t.description !== t.item && (
                                    <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', lineHeight: 1.2 }}>{t.description}</Typography>
                                  )}
                                  {t.participants && t.participants.length > 0 && (
                                    <Typography sx={{ fontSize: '0.63rem', color: 'text.disabled', mt: 0.25 }}>
                                      {t.splitBill === true && t.type === 'expense'
                                        ? `÷${t.participants.length + 1} · ${symbol}${convert(t.amount / (t.participants.length + 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })}/person`
                                        : `🎁 ${t.participants.join(', ')}`}
                                    </Typography>
                                  )}
                                </Box>
                                <Typography fontWeight={700} sx={{ color: t.type === 'income' ? theme.palette.success.light : theme.palette.error.light, fontSize: '0.9rem', flexShrink: 0 }}>
                                  {t.type === 'income' ? '+' : '-'}{symbol}{convert(t.amount).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </Typography>
                              </Box>
                            </CardContent>
                          </CardActionArea>
                        </Card>
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>

              {/* Desktop: date range control + summary cards + chart */}
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Box sx={{ mb: 2 }}>
                  <DateRangeControl
                    preset={datePreset}
                    selectedMonth={selectedMonth}
                    customStart={customStart}
                    customEnd={customEnd}
                    currency={currency}
                    onPresetChange={handlePresetChange}
                    onMonthChange={setSelectedMonth}
                    onCustomChange={handleCustomChange}
                    onCurrencyChange={setCurrency}
                  />
                </Box>
                <SummaryCards transactions={monthFiltered} prevMonthTransactions={prevMonthFiltered} convert={convert} symbol={symbol} />
                <SpendingInsights transactions={monthFiltered} prevMonthTransactions={prevMonthFiltered} convert={convert} symbol={symbol} />
                {(() => {
                  const weekStart = dayjs().startOf('week');
                  const lastWeekStart = weekStart.subtract(1, 'week');
                  const thisWeek = transactions.filter((t) => {
                    const d = dayjs(t.date || t.createdAt);
                    return d.isValid() && !d.isBefore(weekStart);
                  });
                  const lastWeek = transactions.filter((t) => {
                    const d = dayjs(t.date || t.createdAt);
                    return d.isValid() && !d.isBefore(lastWeekStart) && d.isBefore(weekStart);
                  });
                  const weekExp = thisWeek.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
                  const lastWeekExp = lastWeek.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
                  const weekInc = thisWeek.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
                  if (weekExp === 0 && weekInc === 0) return null;
                  const delta = lastWeekExp > 0 ? weekExp - lastWeekExp : null;
                  return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, px: 0.5, py: 1, borderRadius: 1.5, bgcolor: theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.04)' : 'rgba(148,163,184,0.06)', border: theme.palette.mode === 'dark' ? '1px solid rgba(148,163,184,0.08)' : '1px solid rgba(148,163,184,0.12)' }}>
                      <Typography sx={{ fontSize: '0.68rem', color: 'text.disabled', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0 }}>This week</Typography>
                      {weekExp > 0 && <Typography sx={{ fontSize: '0.78rem', color: 'error.light', fontWeight: 600 }}>-{symbol}{convert(weekExp).toLocaleString(undefined, { maximumFractionDigits: 0 })}</Typography>}
                      {weekInc > 0 && <Typography sx={{ fontSize: '0.78rem', color: 'success.light', fontWeight: 600 }}>+{symbol}{convert(weekInc).toLocaleString(undefined, { maximumFractionDigits: 0 })}</Typography>}
                      <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled' }}>{thisWeek.length} txn{thisWeek.length !== 1 ? 's' : ''}</Typography>
                      {delta !== null && <Typography sx={{ fontSize: '0.72rem', color: delta > 0 ? theme.palette.error.light : theme.palette.success.light, fontWeight: 600, ml: 'auto' }}>{delta > 0 ? '↑' : '↓'} {symbol}{convert(Math.abs(delta)).toLocaleString(undefined, { maximumFractionDigits: 0 })} vs last week</Typography>}
                    </Box>
                  );
                })()}
                <TrendsChart transactions={transactions} onMonthSelect={setSelectedMonth} convert={convert} symbol={symbol} />
                <CategoryChart transactions={monthFiltered} onCategoryClick={(cat) => { setSearch(cat); setActiveTab(1); }} />
                <BudgetProgress budgets={budgets} categorySpend={categorySpend} convert={convert} symbol={symbol} onCategoryClick={(cat) => { setSearch(cat); setActiveTab(1); }} />
                <SpendingBreakdown transactions={monthFiltered} prevMonthTransactions={prevMonthFiltered} convert={convert} symbol={symbol} onItemClick={(name) => { setSearch(name); setActiveTab(1); }} />
                <PeopleBreakdown transactions={monthFiltered} convert={convert} symbol={symbol} onPersonClick={(name) => { setSearch(name); setActiveTab(1); }} />
                {monthFiltered.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700 }}>Recent Transactions</Typography>
                      <Typography variant="caption" onClick={() => setActiveTab(1)} sx={{ color: 'primary.main', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600 }}>See all →</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {monthFiltered.slice(0, 5).map((t) => (
                        <Card key={t._id} sx={{ border: `1px solid ${theme.palette.divider}`, background: theme.palette.mode === 'dark' ? 'rgba(30,41,59,0.5)' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)' }}>
                          <CardActionArea onClick={() => setEditTransaction(t)} sx={{ p: 0 }}>
                            <CardContent sx={{ p: '12px 16px', '&:last-child': { pb: '12px' } }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                  <Typography fontWeight={600} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.88rem' }}>
                                    {t.item || t.description}
                                  </Typography>
                                  {t.item && t.description && t.description !== t.item && (
                                    <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', lineHeight: 1.2 }}>{t.description}</Typography>
                                  )}
                                  {t.participants && t.participants.length > 0 && (
                                    <Typography sx={{ fontSize: '0.63rem', color: 'text.disabled', mt: 0.25 }}>
                                      {t.splitBill === true && t.type === 'expense'
                                        ? `÷${t.participants.length + 1} · ${symbol}${convert(t.amount / (t.participants.length + 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })}/person`
                                        : `🎁 ${t.participants.join(', ')}`}
                                    </Typography>
                                  )}
                                </Box>
                                <Typography fontWeight={700} sx={{ color: t.type === 'income' ? theme.palette.success.light : theme.palette.error.light, fontSize: '0.9rem', flexShrink: 0 }}>
                                  {t.type === 'income' ? '+' : '-'}{symbol}{convert(t.amount).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </Typography>
                              </Box>
                            </CardContent>
                          </CardActionArea>
                        </Card>
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
              </>)}
            </>
          )}

          {activeTab === 1 && (
            <>
              {search === '' && (
                <Box sx={{ mb: 1.5 }}>
                  <DateRangeControl
                    preset={datePreset}
                    selectedMonth={selectedMonth}
                    customStart={customStart}
                    customEnd={customEnd}
                    currency={currency}
                    onPresetChange={handlePresetChange}
                    onMonthChange={setSelectedMonth}
                    onCustomChange={handleCustomChange}
                    onCurrencyChange={setCurrency}
                  />
                </Box>
              )}
              <FilterBar
                search={search}
                typeFilter={typeFilter}
                paymentMethodFilter={paymentMethodFilter}
                categoryFilter={categoryFilter}
                tagFilter={tagFilter}
                categories={existingCategories}
                availableTags={tags}
                sortBy={sortBy}
                total={search !== '' ? transactions.length : monthFiltered.length}
                filtered={filteredTransactions.length}
                searchAllTime={search !== ''}
                onSearchChange={setSearch}
                onTypeFilterChange={setTypeFilter}
                onPaymentMethodFilterChange={setPaymentMethodFilter}
                onCategoryFilterChange={setCategoryFilter}
                onTagFilterChange={setTagFilter}
                onSortChange={setSortBy}
                onExport={handleExport}
                onExportJson={handleExportJson}
              />
              {filteredTransactions.length > 0 && (() => {
                const fIncome = filteredTransactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
                const fExpense = filteredTransactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
                const fNet = fIncome - fExpense;
                return (
                  <Box sx={{ display: 'flex', gap: 2, mb: 1.5, px: 0.5 }}>
                    {fIncome > 0 && (
                      <Typography sx={{ fontSize: '0.75rem', color: 'success.light', fontWeight: 600 }}>
                        +{symbol}{convert(fIncome).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </Typography>
                    )}
                    {fExpense > 0 && (
                      <Typography sx={{ fontSize: '0.75rem', color: 'error.light', fontWeight: 600 }}>
                        -{symbol}{convert(fExpense).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </Typography>
                    )}
                    {fIncome > 0 && fExpense > 0 && (
                      <Typography sx={{ fontSize: '0.75rem', color: fNet >= 0 ? 'primary.main' : 'text.secondary', fontWeight: 600, ml: 'auto' }}>
                        {fNet >= 0 ? '+' : ''}{symbol}{convert(fNet).toLocaleString(undefined, { maximumFractionDigits: 0 })} net
                      </Typography>
                    )}
                  </Box>
                );
              })()}
              <ExpenseList
                transactions={filteredTransactions}
                onEdit={(t) => setEditTransaction(t)}
                onDelete={handleDelete}
                convert={convert}
                symbol={symbol}
                recurringLabels={recurringLabels}
                filtersActive={search !== '' || typeFilter !== 'all' || paymentMethodFilter !== 'all' || categoryFilter !== 'all' || tagFilter !== 'all'}
                monthLabel={datePreset === 'month' && selectedMonth && search === '' ? selectedMonth.format('MMMM YYYY') : undefined}
                onAddClick={() => setAddOpen(true)}
                onRefresh={fetchTransactions}
              />
            </>
          )}

          <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>}>
            {activeTab === 2 && (
              <NetWorthPage convert={convert} symbol={symbol} />
            )}

            {activeTab === 3 && (
              <SpendingInsightsPage transactions={transactions} convert={convert} symbol={symbol} />
            )}

            {activeTab === 4 && (
              <RecurringPage />
            )}

            {activeTab === 5 && (
              <GoalsPage convert={convert} symbol={symbol} />
            )}

            {activeTab === 6 && (
              <ReportsPage
                transactions={transactions}
                convert={convert}
                symbol={symbol}
                loading={initialLoading}
                onAddTransaction={() => setAddOpen(true)}
              />
            )}

            {activeTab === 7 && (
              <SettingsPage
                currency={currency}
                onCurrencyChange={(c: Currency) => setCurrency(c)}
                categorySpend={categorySpend}
                onTransactionsImported={fetchTransactions}
              />
            )}
          </Suspense>
        </Container>
      </Box>

      {/* Mobile bottom navigation */}
      <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
        <BottomNavigation
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1100,
            pb: 'env(safe-area-inset-bottom)',
            height: 'calc(56px + env(safe-area-inset-bottom))',
            bgcolor: 'background.paper',
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <BottomNavigationAction label="Home" icon={<DashboardIcon />} />
          <BottomNavigationAction label="Txns" icon={<ReceiptLongIcon />} />
          <BottomNavigationAction label="Worth" icon={<AccountBalanceIcon />} />
          <BottomNavigationAction label="Insights" icon={<BarChartIcon />} />
          <BottomNavigationAction label="Repeat" icon={<RepeatIcon />} />
          <BottomNavigationAction label="Goals" icon={<SavingsIcon />} />
          <BottomNavigationAction label="Reports" icon={<AssessmentIcon />} />
          <BottomNavigationAction label="Settings" icon={<SettingsIcon />} />
        </BottomNavigation>
      </Box>

      {/* Fixed FAB group — primary action + scan receipt */}
      <Box
        sx={{
          position: 'fixed',
          bottom: { xs: 'calc(56px + 20px + env(safe-area-inset-bottom))', sm: 32 },
          right: { xs: 20, sm: 40 },
          zIndex: 1200,
          display: 'flex',
          flexDirection: { xs: 'column-reverse', sm: 'row' },
          alignItems: { xs: 'flex-end', sm: 'center' },
          gap: 1,
        }}
      >
        <ReceiptScanButton onFileSelected={handleScanReceipt} loading={scanLoading} />
        <Fab
          color="primary"
          onClick={() => {
            if (onboardingOpen) {
              handleOnboardingFab();
            } else {
              setAddOpen(true);
            }
          }}
          variant={isDesktop ? 'extended' : 'circular'}
          sx={{
            px: isDesktop ? 3 : undefined,
            gap: isDesktop ? 1 : undefined,
            boxShadow: theme.palette.mode === 'dark' ? '0 0 0 0 rgba(129,140,248,0.4)' : '0 0 0 0 rgba(99,102,241,0.4)',
            '@media (prefers-reduced-motion: no-preference)': {
              animation: 'fab-pulse 2.5s ease-in-out 3',
              '@keyframes fab-pulse': {
                '0%': { boxShadow: theme.palette.mode === 'dark' ? '0 0 0 0 rgba(129,140,248,0.4)' : '0 0 0 0 rgba(99,102,241,0.4)' },
                '60%': { boxShadow: theme.palette.mode === 'dark' ? '0 0 0 12px rgba(129,140,248,0)' : '0 0 0 12px rgba(99,102,241,0)' },
                '100%': { boxShadow: theme.palette.mode === 'dark' ? '0 0 0 0 rgba(129,140,248,0)' : '0 0 0 0 rgba(99,102,241,0)' },
              },
            },
            '&:hover': {
              animation: 'none',
              boxShadow: theme.palette.mode === 'dark' ? '0 0 28px rgba(129,140,248,0.5)' : '0 0 28px rgba(99,102,241,0.5)',
            },
          }}
        >
          <AddIcon sx={{ fontSize: isDesktop ? 20 : 24 }} />
          {isDesktop && <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Record</span>}
        </Fab>
      </Box>

      <AddTransactionSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAddOptimistic}
        existingCategories={existingCategories}
      />

      <AddExpenseModal
        open={addReceiptOpen}
        onClose={() => {
          setAddReceiptOpen(false);
          if (receiptImageUrlRef.current) {
            URL.revokeObjectURL(receiptImageUrlRef.current);
            receiptImageUrlRef.current = null;
          }
          setReceiptPrefill(undefined);
        }}
        onSubmit={handleAdd}
        existingCategories={existingCategories}
        descriptionsByItem={descriptionsByItem}
        knownParticipants={smartSuggestions.rankedParticipants}
        recentItems={recentItems}
        amountsByDescription={amountsByDescription}
        categoriesByDescription={categoriesByDescription}
        receiptPrefill={receiptPrefill}
        availableTags={tags}
        onCreateTag={(name) => addTag(name)}
        participantsForItem={smartSuggestions.participantsForItem}
        timeRelevantItems={smartSuggestions.timeRelevantItems}
      />

      <QuickExpenseInput
        open={quickExpenseOpen}
        onClose={() => setQuickExpenseOpen(false)}
        onSubmit={handleAdd}
        existingCategories={existingCategories}
      />

      <EditExpenseModal
        open={!!editTransaction}
        transaction={editTransaction}
        onClose={() => setEditTransaction(null)}
        onSaved={handleSaved}
        onDelete={(id) => {
          handleDelete(id);
          setEditTransaction(null);
        }}
        onDuplicate={async (data) => {
          const owner = getOwnerFromToken();
          const created = await createExpense({ ...data, owner });
          setTransactions((prev) => [created, ...prev]);
          showSnackbar('Transaction logged again');
        }}
        existingCategories={existingCategories}
        descriptionsByItem={descriptionsByItem}
        knownParticipants={knownParticipants}
        recentItems={recentItems}
        availableTags={tags}
        onCreateTag={(name) => addTag(name)}
      />

      <OnboardingFlow
        open={onboardingOpen}
        onDismiss={handleOnboardingDismiss}
        onFabClick={handleOnboardingFab}
      />
    </Box>
  );
};

export default MainLayout;
