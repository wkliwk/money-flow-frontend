import React, { useMemo } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import dayjs, { Dayjs } from 'dayjs';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { Transaction } from '../../types';
import { Currency } from '../../hooks/useFxRates';
import CurrencyPicker from './CurrencyPicker';
import { tokens } from '../../theme';

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
  const net = income - expenses;
  const savingsRate = income > 0 ? Math.round((net / income) * 100) : null;

  const { avgPerDay, projectedTotal, topExpense } = (() => {
    if (!selectedMonth || expenses === 0) return { avgPerDay: null, projectedTotal: null, topExpense: null };
    const now = dayjs();
    const isCurrentMonth = selectedMonth.isSame(now, 'month');
    const daysElapsed = isCurrentMonth ? now.date() : selectedMonth.daysInMonth();
    const avg = expenses / daysElapsed;
    const projected = isCurrentMonth && daysElapsed < selectedMonth.daysInMonth()
      ? avg * selectedMonth.daysInMonth()
      : null;

    const itemTotals: Record<string, number> = {};
    transactions.filter((t) => t.type === 'expense').forEach((t) => {
      const key = t.item || t.description || 'Other';
      itemTotals[key] = (itemTotals[key] || 0) + t.amount;
    });
    const top = Object.entries(itemTotals).sort((a, b) => b[1] - a[1])[0] ?? null;
    return { avgPerDay: avg, projectedTotal: projected, topExpense: top };
  })();

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
    <Box sx={{ mb: 1.5 }}>
      {/* Currency picker */}
      <Box sx={{ mb: 1.5 }}>
        <CurrencyPicker currency={currency} onChange={onCurrencyChange} />
      </Box>

      {/* Dark hero card */}
      <Box
        sx={{
          borderRadius: '20px',
          p: '20px',
          mb: 1.5,
          bgcolor: tokens.primaryDark,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circle */}
        <Box
          sx={{
            position: 'absolute',
            top: -40,
            right: -20,
            width: 120,
            height: 120,
            borderRadius: '50%',
            bgcolor: 'rgba(91,78,199,0.15)',
            pointerEvents: 'none',
          }}
        />

        {/* Streak badge */}
        {streak && streak >= 2 && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#86EFAC', bgcolor: 'rgba(134,239,172,0.15)', px: 1, py: 0.25, borderRadius: '6px', letterSpacing: '0.03em' }}>
              🔥 {streak} day streak
            </Typography>
          </Box>
        )}

        {/* Month navigator */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75, position: 'relative' }}>
          <IconButton size="small" onClick={handlePrev} sx={{ p: 0.5, color: 'rgba(255,255,255,0.5)', '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' } }}>
            <ChevronLeftIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <Typography
            sx={{
              fontFamily: `'Space Grotesk', sans-serif`,
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#fff',
              letterSpacing: '-0.5px',
              cursor: 'pointer',
              userSelect: 'none',
            }}
            onClick={() => selectedMonth ? onChange(null) : onChange(dayjs())}
          >
            {selectedMonth ? selectedMonth.format('MMMM YYYY') : 'All Time'}
          </Typography>
          <IconButton size="small" onClick={handleNext} sx={{ p: 0.5, color: 'rgba(255,255,255,0.5)', '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' } }}>
            <ChevronRightIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        {/* Net Balance label */}
        <Typography sx={{ fontFamily: `'Plus Jakarta Sans', sans-serif`, fontSize: '0.6875rem', fontWeight: 500, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px', mb: 0.75 }}>
          Net Balance
        </Typography>

        {/* Big number */}
        <Typography
          sx={{
            fontFamily: `'Space Grotesk', sans-serif`,
            fontSize: '2.25rem',
            fontWeight: 700,
            color: '#fff',
            letterSpacing: '-1px',
            lineHeight: 1.1,
            mb: 0.5,
          }}
        >
          {net >= 0 ? '+' : '-'}{symbol}{fmt(convert(Math.abs(net)))}
        </Typography>

        {showDelta && (
          <Typography sx={{ fontFamily: `'Plus Jakarta Sans', sans-serif`, fontSize: '0.75rem', color: delta > 0 ? '#FCA5A5' : '#86EFAC', fontWeight: 600, mb: 1.5 }}>
            {delta > 0 ? '↑' : '↓'} {symbol}{fmt(convert(Math.abs(delta)))} spending vs last month
          </Typography>
        )}

        {/* Sub-stats row */}
        <Box sx={{ display: 'flex', gap: '20px', mt: '14px' }}>
          <Box>
            <Typography sx={{ fontFamily: `'Plus Jakarta Sans', sans-serif`, fontSize: '0.625rem', color: 'rgba(255,255,255,0.4)', mb: 0.25 }}>Income</Typography>
            <Typography sx={{ fontFamily: `'Space Grotesk', sans-serif`, fontSize: '1rem', fontWeight: 600, color: '#86EFAC', letterSpacing: '-0.3px' }}>
              +{symbol}{fmt(convert(income))}
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontFamily: `'Plus Jakarta Sans', sans-serif`, fontSize: '0.625rem', color: 'rgba(255,255,255,0.4)', mb: 0.25 }}>Expenses</Typography>
            <Typography sx={{ fontFamily: `'Space Grotesk', sans-serif`, fontSize: '1rem', fontWeight: 600, color: '#FCA5A5', letterSpacing: '-0.3px' }}>
              -{symbol}{fmt(convert(expenses))}
            </Typography>
            {avgPerDay !== null && (
              <Typography sx={{ fontFamily: `'Plus Jakarta Sans', sans-serif`, fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', mt: 0.25 }}>
                {symbol}{fmt(convert(avgPerDay))}/day{projectedTotal ? ` · pace ${symbol}${fmt(convert(projectedTotal))}` : ''}
              </Typography>
            )}
          </Box>
          {savingsRate !== null && (
            <Box>
              <Typography sx={{ fontFamily: `'Plus Jakarta Sans', sans-serif`, fontSize: '0.625rem', color: 'rgba(255,255,255,0.4)', mb: 0.25 }}>Saving rate</Typography>
              <Typography sx={{ fontFamily: `'Space Grotesk', sans-serif`, fontSize: '1rem', fontWeight: 600, color: '#fff', letterSpacing: '-0.3px' }}>
                {Math.max(0, savingsRate)}%
              </Typography>
            </Box>
          )}
        </Box>

        {topExpense && (
          <Typography sx={{ fontFamily: `'Plus Jakarta Sans', sans-serif`, fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', mt: 1 }}>
            Top: {topExpense[0]} {symbol}{fmt(convert(topExpense[1]))}
          </Typography>
        )}

        {/* Daily spend sparkline */}
        {dailySpend.length > 1 && (
          <Box sx={{ mt: 2, mx: -1 }}>
            <ResponsiveContainer width="100%" height={36}>
              <AreaChart data={dailySpend} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="heroSparkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FCA5A5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#FCA5A5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#FCA5A5"
                  strokeWidth={1.5}
                  fill="url(#heroSparkGrad)"
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default MobileHero;
