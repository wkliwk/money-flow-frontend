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
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import TodayIcon from '@mui/icons-material/Today';
import HistoryIcon from '@mui/icons-material/History';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { Transaction, TransactionRequest, TransactionType } from '../../types';
import { updateExpense } from '../../services/api';
import NumPad from './NumPad';
import ItemPicker, { ItemPreset, ITEM_PRESETS, ITEM_SUGGESTIONS } from './ItemPicker';
import DescriptionPicker from './DescriptionPicker';
import ParticipantPicker from './ParticipantPicker';
import { useFxRates, CURRENCIES, CURRENCY_SYMBOLS, Currency } from '../../hooks/useFxRates';
import { useItemPresets } from '../../hooks/useItemPresets';

interface Props {
  open: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onSaved: (updated: Transaction) => void;
  onDelete: (id: string) => void;
  onDuplicate: (data: Omit<TransactionRequest, 'owner'>) => Promise<void>;
  existingCategories: string[];
  descriptionsByItem?: Record<string, string[]>;
  knownParticipants?: string[];
  recentItems?: string[];
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

const EditExpenseModal: React.FC<Props> = ({ open, transaction, onClose, onSaved, onDelete, onDuplicate, descriptionsByItem = {}, knownParticipants = [], recentItems = [] }) => {
  const { presets: itemPresets } = useItemPresets();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { symbol, rates, currency, setCurrency } = useFxRates();
  const fxRate = currency !== 'HKD' ? 1 / rates[currency] : undefined;
  const [item, setItem] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [quickDate, setQuickDate] = useState<QuickDate>('today');
  const [customDate, setCustomDate] = useState(todayStr());
  const [participants, setParticipants] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [duplicating, setDuplicating] = useState(false);

  useEffect(() => {
    if (transaction) {
      // Backward compat: old records stored item label in description field
      const resolvedItem = transaction.item || (ITEM_PRESETS.find((p) => p.label === transaction.description)?.label ?? '');
      const resolvedDesc = transaction.item ? transaction.description : (resolvedItem ? '' : transaction.description);
      setItem(resolvedItem);
      setCategory(transaction.category || (ITEM_PRESETS.find((p) => p.label === resolvedItem)?.category ?? ''));
      setDescription(resolvedDesc);
      setAmount(String(transaction.amount));
      setType(transaction.type);
      setParticipants(transaction.participants ?? []);
      const raw = transaction.date ? transaction.date.split('T')[0] : todayStr();
      setQuickDate(classifyDate(raw));
      setCustomDate(raw);
      setError('');
      setDeleteConfirm(false);
    }
  }, [transaction]);

  const resolvedDate =
    quickDate === 'today' ? todayStr() : quickDate === 'yesterday' ? yesterdayStr() : customDate;

  const handleItemSelect = (preset: ItemPreset) => {
    setItem(preset.label);
    setCategory(preset.category);
  };

  const handleSubmit = async () => {
    if (!item && !description.trim()) { setError('Please select an item or enter a description'); return; }
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) { setError('Please enter a valid amount'); return; }
    if (!transaction) return;

    setLoading(true);
    setError('');
    try {
      const updated = await updateExpense(transaction._id, {
        description: description.trim() || item,
        amount: parsedAmount,
        type,
        item: item || undefined,
        category: category || undefined,
        participants: participants.length ? participants : undefined,
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

  const handleDuplicate = async () => {
    if (!transaction) return;
    setDuplicating(true);
    try {
      await onDuplicate({
        description: description.trim() || item,
        amount: parseFloat(amount) || transaction.amount,
        type,
        item: item || undefined,
        category: category || undefined,
        participants: participants.length ? participants : undefined,
        date: todayStr(),
      });
      onClose();
    } finally {
      setDuplicating(false);
    }
  };

  const typeCards = [
    {
      value: 'expense' as TransactionType,
      label: 'Expense',
      icon: <TrendingDownIcon sx={{ fontSize: 20 }} />,
      color: '#fb7185',
      bg: 'rgba(251,113,133,0.07)',
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
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" fullScreen={isMobile}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>Edit Transaction</Typography>
          {transaction?.createdAt && (
            <Typography sx={{ fontSize: '0.65rem', color: 'text.disabled', mt: 0.125 }}>
              {new Date(transaction.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </Typography>
          )}
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {error && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{error}</Alert>}

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

        {/* Item picker — filtered by current type */}
        <ItemPicker value={item} type={type} onSelect={handleItemSelect} recentItems={recentItems} />

        {/* Description — tag picker */}
        {(() => {
          const preset = item ? itemPresets[item] : '';
          const history = item ? (descriptionsByItem[item] || []) : [];
          const builtIn = item ? (ITEM_SUGGESTIONS[item] || []) : [];
          const suggestions = Array.from(new Set([...(preset ? [preset] : []), ...history, ...builtIn])).slice(0, 10);
          return <DescriptionPicker value={description} onChange={setDescription} suggestions={suggestions} />;
        })()}

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

        <ParticipantPicker value={participants} onChange={setParticipants} suggestions={knownParticipants} />
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 1, pb: isMobile ? 'calc(16px + env(safe-area-inset-bottom))' : 2, gap: 1 }}>
        {deleteConfirm ? (
          <>
            <Typography variant="caption" color="error" sx={{ flex: 1, fontSize: '0.75rem' }}>Are you sure?</Typography>
            <Button size="small" onClick={() => setDeleteConfirm(false)}>Cancel</Button>
            <Button size="small" color="error" variant="contained" onClick={() => { if (transaction) { onDelete(transaction._id); onClose(); } }}>
              Delete
            </Button>
          </>
        ) : (
          <>
            <IconButton size="small" onClick={() => setDeleteConfirm(true)} disabled={loading || duplicating} sx={{ color: 'rgba(251,113,133,0.5)', '&:hover': { color: '#fb7185' } }}>
              <DeleteIcon sx={{ fontSize: 20 }} />
            </IconButton>
            <IconButton size="small" onClick={handleDuplicate} disabled={loading || duplicating} title="Log again today" sx={{ color: 'rgba(129,140,248,0.5)', '&:hover': { color: '#818cf8' }, mr: 'auto' }}>
              {duplicating ? <CircularProgress size={16} /> : <ContentCopyIcon sx={{ fontSize: 18 }} />}
            </IconButton>
            <Button onClick={onClose} disabled={loading || duplicating}>Cancel</Button>
            <Button variant="contained" onClick={handleSubmit} disabled={loading || duplicating} size="large">
              {loading ? <><CircularProgress size={16} sx={{ mr: 1 }} />Saving…</> : 'Save'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default EditExpenseModal;
