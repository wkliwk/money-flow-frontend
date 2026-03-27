import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import RepeatIcon from '@mui/icons-material/Repeat';
import { useTheme } from '@mui/material/styles';
import dayjs from 'dayjs';
import { useRecurring, RecurringItem } from '../../hooks/useRecurring';
import { useFxRates } from '../../hooks/useFxRates';
import { ITEM_PRESETS } from '../expenses/ItemPicker';
import { TransactionType } from '../../types';

const emptyRecurring = (): Omit<RecurringItem, 'id'> => ({
  label: '',
  item: '',
  description: '',
  amount: 0,
  type: 'expense' as TransactionType,
  category: '',
  startDate: dayjs().format('YYYY-MM-DD'),
});

const RecurringPage: React.FC = () => {
  const theme = useTheme();
  const { items: recurring, addItem: addRecurring, deleteItem: deleteRecurring } = useRecurring();
  const { symbol, convert } = useFxRates();
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState(emptyRecurring());

  const expenses = recurring.filter((r) => r.type === 'expense');
  const incomes = recurring.filter((r) => r.type === 'income');
  const totalExpense = expenses.reduce((s, r) => s + r.amount, 0);
  const totalIncome = incomes.reduce((s, r) => s + r.amount, 0);

  const renderItem = (r: RecurringItem) => (
    <ListItem key={r.id} disableGutters sx={{ py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, flex: 1 }}>
              {r.label || r.description}
            </Typography>
            <Typography sx={{
              fontSize: '0.88rem',
              fontWeight: 700,
              color: r.type === 'expense' ? 'error.light' : 'success.light',
            }}>
              {r.type === 'expense' ? '-' : '+'}{symbol}{convert(r.amount).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </Typography>
          </Box>
        }
        secondary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
            {r.item && (
              <Chip label={r.item} size="small" sx={{ fontSize: '0.65rem', height: 18, bgcolor: 'action.hover' }} />
            )}
            {r.frequency && r.frequency !== 'monthly' && (
              <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.68rem' }}>
                {r.frequency}
              </Typography>
            )}
            {r.startDate && (
              <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.68rem' }}>
                from {dayjs(r.startDate).format('MMM D, YYYY')}
              </Typography>
            )}
          </Box>
        }
      />
      <IconButton size="small" onClick={() => deleteRecurring(r.id)} sx={{ color: 'error.light', '&:hover': { color: 'error.main' }, ml: 0.5 }}>
        <DeleteIcon sx={{ fontSize: 16 }} />
      </IconButton>
    </ListItem>
  );

  return (
    <Box sx={{ maxWidth: 500, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <RepeatIcon sx={{ color: 'primary.main', fontSize: 22 }} />
        <Typography variant="h6" fontWeight={700}>Monthly Recurring</Typography>
      </Box>

      {/* Summary cards */}
      {recurring.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5 }}>
          <Box sx={{ flex: 1, borderRadius: 2, border: '1px solid', borderColor: 'divider', p: 1.5, textAlign: 'center' }}>
            <Typography sx={{ fontSize: '0.68rem', color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.25 }}>
              Monthly Expenses
            </Typography>
            <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: 'error.light' }}>
              -{symbol}{convert(totalExpense).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </Typography>
          </Box>
          <Box sx={{ flex: 1, borderRadius: 2, border: '1px solid', borderColor: 'divider', p: 1.5, textAlign: 'center' }}>
            <Typography sx={{ fontSize: '0.68rem', color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.25 }}>
              Monthly Income
            </Typography>
            <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: 'success.light' }}>
              +{symbol}{convert(totalIncome).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Expense list */}
      {expenses.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.68rem', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', mb: 0.5, px: 0.5 }}>
            Expenses ({expenses.length})
          </Typography>
          <Box sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
            <List disablePadding sx={{ px: 2 }}>
              {expenses.map(renderItem)}
            </List>
          </Box>
        </Box>
      )}

      {/* Income list */}
      {incomes.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.68rem', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', mb: 0.5, px: 0.5 }}>
            Income ({incomes.length})
          </Typography>
          <Box sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
            <List disablePadding sx={{ px: 2 }}>
              {incomes.map(renderItem)}
            </List>
          </Box>
        </Box>
      )}

      {/* Empty state */}
      {recurring.length === 0 && !showForm && (
        <Box sx={{ textAlign: 'center', py: 6, color: 'text.disabled' }}>
          <RepeatIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
          <Typography sx={{ fontSize: '0.88rem', mb: 0.5 }}>No recurring transactions yet</Typography>
          <Typography sx={{ fontSize: '0.75rem' }}>Add subscriptions, rent, salary — anything that repeats monthly.</Typography>
        </Box>
      )}

      {/* Add form */}
      {!showForm ? (
        <Button
          fullWidth
          startIcon={<AddIcon />}
          onClick={() => setShowForm(true)}
          sx={{
            color: 'text.secondary',
            fontSize: '0.82rem',
            borderStyle: 'dashed',
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 2,
            py: 1.25,
          }}
        >
          Add recurring transaction
        </Button>
      ) : (
        <Box sx={{ bgcolor: 'action.hover', borderRadius: 2, p: 2, border: '1px solid', borderColor: 'divider' }}>
          <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, mb: 1.5 }}>New Recurring</Typography>

          {/* Type selector */}
          <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
            {(['expense', 'income'] as TransactionType[]).map((t) => (
              <Box
                key={t}
                onClick={() => setDraft((d) => ({ ...d, type: t, item: '' }))}
                sx={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0.5,
                  py: 0.75,
                  borderRadius: 1.5,
                  cursor: 'pointer',
                  border: '1.5px solid',
                  borderColor: draft.type === t
                    ? (t === 'expense'
                      ? (theme.palette.mode === 'dark' ? 'rgba(251,113,133,0.4)' : 'rgba(244,63,94,0.5)')
                      : (theme.palette.mode === 'dark' ? 'rgba(52,211,153,0.4)' : 'rgba(16,185,129,0.5)'))
                    : 'divider',
                  bgcolor: draft.type === t
                    ? (t === 'expense'
                      ? (theme.palette.mode === 'dark' ? 'rgba(251,113,133,0.12)' : 'rgba(244,63,94,0.08)')
                      : (theme.palette.mode === 'dark' ? 'rgba(52,211,153,0.12)' : 'rgba(16,185,129,0.08)'))
                    : 'transparent',
                }}
              >
                {t === 'expense'
                  ? <TrendingDownIcon sx={{ fontSize: 14, color: 'error.main' }} />
                  : <TrendingUpIcon sx={{ fontSize: 14, color: 'success.main' }} />}
                <Typography
                  variant="caption"
                  fontWeight={700}
                  sx={{
                    fontSize: '0.72rem',
                    color: draft.type === t
                      ? (t === 'expense' ? 'error.main' : 'success.main')
                      : 'text.secondary',
                  }}
                >
                  {t === 'expense' ? 'Expense' : 'Income'}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Item chips */}
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1.5 }}>
            {ITEM_PRESETS.filter((p) => p.type === draft.type).map((p) => (
              <Chip
                key={p.label}
                label={p.label}
                size="small"
                clickable
                onClick={() => setDraft((d) => ({ ...d, item: d.item === p.label ? '' : p.label, category: p.category }))}
                sx={{
                  fontSize: '0.68rem',
                  height: 22,
                  bgcolor: draft.item === p.label
                    ? (theme.palette.mode === 'dark' ? 'rgba(129,140,248,0.18)' : 'rgba(99,102,241,0.12)')
                    : 'action.hover',
                  color: draft.item === p.label ? 'primary.main' : 'text.disabled',
                  border: '1px solid',
                  borderColor: draft.item === p.label
                    ? (theme.palette.mode === 'dark' ? 'rgba(129,140,248,0.35)' : 'rgba(99,102,241,0.3)')
                    : 'divider',
                }}
              />
            ))}
          </Box>

          {/* Fields */}
          <TextField
            label="Label"
            placeholder='e.g. "Netflix"'
            size="small"
            fullWidth
            value={draft.label}
            onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
            sx={{ mb: 1 }}
          />
          <TextField
            label="Description"
            size="small"
            fullWidth
            value={draft.description}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
            sx={{ mb: 1 }}
          />
          <TextField
            label="Amount (HKD)"
            type="number"
            size="small"
            fullWidth
            value={draft.amount || ''}
            onChange={(e) => setDraft((d) => ({ ...d, amount: parseFloat(e.target.value) || 0 }))}
            sx={{ mb: 1 }}
            inputProps={{ min: 0 }}
          />
          <TextField
            label="Start Date"
            type="date"
            size="small"
            fullWidth
            value={draft.startDate || dayjs().format('YYYY-MM-DD')}
            onChange={(e) => setDraft((d) => ({ ...d, startDate: e.target.value }))}
            sx={{ mb: 1.5 }}
            InputLabelProps={{ shrink: true }}
          />

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              onClick={() => { setShowForm(false); setDraft(emptyRecurring()); }}
              sx={{ color: 'text.secondary' }}
            >
              Cancel
            </Button>
            <Button
              size="small"
              variant="contained"
              disabled={!draft.amount || (!draft.label && !draft.description)}
              onClick={() => {
                addRecurring({
                  ...draft,
                  label: draft.label || draft.description,
                  item: draft.item || undefined,
                  category: draft.category || undefined,
                });
                setShowForm(false);
                setDraft(emptyRecurring());
              }}
              sx={{ flex: 1 }}
            >
              Save
            </Button>
          </Box>
        </Box>
      )}

      {/* Footer info */}
      <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled', mt: 2, textAlign: 'center' }}>
        Recurring transactions are prompted at the start of each month.
      </Typography>
    </Box>
  );
};

export default RecurringPage;
