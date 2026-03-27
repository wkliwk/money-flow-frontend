import React, { useState, useEffect } from 'react';
import { Box, Typography, ButtonBase, Collapse, TextField, InputAdornment } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import BackspaceOutlinedIcon from '@mui/icons-material/BackspaceOutlined';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import CalculateOutlinedIcon from '@mui/icons-material/CalculateOutlined';

interface Props {
  value: string;           // Always HKD — parent stores HKD
  onChange: (hkdValue: string) => void;
  fxSymbol?: string;       // e.g. 'CA$' — if set, FX swap available
  fxRate?: number;         // HKD per 1 foreign unit
  compact?: boolean;       // Hide calculator grid by default, show text input
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

const NumPad: React.FC<Props> = ({ value, onChange, fxSymbol, fxRate, compact }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isFxAvailable = !!fxSymbol && !!fxRate;
  const rate = fxRate ?? 1;
  const [inputInFx, setInputInFx] = useState(() => isFxAvailable);
  const [fxInput, setFxInput] = useState('');
  const [storedValue, setStoredValue] = useState<number | null>(null);
  const [pendingOp, setPendingOp] = useState<string | null>(null);
  const [waitForNext, setWaitForNext] = useState(false);
  const [showGrid, setShowGrid] = useState(false);

  // On currency switch, default to FX mode when FX available, re-init fxInput
  useEffect(() => {
    setInputInFx(isFxAvailable);
    if (isFxAvailable && value) {
      setFxInput(fmt(parseFloat(value) / rate));
    } else {
      setFxInput('');
    }
    setStoredValue(null);
    setPendingOp(null);
    setWaitForNext(false);
  }, [isFxAvailable, fxRate]); // intentionally omits value

  const displayStr = inputInFx ? fxInput : value;
  const displayNum = displayStr === '' ? '0' : displayStr;
  const displaySymbol = inputInFx ? (fxSymbol ?? 'HK$') : 'HK$';
  const hintSymbol = inputInFx ? 'HK$' : fxSymbol;
  const hintVal = isFxAvailable
    ? inputInFx
      ? fmt(parseFloat(fxInput || '0') * rate)
      : fmt(parseFloat(value || '0') / rate)
    : null;

  const emitHkd = (fxStr: string) => {
    const n = parseFloat(fxStr) || 0;
    onChange(n > 0 ? fmt(n * rate) : '');
  };

  const handleSwap = () => {
    if (!isFxAvailable) return;
    if (inputInFx) {
      // fxInput → convert to HKD, now entering HKD
      const hkd = parseFloat(fxInput || '0') * rate;
      onChange(hkd > 0 ? fmt(hkd) : '');
    } else {
      // value is HKD → convert to FX, now entering FX
      const fx = parseFloat(value || '0') / rate;
      setFxInput(fx > 0 ? fmt(fx) : '');
    }
    setInputInFx((v) => !v);
    setStoredValue(null);
    setPendingOp(null);
    setWaitForNext(false);
  };

  const handleDigit = (key: string) => {
    const cur = inputInFx ? fxInput : value;
    const setCur = inputInFx
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
    const cur = parseFloat((inputInFx ? fxInput : value) || '0');
    if (storedValue !== null && pendingOp && !waitForNext) {
      const result = compute(storedValue, cur, pendingOp);
      const r = fmt(result);
      if (inputInFx) { setFxInput(r); emitHkd(r); } else onChange(r);
      setStoredValue(result);
    } else {
      setStoredValue(cur);
    }
    setPendingOp(op);
    setWaitForNext(true);
  };

  const handleEquals = () => {
    if (storedValue === null || !pendingOp) return;
    const cur = parseFloat((inputInFx ? fxInput : value) || '0');
    const result = compute(storedValue, cur, pendingOp);
    const r = fmt(result);
    if (inputInFx) { setFxInput(r); emitHkd(r); } else onChange(r);
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

  // Compact mode: text input + calc toggle instead of large display
  const compactAmountInput = compact ? (
    <Box sx={{ mb: 1 }}>
      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
        Amount
      </Typography>
      <TextField
        value={displayStr || ''}
        onChange={(e) => {
          const v = e.target.value.replace(/[^0-9.]/g, '');
          if (inputInFx) { setFxInput(v); emitHkd(v); } else onChange(v);
        }}
        placeholder="0"
        size="small"
        fullWidth
        inputProps={{ inputMode: 'decimal', style: { fontSize: '1.3rem', fontWeight: 700, letterSpacing: '-0.02em' } }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', fontWeight: 500 }}>{displaySymbol}</Typography>
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <ButtonBase
                onClick={() => setShowGrid((v) => !v)}
                sx={{ p: 0.5, borderRadius: 1, bgcolor: showGrid ? (isDark ? 'rgba(129,140,248,0.18)' : 'rgba(99,102,241,0.22)') : 'transparent' }}
              >
                <CalculateOutlinedIcon sx={{ fontSize: 20, color: showGrid ? theme.palette.primary.main : 'text.disabled' }} />
              </ButtonBase>
            </InputAdornment>
          ),
        }}
        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
      />
      {isFxAvailable && (
        <Box
          onClick={handleSwap}
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, cursor: 'pointer' }}
        >
          <Typography sx={{ fontSize: '0.68rem', color: 'text.disabled' }}>
            {hintSymbol}{hintVal ?? '0'}
          </Typography>
          <SwapVertIcon sx={{ fontSize: 14, color: inputInFx ? theme.palette.primary.main : 'text.disabled' }} />
        </Box>
      )}
    </Box>
  ) : null;

  const fullDisplay = !compact ? (
    <Box sx={{ mb: 1, borderRadius: 2, bgcolor: 'rgba(148,163,184,0.05)', border: '1px solid rgba(148,163,184,0.1)', overflow: 'hidden' }}>
      {pendingOp && (
        <Typography sx={{ fontSize: '0.65rem', color: theme.palette.primary.main, px: 2, pt: 1, letterSpacing: '0.04em', textAlign: 'center' }}>
          {storedValue} {pendingOp}
        </Typography>
      )}
      <Box sx={{ px: 2, pt: pendingOp ? 0.5 : 1.5, pb: isFxAvailable ? 0.5 : 1.5, textAlign: 'center' }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', mb: 0.25 }}>
          Amount
        </Typography>
        <Typography variant="h3" fontWeight={700} sx={{ letterSpacing: '-0.03em', lineHeight: 1.1, color: displayStr ? 'text.primary' : 'text.disabled' }}>
          <span style={{ fontSize: '1rem', fontWeight: 500, opacity: 0.6 }}>{displaySymbol}</span>
          {displayNum}
        </Typography>
      </Box>
      {isFxAvailable && (
        <Box
          sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, py: 0.75,
            borderTop: '1px solid rgba(148,163,184,0.08)', cursor: 'pointer', bgcolor: 'rgba(148,163,184,0.03)',
            '&:active': { bgcolor: isDark ? 'rgba(129,140,248,0.08)' : 'rgba(99,102,241,0.1)' },
          }}
          onClick={handleSwap}
        >
          <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled' }}>{hintSymbol}{hintVal ?? '0'}</Typography>
          <SwapVertIcon sx={{ fontSize: 16, color: inputInFx ? theme.palette.primary.main : 'text.disabled' }} />
          <Typography sx={{ fontSize: '0.65rem', color: inputInFx ? theme.palette.primary.main : 'text.disabled', fontWeight: 600 }}>
            {inputInFx ? `Enter in ${fxSymbol}` : 'Enter in HK$'}
          </Typography>
        </Box>
      )}
    </Box>
  ) : null;

  return (
    <Box>
      {compactAmountInput}
      {fullDisplay}

      {/* Quick amount presets */}
      <Box sx={{ display: 'flex', gap: 0.75, mb: 0.75 }}>
        {[50, 100, 200, 500].map((preset) => (
          <ButtonBase
            key={preset}
            onClick={() => {
              setStoredValue(null);
              setPendingOp(null);
              setWaitForNext(false);
              if (inputInFx && isFxAvailable) {
                const fx = fmt(preset / rate);
                setFxInput(fx);
                onChange(fmt(preset));
              } else {
                onChange(String(preset));
              }
            }}
            sx={{
              flex: 1,
              py: 0.6,
              borderRadius: 1.5,
              bgcolor: isDark ? 'rgba(129,140,248,0.07)' : 'rgba(99,102,241,0.09)',
              border: `1px solid ${isDark ? 'rgba(129,140,248,0.18)' : 'rgba(99,102,241,0.22)'}`,
              '&:active': { bgcolor: isDark ? 'rgba(129,140,248,0.2)' : 'rgba(99,102,241,0.25)', transform: 'scale(0.95)' },
              transition: 'all 0.1s ease',
            }}
          >
            <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: theme.palette.primary.main }}>
              {preset}
            </Typography>
          </ButtonBase>
        ))}
      </Box>

      {/* Grid — collapsible in compact mode */}
      <Collapse in={compact ? showGrid : true}>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 0.75 }}>
        {['7','8','9'].map(k => (
          <ButtonBase key={k} onClick={() => handleDigit(k)} sx={{ ...btnBase, bgcolor: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.1)', '&:active': { bgcolor: isDark ? 'rgba(129,140,248,0.15)' : 'rgba(99,102,241,0.18)', transform: 'scale(0.95)' } }}>
            <Typography fontWeight={600} sx={{ fontSize: '1.15rem', color: 'text.primary' }}>{k}</Typography>
          </ButtonBase>
        ))}
        <ButtonBase onClick={() => handleOp('÷')} sx={{ ...btnBase, bgcolor: pendingOp === '÷' ? (isDark ? 'rgba(129,140,248,0.2)' : 'rgba(99,102,241,0.25)') : (isDark ? 'rgba(129,140,248,0.08)' : 'rgba(99,102,241,0.1)'), border: `1px solid ${isDark ? 'rgba(129,140,248,0.2)' : 'rgba(99,102,241,0.25)'}`, '&:active': { bgcolor: isDark ? 'rgba(129,140,248,0.25)' : 'rgba(99,102,241,0.3)', transform: 'scale(0.95)' } }}>
          <Typography fontWeight={700} sx={{ fontSize: '1.1rem', color: theme.palette.primary.main }}>÷</Typography>
        </ButtonBase>

        {['4','5','6'].map(k => (
          <ButtonBase key={k} onClick={() => handleDigit(k)} sx={{ ...btnBase, bgcolor: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.1)', '&:active': { bgcolor: isDark ? 'rgba(129,140,248,0.15)' : 'rgba(99,102,241,0.18)', transform: 'scale(0.95)' } }}>
            <Typography fontWeight={600} sx={{ fontSize: '1.15rem', color: 'text.primary' }}>{k}</Typography>
          </ButtonBase>
        ))}
        <ButtonBase onClick={() => handleOp('×')} sx={{ ...btnBase, bgcolor: pendingOp === '×' ? (isDark ? 'rgba(129,140,248,0.2)' : 'rgba(99,102,241,0.25)') : (isDark ? 'rgba(129,140,248,0.08)' : 'rgba(99,102,241,0.1)'), border: `1px solid ${isDark ? 'rgba(129,140,248,0.2)' : 'rgba(99,102,241,0.25)'}`, '&:active': { bgcolor: isDark ? 'rgba(129,140,248,0.25)' : 'rgba(99,102,241,0.3)', transform: 'scale(0.95)' } }}>
          <Typography fontWeight={700} sx={{ fontSize: '1.1rem', color: theme.palette.primary.main }}>×</Typography>
        </ButtonBase>

        {['1','2','3'].map(k => (
          <ButtonBase key={k} onClick={() => handleDigit(k)} sx={{ ...btnBase, bgcolor: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.1)', '&:active': { bgcolor: isDark ? 'rgba(129,140,248,0.15)' : 'rgba(99,102,241,0.18)', transform: 'scale(0.95)' } }}>
            <Typography fontWeight={600} sx={{ fontSize: '1.15rem', color: 'text.primary' }}>{k}</Typography>
          </ButtonBase>
        ))}
        <ButtonBase onClick={() => handleOp('−')} sx={{ ...btnBase, bgcolor: pendingOp === '−' ? (isDark ? 'rgba(129,140,248,0.2)' : 'rgba(99,102,241,0.25)') : (isDark ? 'rgba(129,140,248,0.08)' : 'rgba(99,102,241,0.1)'), border: `1px solid ${isDark ? 'rgba(129,140,248,0.2)' : 'rgba(99,102,241,0.25)'}`, '&:active': { bgcolor: isDark ? 'rgba(129,140,248,0.25)' : 'rgba(99,102,241,0.3)', transform: 'scale(0.95)' } }}>
          <Typography fontWeight={700} sx={{ fontSize: '1.1rem', color: theme.palette.primary.main }}>−</Typography>
        </ButtonBase>

        <ButtonBase onClick={() => handleDigit('C')} sx={{ ...btnBase, bgcolor: isDark ? 'rgba(251,113,133,0.07)' : 'rgba(244,63,94,0.09)', border: `1px solid ${isDark ? 'rgba(251,113,133,0.15)' : 'rgba(244,63,94,0.18)'}`, '&:active': { bgcolor: isDark ? 'rgba(251,113,133,0.18)' : 'rgba(244,63,94,0.22)', transform: 'scale(0.95)' } }}>
          <Typography fontWeight={700} sx={{ fontSize: '0.9rem', color: theme.palette.error.light }}>C</Typography>
        </ButtonBase>
        <ButtonBase onClick={() => handleDigit('.')} sx={{ ...btnBase, bgcolor: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.1)', '&:active': { bgcolor: isDark ? 'rgba(129,140,248,0.15)' : 'rgba(99,102,241,0.18)', transform: 'scale(0.95)' } }}>
          <Typography fontWeight={600} sx={{ fontSize: '1.15rem', color: 'text.primary' }}>.</Typography>
        </ButtonBase>
        <ButtonBase onClick={() => handleDigit('0')} sx={{ ...btnBase, bgcolor: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.1)', '&:active': { bgcolor: isDark ? 'rgba(129,140,248,0.15)' : 'rgba(99,102,241,0.18)', transform: 'scale(0.95)' } }}>
          <Typography fontWeight={600} sx={{ fontSize: '1.15rem', color: 'text.primary' }}>0</Typography>
        </ButtonBase>
        <ButtonBase onClick={() => handleOp('+')} sx={{ ...btnBase, bgcolor: pendingOp === '+' ? (isDark ? 'rgba(129,140,248,0.2)' : 'rgba(99,102,241,0.25)') : (isDark ? 'rgba(129,140,248,0.08)' : 'rgba(99,102,241,0.1)'), border: `1px solid ${isDark ? 'rgba(129,140,248,0.2)' : 'rgba(99,102,241,0.25)'}`, '&:active': { bgcolor: isDark ? 'rgba(129,140,248,0.25)' : 'rgba(99,102,241,0.3)', transform: 'scale(0.95)' } }}>
          <Typography fontWeight={700} sx={{ fontSize: '1.1rem', color: theme.palette.primary.main }}>+</Typography>
        </ButtonBase>

        <ButtonBase onClick={() => handleDigit('⌫')} sx={{ ...btnBase, gridColumn: 'span 2', bgcolor: isDark ? 'rgba(251,113,133,0.06)' : 'rgba(244,63,94,0.08)', border: `1px solid ${isDark ? 'rgba(251,113,133,0.12)' : 'rgba(244,63,94,0.15)'}`, '&:active': { bgcolor: isDark ? 'rgba(251,113,133,0.16)' : 'rgba(244,63,94,0.2)', transform: 'scale(0.97)' } }}>
          <BackspaceOutlinedIcon sx={{ fontSize: 20, color: theme.palette.error.light }} />
        </ButtonBase>
        <ButtonBase onClick={handleEquals} sx={{ ...btnBase, gridColumn: 'span 2', bgcolor: theme.palette.primary.main, border: 'none', '&:active': { bgcolor: isDark ? '#6366f1' : '#4f46e5', transform: 'scale(0.97)' } }}>
          <Typography fontWeight={700} sx={{ fontSize: '1.1rem', color: '#fff' }}>=</Typography>
        </ButtonBase>
      </Box>
      </Collapse>
    </Box>
  );
};

export default NumPad;
