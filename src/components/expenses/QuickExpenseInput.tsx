import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Autocomplete,
} from '@mui/material';
import { parseQuickExpense, suggestCategory } from '../../utils/parseQuickExpense';
import { TransactionRequest } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<TransactionRequest, 'owner'>) => Promise<void>;
  existingCategories: string[];
}

const QuickExpenseInput: React.FC<Props> = ({ open, onClose, onSubmit, existingCategories }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset on close
  useEffect(() => {
    if (!open) {
      setInput('');
      setError('');
    }
  }, [open]);

  // Focus input when dialog opens
  const inputRef = React.useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSubmit = async () => {
    setError('');
    const parsed = parseQuickExpense(input);

    if (!parsed || parsed.amount === 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);

      // If item is empty, use amount as item
      const item = parsed.item || `Expense ${parsed.amount}`;
      const category = suggestCategory(item);

      const transactionData: Omit<TransactionRequest, 'owner'> = {
        item,
        category,
        description: item,
        amount: parsed.amount,
        type: 'expense',
        date: new Date().toISOString().split('T')[0],
      };

      await onSubmit(transactionData);
      setInput('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create expense');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleSubmit();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const parsed = input ? parseQuickExpense(input) : null;
  const suggestedCategory = parsed?.item ? suggestCategory(parsed.item) : '';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Quick Expense</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
        {error && <Alert severity="error">{error}</Alert>}

        <Box>
          <TextField
            inputRef={inputRef}
            fullWidth
            placeholder="e.g. coffee 5 usd, lunch 12.50, groceries 45"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            autoFocus
            helperText="Format: [item] [amount] [currency]"
          />
        </Box>

        {parsed && (
          <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="body2" color="textSecondary">
              Preview:
            </Typography>
            <Typography variant="body1" sx={{ mt: 0.5 }}>
              <strong>{parsed.item || 'Expense'}</strong> – ${parsed.amount.toFixed(2)}
            </Typography>
            {suggestedCategory && (
              <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
                Category: <strong>{suggestedCategory}</strong>
              </Typography>
            )}
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading || !parsed || parsed.amount === 0}
          >
            {loading ? <CircularProgress size={24} /> : 'Add Expense'}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default QuickExpenseInput;
