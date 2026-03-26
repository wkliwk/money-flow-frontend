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
import RepeatIcon from '@mui/icons-material/Repeat';
import { TransactionRequest, TransactionType } from '../../types';
import NumPad from './NumPad';
import ItemPicker, { ItemPreset, ITEM_SUGGESTIONS } from './ItemPicker';
import DescriptionPicker from './DescriptionPicker';
import TemplateChips from './TemplateChips';
import ManageTemplatesDrawer from './ManageTemplatesDrawer';
import ParticipantPicker from './ParticipantPicker';
import { useTemplates, TransactionTemplate } from '../../hooks/useTemplates';
import { useFxRates, CURRENCIES, CURRENCY_SYMBOLS, Currency } from '../../hooks/useFxRates';
import { useItemPresets } from '../../hooks/useItemPresets';
import { useRecurring } from '../../hooks/useRecurring';

type RecurringFrequency = 'monthly' | 'weekly' | 'daily';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<TransactionRequest, 'owner'>) => Promise<void>;
  existingCategories: string[];
  descriptionsByItem?: Record<string, string[]>;
  knownParticipants?: string[];
  recentItems?: string[];
  amountsByDescription?: Record<string, number>;
}

const today = () => new Date().toISOString().split('T')[0];
const yesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
};

type QuickDate = 'today' | 'yesterday' | 'custom';

const AddExpenseModal: React.FC<Props> = ({ open, onClose, onSubmit, descriptionsByItem = {}, knownParticipants = [], recentItems = [], amountsByDescription = {} }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { templates, addTemplate, deleteTemplate } = useTemplates();
  const { symbol, rates, currency, setCurrency, convert } = useFxRates();
  const { presets: itemPresets } = useItemPresets();
  const { addItem: addRecurringItem } = useRecurring();
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
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState<{ data: Omit<TransactionRequest, 'owner'>; addAnother: boolean } | null>(null);

  const handleItemSelect = (preset: ItemPreset) => {
    setItem(preset.label);
    setCategory(preset.category);
    if (!description && itemPresets[preset.label]) {
      setDescription(itemPresets[preset.label]);
    }
  };

  const handleTemplateSelect = (t: TransactionTemplate) => {
    setType(t.type);
    setCategory(t.category);
    setDescription(t.description);
    if (t.item) setItem(t.item);
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
    setIsRecurring(false);
    setFrequency('monthly');
    setError('');
    onClose();
  };

  const handleSubmit = async (addAnother = false) => {
    if (!item && !description.trim()) { setError('Please select an item or enter a description'); return; }
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) { setError('Please enter a valid amount'); return; }

    const data: Omit<TransactionRequest, 'owner'> = {
      description: description.trim() || item,
      amount: parsedAmount,
      type,
      item: item || undefined,
      category: category || undefined,
      participants: participants,
      date: resolvedDate,
    };

    setLoading(true);
    setError('');
    try {
      await onSubmit(data);
      if (isRecurring) {
        addRecurringItem({
          label: item || description.trim(),
          item: item || undefined,
          description: description.trim() || item,
          amount: parsedAmount,
          type,
          category: category || undefined,
          participants: participants.length ? participants : undefined,
          frequency,
        });
      }
      if (addAnother) {
        // Reset amount and description, keep item/type/date/participants
        setAmount('');
        setDescription('');
        setError('');
      } else {
        handleClose();
      }
    } catch (err: any) {
      const status = err?.response?.status;
      const errorMessage = err?.response?.data?.error || 'Failed to add transaction';

      if (status === 409) {
        // Duplicate detected - show confirmation dialog
        setPendingSubmit({ data, addAnother });
        setDuplicateDialogOpen(true);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDuplicate = async (force: boolean) => {
    if (!force || !pendingSubmit) {
      setDuplicateDialogOpen(false);
      setPendingSubmit(null);
      return;
    }

    setLoading(true);
    setError('');
    try {
      // In a real scenario, we'd have a force flag on the API
      // For now, we'll just proceed - the backend will allow it if sent again
      await onSubmit(pendingSubmit.data);
      if (isRecurring) {
        addRecurringItem({
          label: item || description.trim(),
          item: item || undefined,
          description: description.trim() || item,
          amount: parseFloat(amount),
          type,
          category: category || undefined,
          participants: participants.length ? participants : undefined,
          frequency,
        });
      }
      if (pendingSubmit.addAnother) {
        setAmount('');
        setDescription('');
        setError('');
      } else {
        handleClose();
      }
      setDuplicateDialogOpen(false);
      setPendingSubmit(null);
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
        <ItemPicker value={item} type={type} onSelect={handleItemSelect} recentItems={recentItems} />

        {/* Description — tag picker */}
        {(() => {
          const preset = item ? itemPresets[item] : '';
          const history = item ? (descriptionsByItem[item] || []) : [];
          const builtIn = item ? (ITEM_SUGGESTIONS[item] || []) : [];
          const suggestions = Array.from(new Set([...(preset ? [preset] : []), ...history, ...builtIn])).slice(0, 10);
          return <DescriptionPicker value={description} onChange={setDescription} suggestions={suggestions} />;
        })()}

        {/* Amount suggestion from history */}
        {(() => {
          if (amount) return null; // Don't suggest if amount already entered
          const key = (description.trim() || item || '').toLowerCase();
          const suggested = key ? amountsByDescription[key] : undefined;
          if (!suggested) return null;
          return (
            <Box sx={{ mt: 0.75, mb: 0.5 }}>
              <Chip
                label={`Last time: ${symbol}${convert(suggested).toLocaleString(undefined, { maximumFractionDigits: 0 })} — use this?`}
                size="small"
                onClick={() => setAmount(String(suggested))}
                sx={{ fontSize: '0.72rem', height: 26, bgcolor: 'rgba(129,140,248,0.1)', color: '#818cf8', border: '1px solid rgba(129,140,248,0.25)', cursor: 'pointer', '&:hover': { bgcolor: 'rgba(129,140,248,0.18)' } }}
              />
            </Box>
          );
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

        {/* Recurring toggle */}
        <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            icon={<RepeatIcon sx={{ fontSize: '14px !important' }} />}
            label="Repeat"
            size="small"
            clickable
            onClick={() => setIsRecurring((v) => !v)}
            sx={{
              fontSize: '0.75rem',
              height: 30,
              bgcolor: isRecurring ? 'rgba(129,140,248,0.18)' : 'rgba(148,163,184,0.08)',
              color: isRecurring ? '#818cf8' : 'text.secondary',
              border: '1px solid',
              borderColor: isRecurring ? 'rgba(129,140,248,0.4)' : 'rgba(148,163,184,0.12)',
              fontWeight: isRecurring ? 600 : 400,
            }}
          />
          {isRecurring && (['monthly', 'weekly', 'daily'] as RecurringFrequency[]).map((f) => (
            <Chip
              key={f}
              label={f.charAt(0).toUpperCase() + f.slice(1)}
              size="small"
              clickable
              onClick={() => setFrequency(f)}
              sx={{
                fontSize: '0.72rem',
                height: 28,
                bgcolor: frequency === f ? 'rgba(129,140,248,0.18)' : 'rgba(148,163,184,0.06)',
                color: frequency === f ? '#818cf8' : 'text.disabled',
                border: '1px solid',
                borderColor: frequency === f ? 'rgba(129,140,248,0.4)' : 'rgba(148,163,184,0.1)',
                fontWeight: frequency === f ? 700 : 400,
              }}
            />
          ))}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 1, pb: isMobile ? 'calc(16px + env(safe-area-inset-bottom))' : 2, gap: 1 }}>
        <Button onClick={handleClose} disabled={loading}>Cancel</Button>
        <Button variant="outlined" onClick={() => handleSubmit(true)} disabled={loading} sx={{ fontSize: '0.78rem', px: 1.5 }}>
          + Add
        </Button>
        <Button variant="contained" onClick={() => handleSubmit(false)} disabled={loading} size="large">
          {loading ? <><CircularProgress size={16} sx={{ mr: 1 }} />Saving…</> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>

    {/* Duplicate confirmation dialog */}
    <Dialog open={duplicateDialogOpen} onClose={() => handleConfirmDuplicate(false)}>
      <DialogTitle>Potential Duplicate Detected</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          A similar transaction was recently created. This might be a duplicate. Do you still want to create it?
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={() => handleConfirmDuplicate(false)}>Cancel</Button>
        <Button variant="contained" onClick={() => handleConfirmDuplicate(true)} disabled={loading}>
          {loading ? <><CircularProgress size={16} sx={{ mr: 1 }} />Creating…</> : 'Create Anyway'}
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
