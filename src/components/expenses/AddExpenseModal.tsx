import React, { useEffect, useState } from 'react';
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
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import TodayIcon from '@mui/icons-material/Today';
import HistoryIcon from '@mui/icons-material/History';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import RepeatIcon from '@mui/icons-material/Repeat';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { TransactionRequest, TransactionType, PaymentMethod } from '../../types';
import { ReceiptConfidence } from '../../services/api';
import NumPad from './NumPad';
import ItemPicker, { ItemPreset, ITEM_SUGGESTIONS } from './ItemPicker';
import DescriptionPicker from './DescriptionPicker';
import TemplateChips from './TemplateChips';
import ManageTemplatesDrawer from './ManageTemplatesDrawer';
import ParticipantPicker from './ParticipantPicker';
import PaymentMethodPicker from './PaymentMethodPicker';
import { useTemplates, TransactionTemplate } from '../../hooks/useTemplates';
import { useFxRates, CURRENCY_SYMBOLS, Currency } from '../../hooks/useFxRates';
import { useItemPresets } from '../../hooks/useItemPresets';
import { useRecurring } from '../../hooks/useRecurring';

type RecurringFrequency = 'monthly' | 'weekly' | 'daily';

export interface ReceiptPrefill {
  amount?: number;
  description?: string;
  category?: string;
  date?: string;
  confidence?: ReceiptConfidence;
  imagePreviewUrl?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<TransactionRequest, 'owner'>) => Promise<void>;
  existingCategories: string[];
  descriptionsByItem?: Record<string, string[]>;
  knownParticipants?: string[];
  recentItems?: string[];
  amountsByDescription?: Record<string, number>;
  categoriesByDescription?: Record<string, string>;
  receiptPrefill?: ReceiptPrefill;
}

const today = () => new Date().toISOString().split('T')[0];
const yesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
};

type QuickDate = 'today' | 'yesterday' | 'custom';

const AddExpenseModal: React.FC<Props> = ({ open, onClose, onSubmit, descriptionsByItem = {}, knownParticipants = [], recentItems = [], amountsByDescription = {}, categoriesByDescription = {}, receiptPrefill }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { templates, addTemplate, deleteTemplate } = useTemplates();
  const { symbol: displaySymbol, convert, rateForCurrency } = useFxRates();
  const { presets: itemPresets } = useItemPresets();
  const { addItem: addRecurringItem } = useRecurring();
  const [txCurrency, setTxCurrency] = useState<Currency>('HKD');
  const fxRate = txCurrency !== 'HKD' ? rateForCurrency(txCurrency) : undefined;
  const [manageOpen, setManageOpen] = useState(false);
  const [item, setItem] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [quickDate, setQuickDate] = useState<QuickDate>('today');
  const [customDate, setCustomDate] = useState(today());
  const [participants, setParticipants] = useState<string[]>([]);
  const [splitBillMode, setSplitBillMode] = useState<'treat' | 'split'>('treat');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState<{ data: Omit<TransactionRequest, 'owner'>; addAnother: boolean } | null>(null);

  // Apply receipt OCR prefill when the modal opens with data
  useEffect(() => {
    if (!open || !receiptPrefill) return;
    if (receiptPrefill.amount !== undefined) setAmount(String(receiptPrefill.amount));
    if (receiptPrefill.description) setDescription(receiptPrefill.description);
    if (receiptPrefill.category) setCategory(receiptPrefill.category);
    if (receiptPrefill.date) {
      setQuickDate('custom');
      setCustomDate(receiptPrefill.date);
    }
  }, [open, receiptPrefill]);

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
    setSplitBillMode('treat');
    setPaymentMethod(null);
    setTxCurrency('HKD');
    setIsRecurring(false);
    setFrequency('monthly');
    setNotes('');
    setError('');
    onClose();
  };

  const handleSubmit = async (addAnother = false) => {
    if (!item && !description.trim()) { setError('Please select an item or enter a description'); return; }
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) { setError('Please enter a valid amount'); return; }

    // amount state is always HKD (NumPad converts FX to HKD)
    const isForeign = txCurrency !== 'HKD' && fxRate;
    const foreignAmount = isForeign ? Math.round(parsedAmount / fxRate * 100) / 100 : undefined;

    const data: Omit<TransactionRequest, 'owner'> = {
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
      ...(isForeign ? {
        currency: txCurrency,
        originalAmount: foreignAmount,
        exchangeRate: fxRate,
      } : {}),
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
        setNotes('');
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

        {/* Receipt preview + confidence warning */}
        {receiptPrefill && (
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5, mt: 0.5 }}>
            {receiptPrefill.imagePreviewUrl && (
              <Box
                component="img"
                src={receiptPrefill.imagePreviewUrl}
                alt="Receipt preview"
                sx={{
                  width: 56,
                  height: 56,
                  objectFit: 'cover',
                  borderRadius: 1.5,
                  border: '1px solid rgba(148,163,184,0.15)',
                  flexShrink: 0,
                }}
              />
            )}
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" sx={{ color: 'rgba(129,140,248,0.9)', fontWeight: 600, fontSize: '0.72rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Scanned from receipt
              </Typography>
              {receiptPrefill.confidence === 'low' && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                  <WarningAmberIcon sx={{ fontSize: 13, color: 'warning.main' }} />
                  <Typography variant="caption" sx={{ color: 'warning.main', fontSize: '0.7rem' }}>
                    Some fields may need correction
                  </Typography>
                </Box>
              )}
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', display: 'block', mt: 0.25 }}>
                Review and edit before saving
              </Typography>
            </Box>
          </Box>
        )}

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
          return <DescriptionPicker value={description} onChange={setDescription} suggestions={suggestions} categoriesByDescription={categoriesByDescription} onCategorySelect={setCategory} />;
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
                label={`Last time: ${displaySymbol}${convert(suggested).toLocaleString(undefined, { maximumFractionDigits: 0 })} — use this?`}
                size="small"
                onClick={() => setAmount(String(suggested))}
                sx={{ fontSize: '0.72rem', height: 26, bgcolor: 'rgba(129,140,248,0.1)', color: '#818cf8', border: '1px solid rgba(129,140,248,0.25)', cursor: 'pointer', '&:hover': { bgcolor: 'rgba(129,140,248,0.18)' } }}
              />
            </Box>
          );
        })()}

        {/* Amount — calculator keypad with FX support */}
        <NumPad
          value={amount}
          onChange={setAmount}
          fxSymbol={txCurrency !== 'HKD' ? CURRENCY_SYMBOLS[txCurrency] : undefined}
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
