import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { Transaction } from '../../types';

interface Props {
  transactions: Transaction[];
  prevMonthTransactions: Transaction[];
  convert: (hkd: number) => number;
  symbol: string;
}

function sumByType(txns: Transaction[], type: string): number {
  return txns.filter((t) => t.type === type).reduce((s, t) => s + t.amount, 0);
}

function topCategoryChange(current: Transaction[], prev: Transaction[]): { category: string; currentSpend: number; prevSpend: number; delta: number } | null {
  const curMap: Record<string, number> = {};
  const prevMap: Record<string, number> = {};
  current.filter((t) => t.type === 'expense').forEach((t) => { const c = t.category || 'Other'; curMap[c] = (curMap[c] || 0) + t.amount; });
  prev.filter((t) => t.type === 'expense').forEach((t) => { const c = t.category || 'Other'; prevMap[c] = (prevMap[c] || 0) + t.amount; });

  const allCats = new Set([...Object.keys(curMap), ...Object.keys(prevMap)]);
  let biggest: { category: string; currentSpend: number; prevSpend: number; delta: number } | null = null;
  let maxAbsDelta = 0;
  allCats.forEach((cat) => {
    const cur = curMap[cat] || 0;
    const prv = prevMap[cat] || 0;
    const delta = cur - prv;
    if (Math.abs(delta) > maxAbsDelta && prv > 0) {
      maxAbsDelta = Math.abs(delta);
      biggest = { category: cat, currentSpend: cur, prevSpend: prv, delta };
    }
  });
  return biggest;
}

const SpendingInsights: React.FC<Props> = ({ transactions, prevMonthTransactions, convert, symbol }) => {
  const theme = useTheme();
  const insights = useMemo(() => {
    if (prevMonthTransactions.length === 0) return null;

    const curExpenses = sumByType(transactions, 'expense');
    const prevExpenses = sumByType(prevMonthTransactions, 'expense');
    const curIncome = sumByType(transactions, 'income');
    const net = curIncome - curExpenses;

    const spendDelta = prevExpenses > 0 ? ((curExpenses - prevExpenses) / prevExpenses) * 100 : null;
    const topCat = topCategoryChange(transactions, prevMonthTransactions);

    return { curExpenses, prevExpenses, spendDelta, topCat, net };
  }, [transactions, prevMonthTransactions]);

  if (!insights) return null;

  const { spendDelta, topCat, net } = insights;

  const successColor = theme.palette.success.light;
  const errorColor = theme.palette.error.light;

  const cards: { text: string; color: string; bgAlpha: number; borderAlpha: number }[] = [];

  if (spendDelta !== null) {
    const dir = spendDelta <= 0 ? 'less' : 'more';
    const arrow = spendDelta <= 0 ? '\u2193' : '\u2191';
    const color = spendDelta <= 0 ? successColor : errorColor;
    cards.push({ text: `${arrow} ${Math.abs(Math.round(spendDelta))}% ${dir} spending than last month`, color, bgAlpha: 0.08, borderAlpha: 0.2 });
  }

  if (topCat && topCat.prevSpend > 0) {
    const pct = Math.round(((topCat.currentSpend - topCat.prevSpend) / topCat.prevSpend) * 100);
    if (Math.abs(pct) >= 10) {
      const arrow = pct <= 0 ? '\u2193' : '\u2191';
      const color = pct <= 0 ? successColor : errorColor;
      cards.push({ text: `${topCat.category}: ${symbol}${convert(topCat.prevSpend).toLocaleString(undefined, { maximumFractionDigits: 0 })} \u2192 ${symbol}${convert(topCat.currentSpend).toLocaleString(undefined, { maximumFractionDigits: 0 })} (${arrow}${Math.abs(pct)}%)`, color, bgAlpha: 0.08, borderAlpha: 0.2 });
    }
  }

  if (net > 0) {
    cards.push({ text: `Saved ${symbol}${convert(net).toLocaleString(undefined, { maximumFractionDigits: 0 })} this month`, color: successColor, bgAlpha: 0.08, borderAlpha: 0.2 });
  }

  if (cards.length === 0) return null;

  return (
    <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
      {cards.map((card, i) => (
        <Box key={i} sx={{ py: 0.75, px: 1.5, borderRadius: 1.5, bgcolor: alpha(card.color, card.bgAlpha), border: `1px solid ${alpha(card.color, card.borderAlpha)}` }}>
          <Typography sx={{ fontSize: '0.75rem', color: card.color, fontWeight: 600 }}>
            {card.text}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

export default SpendingInsights;
