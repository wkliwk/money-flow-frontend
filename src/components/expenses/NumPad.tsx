import React, { useState, useEffect } from 'react';
import { Box, Typography, ButtonBase } from '@mui/material';
import BackspaceOutlinedIcon from '@mui/icons-material/BackspaceOutlined';

interface Props {
  value: string;           // Always HKD — parent stores HKD
  onChange: (hkdValue: string) => void;
  fxSymbol?: string;       // e.g. 'CA$' — if set, user enters in foreign currency
  fxRate?: number;         // HKD per 1 foreign unit (e.g. CA$1 = HK$5.5 → rate=5.5)
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

const NumPad: React.FC<Props> = ({ value, onChange, fxSymbol, fxRate }) => {
  const isFx = !!fxSymbol && !!fxRate;

  // When in FX mode, fxInput is what the user typed (foreign currency).
  // parent's `value` is always HKD.
  const [fxInput, setFxInput] = useState('');
  const [storedValue, setStoredValue] = useState<number | null>(null);
  const [pendingOp, setPendingOp] = useState<string | null>(null);
  const [waitForNext, setWaitForNext] = useState(false);

  // When switching currency (fxRate changes), initialize fxInput from existing HKD value
  useEffect(() => {
    if (isFx && value) {
      const fxVal = parseFloat(value) / fxRate!;
      setFxInput(fxVal > 0 ? fmt(fxVal) : '');
    } else {
      setFxInput('');
    }
    setStoredValue(null);
    setPendingOp(null);
    setWaitForNext(false);
  }, [isFx, fxRate]); // intentionally omitting `value` — only re-init on currency change

  // The string shown in the big display
  const displayStr = isFx ? fxInput : value;
  const displayNum = displayStr === '' ? '0' : displayStr;
  const displaySymbol = isFx ? fxSymbol! : 'HK$';

  // Conversion hint below display
  const hintLabel = isFx && fxInput !== ''
    ? `≈ HK$${fmt(parseFloat(fxInput || '0') * fxRate!)}`
    : !isFx && fxSymbol && fxRate && value !== ''
    ? `≈ ${fxSymbol}${fmt(parseFloat(value || '0') / fxRate)}`
    : '';

  const emitHkd = (fxStr: string) => {
    const fxNum = parseFloat(fxStr) || 0;
    onChange(fxNum > 0 ? fmt(fxNum * fxRate!) : '');
  };

  const handleDigit = (key: string) => {
    // Use fxInput when in FX mode, otherwise value directly
    const cur = isFx ? fxInput : value;
    const setCur = isFx
      ? (v: string) => { setFxInput(v); emitHkd(v); }
      : (v: string) => onChange(v);

    if (key === 'C') {
      setCur('');
      setStoredValue(null);
      setPendingOp(null);
      setWaitForNext(false);
      return;
    }
    if (key === '⌫') {
      if (!waitForNext) setCur(cur.length <= 1 ? '' : cur.slice(0, -1));
      return;
    }
    if (key === '.') {
      if (waitForNext) { setCur('0.'); setWaitForNext(false); return; }
      if (cur.includes('.')) return;
      setCur((cur || '0') + '.');
      return;
    }
    // digit
    if (waitForNext) {
      setCur(key);
      setWaitForNext(false);
    } else {
      if (cur === '0' || cur === '') { setCur(key); return; }
      const dotIdx = cur.indexOf('.');
      if (dotIdx !== -1 && cur.length - dotIdx > 2) return;
      if (!cur.includes('.') && cur.length >= 10) return;
      setCur(cur + key);
    }
  };

  const handleOp = (op: string) => {
    const cur = parseFloat((isFx ? fxInput : value) || '0');
    if (storedValue !== null && pendingOp && !waitForNext) {
      const result = compute(storedValue, cur, pendingOp);
      const resultStr = fmt(result);
      if (isFx) { setFxInput(resultStr); emitHkd(resultStr); }
      else onChange(resultStr);
      setStoredValue(result);
    } else {
      setStoredValue(cur);
    }
    setPendingOp(op);
    setWaitForNext(true);
  };

  const handleEquals = () => {
    if (storedValue === null || !pendingOp) return;
    const cur = parseFloat((isFx ? fxInput : value) || '0');
    const result = compute(storedValue, cur, pendingOp);
    const resultStr = fmt(result);
    if (isFx) { setFxInput(resultStr); emitHkd(resultStr); }
    else onChange(resultStr);
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
      <Box sx={{ textAlign: 'center', py: 1.5, mb: 1, borderRadius: 2, bgcolor: 'rgba(148,163,184,0.05)', border: '1px solid rgba(148,163,184,0.1)' }}>
        {pendingOp && (
          <Typography sx={{ fontSize: '0.65rem', color: '#818cf8', mb: 0.25, letterSpacing: '0.04em' }}>
            {storedValue} {pendingOp}
          </Typography>
        )}
        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Amount
        </Typography>
        <Typography variant="h3" fontWeight={700} sx={{ letterSpacing: '-0.03em', lineHeight: 1.1, color: displayStr ? 'text.primary' : 'text.disabled', mt: 0.25 }}>
          <span style={{ fontSize: '1rem', fontWeight: 500, opacity: 0.6 }}>{displaySymbol}</span>
          {displayNum}
        </Typography>
        {hintLabel && (
          <Typography sx={{ fontSize: '0.68rem', color: 'text.disabled', mt: 0.25 }}>{hintLabel}</Typography>
        )}
      </Box>

      {/* Grid: 3 digit cols + 1 op col */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 0.75 }}>
        {['7','8','9'].map(k => (
          <ButtonBase key={k} onClick={() => handleDigit(k)} sx={{ ...btnBase, bgcolor: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.1)', '&:active': { bgcolor: 'rgba(129,140,248,0.15)', transform: 'scale(0.95)' } }}>
            <Typography fontWeight={600} sx={{ fontSize: '1.15rem', color: 'text.primary' }}>{k}</Typography>
          </ButtonBase>
        ))}
        <ButtonBase onClick={() => handleOp('÷')} sx={{ ...btnBase, bgcolor: pendingOp === '÷' ? 'rgba(129,140,248,0.2)' : 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.2)', '&:active': { bgcolor: 'rgba(129,140,248,0.25)', transform: 'scale(0.95)' } }}>
          <Typography fontWeight={700} sx={{ fontSize: '1.1rem', color: '#818cf8' }}>÷</Typography>
        </ButtonBase>

        {['4','5','6'].map(k => (
          <ButtonBase key={k} onClick={() => handleDigit(k)} sx={{ ...btnBase, bgcolor: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.1)', '&:active': { bgcolor: 'rgba(129,140,248,0.15)', transform: 'scale(0.95)' } }}>
            <Typography fontWeight={600} sx={{ fontSize: '1.15rem', color: 'text.primary' }}>{k}</Typography>
          </ButtonBase>
        ))}
        <ButtonBase onClick={() => handleOp('×')} sx={{ ...btnBase, bgcolor: pendingOp === '×' ? 'rgba(129,140,248,0.2)' : 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.2)', '&:active': { bgcolor: 'rgba(129,140,248,0.25)', transform: 'scale(0.95)' } }}>
          <Typography fontWeight={700} sx={{ fontSize: '1.1rem', color: '#818cf8' }}>×</Typography>
        </ButtonBase>

        {['1','2','3'].map(k => (
          <ButtonBase key={k} onClick={() => handleDigit(k)} sx={{ ...btnBase, bgcolor: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.1)', '&:active': { bgcolor: 'rgba(129,140,248,0.15)', transform: 'scale(0.95)' } }}>
            <Typography fontWeight={600} sx={{ fontSize: '1.15rem', color: 'text.primary' }}>{k}</Typography>
          </ButtonBase>
        ))}
        <ButtonBase onClick={() => handleOp('−')} sx={{ ...btnBase, bgcolor: pendingOp === '−' ? 'rgba(129,140,248,0.2)' : 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.2)', '&:active': { bgcolor: 'rgba(129,140,248,0.25)', transform: 'scale(0.95)' } }}>
          <Typography fontWeight={700} sx={{ fontSize: '1.1rem', color: '#818cf8' }}>−</Typography>
        </ButtonBase>

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
