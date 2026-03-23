import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { Transaction } from '../../types';
import { useBudgets } from '../../hooks/useBudgets';
import { ITEM_PRESETS } from '../expenses/ItemPicker';

interface Props {
  transactions: Transaction[];
  convert: (hkd: number) => number;
  symbol: string;
}

// Map item label → category
const ITEM_TO_CATEGORY: Record<string, string> = {};
ITEM_PRESETS.forEach((p) => { ITEM_TO_CATEGORY[p.label] = p.category; });

const COLORS = ['#818cf8', '#34d399', '#fb7185', '#fbbf24', '#38bdf8', '#a78bfa'];

const SpendingBreakdown: React.FC<Props> = ({ transactions, convert, symbol }) => {
  const { budgets } = useBudgets();

  const { rows, categoryTotals } = useMemo(() => {
    const expenses = transactions.filter((t) => t.type === 'expense');
    if (expenses.length === 0) return { rows: [], categoryTotals: {} };

    const itemTotals: Record<string, number> = {};
    const catTotals: Record<string, number> = {};

    expenses.forEach((t) => {
      const key = t.item || t.category || 'Other';
      itemTotals[key] = (itemTotals[key] || 0) + t.amount;
      const cat = ITEM_TO_CATEGORY[key] || t.category || key;
      catTotals[cat] = (catTotals[cat] || 0) + t.amount;
    });

    const sorted = Object.entries(itemTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    return { rows: sorted, categoryTotals: catTotals };
  }, [transactions]);

  if (rows.length === 0) return null;

  const max = rows[0].value;

  return (
    <Box sx={{ mb: 2, px: 0.5 }}>
      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.68rem', letterSpacing: '0.07em', textTransform: 'uppercase', display: 'block', mb: 1.5 }}>
        Spending Breakdown
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        {rows.map(({ name, value }, i) => {
          const pct = (value / max) * 100;
          const color = COLORS[i % COLORS.length];

          // Budget: look up category total vs category budget
          const cat = ITEM_TO_CATEGORY[name] || name;
          const budget = budgets[cat] || budgets[name];
          const catTotal = budget ? (categoryTotals[cat] || value) : null;
          const budgetPct = budget && catTotal ? Math.min((catTotal / budget) * 100, 100) : null;
          const budgetColor = budgetPct === null ? color : budgetPct >= 100 ? '#fb7185' : budgetPct >= 80 ? '#fbbf24' : '#34d399';
          const over = budget && catTotal && catTotal > budget;

          return (
            <Box key={name}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: 'text.primary' }}>{name}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  {budget && catTotal != null && (
                    <Typography sx={{ fontSize: '0.68rem', color: over ? '#fb7185' : 'text.disabled', fontVariantNumeric: 'tabular-nums' }}>
                      {over
                        ? `+${symbol}${convert(catTotal - budget).toLocaleString(undefined, { maximumFractionDigits: 0 })} over`
                        : `${symbol}${convert(catTotal).toLocaleString(undefined, { maximumFractionDigits: 0 })} / ${symbol}${convert(budget).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                    </Typography>
                  )}
                  {!budget && (
                    <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
                      {symbol}{convert(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </Typography>
                  )}
                </Box>
              </Box>
              <Box sx={{ height: 4, borderRadius: 2, bgcolor: 'rgba(148,163,184,0.08)', overflow: 'hidden' }}>
                {budgetPct !== null ? (
                  <Box sx={{ height: '100%', width: `${budgetPct}%`, borderRadius: 2, bgcolor: budgetColor, transition: 'width 0.4s ease' }} />
                ) : (
                  <Box sx={{ height: '100%', width: `${pct}%`, borderRadius: 2, bgcolor: color, transition: 'width 0.4s ease' }} />
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default SpendingBreakdown;
