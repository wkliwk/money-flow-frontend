import React, { useMemo } from 'react';
import { Box, Typography, IconButton, Divider } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import dayjs, { Dayjs } from 'dayjs';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { Transaction } from '../../types';
import { Currency } from '../../hooks/useFxRates';
import CurrencyPicker from './CurrencyPicker';

interface Props {
  transactions: Transaction[];
  prevMonthTransactions?: Transaction[];
  streak?: number;
  selectedMonth: Dayjs | null;
  onChange: (month: Dayjs | null) => void;
  currency: Currency;
  onCurrencyChange: (c: Currency) => void;
  convert: (amount: number) => number;
  symbol: string;
}

const fmt = (n: number) =>
  n.toLocaleString('en-HK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const MobileHero: React.FC<Props> = ({
  transactions,
  prevMonthTransactions,
  streak,
  selectedMonth,
  onChange,
  currency,
  onCurrencyChange,
  convert,
  symbol,
}) => {
  const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const prevExpenses = (prevMonthTransactions ?? []).filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const showDelta = selectedMonth && prevMonthTransactions && prevMonthTransactions.length > 0;
  const delta = expenses - prevExpenses;

  const { avgPerDay, projectedTotal, topExpense } = (() => {
    if (!selectedMonth || expenses === 0) return { avgPerDay: null, projectedTotal: null, topExpense: null };
    const now = dayjs();
    const isCurrentMonth = selectedMonth.isSame(now, 'month');
    const daysElapsed = isCurrentMonth ? now.date() : selectedMonth.daysInMonth();
    const avg = expenses / daysElapsed;
    const projected = isCurrentMonth && daysElapsed < selectedMonth.daysInMonth()
      ? avg * selectedMonth.daysInMonth()
      : null;

    // Top expense item this month
    const itemTotals: Record<string, number> = {};
    transactions.filter((t) => t.type === 'expense').forEach((t) => {
      const key = t.item || t.description || 'Other';
      itemTotals[key] = (itemTotals[key] || 0) + t.amount;
    });
    const top = Object.entries(itemTotals).sort((a, b) => b[1] - a[1])[0] ?? null;

    return { avgPerDay: avg, projectedTotal: projected, topExpense: top };
  })();
  const net = income - expenses;
  const isPositive = net >= 0;

  const dailySpend = useMemo(() => {
    if (!selectedMonth || expenses === 0) return [];
    const now = dayjs();
    const isCurrentMonth = selectedMonth.isSame(now, 'month');
    const days = isCurrentMonth ? now.date() : selectedMonth.daysInMonth();
    const byDay: number[] = Array(days).fill(0);
    transactions.filter((t) => t.type === 'expense').forEach((t) => {
      const d = dayjs(t.date || t.createdAt);
      if (d.isValid() && d.isSame(selectedMonth, 'month')) {
        const idx = d.date() - 1;
        if (idx >= 0 && idx < days) byDay[idx] += t.amount;
      }
    });
    return byDay.map((amount, i) => ({ day: i + 1, amount }));
  }, [transactions, selectedMonth, expenses]);

  const handlePrev = () => onChange((selectedMonth ?? dayjs()).subtract(1, 'month'));
  const handleNext = () => onChange((selectedMonth ?? dayjs()).add(1, 'month'));

  return (
    <Box
      sx={{
        borderRadius: 3,
        p: 3,
        mb: 2,
        background: isPositive
          ? 'linear-gradient(135deg, rgba(129,140,248,0.18) 0%, rgba(52,211,153,0.08) 100%)'
          : 'linear-gradient(135deg, rgba(251,113,133,0.18) 0%, rgba(251,113,133,0.06) 100%)',
        border: `1px solid ${isPositive ? 'rgba(129,140,248,0.25)' : 'rgba(251,113,133,0.25)'}`,
        boxShadow: `0 8px 32px ${isPositive ? 'rgba(129,140,248,0.1)' : 'rgba(251,113,133,0.1)'}`,
      }}
    >
      {/* Streak badge */}
      {streak && streak >= 2 && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#fbbf24', bgcolor: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', px: 1, py: 0.25, borderRadius: 1, letterSpacing: '0.03em' }}>
            🔥 {streak} day streak
          </Typography>
        </Box>
      )}

      {/* Month navigator */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
        <IconButton size="small" onClick={handlePrev} sx={{ p: 1.5, color: 'text.secondary' }}>
          <ChevronLeftIcon sx={{ fontSize: 18 }} />
        </IconButton>
        <Typography
          variant="caption"
          fontWeight={600}
          onClick={() => selectedMonth ? onChange(null) : onChange(dayjs())}
          sx={{
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            fontSize: '0.72rem',
            color: 'text.secondary',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          {selectedMonth ? selectedMonth.format('MMMM YYYY') : 'All Time'}
        </Typography>
        <IconButton size="small" onClick={handleNext} sx={{ p: 1.5, color: 'text.secondary' }}>
          <ChevronRightIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {/* Currency picker */}
      <Box sx={{ mb: 2 }}>
        <CurrencyPicker currency={currency} onChange={onCurrencyChange} />
      </Box>

      {/* Big balance */}
      <Box sx={{ textAlign: 'center', mb: 2.5 }}>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontSize: '0.72rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            display: 'block',
            mb: 0.5,
          }}
        >
          Net Balance
        </Typography>
        <Typography
          variant="h3"
          fontWeight={700}
          sx={{
            color: isPositive ? 'primary.main' : 'error.main',
            letterSpacing: '-0.03em',
            lineHeight: 1,
          }}
        >
          {isPositive ? '+' : '-'}{symbol}{fmt(convert(Math.abs(net)))}
        </Typography>
        {showDelta && (
          <Typography sx={{ fontSize: '0.65rem', mt: 0.75, color: delta > 0 ? 'error.main' : 'success.main', fontWeight: 600 }}>
            {delta > 0 ? '↑' : '↓'} {symbol}{fmt(convert(Math.abs(delta)))} spending vs last month
          </Typography>
        )}
      </Box>

      {/* Income / Expense row */}
      <Divider sx={{ mb: 2, borderColor: 'rgba(148,163,184,0.1)' }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', mb: 0.25 }}
          >
            Income
          </Typography>
          <Typography fontWeight={700} sx={{ color: 'success.main', fontSize: '1rem', letterSpacing: '-0.01em' }}>
            +{symbol}{fmt(convert(income))}
          </Typography>
        </Box>
        <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(148,163,184,0.15)' }} />
        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', mb: 0.25 }}
          >
            Expenses
          </Typography>
          <Typography fontWeight={700} sx={{ color: 'error.main', fontSize: '1rem', letterSpacing: '-0.01em' }}>
            -{symbol}{fmt(convert(expenses))}
          </Typography>
          {avgPerDay !== null && (
            <Typography sx={{ fontSize: '0.6rem', color: 'text.disabled', mt: 0.25 }}>
              {symbol}{fmt(convert(avgPerDay))}/day
              {projectedTotal !== null && ` · on pace for ${symbol}${fmt(convert(projectedTotal))}`}
            </Typography>
          )}
          {topExpense && (
            <Typography sx={{ fontSize: '0.6rem', color: 'text.disabled', mt: 0.125 }}>
              Top: {topExpense[0]} {symbol}{fmt(convert(topExpense[1]))}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Daily spend sparkline */}
      {dailySpend.length > 1 && (
        <Box sx={{ mt: 2, mx: -1 }}>
          <ResponsiveContainer width="100%" height={36}>
            <AreaChart data={dailySpend} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fb7185" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#fb7185" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#fb7185"
                strokeWidth={1.5}
                fill="url(#sparkGrad)"
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      )}
    </Box>
  );
};

export default MobileHero;
