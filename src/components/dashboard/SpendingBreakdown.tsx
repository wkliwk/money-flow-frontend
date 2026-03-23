import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { Transaction } from '../../types';

interface Props {
  transactions: Transaction[];
  convert: (hkd: number) => number;
  symbol: string;
}

const SpendingBreakdown: React.FC<Props> = ({ transactions, convert, symbol }) => {
  const rows = useMemo(() => {
    const expenses = transactions.filter((t) => t.type === 'expense');
    if (expenses.length === 0) return [];

    const totals: Record<string, number> = {};
    expenses.forEach((t) => {
      const key = t.item || t.category || 'Other';
      totals[key] = (totals[key] || 0) + t.amount;
    });

    const sorted = Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    return sorted;
  }, [transactions]);

  if (rows.length === 0) return null;

  const max = rows[0].value;

  const COLORS = ['#818cf8', '#34d399', '#fb7185', '#fbbf24', '#38bdf8', '#a78bfa'];

  return (
    <Box sx={{ mb: 2, px: 0.5 }}>
      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.68rem', letterSpacing: '0.07em', textTransform: 'uppercase', display: 'block', mb: 1.5 }}>
        Spending Breakdown
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        {rows.map(({ name, value }, i) => {
          const pct = (value / max) * 100;
          const color = COLORS[i % COLORS.length];
          return (
            <Box key={name}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: 'text.primary' }}>{name}</Typography>
                <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
                  {symbol}{convert(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </Typography>
              </Box>
              <Box sx={{ height: 4, borderRadius: 2, bgcolor: 'rgba(148,163,184,0.08)', overflow: 'hidden' }}>
                <Box sx={{ height: '100%', width: `${pct}%`, borderRadius: 2, bgcolor: color, transition: 'width 0.4s ease' }} />
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default SpendingBreakdown;
