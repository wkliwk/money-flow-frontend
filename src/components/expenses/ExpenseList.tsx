import React, { useState } from 'react';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Chip,
  Typography,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { Transaction } from '../../types';

interface Props {
  transactions: Transaction[];
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

const ExpenseList: React.FC<Props> = ({ transactions, onEdit, onDelete, onAdd }) => {
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const handleDeleteClick = (id: string) => {
    setConfirmId(id);
  };

  const handleConfirm = () => {
    if (confirmId) {
      onDelete(confirmId);
      setConfirmId(null);
    }
  };

  const handleCancel = () => {
    setConfirmId(null);
  };

  if (transactions.length === 0) {
    return (
      <>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <AccountBalanceWalletIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
          <Typography variant="h6" color="text.secondary" mt={2}>
            No transactions yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Add your first transaction to get started
          </Typography>
          <Button variant="contained" sx={{ mt: 3 }} onClick={onAdd}>
            + Add Transaction
          </Button>
        </Box>
      </>
    );
  }

  return (
    <>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Description</TableCell>
            <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Type</TableCell>
            <TableCell align="right">Amount</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {transactions.map((t) => (
            <TableRow key={t._id} hover>
              <TableCell>{formatDate(t.date)}</TableCell>
              <TableCell
                sx={{
                  maxWidth: 200,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {t.description}
              </TableCell>
              <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                <Chip
                  label={t.type === 'income' ? 'Income' : 'Expense'}
                  color={t.type === 'income' ? 'success' : 'error'}
                  size="small"
                />
              </TableCell>
              <TableCell align="right">
                <Typography
                  color={t.type === 'income' ? 'success.main' : 'error.main'}
                  fontWeight={500}
                >
                  {t.type === 'income' ? '+' : '-'}HK${t.amount.toLocaleString()}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <IconButton size="small" onClick={() => onEdit(t)}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => handleDeleteClick(t._id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!confirmId} onClose={handleCancel}>
        <DialogTitle>Delete transaction?</DialogTitle>
        <DialogContent>
          <DialogContentText>This cannot be undone.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleConfirm}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ExpenseList;
