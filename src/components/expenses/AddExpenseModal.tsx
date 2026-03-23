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
import TodayIcon from '@mui/icons-material/Today';
import HistoryIcon from '@mui/icons-material/History';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { TransactionRequest, TransactionType } from '../../types';
import NumPad from './NumPad';
import ItemPicker, { ItemPreset } from './ItemPicker';
import TemplateChips from './TemplateChips';
import ManageTemplatesDrawer from './ManageTemplatesDrawer';
import ParticipantPicker from './ParticipantPicker';
import { useTemplates, TransactionTemplate } from '../../hooks/useTemplates';
import { useFxRates, CURRENCIES, CURRENCY_SYMBOLS, Currency } from '../../hooks/useFxRates';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<TransactionRequest, 'owner'>) => Promise<void>;
  existingCategories: string[];
  descriptionsByItem?: Record<string, string[]>;
}

const today = () => new Date().toISOString().split('T')[0];
const yesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
};

type QuickDate = 'today' | 'yesterday' | 'custom';

const AddExpenseModal: React.FC<Props> = ({ open, onClose, onSubmit, descriptionsByItem = {} }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { templates, addTemplate, deleteTemplate } = useTemplates();
  const { symbol, rates, currency, setCurrency } = useFxRates();
  const fxRate = currency !== 'HKD' ? 1 / rates[currency] : undefined;
  const [manageOpen, setManageOpen] = useState(false);
  const [item, setItem] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [quickDate, setQuickDate] = useState<QuickDate>('today');
  const [customDate, setCustomDate] = useState(today());
  const [participants, setParticipants] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleItemSelect = (preset: ItemPreset) => {
    setItem(preset.label);
    setCategory(preset.category);
  };

  const handleTemplateSelect = (t: TransactionTemplate) => {
    setDescription(t.description);
    setType(t.type);
    setCategory(t.category);
    if (t.defaultAmount) setAmount(String(t.defaultAmount));
  };

  const resolvedDate = quickDate === 'today' ? today() : quickDate === 'yesterday' ? yesterday() : customDate;

  const handleClose = () => {
    setItem('');
    setCategory('');
    setDescription('');
    setAmount('');
    setType('expense');
    setQuickDate('today');
    setCustomDate(today());
    setParticipants([]);
    setError('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!item && !description.trim()) { setError('Please select an item or enter a description'); return; }
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) { setError('Please enter a valid amount'); return; }

    setLoading(true);
    setError('');
    try {
      await onSubmit({
        description: description.trim() || item,
        amount: parsedAmount,
        type,
        item: item || undefined,
        category: category || undefined,
        participants: participants.length ? participants : undefined,
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
      icon: <TrendingDownIcon sx={{ fontSize: 20 }} />,
      color: '#fb7185',
      bg: 'rgba(251,113,133,0.1)',
      border: 'rgba(251,113,133,0.35)',
      activeBg: 'rgba(251,113,133,0.18)',
    },
    {
      value: 'income' as TransactionType,
      label: 'Income',
      icon: <TrendingUpIcon sx={{ fontSize: 20 }} />,
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
        <Box sx={{ display: 'flex', gap: 1, mb: 1.5, mt: 0.5 }}>
          {typeCards.map((card) => {
            const selected = type === card.value;
            return (
              <Box
                key={card.value}
                onClick={() => { setType(card.value); setItem(''); setCategory(''); }}
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0.75,
                  py: 1,
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

        {/* Item picker — sets item + category, filtered by type */}
        <ItemPicker value={item} type={type} onSelect={handleItemSelect} />

        {/* Description — optional free-text note */}
        <TextField
          label="Description"
          fullWidth
          margin="dense"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. McDonald's, MTR…"
          size="small"
        />

        {/* Description history chips — quick-tap past entries for this item */}
        {item && descriptionsByItem[item] && descriptionsByItem[item].length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5, mb: 0.5 }}>
            {descriptionsByItem[item].slice(0, 6).map((d) => (
              <Chip
                key={d}
                label={d}
                size="small"
                clickable
                onClick={() => setDescription(d)}
                sx={{
                  height: 22,
                  fontSize: '0.7rem',
                  bgcolor: description === d ? 'rgba(129,140,248,0.18)' : 'rgba(148,163,184,0.06)',
                  color: description === d ? '#818cf8' : 'text.secondary',
                  border: '1px solid',
                  borderColor: description === d ? 'rgba(129,140,248,0.35)' : 'rgba(148,163,184,0.1)',
                }}
              />
            ))}
          </Box>
        )}

        {/* Currency selector */}
        <Box sx={{ mt: 1.5, mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontSize: '0.72rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Currency
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.75 }}>
            {CURRENCIES.map((c) => (
              <Chip
                key={c}
                label={`${CURRENCY_SYMBOLS[c]} ${c}`}
                size="small"
                clickable
                onClick={() => setCurrency(c as Currency)}
                sx={{
                  fontSize: '0.72rem',
                  height: 28,
                  bgcolor: currency === c ? 'rgba(129,140,248,0.18)' : 'rgba(148,163,184,0.08)',
                  color: currency === c ? '#818cf8' : 'text.secondary',
                  border: '1px solid',
                  borderColor: currency === c ? 'rgba(129,140,248,0.4)' : 'rgba(148,163,184,0.12)',
                  fontWeight: currency === c ? 700 : 400,
                }}
              />
            ))}
          </Box>
        </Box>

        {/* Amount — calculator keypad with FX support */}
        <NumPad
          value={amount}
          onChange={setAmount}
          fxSymbol={currency !== 'HKD' ? symbol : undefined}
          fxRate={fxRate}
        />

        {/* Date — quick chips */}
        <Box sx={{ mt: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontSize: '0.72rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Date
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            {(['today', 'yesterday', 'custom'] as QuickDate[]).map((d) => (
              <Chip
                key={d}
                icon={d === 'today' ? <TodayIcon sx={{ fontSize: '14px !important' }} /> : d === 'yesterday' ? <HistoryIcon sx={{ fontSize: '14px !important' }} /> : <CalendarMonthIcon sx={{ fontSize: '14px !important' }} />}
                label={d === 'today' ? 'Today' : d === 'yesterday' ? 'Yesterday' : 'Custom'}
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

        <ParticipantPicker value={participants} onChange={setParticipants} />
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 1, pb: isMobile ? 'calc(16px + env(safe-area-inset-bottom))' : 2 }}>
        <Button onClick={handleClose} disabled={loading}>Cancel</Button>
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
