import React, { useMemo, useState } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import dayjs from 'dayjs';
import { Transaction } from '../../types';

interface Anomaly {
  category: string;
  currentSpend: number;
  avgSpend: number;
  pctOver: number;
}

interface Props {
  transactions: Transaction[];
  convert: (amount: number) => number;
  symbol: string;
}

const THRESHOLD = 1.5; // 150% of average
const MIN_PRIOR_MONTHS = 2; // need at least 2 months of data

const SpendingAnomalyAlert: React.FC<Props> = ({ transactions, convert, symbol }) => {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const anomalies = useMemo<Anomaly[]>(() => {
    const now = dayjs();
    const currentMonthKey = now.format('YYYY-MM');

    // Group expenses by month → category → total
    const byMonthCategory: Record<string, Record<string, number>> = {};
    transactions.forEach((t) => {
      if (t.type !== 'expense') return;
      const d = dayjs(t.date || t.createdAt);
      if (!d.isValid()) return;
      const monthKey = d.format('YYYY-MM');
      const cat = t.category || 'Other';
      if (!byMonthCategory[monthKey]) byMonthCategory[monthKey] = {};
      byMonthCategory[monthKey][cat] = (byMonthCategory[monthKey][cat] || 0) + t.amount;
    });

    const currentSpendByCategory = byMonthCategory[currentMonthKey] ?? {};

    // Build 3-month rolling window (the 3 months before this month)
    const priorMonths = [1, 2, 3].map((n) => now.subtract(n, 'month').format('YYYY-MM'));

    const results: Anomaly[] = [];

    Object.entries(currentSpendByCategory).forEach(([cat, currentSpend]) => {
      const priorAmounts = priorMonths
        .map((m) => byMonthCategory[m]?.[cat] ?? null)
        .filter((v): v is number => v !== null);

      // Need at least MIN_PRIOR_MONTHS of prior data
      if (priorAmounts.length < MIN_PRIOR_MONTHS) return;

      const avgSpend = priorAmounts.reduce((s, v) => s + v, 0) / priorAmounts.length;
      if (avgSpend <= 0) return;

      const ratio = currentSpend / avgSpend;
      if (ratio < THRESHOLD) return;

      results.push({
        category: cat,
        currentSpend,
        avgSpend,
        pctOver: Math.round((ratio - 1) * 100),
      });
    });

    // Sort by biggest overage first
    return results.sort((a, b) => b.pctOver - a.pctOver);
  }, [transactions]);

  const visible = anomalies.filter((a) => !dismissed.has(a.category));
  if (visible.length === 0) return null;

  return (
    <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
      {visible.map((a) => (
        <Box
          key={a.category}
          sx={{
            py: 1.25,
            px: 2,
            borderRadius: 2,
            bgcolor: 'rgba(251,191,36,0.06)',
            border: '1px solid rgba(251,191,36,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Typography sx={{ fontSize: '0.82rem', color: '#fbbf24', fontWeight: 700, flexShrink: 0 }}>
            ↑{a.pctOver}%
          </Typography>
          <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', flex: 1 }}>
            <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>{a.category}</Box>
            {' '}— {symbol}{convert(a.currentSpend).toLocaleString(undefined, { maximumFractionDigits: 0 })} this month vs {symbol}{convert(a.avgSpend).toLocaleString(undefined, { maximumFractionDigits: 0 })} avg
          </Typography>
          <IconButton
            size="small"
            onClick={() => setDismissed((prev) => new Set([...prev, a.category]))}
            sx={{ color: 'text.disabled', p: 0.25, flexShrink: 0 }}
          >
            <CloseIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Box>
      ))}
    </Box>
  );
};

export default SpendingAnomalyAlert;
