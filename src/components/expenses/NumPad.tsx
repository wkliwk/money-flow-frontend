import React from 'react';
import { Box, Typography, ButtonBase } from '@mui/material';
import BackspaceOutlinedIcon from '@mui/icons-material/BackspaceOutlined';

interface Props {
  value: string;
  onChange: (v: string) => void;
  symbol?: string;
  convertedSymbol?: string;
  convertedValue?: string;
}

// 3 number rows + bottom row with C . 0 ⌫
const NUMBER_ROWS = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
];
const BOTTOM_ROW = ['C', '.', '0', '⌫'];

const NumPad: React.FC<Props> = ({ value, onChange, symbol = 'HK$', convertedSymbol, convertedValue }) => {
  const handleKey = (key: string) => {
    if (key === '⌫') {
      onChange(value.length <= 1 ? '' : value.slice(0, -1));
      return;
    }
    if (key === 'C') {
      onChange('');
      return;
    }
    if (key === '.' && value.includes('.')) return;
    if (key !== '.' && value === '0') { onChange(key); return; }
    const dotIdx = value.indexOf('.');
    if (dotIdx !== -1 && value.length - dotIdx > 2) return;
    if (!value.includes('.') && value.length >= 10) return;
    onChange(value + key);
  };

  const display = value === '' ? '0' : value;
  const showConversion = convertedSymbol && convertedValue && symbol !== convertedSymbol && value !== '';

  const keyStyle = (key: string) => {
    if (key === '⌫') return { bgcolor: 'rgba(251,113,133,0.08)', borderColor: 'rgba(251,113,133,0.15)', activeColor: 'rgba(251,113,133,0.2)' };
    if (key === 'C') return { bgcolor: 'rgba(251,113,133,0.06)', borderColor: 'rgba(251,113,133,0.12)', activeColor: 'rgba(251,113,133,0.18)' };
    return { bgcolor: 'rgba(148,163,184,0.06)', borderColor: 'rgba(148,163,184,0.1)', activeColor: 'rgba(129,140,248,0.15)' };
  };

  return (
    <Box>
      {/* Amount display */}
      <Box sx={{ textAlign: 'center', py: 1.75, mb: 1, borderRadius: 2, bgcolor: 'rgba(148,163,184,0.05)', border: '1px solid rgba(148,163,184,0.1)' }}>
        <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Amount
        </Typography>
        <Typography variant="h3" fontWeight={700} sx={{ letterSpacing: '-0.03em', lineHeight: 1.1, color: value ? 'text.primary' : 'text.disabled', mt: 0.25 }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 500, opacity: 0.6 }}>{symbol}</span>
          {display}
        </Typography>
        {showConversion && (
          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem', mt: 0.25, display: 'block' }}>
            ≈ {convertedSymbol}{convertedValue}
          </Typography>
        )}
      </Box>

      {/* Number rows */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, mb: 1 }}>
        {NUMBER_ROWS.flat().map((key) => {
          const s = keyStyle(key);
          return (
            <ButtonBase
              key={key}
              onClick={() => handleKey(key)}
              sx={{ borderRadius: 2, py: 1.75, bgcolor: s.bgcolor, border: '1px solid', borderColor: s.borderColor, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.1s ease', '&:active': { bgcolor: s.activeColor, transform: 'scale(0.96)' } }}
            >
              <Typography fontWeight={600} sx={{ fontSize: '1.2rem', color: 'text.primary', lineHeight: 1 }}>{key}</Typography>
            </ButtonBase>
          );
        })}
      </Box>

      {/* Bottom row: C . 0 ⌫ */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1 }}>
        {BOTTOM_ROW.map((key) => {
          const s = keyStyle(key);
          return (
            <ButtonBase
              key={key}
              onClick={() => handleKey(key)}
              sx={{ borderRadius: 2, py: 1.75, bgcolor: s.bgcolor, border: '1px solid', borderColor: s.borderColor, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.1s ease', '&:active': { bgcolor: s.activeColor, transform: 'scale(0.96)' } }}
            >
              {key === '⌫' ? (
                <BackspaceOutlinedIcon sx={{ fontSize: 20, color: '#fb7185' }} />
              ) : (
                <Typography fontWeight={key === 'C' ? 700 : 600} sx={{ fontSize: key === 'C' ? '0.95rem' : '1.2rem', color: key === 'C' ? '#fb7185' : 'text.primary', lineHeight: 1 }}>{key}</Typography>
              )}
            </ButtonBase>
          );
        })}
      </Box>
    </Box>
  );
};

export default NumPad;
