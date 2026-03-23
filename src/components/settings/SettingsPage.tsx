import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Divider,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { clearToken } from '../../services/auth';
import { CURRENCIES, CURRENCY_SYMBOLS, Currency } from '../../hooks/useFxRates';
import { useBudgets, BUDGET_CATEGORIES } from '../../hooks/useBudgets';
import { useRecurring, RecurringItem } from '../../hooks/useRecurring';
import { ITEM_PRESETS } from '../expenses/ItemPicker';
import { TransactionType } from '../../types';

interface Props {
  currency: string;
  onCurrencyChange: (c: Currency) => void;
  categorySpend?: Record<string, number>;
}

function getUserId(): string {
  try {
    const token = localStorage.getItem('mf_token');
    if (!token) return '';
    return JSON.parse(atob(token.split('.')[1])).userId || '';
  } catch { return ''; }
}

const emptyRecurring = (): Omit<RecurringItem, 'id'> => ({
  label: '',
  item: '',
  description: '',
  amount: 0,
  type: 'expense' as TransactionType,
  category: '',
});

const SettingsPage: React.FC<Props> = ({ currency, onCurrencyChange, categorySpend = {} }) => {
  const userId = getUserId();
  const { budgets, setBudget } = useBudgets();
  const { items: recurring, addItem: addRecurring, deleteItem: deleteRecurring } = useRecurring();
  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(BUDGET_CATEGORIES.map((c) => [c, budgets[c] ? String(budgets[c]) : '']))
  );
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [recurringDraft, setRecurringDraft] = useState(emptyRecurring());

  const handleBudgetBlur = (category: string) => {
    const val = parseFloat(drafts[category]);
    setBudget(category, isNaN(val) ? 0 : val);
  };

  const handleLogout = () => {
    clearToken();
    window.location.href = '/login';
  };

  return (
    <Box sx={{ maxWidth: 500, mx: 'auto' }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>Settings</Typography>

      {/* Display Currency */}
      <Box sx={{ borderRadius: 2, border: '1px solid rgba(148,163,184,0.1)', overflow: 'hidden', mb: 2 }}>
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', mb: 1 }}>
            Display Currency
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
            {CURRENCIES.map((c) => (
              <Chip
                key={c}
                label={`${CURRENCY_SYMBOLS[c]} ${c}`}
                size="small"
                clickable
                onClick={() => onCurrencyChange(c as Currency)}
                sx={{
                  fontSize: '0.72rem', height: 28,
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
        <Divider sx={{ borderColor: 'rgba(148,163,184,0.08)' }} />
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
            Account
          </Typography>
          <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', fontFamily: 'monospace' }}>{userId || '—'}</Typography>
        </Box>
      </Box>

      {/* Monthly Budgets */}
      <Box sx={{ borderRadius: 2, border: '1px solid rgba(148,163,184,0.1)', overflow: 'hidden', mb: 2 }}>
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
            Monthly Budgets (HKD)
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled', mb: 1.5 }}>
            Set limits per category — progress bars appear on the Home breakdown.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {BUDGET_CATEGORIES.map((cat) => {
              const spent = categorySpend[cat] || 0;
              const budget = budgets[cat];
              const over = budget && spent > budget;
              return (
              <Box key={cat} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>{cat}</Typography>
                  {spent > 0 && (
                    <Typography sx={{ fontSize: '0.65rem', color: over ? '#fb7185' : 'text.disabled', fontVariantNumeric: 'tabular-nums' }}>
                      HK${Math.round(spent).toLocaleString()} this month{over ? ' — over!' : ''}
                    </Typography>
                  )}
                </Box>
                <TextField
                  size="small"
                  type="number"
                  placeholder="No limit"
                  value={drafts[cat]}
                  onChange={(e) => setDrafts((d) => ({ ...d, [cat]: e.target.value }))}
                  onBlur={() => handleBudgetBlur(cat)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Typography sx={{ fontSize: '0.78rem', color: 'text.disabled' }}>HK$</Typography></InputAdornment> }}
                  sx={{ width: 140, '& .MuiInputBase-input': { fontSize: '0.82rem', py: 0.75 } }}
                  inputProps={{ min: 0 }}
                />
              </Box>
              );
            })}
          </Box>
        </Box>
      </Box>

      {/* Recurring transactions */}
      <Box sx={{ borderRadius: 2, border: '1px solid rgba(148,163,184,0.1)', overflow: 'hidden', mb: 2 }}>
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
            Monthly Recurring
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled', mb: 1 }}>
            Auto-prompted at the start of each month.
          </Typography>

          {recurring.length > 0 && (
            <List disablePadding sx={{ mb: 1 }}>
              {recurring.map((r) => (
                <ListItem key={r.id} disableGutters sx={{ py: 0.75 }}>
                  <ListItemText
                    primary={<Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{r.label || r.description}</Typography>}
                    secondary={<Typography variant="caption" color="text.disabled">HK${r.amount} · {r.type}{r.item ? ` · ${r.item}` : ''}</Typography>}
                  />
                  <IconButton size="small" onClick={() => deleteRecurring(r.id)} sx={{ color: 'rgba(251,113,133,0.4)', '&:hover': { color: '#fb7185' } }}>
                    <DeleteIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </ListItem>
              ))}
            </List>
          )}

          {!showRecurringForm ? (
            <Button size="small" startIcon={<AddIcon />} onClick={() => setShowRecurringForm(true)} sx={{ color: 'text.secondary', fontSize: '0.78rem', borderStyle: 'dashed', border: '1px dashed rgba(148,163,184,0.2)', borderRadius: 1.5, px: 1.5, py: 0.5 }}>
              Add recurring
            </Button>
          ) : (
            <Box sx={{ bgcolor: 'rgba(148,163,184,0.04)', borderRadius: 2, p: 1.5, border: '1px solid rgba(148,163,184,0.1)', mt: 1 }}>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                {(['expense', 'income'] as TransactionType[]).map((t) => (
                  <Box key={t} onClick={() => setRecurringDraft((d) => ({ ...d, type: t, item: '' }))}
                    sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, py: 0.75, borderRadius: 1.5, cursor: 'pointer', border: '1.5px solid', borderColor: recurringDraft.type === t ? (t === 'expense' ? 'rgba(251,113,133,0.4)' : 'rgba(52,211,153,0.4)') : 'rgba(148,163,184,0.1)', bgcolor: recurringDraft.type === t ? (t === 'expense' ? 'rgba(251,113,133,0.12)' : 'rgba(52,211,153,0.12)') : 'transparent' }}>
                    {t === 'expense' ? <TrendingDownIcon sx={{ fontSize: 14, color: '#fb7185' }} /> : <TrendingUpIcon sx={{ fontSize: 14, color: '#34d399' }} />}
                    <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.72rem', color: recurringDraft.type === t ? (t === 'expense' ? '#fb7185' : '#34d399') : 'text.secondary' }}>{t === 'expense' ? 'Expense' : 'Income'}</Typography>
                  </Box>
                ))}
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                {ITEM_PRESETS.filter((p) => p.type === recurringDraft.type).map((p) => (
                  <Chip key={p.label} label={p.label} size="small" clickable onClick={() => setRecurringDraft((d) => ({ ...d, item: d.item === p.label ? '' : p.label, category: p.category }))}
                    sx={{ fontSize: '0.68rem', height: 22, bgcolor: recurringDraft.item === p.label ? 'rgba(129,140,248,0.18)' : 'rgba(148,163,184,0.06)', color: recurringDraft.item === p.label ? '#818cf8' : 'text.disabled', border: '1px solid', borderColor: recurringDraft.item === p.label ? 'rgba(129,140,248,0.35)' : 'rgba(148,163,184,0.1)' }}
                  />
                ))}
              </Box>
              <TextField label="Label" placeholder='e.g. "Netflix"' size="small" fullWidth value={recurringDraft.label} onChange={(e) => setRecurringDraft((d) => ({ ...d, label: e.target.value }))} sx={{ mb: 1 }} />
              <TextField label="Description" size="small" fullWidth value={recurringDraft.description} onChange={(e) => setRecurringDraft((d) => ({ ...d, description: e.target.value }))} sx={{ mb: 1 }} />
              <TextField label="Amount (HKD)" type="number" size="small" fullWidth value={recurringDraft.amount || ''} onChange={(e) => setRecurringDraft((d) => ({ ...d, amount: parseFloat(e.target.value) || 0 }))} sx={{ mb: 1.5 }} inputProps={{ min: 0 }} />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" onClick={() => { setShowRecurringForm(false); setRecurringDraft(emptyRecurring()); }} sx={{ color: 'text.secondary' }}>Cancel</Button>
                <Button size="small" variant="contained" disabled={!recurringDraft.amount || (!recurringDraft.label && !recurringDraft.description)}
                  onClick={() => {
                    addRecurring({ ...recurringDraft, label: recurringDraft.label || recurringDraft.description, item: recurringDraft.item || undefined, category: recurringDraft.category || undefined });
                    setShowRecurringForm(false);
                    setRecurringDraft(emptyRecurring());
                  }}
                  sx={{ flex: 1 }}
                >
                  Save
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      <Button
        variant="outlined"
        color="error"
        startIcon={<LogoutIcon />}
        onClick={handleLogout}
        fullWidth
        sx={{ borderColor: 'rgba(251,113,133,0.3)', color: '#fb7185', '&:hover': { borderColor: '#fb7185', bgcolor: 'rgba(251,113,133,0.08)' } }}
      >
        Sign Out
      </Button>
    </Box>
  );
};

export default SettingsPage;
