import React, { useState } from 'react';
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
import { TransactionRequest, TransactionType } from '../../types';
import CategorySelect from './CategorySelect';
import NumPad from './NumPad';
import TemplateChips from './TemplateChips';
import ManageTemplatesDrawer from './ManageTemplatesDrawer';
import { useTemplates, TransactionTemplate } from '../../hooks/useTemplates';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<TransactionRequest, 'owner'>) => Promise<void>;
  existingCategories: string[];
}

const today = () => new Date().toISOString().split('T')[0];
const yesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
};

type QuickDate = 'today' | 'yesterday' | 'custom';

const AddExpenseModal: React.FC<Props> = ({ open, onClose, onSubmit, existingCategories }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { templates, addTemplate, deleteTemplate } = useTemplates();
  const [manageOpen, setManageOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState('');
  const [quickDate, setQuickDate] = useState<QuickDate>('today');
  const [customDate, setCustomDate] = useState(today());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTemplateSelect = (t: TransactionTemplate) => {
    setDescription(t.description);
    setType(t.type);
    setCategory(t.category);
    if (t.defaultAmount) setAmount(String(t.defaultAmount));
  };

  const resolvedDate = quickDate === 'today' ? today() : quickDate === 'yesterday' ? yesterday() : customDate;

  const handleClose = () => {
    setDescription('');
    setAmount('');
    setType('expense');
    setCategory('');
    setQuickDate('today');
    setCustomDate(today());
    setError('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!description.trim()) { setError('Description is required'); return; }
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) { setError('Please enter a valid amount'); return; }

    setLoading(true);
    setError('');
    try {
      await onSubmit({
        description: description.trim(),
        amount: parsedAmount,
        type,
        category: category.trim() || undefined,
        date: resolvedDate,
      });
      handleClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to add transaction');
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
      bg: 'rgba(251,113,133,0.1)',
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
    <>
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" fullScreen={isMobile}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Typography variant="h6" fontWeight={700}>Record Transaction</Typography>
        <IconButton size="small" onClick={handleClose} sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {error && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{error}</Alert>}

        {/* Template quick-tap row */}
        <TemplateChips
          templates={templates}
          onSelect={handleTemplateSelect}
          onManage={() => setManageOpen(true)}
        />

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

        {/* Amount — calculator keypad */}
        <NumPad value={amount} onChange={setAmount} />

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
        <Button onClick={handleClose} disabled={loading} sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
          Cancel
        </Button>
        <Button variant="contained" fullWidth={isMobile} onClick={handleSubmit} disabled={loading} size="large">
          {loading ? <><CircularProgress size={16} sx={{ mr: 1 }} />Saving…</> : 'Save Transaction'}
        </Button>
      </DialogActions>
    </Dialog>

    <ManageTemplatesDrawer
      open={manageOpen}
      onClose={() => setManageOpen(false)}
      templates={templates}
      onAdd={addTemplate}
      onDelete={deleteTemplate}
    />
    </>
  );
};

export default AddExpenseModal;
