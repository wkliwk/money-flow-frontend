import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Container,
  Snackbar,
  SnackbarContent,
  Alert,
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
import AddIcon from '@mui/icons-material/Add';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CategoryIcon from '@mui/icons-material/Category';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import TableChartIcon from '@mui/icons-material/TableChart';
import DataObjectIcon from '@mui/icons-material/DataObject';
import dayjs, { Dayjs } from 'dayjs';
import { Transaction, TransactionRequest, TransactionType, PaymentMethod } from '../types';
import { getExpenses, getExpense, createExpense, deleteExpense } from '../services/api';
import SummaryCards from './dashboard/SummaryCards';
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
import AddExpenseModal from './expenses/AddExpenseModal';
import EditExpenseModal from './expenses/EditExpenseModal';
import QuickExpenseInput from './expenses/QuickExpenseInput';
import { useFxRates } from '../hooks/useFxRates';
import { Currency } from '../hooks/useFxRates';
import { useRecurring } from '../hooks/useRecurring';
import ManageItemsPage from './items/ManageItemsPage';
import NetWorthPage from './networth/NetWorthPage';
import SettingsPage from './settings/SettingsPage';
import { useBudgets } from '../hooks/useBudgets';

function getOwnerFromToken(): string {
  try {
    const token = localStorage.getItem('mf_token');
    if (!token) return '';
    return JSON.parse(atob(token.split('.')[1])).userId || '';
  } catch {
    return '';
  }
}

const MainLayout: React.FC = () => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('sm'));
  const { currency, setCurrency, convert, symbol } = useFxRates();
  const { items: recurringItems, markApplied } = useRecurring();
  const { budgets } = useBudgets();
  const [activeTab, setActiveTab] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => { window.removeEventListener('offline', goOffline); window.removeEventListener('online', goOnline); };
  }, []);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [datePreset, setDatePreset] = useState<DatePreset>(() => {
    const saved = localStorage.getItem('mf_date_preset') as DatePreset | null;
    return saved ?? 'month';
  });
  const [selectedMonth, setSelectedMonth] = useState<Dayjs | null>(dayjs());
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<PaymentMethod | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [quickExpenseOpen, setQuickExpenseOpen] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [undoSnackbar, setUndoSnackbar] = useState(false);
  const pendingDelete = useRef<Transaction | null>(null);

  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchTransactions = async () => {
    try {
      const data = await getExpenses();
      setTransactions(data);
    } catch {
      showSnackbar('Failed to load transactions', 'error');
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;

      // Cmd+K / Ctrl+K for quick expense
      if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey) && !e.altKey) {
        e.preventDefault();
        if (!addOpen && !editTransaction && !quickExpenseOpen) {
          setQuickExpenseOpen(true);
        }
        return;
      }

      // 'n' for normal add expense
      if (e.key !== 'n' || e.ctrlKey || e.metaKey || e.altKey) return;
      if (addOpen || editTransaction) return;
      setAddOpen(true);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [addOpen, editTransaction, quickExpenseOpen]);

  const handleAdd = async (data: Omit<TransactionRequest, 'owner'>) => {
    const owner = getOwnerFromToken();
    const created = await createExpense({ ...data, owner });
    setTransactions((prev) => [created, ...prev]);
    showSnackbar('Transaction added');
  };

  const handleDelete = useCallback((id: string) => {
    setTransactions((prev) => {
      const t = prev.find((tx) => tx._id === id);
      if (!t) return prev;
      pendingDelete.current = t;
      return prev.filter((tx) => tx._id !== id);
    });
    setUndoSnackbar(true);
  }, []);

  const commitDelete = useCallback(async () => {
    const t = pendingDelete.current;
    if (!t) return;
    pendingDelete.current = null;
    try {
      await deleteExpense(t._id);
    } catch {
      setTransactions((prev) => [t, ...prev]);
      showSnackbar('Failed to delete transaction', 'error');
    }
  }, []);

  const handleUndo = useCallback(() => {
    const t = pendingDelete.current;
    if (!t) return;
    pendingDelete.current = null;
    setTransactions((prev) => [t, ...prev].sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime()));
    setUndoSnackbar(false);
  }, []);

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

  // description → most recent amount used for that description (for autocomplete)
  const amountsByDescription = useMemo(() => {
    const map: Record<string, number> = {};
    // Sort newest first so first hit is most recent
    [...transactions].sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime())
      .forEach((t) => {
        const key = (t.description?.trim() || t.item || '').toLowerCase();
        if (key && !map[key]) map[key] = t.amount;
      });
    return map;
  }, [transactions]);

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
        (t.notes || '').toLowerCase().includes(searchLow);
      const matchesType = typeFilter === 'all' || t.type === typeFilter;
      const matchesPayment = paymentMethodFilter === 'all' || t.paymentMethod === paymentMethodFilter;
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
      return matchesSearch && matchesType && matchesPayment && matchesCategory;
    });
    if (sortBy === 'amount') {
      return [...filtered].sort((a, b) => b.amount - a.amount);
    }
    return filtered;
  }, [transactions, monthFiltered, search, typeFilter, paymentMethodFilter, categoryFilter, sortBy]);

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
    { label: 'Items', icon: <CategoryIcon /> },
    { label: 'Net Worth', icon: <AccountBalanceIcon /> },
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
              background: 'linear-gradient(135deg, #818cf8 0%, #34d399 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Money Flow
          </Typography>
          {isOffline && (
            <Typography sx={{ fontSize: '0.68rem', color: '#fbbf24', fontWeight: 600, letterSpacing: '0.04em', px: 1, py: 0.25, borderRadius: 1, bgcolor: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}>
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
            borderRight: '1px solid rgba(148,163,184,0.1)',
          },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <List>
            {navItems.map((item, index) => (
              <ListItemButton
                key={item.label}
                selected={activeTab === index}
                onClick={() => setActiveTab(index as 0 | 1 | 2 | 3 | 4)}
                sx={{
                  '&.Mui-selected': { bgcolor: 'rgba(129,140,248,0.1)', color: '#818cf8' },
                  '&.Mui-selected .MuiListItemIcon-root': { color: '#818cf8' },
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
              v{process.env.REACT_APP_VERSION ?? '1.0.0'}
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
              {transactions.length === 0 ? (
                <EmptyState
                  heading="Track your first expense"
                  subtext="Track your first expense to see insights"
                  ctaLabel="Add first expense"
                  onCta={() => setAddOpen(true)}
                />
              ) : (<>
              {/* Recurring prompt banner */}
              {pendingRecurring.length > 0 && (
                <Box sx={{ mb: 2, py: 1.5, px: 2, borderRadius: 2, bgcolor: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                  <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', flex: 1 }}>
                    {pendingRecurring.length} recurring transaction{pendingRecurring.length > 1 ? 's' : ''} pending for {dayjs().format('MMMM')}
                  </Typography>
                  <Button size="small" variant="contained" onClick={applyRecurring} sx={{ fontSize: '0.75rem', px: 1.5, flexShrink: 0 }}>
                    Apply
                  </Button>
                </Box>
              )}

              {/* Over-budget alert */}
              {(() => {
                const overBudget = Object.entries(budgets).filter(([cat, limit]) => limit > 0 && (categorySpend[cat] || 0) > limit);
                if (overBudget.length === 0) return null;
                return (
                  <Box sx={{ mb: 2, py: 1.25, px: 2, borderRadius: 2, bgcolor: 'rgba(251,113,133,0.07)', border: '1px solid rgba(251,113,133,0.2)', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ fontSize: '0.82rem', color: '#fb7185', fontWeight: 600 }}>⚠</Typography>
                    <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>
                      Over budget: {overBudget.map(([cat, limit]) => `${cat} (+${symbol}${convert(categorySpend[cat] - limit).toLocaleString(undefined, { maximumFractionDigits: 0 })})`).join(', ')}
                    </Typography>
                  </Box>
                );
              })()}

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
                      <Typography variant="caption" onClick={() => setActiveTab(1)} sx={{ color: '#818cf8', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600 }}>See all →</Typography>
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
                                <Typography fontWeight={700} sx={{ color: t.type === 'income' ? '#34d399' : '#fb7185', fontSize: '0.9rem', flexShrink: 0 }}>
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, px: 0.5, py: 1, borderRadius: 1.5, bgcolor: 'rgba(148,163,184,0.04)', border: '1px solid rgba(148,163,184,0.08)' }}>
                      <Typography sx={{ fontSize: '0.68rem', color: 'text.disabled', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0 }}>This week</Typography>
                      {weekExp > 0 && <Typography sx={{ fontSize: '0.78rem', color: '#fb7185', fontWeight: 600 }}>-{symbol}{convert(weekExp).toLocaleString(undefined, { maximumFractionDigits: 0 })}</Typography>}
                      {weekInc > 0 && <Typography sx={{ fontSize: '0.78rem', color: '#34d399', fontWeight: 600 }}>+{symbol}{convert(weekInc).toLocaleString(undefined, { maximumFractionDigits: 0 })}</Typography>}
                      <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled' }}>{thisWeek.length} txn{thisWeek.length !== 1 ? 's' : ''}</Typography>
                      {delta !== null && <Typography sx={{ fontSize: '0.72rem', color: delta > 0 ? '#fb7185' : '#34d399', fontWeight: 600, ml: 'auto' }}>{delta > 0 ? '↑' : '↓'} {symbol}{convert(Math.abs(delta)).toLocaleString(undefined, { maximumFractionDigits: 0 })} vs last week</Typography>}
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
                      <Typography variant="caption" onClick={() => setActiveTab(1)} sx={{ color: '#818cf8', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600 }}>See all →</Typography>
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
                                <Typography fontWeight={700} sx={{ color: t.type === 'income' ? '#34d399' : '#fb7185', fontSize: '0.9rem', flexShrink: 0 }}>
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
                categories={existingCategories}
                sortBy={sortBy}
                total={search !== '' ? transactions.length : monthFiltered.length}
                filtered={filteredTransactions.length}
                searchAllTime={search !== ''}
                onSearchChange={setSearch}
                onTypeFilterChange={setTypeFilter}
                onPaymentMethodFilterChange={setPaymentMethodFilter}
                onCategoryFilterChange={setCategoryFilter}
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
                      <Typography sx={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600 }}>
                        +{symbol}{convert(fIncome).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </Typography>
                    )}
                    {fExpense > 0 && (
                      <Typography sx={{ fontSize: '0.75rem', color: '#fb7185', fontWeight: 600 }}>
                        -{symbol}{convert(fExpense).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </Typography>
                    )}
                    {fIncome > 0 && fExpense > 0 && (
                      <Typography sx={{ fontSize: '0.75rem', color: fNet >= 0 ? '#818cf8' : 'text.secondary', fontWeight: 600, ml: 'auto' }}>
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
                filtersActive={search !== '' || typeFilter !== 'all' || paymentMethodFilter !== 'all' || categoryFilter !== 'all'}
                onAddClick={() => setAddOpen(true)}
              />
            </>
          )}

          {activeTab === 2 && <ManageItemsPage />}

          {activeTab === 3 && (
            <NetWorthPage convert={convert} symbol={symbol} />
          )}

          {activeTab === 4 && (
            <SettingsPage
              currency={currency}
              onCurrencyChange={(c: Currency) => setCurrency(c)}
              categorySpend={categorySpend}
            />
          )}
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
          <BottomNavigationAction label="Items" icon={<CategoryIcon />} />
          <BottomNavigationAction label="Worth" icon={<AccountBalanceIcon />} />
          <BottomNavigationAction label="Settings" icon={<SettingsIcon />} />
        </BottomNavigation>
      </Box>

      {/* Fixed FAB — primary action */}
      <Fab
        color="primary"
        onClick={() => setAddOpen(true)}
        variant={isDesktop ? 'extended' : 'circular'}
        sx={{
          position: 'fixed',
          bottom: { xs: 'calc(56px + 20px + env(safe-area-inset-bottom))', sm: 32 },
          right: { xs: 20, sm: 40 },
          zIndex: 1200,
          px: isDesktop ? 3 : undefined,
          gap: isDesktop ? 1 : undefined,
          boxShadow: '0 0 0 0 rgba(129,140,248,0.4)',
          '@media (prefers-reduced-motion: no-preference)': {
            animation: 'fab-pulse 2.5s ease-in-out 3',
            '@keyframes fab-pulse': {
              '0%': { boxShadow: '0 0 0 0 rgba(129,140,248,0.4)' },
              '60%': { boxShadow: '0 0 0 12px rgba(129,140,248,0)' },
              '100%': { boxShadow: '0 0 0 0 rgba(129,140,248,0)' },
            },
          },
          '&:hover': {
            animation: 'none',
            boxShadow: '0 0 28px rgba(129,140,248,0.5)',
          },
        }}
      >
        <AddIcon sx={{ fontSize: isDesktop ? 20 : 24 }} />
        {isDesktop && <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Record</span>}
      </Fab>

      <AddExpenseModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAdd}
        existingCategories={existingCategories}
        descriptionsByItem={descriptionsByItem}
        knownParticipants={knownParticipants}
        recentItems={recentItems}
        amountsByDescription={amountsByDescription}
        categoriesByDescription={categoriesByDescription}
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
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        sx={{ bottom: { xs: 'calc(56px + env(safe-area-inset-bottom) + 8px) !important', sm: 24 } }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Snackbar
        open={undoSnackbar}
        autoHideDuration={5000}
        onClose={(_, reason) => {
          if (reason === 'timeout') {
            setUndoSnackbar(false);
            commitDelete();
          }
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        sx={{ bottom: { xs: 'calc(56px + env(safe-area-inset-bottom) + 8px) !important', sm: 24 } }}
      >
        <SnackbarContent
          sx={{ bgcolor: 'background.paper', border: `1px solid ${theme.palette.divider}`, borderRadius: 2, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
          message={<Typography sx={{ fontSize: '0.85rem', color: 'text.primary' }}>Transaction deleted</Typography>}
          action={
            <Button size="small" onClick={handleUndo} sx={{ color: '#818cf8', fontWeight: 700, fontSize: '0.8rem' }}>
              Undo
            </Button>
          }
        />
      </Snackbar>
    </Box>
  );
};

export default MainLayout;
