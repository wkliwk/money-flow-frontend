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
  ToggleButtonGroup,
  ToggleButton,
  SvgIcon,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import DeleteIcon from '@mui/icons-material/Delete';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { useTheme } from '@mui/material/styles';
import { clearToken } from '../../services/auth';
import { useFxRates, CURRENCIES, CURRENCY_SYMBOLS, Currency } from '../../hooks/useFxRates';
import { useCurrencyPreferences } from '../../hooks/useCurrencyPreferences';
import { useBudgets, BUDGET_CATEGORIES } from '../../hooks/useBudgets';
import FriendsSection from './FriendsSection';
import { useItemPresets } from '../../hooks/useItemPresets';
import { ITEM_PRESETS } from '../expenses/ItemPicker';
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
  const { presets, setPreset, deletePreset } = useItemPresets();
  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(BUDGET_CATEGORIES.map((c) => [c, budgets[c] ? String(budgets[c]) : '']))
  );
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [itemDraft, setItemDraft] = useState('');

  const handleBudgetBlur = (category: string) => {
    const val = parseFloat(drafts[category]);
    setBudget(category, isNaN(val) ? 0 : val);
  };

  const startEditItem = (label: string) => {
    setEditingItem(label);
    setItemDraft(presets[label] || '');
  };

  const saveItem = () => {
    if (editingItem) {
      if (itemDraft.trim()) setPreset(editingItem, itemDraft.trim());
      else deletePreset(editingItem);
      setEditingItem(null);
    }
  };

  const handleLogout = () => {
    clearToken();
    window.location.href = '/login';
  };

  const renderItemSection = (label: string, items: typeof ITEM_PRESETS) => (
    <Box sx={{ mb: 2 }}>
      <Typography
        variant="caption"
        sx={{
          color: 'text.disabled',
          fontSize: '0.65rem',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          display: 'block',
          mb: 1,
          px: 1,
        }}
      >
        {label}
      </Typography>
      <Box sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        {items.map((item, idx) => (
          <Box key={item.label + item.type}>
            {idx > 0 && <Divider />}
            <Box sx={{ px: 2, py: 1.25 }}>
              {editingItem === item.label ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SvgIcon component={() => React.cloneElement(item.icon, { sx: { fontSize: 20, color: item.color } })} />
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, minWidth: 60 }}>{item.label}</Typography>
                  <TextField
                    size="small"
                    autoFocus
                    value={itemDraft}
                    onChange={(e) => setItemDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveItem();
                      if (e.key === 'Escape') setEditingItem(null);
                    }}
                    placeholder={`Default description for ${item.label}`}
                    sx={{ flex: 1, '& .MuiInputBase-input': { fontSize: '0.82rem', py: 0.75 } }}
                  />
                  <IconButton size="small" onClick={saveItem} sx={{ color: theme.palette.success.light }}>
                    <CheckIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                  <IconButton size="small" onClick={() => setEditingItem(null)} sx={{ color: 'text.disabled' }}>
                    <CloseIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <SvgIcon component={() => React.cloneElement(item.icon, { sx: { fontSize: 20, color: item.color } })} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{item.label}</Typography>
                    <Typography sx={{ fontSize: '0.72rem', color: presets[item.label] ? 'text.secondary' : 'text.disabled' }}>
                      {presets[item.label] || 'No default set'}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => startEditItem(item.label)}
                    sx={{ color: 'text.disabled', '&:hover': { color: theme.palette.primary.main } }}
                  >
                    <EditIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                  {presets[item.label] && (
                    <IconButton
                      size="small"
                      onClick={() => deletePreset(item.label)}
                      sx={{ color: theme.palette.mode === 'dark' ? 'rgba(251,113,133,0.4)' : 'rgba(244,63,94,0.5)', '&:hover': { color: theme.palette.error.light } }}
                    >
                      <DeleteIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  )}
                </Box>
              )}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );

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

      {/* Friends */}
      <Box sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden', mb: 2 }}>
        <Box sx={{ px: 2, py: 1.5 }}>
          <FriendsSection />
        </Box>
      </Box>

      {/* Item Presets */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', mb: 1 }}>
          Item Presets
        </Typography>
        <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled', mb: 1.5 }}>
          Set a default description for each item type — auto-filled when you pick that item in the add form.
        </Typography>
        {renderItemSection('Expense Items', ITEM_PRESETS.filter((p) => p.type === 'expense'))}
        {renderItemSection('Income Items', ITEM_PRESETS.filter((p) => p.type === 'income'))}
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
