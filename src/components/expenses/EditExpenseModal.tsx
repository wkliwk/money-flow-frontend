import React, { useState, useLayoutEffect } from 'react';
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
  ToggleButtonGroup,
  ToggleButton,
  Collapse,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import TodayIcon from '@mui/icons-material/Today';
import HistoryIcon from '@mui/icons-material/History';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Transaction, TransactionRequest, TransactionType, PaymentMethod } from '../../types';
import { updateExpense } from '../../services/api';
import NumPad from './NumPad';
import ItemPicker, { ItemPreset, ITEM_PRESETS, ITEM_SUGGESTIONS } from './ItemPicker';
import DescriptionPicker from './DescriptionPicker';
import ParticipantPicker from './ParticipantPicker';
import PaymentMethodPicker from './PaymentMethodPicker';
import { useFxRates, CURRENCY_SYMBOLS, Currency } from '../../hooks/useFxRates';
import { useItemPresets } from '../../hooks/useItemPresets';
import { usePriceAlert } from '../../hooks/usePriceAlert';

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
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { rateForCurrency } = useFxRates();
  const [txCurrency, setTxCurrency] = useState<Currency>('HKD');
  const fxRate = txCurrency !== 'HKD' ? rateForCurrency(txCurrency) : undefined;
  const [item, setItem] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [quickDate, setQuickDate] = useState<QuickDate>('today');
  const [customDate, setCustomDate] = useState(todayStr());
  const [participants, setParticipants] = useState<string[]>([]);
  const [splitBillMode, setSplitBillMode] = useState<'treat' | 'split'>('treat');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const priceAlert = usePriceAlert(item, amount);

  useLayoutEffect(() => {
    if (transaction) {
      // Backward compat: old records stored item label in description field
      const resolvedItem = transaction.item || (ITEM_PRESETS.find((p) => p.label === transaction.description)?.label ?? '');
      const resolvedDesc = transaction.item
        ? (transaction.description === transaction.item ? '' : transaction.description)
        : (resolvedItem ? '' : transaction.description);
      setItem(resolvedItem);
      setCategory(transaction.category || (ITEM_PRESETS.find((p) => p.label === resolvedItem)?.category ?? ''));
      setDescription(resolvedDesc);
      setAmount(String(transaction.amount));
      setType(transaction.type);
      setParticipants(transaction.participants ?? []);
      setSplitBillMode(transaction.splitBill === true ? 'split' : 'treat');
      setPaymentMethod((transaction.paymentMethod as PaymentMethod) || null);
      setTxCurrency((transaction.currency as Currency) || 'HKD');
      setNotes(transaction.notes || '');
      const raw = transaction.date ? transaction.date.split('T')[0] : todayStr();
      setQuickDate(classifyDate(raw));
      setCustomDate(raw);
      setError('');
      setDeleteConfirm(false);
      setShowMore(
        !!(transaction.participants?.length) ||
        !!(transaction.paymentMethod) ||
        !!(transaction.notes)
      );
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
      const isForeign = txCurrency !== 'HKD' && fxRate;
      const foreignAmount = isForeign ? Math.round(parsedAmount / fxRate * 100) / 100 : undefined;
      const payload = {
        description: description.trim() || item,
        amount: parsedAmount,
        type,
        item: item || undefined,
        category: category || undefined,
        participants: participants,
        splitBill: participants.length > 0 ? splitBillMode === 'split' : undefined,
        paymentMethod: paymentMethod || undefined,
        notes: notes.trim() || undefined,
        date: resolvedDate,
        owner: transaction.owner,
        ...(isForeign ? {
          currency: txCurrency,
          originalAmount: foreignAmount,
          exchangeRate: fxRate,
        } : {
          currency: 'HKD',
          originalAmount: undefined,
          exchangeRate: undefined,
        }),
      };
      const updated = await updateExpense(transaction._id, payload);
      // Keep UI state in sync immediately even if API response is partially shaped.
      onSaved({
        ...transaction,
        ...payload,
        ...updated,
        participants: updated?.participants ?? payload.participants ?? [],
      });
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
      const dupAmount = parseFloat(amount) || transaction.amount;
      const isForeign = txCurrency !== 'HKD' && fxRate;
      const foreignAmount = isForeign ? Math.round(dupAmount / fxRate * 100) / 100 : undefined;
      await onDuplicate({
        description: description.trim() || item,
        amount: dupAmount,
        type,
        item: item || undefined,
        category: category || undefined,
        participants: participants,
        paymentMethod: paymentMethod || undefined,
        date: todayStr(),
        ...(isForeign ? {
          currency: txCurrency,
          originalAmount: foreignAmount,
          exchangeRate: fxRate,
        } : {}),
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
      color: theme.palette.error.light,
      bg: isDark ? 'rgba(251,113,133,0.07)' : 'rgba(244,63,94,0.09)',
      border: isDark ? 'rgba(251,113,133,0.35)' : 'rgba(244,63,94,0.44)',
      activeBg: isDark ? 'rgba(251,113,133,0.18)' : 'rgba(244,63,94,0.22)',
    },
    {
      value: 'income' as TransactionType,
      label: 'Income',
      icon: <TrendingUpIcon sx={{ fontSize: 20 }} />,
      color: theme.palette.success.light,
      bg: isDark ? 'rgba(52,211,153,0.07)' : 'rgba(16,185,129,0.09)',
      border: isDark ? 'rgba(52,211,153,0.35)' : 'rgba(16,185,129,0.44)',
      activeBg: isDark ? 'rgba(52,211,153,0.18)' : 'rgba(16,185,129,0.22)',
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
        <Box role="radiogroup" aria-label="Transaction type" sx={{ display: 'flex', gap: 1, mb: 1.5, mt: 0.5 }}>
          {typeCards.map((card) => {
            const selected = type === card.value;
            return (
              <Box
                key={card.value}
                role="radio"
                aria-checked={selected}
                tabIndex={0}
                onClick={() => { setType(card.value); setItem(''); setCategory(''); }}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    setType(card.value);
                    setItem('');
                    setCategory('');
                  }
                }}
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
                  '&:focus': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
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

        {/* Amount — compact calculator with expandable grid */}
        <NumPad
          value={amount}
          onChange={setAmount}
          fxSymbol={txCurrency !== 'HKD' ? CURRENCY_SYMBOLS[txCurrency] : undefined}
          fxRate={fxRate}
          compact
        />

        {/* Price anomaly warning */}
        {priceAlert.show && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1, py: 0.75, px: 1.5, borderRadius: 1.5, bgcolor: isDark ? 'rgba(251,191,36,0.08)' : 'rgba(245,158,11,0.1)', border: `1px solid ${isDark ? 'rgba(251,191,36,0.25)' : 'rgba(245,158,11,0.3)'}` }}>
            <WarningAmberIcon sx={{ fontSize: 16, color: 'warning.main', flexShrink: 0 }} />
            <Typography sx={{ fontSize: '0.75rem', color: 'warning.main', flex: 1 }}>
              {priceAlert.message}
            </Typography>
          </Box>
        )}

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
                  bgcolor: quickDate === d ? (isDark ? 'rgba(129,140,248,0.18)' : 'rgba(99,102,241,0.22)') : 'rgba(148,163,184,0.08)',
                  color: quickDate === d ? theme.palette.primary.main : 'text.secondary',
                  border: '1px solid',
                  borderColor: quickDate === d ? (isDark ? 'rgba(129,140,248,0.4)' : 'rgba(99,102,241,0.5)') : 'rgba(148,163,184,0.12)',
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

        {/* Collapsible secondary fields */}
        <Box
          onClick={() => setShowMore((v) => !v)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.5,
            mt: 1.5,
            py: 0.75,
            cursor: 'pointer',
            borderRadius: 2,
            bgcolor: 'rgba(148,163,184,0.04)',
            border: '1px solid rgba(148,163,184,0.1)',
            userSelect: 'none',
            '&:hover': { bgcolor: 'rgba(148,163,184,0.08)' },
          }}
        >
          <Typography variant="caption" sx={{ fontSize: '0.72rem', color: 'text.secondary', letterSpacing: '0.04em' }}>
            {showMore ? 'Less options' : 'More options'}
            {!showMore && (participants.length > 0 || paymentMethod || notes) && ' •'}
          </Typography>
          <ExpandMoreIcon sx={{ fontSize: 18, color: 'text.secondary', transition: 'transform 0.2s', transform: showMore ? 'rotate(180deg)' : 'rotate(0)' }} />
        </Box>

        <Collapse in={showMore}>
          <ParticipantPicker value={participants} onChange={setParticipants} suggestions={knownParticipants} />

          {participants.length > 0 && (
            <Box sx={{ mt: 1, mb: 0.5 }}>
              <ToggleButtonGroup
                value={splitBillMode}
                exclusive
                onChange={(_, v) => { if (v) setSplitBillMode(v); }}
                size="small"
                sx={{ height: 30 }}
              >
                <ToggleButton value="split" sx={{ fontSize: '0.72rem', px: 1.5, textTransform: 'none', borderColor: 'rgba(148,163,184,0.15)' }}>
                  Split bill
                </ToggleButton>
                <ToggleButton value="treat" sx={{ fontSize: '0.72rem', px: 1.5, textTransform: 'none', borderColor: 'rgba(148,163,184,0.15)' }}>
                  My treat
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          )}

          <PaymentMethodPicker value={paymentMethod} onChange={setPaymentMethod} />

          {/* Notes */}
          <Box sx={{ mt: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Notes (optional)
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.68rem', color: notes.length > 450 ? (notes.length >= 500 ? 'error.main' : 'warning.main') : 'text.disabled' }}>
                {notes.length}/500
              </Typography>
            </Box>
            <TextField
              multiline
              minRows={2}
              maxRows={4}
              fullWidth
              size="small"
              placeholder="Add a note..."
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 500))}
              inputProps={{ maxLength: 500 }}
              sx={{ '& .MuiInputBase-root': { fontSize: '0.85rem' } }}
            />
          </Box>
        </Collapse>
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
            <IconButton size="small" onClick={() => setDeleteConfirm(true)} disabled={loading || duplicating} sx={{ color: isDark ? 'rgba(251,113,133,0.5)' : 'rgba(244,63,94,0.5)', '&:hover': { color: theme.palette.error.light } }}>
              <DeleteIcon sx={{ fontSize: 20 }} />
            </IconButton>
            <IconButton size="small" onClick={handleDuplicate} disabled={loading || duplicating} title="Log again today" sx={{ color: isDark ? 'rgba(129,140,248,0.5)' : 'rgba(99,102,241,0.5)', '&:hover': { color: theme.palette.primary.main }, mr: 'auto' }}>
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
