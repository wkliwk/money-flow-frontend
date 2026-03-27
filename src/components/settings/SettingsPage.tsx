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
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';
import { useTheme } from '@mui/material/styles';
import { clearToken } from '../../services/auth';
import { useFxRates, CURRENCIES, CURRENCY_SYMBOLS, Currency } from '../../hooks/useFxRates';
import { useCurrencyPreferences } from '../../hooks/useCurrencyPreferences';
import { useBudgets, BUDGET_CATEGORIES } from '../../hooks/useBudgets';
import { useRecurring, RecurringItem } from '../../hooks/useRecurring';
import { ITEM_PRESETS } from '../expenses/ItemPicker';
import { useItemPresets } from '../../hooks/useItemPresets';
import { TransactionType } from '../../types';
import ManageItemsPage from '../items/ManageItemsPage';
import { useThemePreference } from '../../ThemeContext';
import { ThemePreference } from '../../theme';

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

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: React.ReactNode }[] = [
  { value: 'light', label: 'Light', icon: <LightModeIcon sx={{ fontSize: 16 }} /> },
  { value: 'system', label: 'System', icon: <SettingsBrightnessIcon sx={{ fontSize: 16 }} /> },
  { value: 'dark', label: 'Dark', icon: <DarkModeIcon sx={{ fontSize: 16 }} /> },
];

const ThemeToggle: React.FC = () => {
  const { preference, setPreference } = useThemePreference();
  return (
    <Box sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden', mb: 2 }}>
      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', mb: 1 }}>
          Appearance
        </Typography>
        <ToggleButtonGroup
          value={preference}
          exclusive
          onChange={(_, val: ThemePreference | null) => { if (val) setPreference(val); }}
          fullWidth
          aria-label="Theme preference"
        >
          {THEME_OPTIONS.map((opt) => (
            <ToggleButton key={opt.value} value={opt.value} aria-label={opt.label} sx={{ gap: 0.5 }}>
              {opt.icon}
              {opt.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>
    </Box>
  );
};

const SettingsPage: React.FC<Props> = ({ currency, onCurrencyChange, categorySpend = {} }) => {
  const theme = useTheme();
  const userId = getUserId();
  const { symbol, convert } = useFxRates();
  const { enabledCurrencies, toggleCurrency, isEnabled } = useCurrencyPreferences();
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

      {/* Theme */}
      <ThemeToggle />

      {/* Display Currency */}
      <Box sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden', mb: 2 }}>
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
                  bgcolor: currency === c ? (theme.palette.mode === 'dark' ? 'rgba(129,140,248,0.18)' : 'rgba(99,102,241,0.12)') : 'action.hover',
                  color: currency === c ? 'primary.main' : 'text.secondary',
                  border: '1px solid',
                  borderColor: currency === c ? (theme.palette.mode === 'dark' ? 'rgba(129,140,248,0.4)' : 'rgba(99,102,241,0.3)') : 'divider',
                  fontWeight: currency === c ? 700 : 400,
                }}
              />
            ))}
          </Box>
        </Box>
        <Divider />
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
            Account
          </Typography>
          <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', fontFamily: 'monospace' }}>{userId || '\u2014'}</Typography>
        </Box>
      </Box>

      {/* My Currencies */}
      <Box sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden', mb: 2 }}>
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
            My Currencies
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled', mb: 1.5 }}>
            Choose which currencies appear in the currency picker.
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
            {CURRENCIES.map((c) => {
              const enabled = isEnabled(c);
              const isLastEnabled = enabled && enabledCurrencies.length === 1;
              return (
                <Chip
                  key={c}
                  label={`${CURRENCY_SYMBOLS[c]} ${c}`}
                  size="small"
                  clickable={!isLastEnabled}
                  onClick={() => { if (!isLastEnabled) toggleCurrency(c); }}
                  aria-pressed={enabled}
                  aria-disabled={isLastEnabled}
                  sx={{
                    fontSize: '0.72rem', height: 28,
                    bgcolor: enabled ? (theme.palette.mode === 'dark' ? 'rgba(129,140,248,0.18)' : 'rgba(99,102,241,0.12)') : 'action.hover',
                    color: enabled ? 'primary.main' : 'text.secondary',
                    border: '1px solid',
                    borderColor: enabled ? (theme.palette.mode === 'dark' ? 'rgba(129,140,248,0.4)' : 'rgba(99,102,241,0.3)') : 'divider',
                    fontWeight: enabled ? 700 : 400,
                    opacity: isLastEnabled ? 0.5 : 1,
                    cursor: isLastEnabled ? 'default' : 'pointer',
                  }}
                />
              );
            })}
          </Box>
          {enabledCurrencies.length === 1 && (
            <Typography sx={{ fontSize: '0.68rem', color: 'warning.main', mt: 1 }}>
              At least one currency must remain enabled.
            </Typography>
          )}
        </Box>
      </Box>

      {/* Monthly Budgets */}
      <Box sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden', mb: 2 }}>
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
            Monthly Budgets
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
                    <Typography sx={{ fontSize: '0.65rem', color: over ? 'error.main' : 'text.disabled', fontVariantNumeric: 'tabular-nums' }}>
                      {symbol}{Math.round(convert(spent)).toLocaleString()} this month{over ? ' \u2014 over!' : ''}
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
      <Box sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden', mb: 2 }}>
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
                    secondary={<Typography variant="caption" color="text.disabled">{symbol}{convert(r.amount)} · {r.type}{r.item ? ` · ${r.item}` : ''}</Typography>}
                  />
                  <IconButton size="small" onClick={() => deleteRecurring(r.id)} sx={{ color: 'error.light', '&:hover': { color: 'error.main' } }}>
                    <DeleteIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </ListItem>
              ))}
            </List>
          )}

          {!showRecurringForm ? (
            <Button size="small" startIcon={<AddIcon />} onClick={() => setShowRecurringForm(true)} sx={{ color: 'text.secondary', fontSize: '0.78rem', borderStyle: 'dashed', border: '1px dashed', borderColor: 'divider', borderRadius: 1.5, px: 1.5, py: 0.5 }}>
              Add recurring
            </Button>
          ) : (
            <Box sx={{ bgcolor: 'action.hover', borderRadius: 2, p: 1.5, border: '1px solid', borderColor: 'divider', mt: 1 }}>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                {(['expense', 'income'] as TransactionType[]).map((t) => (
                  <Box key={t} onClick={() => setRecurringDraft((d) => ({ ...d, type: t, item: '' }))}
                    sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, py: 0.75, borderRadius: 1.5, cursor: 'pointer', border: '1.5px solid', borderColor: recurringDraft.type === t ? (t === 'expense' ? (theme.palette.mode === 'dark' ? 'rgba(251,113,133,0.4)' : 'rgba(244,63,94,0.5)') : (theme.palette.mode === 'dark' ? 'rgba(52,211,153,0.4)' : 'rgba(16,185,129,0.5)')) : 'divider', bgcolor: recurringDraft.type === t ? (t === 'expense' ? (theme.palette.mode === 'dark' ? 'rgba(251,113,133,0.12)' : 'rgba(244,63,94,0.08)') : (theme.palette.mode === 'dark' ? 'rgba(52,211,153,0.12)' : 'rgba(16,185,129,0.08)')) : 'transparent' }}>
                    {t === 'expense' ? <TrendingDownIcon sx={{ fontSize: 14, color: 'error.main' }} /> : <TrendingUpIcon sx={{ fontSize: 14, color: 'success.main' }} />}
                    <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.72rem', color: recurringDraft.type === t ? (t === 'expense' ? 'error.main' : 'success.main') : 'text.secondary' }}>{t === 'expense' ? 'Expense' : 'Income'}</Typography>
                  </Box>
                ))}
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                {ITEM_PRESETS.filter((p) => p.type === recurringDraft.type).map((p) => (
                  <Chip key={p.label} label={p.label} size="small" clickable onClick={() => setRecurringDraft((d) => ({ ...d, item: d.item === p.label ? '' : p.label, category: p.category }))}
                    sx={{ fontSize: '0.68rem', height: 22, bgcolor: recurringDraft.item === p.label ? (theme.palette.mode === 'dark' ? 'rgba(129,140,248,0.18)' : 'rgba(99,102,241,0.12)') : 'action.hover', color: recurringDraft.item === p.label ? 'primary.main' : 'text.disabled', border: '1px solid', borderColor: recurringDraft.item === p.label ? (theme.palette.mode === 'dark' ? 'rgba(129,140,248,0.35)' : 'rgba(99,102,241,0.3)') : 'divider' }}
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

      {/* Item Presets */}
      <Box sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden', mb: 2 }}>
        <Box sx={{ px: 2, py: 1.5 }}>
          <ManageItemsPage />
        </Box>
      </Box>

      <Button
        variant="outlined"
        color="error"
        startIcon={<LogoutIcon />}
        onClick={handleLogout}
        fullWidth
      >
        Sign Out
      </Button>
    </Box>
  );
};

export default SettingsPage;
