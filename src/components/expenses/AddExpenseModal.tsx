import React, { useState } from 'react';
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
} from '@mui/material';
import { TransactionRequest, TransactionType } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<TransactionRequest, 'owner'>) => Promise<void>;
}

const AddExpenseModal: React.FC<Props> = ({ open, onClose, onSubmit }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    setDescription('');
    setAmount('');
    setType('expense');
    setCategory('');
    setDate(new Date().toISOString().split('T')[0]);
    setError('');
    onClose();
  };

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

    setLoading(true);
    setError('');
    try {
      await onSubmit({
        description: description.trim(),
        amount: parsedAmount,
        type,
        category: category.trim() || undefined,
        date,
      });
      handleClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Add Transaction</DialogTitle>
      <DialogContent>
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
        <TextField
          label="Category (optional)"
          fullWidth
          margin="normal"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="e.g. Food, Transport..."
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
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? <><CircularProgress size={16} sx={{ mr: 1 }} />Adding...</> : 'Add Transaction'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddExpenseModal;
