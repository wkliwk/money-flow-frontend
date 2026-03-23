import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  CircularProgress,
  useMediaQuery,
  useTheme,
  IconButton,
  Typography,
  Box,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Transaction, TransactionType } from '../../types';
import { updateExpense } from '../../services/api';
import CategorySelect from './CategorySelect';

interface Props {
  open: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onSaved: (updated: Transaction) => void;
  existingCategories: string[];
}

const EditExpenseModal: React.FC<Props> = ({ open, transaction, onClose, onSaved, existingCategories }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (transaction) {
      setDescription(transaction.description);
      setAmount(String(transaction.amount));
      setType(transaction.type);
      setCategory(transaction.category || '');
      setDate(transaction.date ? transaction.date.split('T')[0] : new Date().toISOString().split('T')[0]);
      setError('');
    }
  }, [transaction]);

  const handleSubmit = async () => {
    if (!description.trim()) {
      setError('Description is required');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (!transaction) return;

    setLoading(true);
    setError('');
    try {
      const updated = await updateExpense(transaction._id, {
        description: description.trim(),
        amount: parsedAmount,
        type,
        category: category.trim() || undefined,
        date,
        owner: transaction.owner,
      });
      onSaved(updated);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to update transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" fullScreen={isMobile}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>Edit Transaction</Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
            {error}
          </Alert>
        )}
        <TextField
          label="Description"
          fullWidth
          margin="normal"
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <TextField
          label="Amount (HK$)"
          type="number"
          fullWidth
          margin="normal"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputProps={{ min: 0, step: 0.01 }}
        />
        <FormControl margin="normal">
          <FormLabel>Type</FormLabel>
          <RadioGroup
            row
            value={type}
            onChange={(e) => setType(e.target.value as TransactionType)}
          >
            <FormControlLabel value="income" control={<Radio />} label="Income" />
            <FormControlLabel value="expense" control={<Radio />} label="Expense" />
          </RadioGroup>
        </FormControl>
        <CategorySelect
          value={category}
          onChange={setCategory}
          existingCategories={existingCategories}
        />
        <TextField
          label="Date"
          type="date"
          fullWidth
          margin="normal"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 1, pb: isMobile ? 'calc(16px + env(safe-area-inset-bottom))' : 2 }}>
        <Button onClick={onClose} disabled={loading} sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
          Cancel
        </Button>
        <Button variant="contained" fullWidth={isMobile} onClick={handleSubmit} disabled={loading} size="large">
          {loading ? <><CircularProgress size={16} sx={{ mr: 1 }} />Saving…</> : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditExpenseModal;
