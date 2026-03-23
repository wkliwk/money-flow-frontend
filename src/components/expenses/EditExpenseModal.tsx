import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  CircularProgress,
  useMediaQuery,
  useTheme,
  IconButton,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
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

type QuickDate = 'today' | 'yesterday' | 'custom';

const todayStr = () => new Date().toISOString().split('T')[0];
const yesterdayStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
};

function classifyDate(dateStr: string): QuickDate {
  const d = dateStr.split('T')[0];
  if (d === todayStr()) return 'today';
  if (d === yesterdayStr()) return 'yesterday';
  return 'custom';
}

const EditExpenseModal: React.FC<Props> = ({ open, transaction, onClose, onSaved, existingCategories }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState('');
  const [quickDate, setQuickDate] = useState<QuickDate>('today');
  const [customDate, setCustomDate] = useState(todayStr());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (transaction) {
      setDescription(transaction.description);
      setAmount(String(transaction.amount));
      setType(transaction.type);
      setCategory(transaction.category || '');
      const raw = transaction.date ? transaction.date.split('T')[0] : todayStr();
      setQuickDate(classifyDate(raw));
      setCustomDate(raw);
      setError('');
    }
  }, [transaction]);

  const resolvedDate =
    quickDate === 'today' ? todayStr() : quickDate === 'yesterday' ? yesterdayStr() : customDate;

  const handleSubmit = async () => {
    if (!description.trim()) { setError('Description is required'); return; }
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) { setError('Please enter a valid amount'); return; }
    if (!transaction) return;

    setLoading(true);
    setError('');
    try {
      const updated = await updateExpense(transaction._id, {
        description: description.trim(),
        amount: parsedAmount,
        type,
        category: category.trim() || undefined,
        date: resolvedDate,
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

  const typeCards = [
    {
      value: 'expense' as TransactionType,
      label: 'Expense',
      icon: <TrendingDownIcon sx={{ fontSize: 28 }} />,
      color: '#fb7185',
      bg: 'rgba(251,113,133,0.07)',
      border: 'rgba(251,113,133,0.35)',
      activeBg: 'rgba(251,113,133,0.18)',
    },
    {
      value: 'income' as TransactionType,
      label: 'Income',
      icon: <TrendingUpIcon sx={{ fontSize: 28 }} />,
      color: '#34d399',
      bg: 'rgba(52,211,153,0.07)',
      border: 'rgba(52,211,153,0.35)',
      activeBg: 'rgba(52,211,153,0.18)',
    },
  ];

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" fullScreen={isMobile}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Typography variant="h6" fontWeight={700}>Edit Transaction</Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {error && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{error}</Alert>}

        {/* Type selector — icon cards */}
        <Box sx={{ display: 'flex', gap: 1.5, mb: 2, mt: 1 }}>
          {typeCards.map((card) => {
            const selected = type === card.value;
            return (
              <Box
                key={card.value}
                onClick={() => setType(card.value)}
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 0.75,
                  py: 2,
                  borderRadius: 2.5,
                  cursor: 'pointer',
                  border: '2px solid',
                  borderColor: selected ? card.border : 'rgba(148,163,184,0.1)',
                  bgcolor: selected ? card.activeBg : card.bg,
                  transition: 'all 0.15s ease',
                  userSelect: 'none',
                  '&:hover': { bgcolor: card.activeBg },
                }}
              >
                <Box sx={{ color: card.color }}>{card.icon}</Box>
                <Typography
                  variant="caption"
                  fontWeight={700}
                  sx={{ color: selected ? card.color : 'text.secondary', fontSize: '0.78rem', letterSpacing: '0.02em' }}
                >
                  {card.label}
                </Typography>
              </Box>
            );
          })}
        </Box>

        {/* Amount — prominent */}
        <TextField
          label="Amount (HK$)"
          type="number"
          fullWidth
          margin="normal"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputProps={{ min: 0, step: 0.01 }}
          InputProps={{
            sx: {
              fontSize: '1.3rem',
              fontWeight: 700,
              '& input': { textAlign: 'center', letterSpacing: '-0.01em' },
            },
          }}
        />

        {/* Description */}
        <TextField
          label="Description"
          fullWidth
          margin="normal"
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* Category with emoji chips */}
        <CategorySelect value={category} onChange={setCategory} existingCategories={existingCategories} />

        {/* Date — quick chips */}
        <Box sx={{ mt: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontSize: '0.72rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Date
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            {(['today', 'yesterday', 'custom'] as QuickDate[]).map((d) => (
              <Chip
                key={d}
                label={d === 'today' ? '📅 Today' : d === 'yesterday' ? '⏮ Yesterday' : '📆 Custom'}
                size="small"
                clickable
                onClick={() => setQuickDate(d)}
                sx={{
                  fontSize: '0.75rem',
                  height: 30,
                  bgcolor: quickDate === d ? 'rgba(129,140,248,0.18)' : 'rgba(148,163,184,0.08)',
                  color: quickDate === d ? '#818cf8' : 'text.secondary',
                  border: '1px solid',
                  borderColor: quickDate === d ? 'rgba(129,140,248,0.4)' : 'rgba(148,163,184,0.12)',
                  fontWeight: quickDate === d ? 600 : 400,
                }}
              />
            ))}
          </Box>
          {quickDate === 'custom' && (
            <TextField
              type="date"
              size="small"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ mt: 1.5, width: 180 }}
            />
          )}
        </Box>
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
