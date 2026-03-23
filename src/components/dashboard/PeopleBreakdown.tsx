import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import { Transaction } from '../../types';

interface Props {
  transactions: Transaction[];
  convert: (hkd: number) => number;
  symbol: string;
}

const PeopleBreakdown: React.FC<Props> = ({ transactions, convert, symbol }) => {
  const rows = useMemo(() => {
    const expenses = transactions.filter((t) => t.type === 'expense' && t.participants?.length);
    if (expenses.length === 0) return [];

    const totals: Record<string, { amount: number; count: number }> = {};
    expenses.forEach((t) => {
      (t.participants || []).forEach((name) => {
        if (!totals[name]) totals[name] = { amount: 0, count: 0 };
        totals[name].amount += t.amount;
        totals[name].count += 1;
      });
    });

    return Object.entries(totals)
      .map(([name, { amount, count }]) => ({ name, amount, count }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [transactions]);

  if (rows.length === 0) return null;

  return (
    <Box sx={{ mb: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
        <PeopleAltIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.68rem', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
          Treated
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        {rows.map(({ name, amount, count }) => (
          <Box key={name} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.75, px: 1.25, borderRadius: 2, bgcolor: 'rgba(148,163,184,0.04)', border: '1px solid rgba(148,163,184,0.07)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: 'rgba(129,140,248,0.12)', border: '1px solid rgba(129,140,248,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#818cf8' }}>
                  {name.charAt(0).toUpperCase()}
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: 'text.primary', lineHeight: 1.2 }}>{name}</Typography>
                <Typography sx={{ fontSize: '0.65rem', color: 'text.disabled' }}>{count} time{count > 1 ? 's' : ''}</Typography>
              </Box>
            </Box>
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#fb7185', fontVariantNumeric: 'tabular-nums' }}>
              {symbol}{convert(amount).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default PeopleBreakdown;
