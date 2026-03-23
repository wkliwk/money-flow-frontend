import React from 'react';
import {
  Box,
  Typography,
  Button,
  Divider,
  Chip,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { clearToken } from '../../services/auth';
import { CURRENCIES, CURRENCY_SYMBOLS, Currency } from '../../hooks/useFxRates';

interface Props {
  currency: string;
  onCurrencyChange: (c: Currency) => void;
}

function getUserId(): string {
  try {
    const token = localStorage.getItem('mf_token');
    if (!token) return '';
    return JSON.parse(atob(token.split('.')[1])).userId || '';
  } catch {
    return '';
  }
}

const SettingsPage: React.FC<Props> = ({ currency, onCurrencyChange }) => {
  const userId = getUserId();

  const handleLogout = () => {
    clearToken();
    window.location.href = '/login';
  };

  return (
    <Box sx={{ maxWidth: 500, mx: 'auto' }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
        Settings
      </Typography>

      <Box sx={{ borderRadius: 2, border: '1px solid rgba(148,163,184,0.1)', overflow: 'hidden', mb: 2 }}>
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontSize: '0.72rem', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', mb: 1 }}
          >
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
        <Divider sx={{ borderColor: 'rgba(148,163,184,0.08)' }} />
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontSize: '0.72rem', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', mb: 0.5 }}
          >
            Account
          </Typography>
          <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', fontFamily: 'monospace' }}>
            {userId || '—'}
          </Typography>
        </Box>
      </Box>

      <Button
        variant="outlined"
        color="error"
        startIcon={<LogoutIcon />}
        onClick={handleLogout}
        fullWidth
        sx={{
          borderColor: 'rgba(251,113,133,0.3)',
          color: '#fb7185',
          '&:hover': { borderColor: '#fb7185', bgcolor: 'rgba(251,113,133,0.08)' },
        }}
      >
        Sign Out
      </Button>
    </Box>
  );
};

export default SettingsPage;
