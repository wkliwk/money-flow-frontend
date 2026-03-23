import React, { useState } from 'react';
import { Box, Typography, ButtonBase } from '@mui/material';
import BackspaceOutlinedIcon from '@mui/icons-material/BackspaceOutlined';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

interface Props {
  value: string;           // HKD amount string (always stored as HKD)
  onChange: (hkdValue: string) => void;
  // FX props — only shown when non-HKD selected
  fxSymbol?: string;       // e.g. 'CA$'
  fxRate?: number;         // HKD per 1 foreign unit, e.g. 5.5 means CA$1 = HK$5.5
}

function compute(a: number, b: number, op: string): number {
  switch (op) {
    case '+': return a + b;
    case '−': return a - b;
    case '×': return a * b;
    case '÷': return b !== 0 ? a / b : a;
    default: return b;
  }
}

function fmt(n: number): string {
  return String(Math.round(n * 100) / 100);
}

const OPS = ['÷', '×', '−', '+'];

const NumPad: React.FC<Props> = ({ value, onChange, fxSymbol, fxRate }) => {
  const [storedValue, setStoredValue] = useState<number | null>(null);
  const [pendingOp, setPendingOp] = useState<string | null>(null);
  const [waitForNext, setWaitForNext] = useState(false);
  const [inputInFx, setInputInFx] = useState(false); // entering in foreign currency

  const showFxToggle = !!fxSymbol && !!fxRate;
  const inputSymbol = inputInFx ? fxSymbol! : 'HK$';

  // Display value is in inputSymbol
  const displayNum = value === '' ? '0' : value;

  // Converted display: if inputInFx, show HKD equivalent; if HKD input show fx equivalent
  const convertedLabel = showFxToggle
    ? inputInFx
      ? `≈ HK$${fmt(parseFloat(value || '0') * fxRate!)}`
      : `≈ ${fxSymbol}${fmt(parseFloat(value || '0') / fxRate!)}`
    : '';

  const handleDigit = (key: string) => {
    if (key === 'C') {
      onChange('');
      setStoredValue(null);
      setPendingOp(null);
      setWaitForNext(false);
      return;
    }
    if (key === '⌫') {
      if (!waitForNext) onChange(value.length <= 1 ? '' : value.slice(0, -1));
      return;
    }
    if (key === '.') {
      if (waitForNext) { onChange('0.'); setWaitForNext(false); return; }
      if (value.includes('.')) return;
      onChange((value || '0') + '.');
      return;
    }
    // digit
    if (waitForNext) {
      onChange(key);
      setWaitForNext(false);
    } else {
      if (value === '0' || value === '') { onChange(key); return; }
      const dotIdx = value.indexOf('.');
      if (dotIdx !== -1 && value.length - dotIdx > 2) return;
      if (!value.includes('.') && value.length >= 10) return;
      onChange(value + key);
    }
  };

  const handleOp = (op: string) => {
    const cur = parseFloat(value || '0');
    if (storedValue !== null && pendingOp && !waitForNext) {
      const result = compute(storedValue, cur, pendingOp);
      onChange(fmt(result));
      setStoredValue(result);
    } else {
      setStoredValue(cur);
    }
    setPendingOp(op);
    setWaitForNext(true);
  };

  const handleEquals = () => {
    if (storedValue === null || !pendingOp) return;
    const cur = parseFloat(value || '0');
    const result = compute(storedValue, cur, pendingOp);
    const hkdResult = inputInFx && fxRate ? fmt(result * fxRate) : fmt(result);
    onChange(hkdResult);
    setStoredValue(null);
    setPendingOp(null);
    setWaitForNext(false);
    if (inputInFx) setInputInFx(false); // convert back to HKD display after =
  };

  const handleFxToggle = () => {
    if (!fxRate) return;
    const cur = parseFloat(value || '0');
    if (inputInFx) {
      // switching from FX to HKD: convert displayed FX value to HKD
      onChange(cur > 0 ? fmt(cur * fxRate) : '');
    } else {
      // switching from HKD to FX: convert displayed HKD to FX
      onChange(cur > 0 ? fmt(cur / fxRate) : '');
    }
    setInputInFx((v) => !v);
    setStoredValue(null);
    setPendingOp(null);
    setWaitForNext(false);
  };

  const btnBase = {
    borderRadius: 2,
    py: 1.2,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.1s ease',
    '&:active': { transform: 'scale(0.95)' },
  };

  return (
    <Box>
      {/* Display */}
      <Box sx={{ textAlign: 'center', py: 1.5, mb: 1, borderRadius: 2, bgcolor: 'rgba(148,163,184,0.05)', border: '1px solid rgba(148,163,184,0.1)', position: 'relative' }}>
        {showFxToggle && (
          <ButtonBase
            onClick={handleFxToggle}
            sx={{ position: 'absolute', top: 8, right: 10, display: 'flex', alignItems: 'center', gap: 0.4, px: 1, py: 0.4, borderRadius: 10, bgcolor: inputInFx ? 'rgba(129,140,248,0.15)' : 'rgba(148,163,184,0.08)', border: '1px solid', borderColor: inputInFx ? 'rgba(129,140,248,0.3)' : 'rgba(148,163,184,0.12)' }}
          >
            <SwapHorizIcon sx={{ fontSize: 12, color: inputInFx ? '#818cf8' : 'text.disabled' }} />
            <Typography sx={{ fontSize: '0.62rem', color: inputInFx ? '#818cf8' : 'text.disabled', fontWeight: 600 }}>
              {inputInFx ? fxSymbol : 'HK$'}
            </Typography>
          </ButtonBase>
        )}
        {pendingOp && (
          <Typography sx={{ fontSize: '0.65rem', color: '#818cf8', mb: 0.25, letterSpacing: '0.04em' }}>
            {storedValue} {pendingOp}
          </Typography>
        )}
        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Amount
        </Typography>
        <Typography variant="h3" fontWeight={700} sx={{ letterSpacing: '-0.03em', lineHeight: 1.1, color: value ? 'text.primary' : 'text.disabled', mt: 0.25 }}>
          <span style={{ fontSize: '1rem', fontWeight: 500, opacity: 0.6 }}>{inputSymbol}</span>
          {displayNum}
        </Typography>
        {convertedLabel && value !== '' && (
          <Typography sx={{ fontSize: '0.68rem', color: 'text.disabled', mt: 0.25 }}>{convertedLabel}</Typography>
        )}
      </Box>

      {/* Grid: numbers (3 cols) + operators (1 col) */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 0.75 }}>
        {/* Row 1: 7 8 9 ÷ */}
        {['7','8','9'].map(k => (
          <ButtonBase key={k} onClick={() => handleDigit(k)} sx={{ ...btnBase, bgcolor: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.1)', '&:active': { bgcolor: 'rgba(129,140,248,0.15)', transform: 'scale(0.95)' } }}>
            <Typography fontWeight={600} sx={{ fontSize: '1.15rem', color: 'text.primary' }}>{k}</Typography>
          </ButtonBase>
        ))}
        <ButtonBase onClick={() => handleOp('÷')} sx={{ ...btnBase, bgcolor: pendingOp === '÷' ? 'rgba(129,140,248,0.2)' : 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.2)', '&:active': { bgcolor: 'rgba(129,140,248,0.25)', transform: 'scale(0.95)' } }}>
          <Typography fontWeight={700} sx={{ fontSize: '1.1rem', color: '#818cf8' }}>÷</Typography>
        </ButtonBase>

        {/* Row 2: 4 5 6 × */}
        {['4','5','6'].map(k => (
          <ButtonBase key={k} onClick={() => handleDigit(k)} sx={{ ...btnBase, bgcolor: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.1)', '&:active': { bgcolor: 'rgba(129,140,248,0.15)', transform: 'scale(0.95)' } }}>
            <Typography fontWeight={600} sx={{ fontSize: '1.15rem', color: 'text.primary' }}>{k}</Typography>
          </ButtonBase>
        ))}
        <ButtonBase onClick={() => handleOp('×')} sx={{ ...btnBase, bgcolor: pendingOp === '×' ? 'rgba(129,140,248,0.2)' : 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.2)', '&:active': { bgcolor: 'rgba(129,140,248,0.25)', transform: 'scale(0.95)' } }}>
          <Typography fontWeight={700} sx={{ fontSize: '1.1rem', color: '#818cf8' }}>×</Typography>
        </ButtonBase>

        {/* Row 3: 1 2 3 − */}
        {['1','2','3'].map(k => (
          <ButtonBase key={k} onClick={() => handleDigit(k)} sx={{ ...btnBase, bgcolor: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.1)', '&:active': { bgcolor: 'rgba(129,140,248,0.15)', transform: 'scale(0.95)' } }}>
            <Typography fontWeight={600} sx={{ fontSize: '1.15rem', color: 'text.primary' }}>{k}</Typography>
          </ButtonBase>
        ))}
        <ButtonBase onClick={() => handleOp('−')} sx={{ ...btnBase, bgcolor: pendingOp === '−' ? 'rgba(129,140,248,0.2)' : 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.2)', '&:active': { bgcolor: 'rgba(129,140,248,0.25)', transform: 'scale(0.95)' } }}>
          <Typography fontWeight={700} sx={{ fontSize: '1.1rem', color: '#818cf8' }}>−</Typography>
        </ButtonBase>

        {/* Row 4: C . 0 + */}
        <ButtonBase onClick={() => handleDigit('C')} sx={{ ...btnBase, bgcolor: 'rgba(251,113,133,0.07)', border: '1px solid rgba(251,113,133,0.15)', '&:active': { bgcolor: 'rgba(251,113,133,0.18)', transform: 'scale(0.95)' } }}>
          <Typography fontWeight={700} sx={{ fontSize: '0.9rem', color: '#fb7185' }}>C</Typography>
        </ButtonBase>
        <ButtonBase onClick={() => handleDigit('.')} sx={{ ...btnBase, bgcolor: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.1)', '&:active': { bgcolor: 'rgba(129,140,248,0.15)', transform: 'scale(0.95)' } }}>
          <Typography fontWeight={600} sx={{ fontSize: '1.15rem', color: 'text.primary' }}>.</Typography>
        </ButtonBase>
        <ButtonBase onClick={() => handleDigit('0')} sx={{ ...btnBase, bgcolor: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.1)', '&:active': { bgcolor: 'rgba(129,140,248,0.15)', transform: 'scale(0.95)' } }}>
          <Typography fontWeight={600} sx={{ fontSize: '1.15rem', color: 'text.primary' }}>0</Typography>
        </ButtonBase>
        <ButtonBase onClick={() => handleOp('+')} sx={{ ...btnBase, bgcolor: pendingOp === '+' ? 'rgba(129,140,248,0.2)' : 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.2)', '&:active': { bgcolor: 'rgba(129,140,248,0.25)', transform: 'scale(0.95)' } }}>
          <Typography fontWeight={700} sx={{ fontSize: '1.1rem', color: '#818cf8' }}>+</Typography>
        </ButtonBase>

        {/* Row 5: ⌫ (2 cols) = (2 cols) */}
        <ButtonBase onClick={() => handleDigit('⌫')} sx={{ ...btnBase, gridColumn: 'span 2', bgcolor: 'rgba(251,113,133,0.06)', border: '1px solid rgba(251,113,133,0.12)', '&:active': { bgcolor: 'rgba(251,113,133,0.16)', transform: 'scale(0.97)' } }}>
          <BackspaceOutlinedIcon sx={{ fontSize: 20, color: '#fb7185' }} />
        </ButtonBase>
        <ButtonBase onClick={handleEquals} sx={{ ...btnBase, gridColumn: 'span 2', bgcolor: '#818cf8', border: 'none', '&:active': { bgcolor: '#6366f1', transform: 'scale(0.97)' } }}>
          <Typography fontWeight={700} sx={{ fontSize: '1.1rem', color: '#fff' }}>=</Typography>
        </ButtonBase>
      </Box>
    </Box>
  );
};

export default NumPad;
