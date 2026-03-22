import React, { useEffect, useMemo, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  Snackbar,
  Alert,
  IconButton,
  Menu,
  MenuItem,
  Fab,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import dayjs, { Dayjs } from 'dayjs';
import { Transaction, TransactionRequest, TransactionType } from '../types';
import { getExpenses, createExpense, deleteExpense } from '../services/api';
import { clearToken } from '../services/auth';
import SummaryCards from './dashboard/SummaryCards';
import MonthPicker from './dashboard/MonthPicker';
import MobileHero from './dashboard/MobileHero';
import CategoryChart from './dashboard/CategoryChart';
import ExpenseList from './expenses/ExpenseList';
import FilterBar from './expenses/FilterBar';
import AddExpenseModal from './expenses/AddExpenseModal';
import EditExpenseModal from './expenses/EditExpenseModal';

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
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

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

  const monthFiltered = useMemo(() => {
    if (!selectedMonth) return transactions;
    return transactions.filter((t) => {
      const d = dayjs(t.date || t.createdAt);
      return d.isValid() && d.isSame(selectedMonth, 'month');
    });
  }, [transactions, selectedMonth]);

  const filteredTransactions = useMemo(() => {
    return monthFiltered.filter((t) => {
      const matchesSearch = search === '' || t.description.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === 'all' || t.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [monthFiltered, search, typeFilter]);

  const handleLogout = () => {
    clearToken();
    window.location.href = '/login';
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" elevation={0}>
        <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
              fontWeight: 700,
              letterSpacing: '-0.01em',
              background: 'linear-gradient(135deg, #818cf8 0%, #34d399 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Money Flow
          </Typography>
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Button
              color="inherit"
              onClick={handleLogout}
              sx={{ color: 'text.secondary', fontWeight: 500, '&:hover': { color: 'text.primary' } }}
            >
              Sign out
            </Button>
          </Box>
          <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
            <IconButton color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ color: 'text.secondary' }}>
              <AccountCircleIcon />
            </IconButton>
            <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
              <MenuItem
                onClick={() => {
                  setAnchorEl(null);
                  handleLogout();
                }}
              >
                Sign out
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1.5, sm: 3 }, pb: 14 }}>
        {/* Mobile: hero card with month picker + big balance */}
        <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
          <MobileHero
            transactions={monthFiltered}
            selectedMonth={selectedMonth}
            onChange={setSelectedMonth}
          />
        </Box>

        {/* Desktop: separate month picker + summary cards + chart */}
        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
          <MonthPicker selectedMonth={selectedMonth} onChange={setSelectedMonth} />
          <SummaryCards transactions={monthFiltered} />
          <CategoryChart transactions={monthFiltered} />
        </Box>

        <FilterBar
          search={search}
          typeFilter={typeFilter}
          total={monthFiltered.length}
          filtered={filteredTransactions.length}
          onSearchChange={setSearch}
          onTypeFilterChange={setTypeFilter}
        />

        <ExpenseList
          transactions={filteredTransactions}
          onEdit={(t) => setEditTransaction(t)}
          onDelete={handleDelete}
          onAdd={() => setAddOpen(true)}
        />
      </Container>

      {/* Fixed FAB — primary action */}
      <Fab
        color="primary"
        onClick={() => setAddOpen(true)}
        variant={isDesktop ? 'extended' : 'circular'}
        sx={{
          position: 'fixed',
          bottom: { xs: 'calc(20px + env(safe-area-inset-bottom))', sm: 32 },
          right: { xs: 20, sm: 40 },
          zIndex: 1200,
          px: isDesktop ? 3 : undefined,
          gap: isDesktop ? 1 : undefined,
          boxShadow: '0 0 0 0 rgba(129,140,248,0.4)',
          animation: 'fab-pulse 2.5s ease-in-out infinite',
          '@keyframes fab-pulse': {
            '0%': { boxShadow: '0 0 0 0 rgba(129,140,248,0.4)' },
            '60%': { boxShadow: '0 0 0 12px rgba(129,140,248,0)' },
            '100%': { boxShadow: '0 0 0 0 rgba(129,140,248,0)' },
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
      />

      <EditExpenseModal
        open={!!editTransaction}
        transaction={editTransaction}
        onClose={() => setEditTransaction(null)}
        onSaved={handleSaved}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MainLayout;
