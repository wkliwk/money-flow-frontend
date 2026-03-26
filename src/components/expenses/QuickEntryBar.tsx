import React, { useState, useCallback } from 'react';
import { Box, TextField, CircularProgress, InputAdornment } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import SendIcon from '@mui/icons-material/Send';
import IconButton from '@mui/material/IconButton';
import { parseQuickExpense } from '../../utils/parseQuickExpense';
import { TransactionRequest } from '../../types';
import { useFxRates, Currency } from '../../hooks/useFxRates';

interface Props {
  onSubmit: (data: Omit<TransactionRequest, 'owner'>) => Promise<void>;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const QuickEntryBar: React.FC<Props> = ({ onSubmit, onSuccess, onError }) => {
  const theme = useTheme();
  const { rateForCurrency } = useFxRates();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async () => {
    const parsed = parseQuickExpense(input);
    if (!parsed || parsed.amount === 0) return;
    try {
      setLoading(true);
      const isForeign = parsed.currency && parsed.currency !== 'HKD';
      const rate = isForeign ? rateForCurrency(parsed.currency as Currency) : 1;
      const hkdAmount = isForeign ? Math.round(parsed.amount * rate * 100) / 100 : parsed.amount;
      const data: Omit<TransactionRequest, 'owner'> = {
        description: parsed.description || `Expense ${parsed.amount}`,
        amount: hkdAmount,
        category: parsed.category,
        type: 'expense',
        date: new Date().toISOString().split('T')[0],
        ...(isForeign ? {
          currency: parsed.currency,
          originalAmount: parsed.amount,
          exchangeRate: rate,
        } : {}),
      };
      await onSubmit(data);
      setInput('');
      const label = parsed.description || 'Expense';
      onSuccess(`Added: ${label} $${hkdAmount}`);
    } catch {
      onError('Failed to add expense');
    } finally {
      setLoading(false);
    }
  }, [input, onSubmit, onSuccess, onError, rateForCurrency]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) { handleSubmit(); }
  };

  const parsed = input ? parseQuickExpense(input) : null;
  const canSubmit = !!parsed && parsed.amount > 0 && !loading;

  return (
    <Box sx={{ mb: 2 }}>
      <TextField
        fullWidth
        size="small"
        placeholder='Quick add: "lunch 85" or "MTR 500 transport"'
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={loading}
        inputProps={{ 'aria-label': 'Quick expense entry' }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              {loading ? (
                <CircularProgress size={20} />
              ) : (
                <IconButton
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  size="small"
                  aria-label="Submit quick expense"
                  sx={{ color: canSubmit ? 'primary.main' : 'text.disabled' }}
                >
                  <SendIcon fontSize="small" />
                </IconButton>
              )}
            </InputAdornment>
          ),
          sx: {
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(30,41,59,0.5)' : 'rgba(255,255,255,0.85)',
            borderRadius: 2,
            border: '1px solid rgba(148,163,184,0.1)',
            '&:hover': { border: '1px solid rgba(148,163,184,0.2)' },
            fontSize: '0.88rem',
          },
        }}
      />
      {parsed && parsed.amount > 0 && (
        <Box sx={{ mt: 0.5, px: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
          <Box component="span" sx={{ fontSize: '0.7rem', color: 'text.disabled' }}>
            {parsed.description || 'Expense'} &mdash; {parsed.currency ? `${parsed.currency} ` : '$'}{parsed.amount} &middot; {parsed.category}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default React.memo(QuickEntryBar);
