import React from 'react';
import { Box, Typography, ButtonBase } from '@mui/material';
import BackspaceOutlinedIcon from '@mui/icons-material/BackspaceOutlined';

interface Props {
  value: string;
  onChange: (v: string) => void;
  symbol?: string;
}

const KEYS = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
  ['.', '0', '⌫'],
];

const NumPad: React.FC<Props> = ({ value, onChange, symbol = 'HK$' }) => {
  const handleKey = (key: string) => {
    if (key === '⌫') {
      onChange(value.length <= 1 ? '' : value.slice(0, -1));
      return;
    }
    // Prevent multiple decimal points
    if (key === '.' && value.includes('.')) return;
    // Prevent leading zeros (except "0.")
    if (key !== '.' && value === '0') { onChange(key); return; }
    // Limit to 2 decimal places
    const dotIdx = value.indexOf('.');
    if (dotIdx !== -1 && value.length - dotIdx > 2) return;
    // Max 10 digits before decimal
    if (!value.includes('.') && value.length >= 10) return;
    onChange(value + key);
  };

  const display = value === '' ? '0' : value;

  return (
    <Box>
      {/* Amount display */}
      <Box
        sx={{
          textAlign: 'center',
          py: 2,
          mb: 1,
          borderRadius: 2,
          bgcolor: 'rgba(148,163,184,0.05)',
          border: '1px solid rgba(148,163,184,0.1)',
        }}
      >
        <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Amount
        </Typography>
        <Typography
          variant="h3"
          fontWeight={700}
          sx={{
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            color: value ? 'text.primary' : 'text.disabled',
            mt: 0.25,
          }}
        >
          <span style={{ fontSize: '1.1rem', fontWeight: 500, color: 'inherit', opacity: 0.6 }}>{symbol}</span>
          {display}
        </Typography>
      </Box>

      {/* Keypad grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
        {KEYS.flat().map((key) => (
          <ButtonBase
            key={key}
            onClick={() => handleKey(key)}
            sx={{
              borderRadius: 2,
              py: 1.75,
              bgcolor: key === '⌫' ? 'rgba(251,113,133,0.08)' : 'rgba(148,163,184,0.06)',
              border: '1px solid',
              borderColor: key === '⌫' ? 'rgba(251,113,133,0.15)' : 'rgba(148,163,184,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.1s ease',
              '&:active': {
                bgcolor: key === '⌫' ? 'rgba(251,113,133,0.18)' : 'rgba(129,140,248,0.15)',
                transform: 'scale(0.96)',
              },
            }}
          >
            {key === '⌫' ? (
              <BackspaceOutlinedIcon sx={{ fontSize: 20, color: '#fb7185' }} />
            ) : (
              <Typography fontWeight={600} sx={{ fontSize: '1.2rem', color: 'text.primary', lineHeight: 1 }}>
                {key}
              </Typography>
            )}
          </ButtonBase>
        ))}
      </Box>
    </Box>
  );
};

export default NumPad;
