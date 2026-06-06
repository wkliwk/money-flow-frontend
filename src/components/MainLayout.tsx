import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Fab,
  useMediaQuery,
  useTheme,
  BottomNavigation,
  BottomNavigationAction,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  ListItemIcon,
  Card,
  CardActionArea,
  CardContent,
} from '@mui/material';
import useToast from '../hooks/useToast';
import TableChartIcon from '@mui/icons-material/TableChart';
import DataObjectIcon from '@mui/icons-material/DataObject';
import dayjs, { Dayjs } from 'dayjs';
import { Transaction, TransactionRequest, TransactionType, PaymentMethod } from '../types';
import { getExpenses, getExpense, createExpense, deleteExpense, scanReceipt, getLastAmounts, ReceiptScanResult, getContacts } from '../services/api';
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
import CalendarStrip from './expenses/CalendarStrip';
import EmptyState from './EmptyState';
import FilterBar from './expenses/FilterBar';
import AddExpenseModal, { ReceiptPrefill } from './expenses/AddExpenseModal';
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
import { tokens } from '../theme';

// ── Design token constants ─────────────────────────────────────────────────
const SIDEBAR_WIDTH = 232;

// ── SVG icon paths for sidebar nav ────────────────────────────────────────
const NAV_ICON_PATHS: Record<string, string> = {
  home: 'M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1V9.5z',
  txns: 'M4 6h16M4 12h16M4 18h10',
  worth: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  insights: 'M4 20V10m5 10V4m5 16v-6m5 6V8',
  recurring: 'M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15',
  goals: 'M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10zm0-6a4 4 0 100-8 4 4 0 000 8z',
  reports: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  settings: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z',
};

interface NavIconProps {
  iconKey: string;
  active: boolean;
}

const NavIcon: React.FC<NavIconProps> = ({ iconKey, active }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke={active ? '#A5A0F3' : 'rgba(255,255,255,0.4)'}
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={NAV_ICON_PATHS[iconKey]} />
  </svg>
);

// ── Dollar sign icon for logo ──────────────────────────────────────────────
const DollarIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
  </svg>
);

const PlusIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <path d="M8 1v14M1 8h14" />
  </svg>
);

// ── Sidebar ────────────────────────────────────────────────────────────────
const sideNavItems = [
  { id: 'home', label: 'Home', tabIndex: 0 },
  { id: 'txns', label: 'Transactions', tabIndex: 1 },
  { id: 'worth', label: 'Net Worth', tabIndex: 2 },
  { id: 'insights', label: 'Insights', tabIndex: 3 },
  { id: 'recurring', label: 'Recurring', tabIndex: 4 },
  { id: 'goals', label: 'Goals', tabIndex: 5 },
  { id: 'reports', label: 'Reports', tabIndex: 6 },
  { id: 'settings', label: 'Settings', tabIndex: 7 },
];

interface SidebarProps {
  activeTab: number;
  onTabChange: (tab: number) => void;
  userName: string;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, userName }) => {
  const initial = userName ? userName[0].toUpperCase() : 'R';
  return (
    <Box
      sx={{
        width: SIDEBAR_WIDTH,
        bgcolor: tokens.primaryDark,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 1200,
        py: '20px',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <Box sx={{ px: '20px', mb: '28px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '10px',
            bgcolor: tokens.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <DollarIcon />
        </Box>
        <Typography
          sx={{
            fontFamily: `'Space Grotesk', sans-serif`,
            fontSize: 18,
            fontWeight: 700,
            color: '#fff',
            letterSpacing: '-0.3px',
          }}
        >
          MoneyFlow
        </Typography>
      </Box>

      {/* Nav items */}
      <List sx={{ flex: 1, py: 0, px: 0 }}>
        {sideNavItems.map((item) => {
          const isActive = activeTab === item.tabIndex;
          return (
            <ListItemButton
              key={item.id}
              onClick={() => onTabChange(item.tabIndex)}
              selected={isActive}
              sx={{
                borderRadius: '10px',
                mx: '10px',
                mb: '2px',
                px: '12px',
                py: '10px',
                minHeight: 'unset',
                gap: '12px',
                background: isActive ? 'rgba(91,78,199,0.25)' : 'transparent',
                '&:hover': {
                  background: isActive ? 'rgba(91,78,199,0.3)' : 'rgba(255,255,255,0.06)',
                },
                '&.Mui-selected': {
                  background: 'rgba(91,78,199,0.25)',
                  '&:hover': { background: 'rgba(91,78,199,0.3)' },
                },
              }}
            >
              <NavIcon iconKey={item.id} active={isActive} />
              <ListItemText
                primary={item.label}
                sx={{
                  m: 0,
                  '& .MuiListItemText-primary': {
                    fontFamily: `'Plus Jakarta Sans', sans-serif`,
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                  },
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      {/* User avatar */}
      <Box sx={{ px: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: '10px',
            bgcolor: 'rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: `'Space Grotesk', sans-serif`,
            fontSize: 14,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.6)',
            flexShrink: 0,
          }}
        >
          {initial}
        </Box>
        <Box>
          <Typography sx={{ fontFamily: `'Plus Jakarta Sans', sans-serif`, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
            {userName || 'User'}
          </Typography>
          <Typography sx={{ fontFamily: `'Plus Jakarta Sans', sans-serif`, fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
            Personal
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

// ── Mobile nav icon SVG paths ──────────────────────────────────────────────
const MOBILE_NAV_ICONS: Record<string, string> = {
  home: 'M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1V9.5z',
  txns: 'M4 6h16M4 12h16M4 18h10',
  insights: 'M4 20V10m5 10V4m5 16v-6m5 6V8',
  more: 'M12 5v.01M12 12v.01M12 19v.01',
};

interface MobileNavIconProps {
  iconKey: string;
  active: boolean;
}

const MobileNavIcon: React.FC<MobileNavIconProps> = ({ iconKey, active }) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke={active ? tokens.primary : tokens.text3}
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={MOBILE_NAV_ICONS[iconKey]} />
  </svg>
);

// ── Helpers ────────────────────────────────────────────────────────────────
function getOwnerFromToken(): string {
  try {
    const token = localStorage.getItem('mf_token');
    if (!token) return '';
    return JSON.parse(atob(token.split('.')[1])).userId || '';
  } catch {
    return '';
  }
}

function getUserNameFromToken(): string {
  try {
    const token = localStorage.getItem('mf_token');
    if (!token) return '';
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.name || payload.email?.split('@')[0] || '';
  } catch {
    return '';
  }
}

interface MainLayoutProps {
  initialTab?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
}

const MainLayout: React.FC<MainLayoutProps> = ({ initialTab = 0 }) => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const { currency, setCurrency, convert, symbol } = useFxRates();
  const { items: recurringItems, markApplied } = useRecurring();
  const { budgets } = useBudgets();
  const { tags, addTag } = useTags();
  const [activeTab, setActiveTab] = useState<0 | 1 | 2 | 3 | 4 | 5 | 6 | 7>(initialTab);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const userName = useMemo(() => getUserNameFromToken(), []);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => { window.removeEventListener('offline', goOffline); window.removeEventListener('online', goOnline); };
  }, []);

  const [contactNames, setContactNames] = useState<string[]>([]);
  useEffect(() => {
    getContacts().then((cs) => setContactNames(cs.map((c) => c.name))).catch(() => {});
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
  const [calendarFilterDate, setCalendarFilterDate] = useState<string | null>(null);
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
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
    setAddReceiptOpen(true);
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

      if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey) && !e.altKey) {
        e.preventDefault();
        if (!addReceiptOpen && !editTransaction && !quickExpenseOpen) {
          setQuickExpenseOpen(true);
        }
        return;
      }

      if (e.key !== 'n' || e.ctrlKey || e.metaKey || e.altKey) return;
      if (addReceiptOpen || editTransaction) return;
      setAddReceiptOpen(true);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [addReceiptOpen, editTransaction, quickExpenseOpen]);

  const handleAdd = async (data: Omit<TransactionRequest, 'owner'>) => {
    const owner = getOwnerFromToken();
    const created = await createExpense({ ...data, owner });
    setTransactions((prev) => [created, ...prev]);
    if (receiptImageUrlRef.current) {
      URL.revokeObjectURL(receiptImageUrlRef.current);
      receiptImageUrlRef.current = null;
    }
    setReceiptPrefill(undefined);
    showSnackbar('Transaction added');
  };

  const handleScanReceipt = async (file: File) => {
    setScanLoading(true);
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
    setTransactions((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
    showSnackbar('Transaction updated');
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
    [...transactions]
      .sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime())
      .forEach((t) => { if (t.item && !seen.includes(t.item)) seen.push(t.item); });
    return seen.slice(0, 5);
  }, [transactions]);

  const knownParticipants = useMemo(() => {
    const seen = new Set<string>(contactNames);
    transactions.forEach((t) => (t.participants ?? []).forEach((p) => seen.add(p)));
    return Array.from(seen).slice(0, 20);
  }, [transactions, contactNames]);

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

  const categoriesByDescription = useMemo(() => {
    const map: Record<string, string> = {};
    [...transactions]
      .sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime())
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
      const matchesCalendar = !calendarFilterDate || (t.date || '').slice(0, 10) === calendarFilterDate;
      return matchesSearch && matchesType && matchesPayment && matchesCategory && matchesTag && matchesCalendar;
    });
    if (sortBy === 'amount') {
      return [...filtered].sort((a, b) => b.amount - a.amount);
    }
    return filtered;
  }, [transactions, monthFiltered, search, typeFilter, paymentMethodFilter, categoryFilter, tagFilter, sortBy, calendarFilterDate]);

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

  // Page title per tab
  const pageTitle = ['Dashboard', 'Transactions', 'Net Worth', 'Insights', 'Recurring', 'Goals', 'Reports', 'Settings'][activeTab] ?? 'Dashboard';

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: tokens.bg, display: 'flex' }}>
      {/* Desktop permanent sidebar */}
      {isDesktop && (
        <Drawer
          variant="permanent"
          sx={{
            width: SIDEBAR_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: SIDEBAR_WIDTH,
              boxSizing: 'border-box',
              bgcolor: tokens.primaryDark,
              border: 'none',
            },
          }}
        >
          <Sidebar activeTab={activeTab} onTabChange={(t) => setActiveTab(t as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7)} userName={userName} />
        </Drawer>
      )}

      {/* Main content area */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          ml: isDesktop ? 0 : 0,
        }}
      >
        {/* Desktop header bar */}
        {isDesktop && (
          <Box
            component="header"
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 4,
              py: '16px',
              borderBottom: `1px solid ${tokens.border}`,
              bgcolor: tokens.surface,
              flexShrink: 0,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography
                sx={{
                  fontFamily: `'Space Grotesk', sans-serif`,
                  fontSize: 22,
                  fontWeight: 700,
                  color: tokens.text1,
                  letterSpacing: '-0.5px',
                }}
              >
                {pageTitle}
              </Typography>
              {isOffline && (
                <Typography
                  sx={{
                    fontSize: '0.68rem',
                    color: tokens.amber,
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    px: 1,
                    py: 0.25,
                    borderRadius: 1,
                    bgcolor: tokens.amberBg,
                    border: `1px solid ${tokens.amber}40`,
                  }}
                >
                  Offline
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={(e) => setExportMenuAnchor(e.currentTarget)}
                disabled={transactions.length === 0}
                sx={{ fontSize: '0.75rem', borderRadius: '10px' }}
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
                <MenuItem onClick={() => { setExportMenuAnchor(null); handleExport(); }} dense>
                  <ListItemIcon><TableChartIcon fontSize="small" /></ListItemIcon>
                  <ListItemText>Export CSV</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => { setExportMenuAnchor(null); handleExportJson(); }} dense>
                  <ListItemIcon><DataObjectIcon fontSize="small" /></ListItemIcon>
                  <ListItemText>Export JSON</ListItemText>
                </MenuItem>
              </Menu>
            </Box>
          </Box>
        )}

        {/* Mobile header bar */}
        {!isDesktop && (
          <Box
            component="header"
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 2,
              py: '12px',
              borderBottom: `1px solid ${tokens.border}`,
              bgcolor: tokens.surface,
              flexShrink: 0,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '8px',
                  bgcolor: tokens.primary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <DollarIcon />
              </Box>
              <Typography
                sx={{
                  fontFamily: `'Space Grotesk', sans-serif`,
                  fontSize: 16,
                  fontWeight: 700,
                  color: tokens.text1,
                  letterSpacing: '-0.3px',
                }}
              >
                MoneyFlow
              </Typography>
            </Box>
          </Box>
        )}

        {/* Content */}
        <Box
          sx={{
            flex: 1,
            px: { xs: 2, sm: 4 },
            py: { xs: 2, sm: 4 },
            pb: { xs: 'calc(70px + 16px + env(safe-area-inset-bottom))', sm: 4 },
            overflowY: 'auto',
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
                  onCta={() => setAddReceiptOpen(true)}
                />
              ) : (
                <>
                  {/* Recurring prompt */}
                  {pendingRecurring.length > 0 && (
                    <Box
                      sx={{
                        mb: 2,
                        py: 1.5,
                        px: 2,
                        borderRadius: 2,
                        bgcolor: tokens.primaryLight,
                        border: `1px solid ${tokens.primaryBorder}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1,
                      }}
                    >
                      <Typography sx={{ fontSize: '0.82rem', color: tokens.text2, flex: 1 }}>
                        {pendingRecurring.length} recurring transaction{pendingRecurring.length > 1 ? 's' : ''} pending for {dayjs().format('MMMM')}
                      </Typography>
                      <Button size="small" variant="contained" onClick={applyRecurring} sx={{ fontSize: '0.75rem', px: 1.5, flexShrink: 0 }}>
                        Apply
                      </Button>
                    </Box>
                  )}

                  {/* Budget alerts */}
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
                          <Box sx={{ py: 1.25, px: 2, borderRadius: 2, bgcolor: tokens.expenseBg, border: `1px solid ${tokens.expenseBorder}`, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography sx={{ fontSize: '0.82rem', color: tokens.expense, fontWeight: 600 }}>⚠</Typography>
                            <Typography sx={{ fontSize: '0.82rem', color: tokens.text2 }}>
                              Over budget: {overBudget.map(([cat, limit]) => `${cat} (+${symbol}${convert((categorySpend[cat] || 0) - limit).toLocaleString(undefined, { maximumFractionDigits: 0 })})`).join(', ')}
                            </Typography>
                          </Box>
                        )}
                        {nearBudget.length > 0 && (
                          <Box sx={{ py: 1.25, px: 2, borderRadius: 2, bgcolor: tokens.amberBg, border: `1px solid ${tokens.amber}40`, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography sx={{ fontSize: '0.82rem', color: tokens.amber, fontWeight: 600 }}>⚡</Typography>
                            <Typography sx={{ fontSize: '0.82rem', color: tokens.text2 }}>
                              Near limit: {nearBudget.map(([cat, limit]) => `${cat} (${Math.round(((categorySpend[cat] || 0) / limit) * 100)}%)`).join(', ')}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    );
                  })()}

                  <SpendingPulse />

                  {/* Mobile dashboard */}
                  <Box sx={{ display: { xs: 'block', lg: 'none' } }}>
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
                          <Typography sx={{ fontFamily: `'Plus Jakarta Sans', sans-serif`, fontSize: '0.65rem', color: tokens.text3, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Recent</Typography>
                          <Typography onClick={() => setActiveTab(1)} sx={{ fontFamily: `'Plus Jakarta Sans', sans-serif`, fontSize: '0.72rem', color: tokens.primary, cursor: 'pointer', fontWeight: 600 }}>See all →</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {monthFiltered.slice(0, 5).map((t) => (
                            <Card key={t._id} sx={{ border: `1px solid ${tokens.border}`, bgcolor: tokens.surface }}>
                              <CardActionArea onClick={() => setEditTransaction(t)} sx={{ p: 0 }}>
                                <CardContent sx={{ p: '12px 16px', '&:last-child': { pb: '12px' } }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                      <Typography fontWeight={600} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.88rem', color: tokens.text1 }}>
                                        {t.item || t.description}
                                      </Typography>
                                      {t.item && t.description && t.description !== t.item && (
                                        <Typography sx={{ fontSize: '0.7rem', color: tokens.text3, lineHeight: 1.2 }}>{t.description}</Typography>
                                      )}
                                      {t.participants && t.participants.length > 0 && (
                                        <Typography sx={{ fontSize: '0.63rem', color: tokens.text3, mt: 0.25 }}>
                                          {t.splitBill === true && t.type === 'expense'
                                            ? `÷${t.participants.length + 1} · ${symbol}${convert(t.amount / (t.participants.length + 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })}/person`
                                            : `🎁 ${t.participants.join(', ')}`}
                                        </Typography>
                                      )}
                                    </Box>
                                    <Typography fontWeight={700} sx={{ color: t.type === 'income' ? tokens.income : tokens.expense, fontSize: '0.9rem', flexShrink: 0 }}>
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

                  {/* Desktop dashboard */}
                  <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, px: 2, py: 1.25, borderRadius: 2, bgcolor: tokens.surfaceAlt, border: `1px solid ${tokens.border}` }}>
                          <Typography sx={{ fontSize: '0.68rem', color: tokens.text3, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0 }}>This week</Typography>
                          {weekExp > 0 && <Typography sx={{ fontSize: '0.78rem', color: tokens.expense, fontWeight: 600 }}>-{symbol}{convert(weekExp).toLocaleString(undefined, { maximumFractionDigits: 0 })}</Typography>}
                          {weekInc > 0 && <Typography sx={{ fontSize: '0.78rem', color: tokens.income, fontWeight: 600 }}>+{symbol}{convert(weekInc).toLocaleString(undefined, { maximumFractionDigits: 0 })}</Typography>}
                          <Typography sx={{ fontSize: '0.72rem', color: tokens.text3 }}>{thisWeek.length} txn{thisWeek.length !== 1 ? 's' : ''}</Typography>
                          {delta !== null && <Typography sx={{ fontSize: '0.72rem', color: delta > 0 ? tokens.expense : tokens.income, fontWeight: 600, ml: 'auto' }}>{delta > 0 ? '↑' : '↓'} {symbol}{convert(Math.abs(delta)).toLocaleString(undefined, { maximumFractionDigits: 0 })} vs last week</Typography>}
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
                          <Typography sx={{ fontFamily: `'Plus Jakarta Sans', sans-serif`, fontSize: '0.65rem', color: tokens.text3, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Recent Transactions</Typography>
                          <Typography onClick={() => setActiveTab(1)} sx={{ fontFamily: `'Plus Jakarta Sans', sans-serif`, fontSize: '0.72rem', color: tokens.primary, cursor: 'pointer', fontWeight: 600 }}>See all →</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {monthFiltered.slice(0, 5).map((t) => (
                            <Card key={t._id} sx={{ border: `1px solid ${tokens.border}`, bgcolor: tokens.surface, borderRadius: '14px' }}>
                              <CardActionArea onClick={() => setEditTransaction(t)} sx={{ p: 0 }}>
                                <CardContent sx={{ p: '12px 16px', '&:last-child': { pb: '12px' } }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                      <Typography fontWeight={600} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.88rem', color: tokens.text1 }}>
                                        {t.item || t.description}
                                      </Typography>
                                      {t.item && t.description && t.description !== t.item && (
                                        <Typography sx={{ fontSize: '0.7rem', color: tokens.text3, lineHeight: 1.2 }}>{t.description}</Typography>
                                      )}
                                      {t.participants && t.participants.length > 0 && (
                                        <Typography sx={{ fontSize: '0.63rem', color: tokens.text3, mt: 0.25 }}>
                                          {t.splitBill === true && t.type === 'expense'
                                            ? `÷${t.participants.length + 1} · ${symbol}${convert(t.amount / (t.participants.length + 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })}/person`
                                            : `🎁 ${t.participants.join(', ')}`}
                                        </Typography>
                                      )}
                                    </Box>
                                    <Typography fontWeight={700} sx={{ color: t.type === 'income' ? tokens.income : tokens.expense, fontSize: '0.9rem', flexShrink: 0 }}>
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
                </>
              )}
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
              <CalendarStrip
                transactions={search !== '' ? transactions : monthFiltered}
                selectedDate={calendarFilterDate}
                onDayChange={setCalendarFilterDate}
                symbol={symbol}
                convert={convert}
              />
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
                      <Typography sx={{ fontSize: '0.75rem', color: tokens.income, fontWeight: 600 }}>
                        +{symbol}{convert(fIncome).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </Typography>
                    )}
                    {fExpense > 0 && (
                      <Typography sx={{ fontSize: '0.75rem', color: tokens.expense, fontWeight: 600 }}>
                        -{symbol}{convert(fExpense).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </Typography>
                    )}
                    {fIncome > 0 && fExpense > 0 && (
                      <Typography sx={{ fontSize: '0.75rem', color: fNet >= 0 ? tokens.primary : tokens.text2, fontWeight: 600, ml: 'auto' }}>
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
                onAddClick={() => setAddReceiptOpen(true)}
                onRefresh={fetchTransactions}
              />
            </>
          )}

          <Suspense fallback={<Box sx={{ py: 4 }}><DashboardSkeleton /></Box>}>
            {activeTab === 2 && <NetWorthPage convert={convert} symbol={symbol} />}
            {activeTab === 3 && <SpendingInsightsPage transactions={transactions} convert={convert} symbol={symbol} />}
            {activeTab === 4 && <RecurringPage />}
            {activeTab === 5 && <GoalsPage convert={convert} symbol={symbol} />}
            {activeTab === 6 && (
              <ReportsPage
                transactions={transactions}
                convert={convert}
                symbol={symbol}
                loading={initialLoading}
                onAddTransaction={() => setAddReceiptOpen(true)}
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
        </Box>
      </Box>

      {/* Mobile bottom navigation */}
      {!isDesktop && (
        <BottomNavigation
          value={activeTab <= 1 ? activeTab : activeTab === 3 ? 2 : 3}
          onChange={(_, v) => {
            if (v === 0) setActiveTab(0);
            else if (v === 1) setActiveTab(1);
            else if (v === 2) setActiveTab(3);
            else setActiveTab(7);
          }}
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1100,
            height: 'calc(60px + env(safe-area-inset-bottom))',
            pb: 'env(safe-area-inset-bottom)',
            bgcolor: tokens.surface,
            borderTop: `1px solid ${tokens.border}`,
          }}
          aria-label="Bottom navigation"
        >
          <BottomNavigationAction
            label="Home"
            icon={<MobileNavIcon iconKey="home" active={activeTab === 0} />}
            sx={{
              color: activeTab === 0 ? tokens.primary : tokens.text3,
              '& .MuiBottomNavigationAction-label': { fontSize: '0.625rem !important', fontFamily: `'Plus Jakarta Sans', sans-serif` },
            }}
          />
          <BottomNavigationAction
            label="Transactions"
            icon={<MobileNavIcon iconKey="txns" active={activeTab === 1} />}
            sx={{
              color: activeTab === 1 ? tokens.primary : tokens.text3,
              '& .MuiBottomNavigationAction-label': { fontSize: '0.525rem !important', fontFamily: `'Plus Jakarta Sans', sans-serif` },
            }}
          />
          <BottomNavigationAction
            label="Insights"
            icon={<MobileNavIcon iconKey="insights" active={activeTab === 3} />}
            sx={{
              color: activeTab === 3 ? tokens.primary : tokens.text3,
              '& .MuiBottomNavigationAction-label': { fontSize: '0.625rem !important', fontFamily: `'Plus Jakarta Sans', sans-serif` },
            }}
          />
          <BottomNavigationAction
            label="Settings"
            icon={<MobileNavIcon iconKey="more" active={[2, 4, 5, 6, 7].includes(activeTab)} />}
            sx={{
              color: [2, 4, 5, 6, 7].includes(activeTab) ? tokens.primary : tokens.text3,
              '& .MuiBottomNavigationAction-label': { fontSize: '0.625rem !important', fontFamily: `'Plus Jakarta Sans', sans-serif` },
            }}
          />
        </BottomNavigation>
      )}

      {/* FAB — elevated center on mobile, fixed bottom-right on desktop */}
      <Box
        sx={{
          position: 'fixed',
          bottom: isDesktop ? 32 : 'calc(60px + env(safe-area-inset-bottom) - 26px)',
          right: isDesktop ? 40 : '50%',
          transform: isDesktop ? 'none' : 'translateX(50%)',
          zIndex: 1200,
          display: 'flex',
          flexDirection: isDesktop ? 'row' : 'column',
          alignItems: 'center',
          gap: 1,
        }}
      >
        {isDesktop && <ReceiptScanButton onFileSelected={handleScanReceipt} loading={scanLoading} />}
        <Fab
          aria-label="Record transaction"
          data-testid="fab-record"
          onClick={() => {
            if (onboardingOpen) {
              handleOnboardingFab();
            } else {
              setAddReceiptOpen(true);
            }
          }}
          variant={isDesktop ? 'extended' : 'circular'}
          sx={{
            width: isDesktop ? 'auto' : 52,
            height: isDesktop ? 'auto' : 52,
            borderRadius: isDesktop ? '14px' : '16px',
            px: isDesktop ? 3 : undefined,
            gap: isDesktop ? 1 : undefined,
            bgcolor: tokens.primary,
            color: '#fff',
            boxShadow: tokens.sFab,
            '&:hover': { bgcolor: tokens.primaryHover, boxShadow: tokens.sFab },
          }}
        >
          <PlusIcon />
          {isDesktop && (
            <Typography component="span" sx={{ fontFamily: `'Plus Jakarta Sans', sans-serif`, fontWeight: 600, fontSize: '0.9rem' }}>
              Record
            </Typography>
          )}
        </Fab>
        {!isDesktop && <ReceiptScanButton onFileSelected={handleScanReceipt} loading={scanLoading} />}
      </Box>

      {/* Modals */}
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
