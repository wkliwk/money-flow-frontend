import React, { useEffect, useMemo, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Container,
  Snackbar,
  Alert,
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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CategoryIcon from '@mui/icons-material/Category';
import SettingsIcon from '@mui/icons-material/Settings';
import dayjs, { Dayjs } from 'dayjs';
import { Transaction, TransactionRequest, TransactionType } from '../types';
import { getExpenses, createExpense, deleteExpense } from '../services/api';
import SummaryCards from './dashboard/SummaryCards';
import MonthPicker from './dashboard/MonthPicker';
import MobileHero from './dashboard/MobileHero';
import CategoryChart from './dashboard/CategoryChart';
import TrendsChart from './dashboard/TrendsChart';
import SpendingBreakdown from './dashboard/SpendingBreakdown';
import PeopleBreakdown from './dashboard/PeopleBreakdown';
import ExpenseList from './expenses/ExpenseList';
import FilterBar from './expenses/FilterBar';
import AddExpenseModal from './expenses/AddExpenseModal';
import EditExpenseModal from './expenses/EditExpenseModal';
import { useFxRates } from '../hooks/useFxRates';
import { Currency } from '../hooks/useFxRates';
import CurrencyPicker from './dashboard/CurrencyPicker';
import ManageItemsPage from './items/ManageItemsPage';
import SettingsPage from './settings/SettingsPage';

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
  const [activeTab, setActiveTab] = useState<0 | 1 | 2 | 3>(0);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => { window.removeEventListener('offline', goOffline); window.removeEventListener('online', goOnline); };
  }, []);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<Dayjs | null>(dayjs());
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  const [addOpen, setAddOpen] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

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

  const handleAdd = async (data: Omit<TransactionRequest, 'owner'>) => {
    const owner = getOwnerFromToken();
    await createExpense({ ...data, owner });
    await fetchTransactions();
    showSnackbar('Transaction added');
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteExpense(id);
      setTransactions((prev) => prev.filter((t) => t._id !== id));
      showSnackbar('Transaction deleted');
    } catch {
      showSnackbar('Failed to delete transaction', 'error');
    }
  };

  const handleSaved = (updated: Transaction) => {
    setTransactions((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
    showSnackbar('Transaction updated');
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

  const monthFiltered = useMemo(() => {
    if (!selectedMonth) return transactions;
    return transactions.filter((t) => {
      const d = dayjs(t.date || t.createdAt);
      return d.isValid() && d.isSame(selectedMonth, 'month');
    });
  }, [transactions, selectedMonth]);

  const prevMonthFiltered = useMemo(() => {
    if (!selectedMonth) return [];
    const prev = selectedMonth.subtract(1, 'month');
    return transactions.filter((t) => {
      const d = dayjs(t.date || t.createdAt);
      return d.isValid() && d.isSame(prev, 'month');
    });
  }, [transactions, selectedMonth]);

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

  const filteredTransactions = useMemo(() => {
    return monthFiltered.filter((t) => {
      const searchLow = search.toLowerCase();
      const matchesSearch =
        search === '' ||
        (t.description || '').toLowerCase().includes(searchLow) ||
        (t.item || '').toLowerCase().includes(searchLow);
      const matchesType = typeFilter === 'all' || t.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [monthFiltered, search, typeFilter]);

  const handleExport = () => {
    const header = ['Date', 'Description', 'Type', 'Category', 'Amount'];
    const rows = filteredTransactions.map((t) => [
      new Date(t.date || t.createdAt).toISOString().split('T')[0],
      `"${t.description.replace(/"/g, '""')}"`,
      t.type,
      t.category ? `"${t.category.replace(/"/g, '""')}"` : '',
      t.amount,
    ]);
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedMonth
      ? `money-flow-${selectedMonth.format('YYYY-MM')}.csv`
      : 'money-flow-all.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const navItems = [
    { label: 'Home', icon: <DashboardIcon /> },
    { label: 'Transactions', icon: <ReceiptLongIcon /> },
    { label: 'Items', icon: <CategoryIcon /> },
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
        <List>
          {navItems.map((item, index) => (
            <ListItemButton
              key={item.label}
              selected={activeTab === index}
              onClick={() => setActiveTab(index as 0 | 1 | 2 | 3)}
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
              {/* Mobile: hero card with month picker + big balance + breakdown */}
              <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
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
                <SpendingBreakdown transactions={monthFiltered} convert={convert} symbol={symbol} />
                <PeopleBreakdown transactions={monthFiltered} convert={convert} symbol={symbol} />
                {monthFiltered.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700 }}>Recent</Typography>
                      <Typography variant="caption" onClick={() => setActiveTab(1)} sx={{ color: '#818cf8', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600 }}>See all →</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {monthFiltered.slice(0, 5).map((t) => (
                        <Card key={t._id} sx={{ border: '1px solid rgba(148,163,184,0.08)', background: 'rgba(30,41,59,0.5)' }}>
                          <CardActionArea onClick={() => setEditTransaction(t)} sx={{ p: 0 }}>
                            <CardContent sx={{ p: '12px 16px', '&:last-child': { pb: '12px' } }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                  <Typography fontWeight={600} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.88rem' }}>
                                    {t.item || t.description}
                                  </Typography>
                                  {t.item && t.description && (
                                    <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', lineHeight: 1.2 }}>{t.description}</Typography>
                                  )}
                                  {t.participants && t.participants.length > 0 && (
                                    <Typography sx={{ fontSize: '0.63rem', color: 'text.disabled', mt: 0.25 }}>with {t.participants.join(', ')}</Typography>
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

              {/* Desktop: separate month picker + summary cards + chart */}
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <MonthPicker selectedMonth={selectedMonth} onChange={setSelectedMonth} />
                  <CurrencyPicker currency={currency} onChange={setCurrency} />
                </Box>
                <SummaryCards transactions={monthFiltered} prevMonthTransactions={prevMonthFiltered} convert={convert} symbol={symbol} />
                <TrendsChart transactions={transactions} onMonthSelect={setSelectedMonth} />
                <CategoryChart transactions={monthFiltered} />
                <PeopleBreakdown transactions={monthFiltered} convert={convert} symbol={symbol} />
                {monthFiltered.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700 }}>Recent Transactions</Typography>
                      <Typography variant="caption" onClick={() => setActiveTab(1)} sx={{ color: '#818cf8', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600 }}>See all →</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {monthFiltered.slice(0, 5).map((t) => (
                        <Card key={t._id} sx={{ border: '1px solid rgba(148,163,184,0.08)', background: 'rgba(30,41,59,0.5)' }}>
                          <CardActionArea onClick={() => setEditTransaction(t)} sx={{ p: 0 }}>
                            <CardContent sx={{ p: '12px 16px', '&:last-child': { pb: '12px' } }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                  <Typography fontWeight={600} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.88rem' }}>
                                    {t.item || t.description}
                                  </Typography>
                                  {t.item && t.description && (
                                    <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', lineHeight: 1.2 }}>{t.description}</Typography>
                                  )}
                                  {t.participants && t.participants.length > 0 && (
                                    <Typography sx={{ fontSize: '0.63rem', color: 'text.disabled', mt: 0.25 }}>with {t.participants.join(', ')}</Typography>
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
            </>
          )}

          {activeTab === 1 && (
            <>
              <MonthPicker selectedMonth={selectedMonth} onChange={setSelectedMonth} />
              <FilterBar
                search={search}
                typeFilter={typeFilter}
                total={monthFiltered.length}
                filtered={filteredTransactions.length}
                onSearchChange={setSearch}
                onTypeFilterChange={setTypeFilter}
                onExport={handleExport}
              />
              <ExpenseList
                transactions={filteredTransactions}
                onEdit={(t) => setEditTransaction(t)}
                onDelete={handleDelete}
                onAdd={() => setAddOpen(true)}
                convert={convert}
                symbol={symbol}
              />
            </>
          )}

          {activeTab === 2 && <ManageItemsPage />}

          {activeTab === 3 && (
            <SettingsPage
              currency={currency}
              onCurrencyChange={(c: Currency) => setCurrency(c)}
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
            borderTop: '1px solid rgba(148,163,184,0.1)',
          }}
        >
          <BottomNavigationAction label="Home" icon={<DashboardIcon />} />
          <BottomNavigationAction label="Txns" icon={<ReceiptLongIcon />} />
          <BottomNavigationAction label="Items" icon={<CategoryIcon />} />
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
          await createExpense({ ...data, owner });
          await fetchTransactions();
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
    </Box>
  );
};

export default MainLayout;
