import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Divider,
  Chip,
  TextField,
  InputAdornment,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { clearToken } from '../../services/auth';
import { CURRENCIES, CURRENCY_SYMBOLS, Currency } from '../../hooks/useFxRates';
import { useBudgets, BUDGET_CATEGORIES } from '../../hooks/useBudgets';

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

const SettingsPage: React.FC<Props> = ({ currency, onCurrencyChange, categorySpend = {} }) => {
  const userId = getUserId();
  const { budgets, setBudget } = useBudgets();
  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(BUDGET_CATEGORIES.map((c) => [c, budgets[c] ? String(budgets[c]) : '']))
  );

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
