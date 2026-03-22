import React, { useEffect, useState } from 'react';
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
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { Transaction, TransactionRequest } from '../types';
import { getExpenses, createExpense, deleteExpense } from '../services/api';
import { clearToken } from '../services/auth';
import SummaryCards from './dashboard/SummaryCards';
import ExpenseList from './expenses/ExpenseList';
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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

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

  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

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

  const handleLogout = () => {
    clearToken();
    window.location.href = '/login';
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            💰 Money Flow
          </Typography>
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          </Box>
          <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
            <IconButton color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)}>
              <AccountCircleIcon />
            </IconButton>
            <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
              <MenuItem
                onClick={() => {
                  setAnchorEl(null);
                  handleLogout();
                }}
              >
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <SummaryCards transactions={transactions} />

        <Box sx={{ display: { xs: 'none', sm: 'flex' }, justifyContent: 'flex-end', mb: 2 }}>
          <Button variant="contained" onClick={() => setAddOpen(true)}>
            + Add Transaction
          </Button>
        </Box>

        <Box sx={{ display: { xs: 'block', sm: 'none' }, mb: 2 }}>
          <Button variant="contained" fullWidth onClick={() => setAddOpen(true)}>
            + Add Transaction
          </Button>
        </Box>

        <ExpenseList
          transactions={transactions}
          onEdit={(t) => setEditTransaction(t)}
          onDelete={handleDelete}
          onAdd={() => setAddOpen(true)}
        />
      </Container>

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
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
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
