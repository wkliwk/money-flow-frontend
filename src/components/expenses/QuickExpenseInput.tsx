import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, TextField, Box, Typography, Button, CircularProgress, Alert } from '@mui/material';
import { parseQuickExpense } from '../../utils/parseQuickExpense';
import { TransactionRequest } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<TransactionRequest, 'owner'>) => Promise<void>;
  existingCategories: string[];
}

const QuickExpenseInput: React.FC<Props> = ({ open, onClose, onSubmit }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (!open) { setInput(''); setError(''); } }, [open]);
  useEffect(() => { if (open) { setTimeout(() => inputRef.current?.focus(), 100); } }, [open]);

  const handleSubmit = async () => {
    setError('');
    const parsed = parseQuickExpense(input);
    if (!parsed || parsed.amount === 0) { setError('Please enter a valid amount'); return; }
    try {
      setLoading(true);
      await onSubmit({
        description: parsed.description || `Expense ${parsed.amount}`,
        amount: parsed.amount,
        category: parsed.category,
        type: 'expense',
        date: new Date().toISOString().split('T')[0],
      });
      setInput('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create expense');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) { handleSubmit(); }
    if (e.key === 'Escape') { onClose(); }
  };

  const parsed = input ? parseQuickExpense(input) : null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { bgcolor: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(12px)', border: '1px solid rgba(148,163,184,0.15)', borderRadius: 3 } }}>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 3 }}>
        <Typography variant="subtitle2" sx={{ color: 'text.disabled', fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700 }}>
          Quick Expense
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField inputRef={inputRef} fullWidth placeholder='e.g. "lunch 85" or "MTR 500 transport"'
          value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
          disabled={loading} autoFocus size="small"
          helperText="Type description + amount. Add category name at the end to categorise."
          inputProps={{ 'aria-label': 'Quick expense input' }} />
        {parsed && parsed.amount > 0 && (
          <Box sx={{ p: 1.5, bgcolor: 'rgba(30,41,59,0.5)', borderRadius: 2, border: '1px solid rgba(148,163,184,0.08)' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.78rem' }}>
              <strong>{parsed.description || 'Expense'}</strong> &mdash; ${parsed.amount.toFixed(2)}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem' }}>
              Category: {parsed.category}
            </Typography>
          </Box>
        )}
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          <Button onClick={onClose} disabled={loading} size="small">Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={loading || !parsed || parsed.amount === 0} size="small">
            {loading ? <CircularProgress size={20} /> : 'Add Expense'}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default QuickExpenseInput;
