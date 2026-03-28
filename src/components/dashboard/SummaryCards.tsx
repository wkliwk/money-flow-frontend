import React from 'react';
import { Grid, Card, CardContent, Typography, Box, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { Transaction } from '../../types';

interface Props {
  transactions: Transaction[];
  prevMonthTransactions?: Transaction[];
  convert: (amount: number) => number;
  symbol: string;
}

const fmt = (n: number) =>
  n.toLocaleString('en-HK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / Math.abs(previous)) * 100);
}

interface DeltaBadgeProps {
  pct: number | null;
  higherIsBetter: boolean;
  prevAmount: number | null;
  symbol: string;
  convert: (n: number) => number;
}

const DeltaBadge: React.FC<DeltaBadgeProps> = ({ pct, higherIsBetter, prevAmount, symbol, convert }) => {
  const theme = useTheme();

  if (pct === null || prevAmount === null) {
    return null;
  }

  const favorable = higherIsBetter ? pct >= 0 : pct <= 0;
  const color = favorable ? theme.palette.success.light : theme.palette.error.light;
  const arrow = pct > 0 ? '\u2191' : pct < 0 ? '\u2193' : '\u2192';
  const absPct = Math.abs(pct);
  const label = pct === 0 ? '\u2192 0%' : `${arrow}${absPct}%`;
  const tooltipText = `vs ${symbol}${fmt(convert(prevAmount))} last month`;

  return (
    <Tooltip title={tooltipText} arrow placement="bottom">
      <Typography
        component="span"
        sx={{
          display: 'inline-block',
          fontSize: '0.65rem',
          fontWeight: 700,
          mt: 0.5,
          color,
          cursor: 'default',
          letterSpacing: '0.02em',
        }}
      >
        {label}
      </Typography>
    </Tooltip>
  );
};

const SummaryCards: React.FC<Props> = ({ transactions, prevMonthTransactions, convert, symbol }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const net = income - expenses;

  const hasPrev = prevMonthTransactions !== undefined && prevMonthTransactions.length > 0;

  const prevIncome = hasPrev
    ? prevMonthTransactions!.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
    : null;

  const prevExpensesAmount = hasPrev
    ? prevMonthTransactions!.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
    : null;

  const prevNet =
    prevIncome !== null && prevExpensesAmount !== null ? prevIncome - prevExpensesAmount : null;

  const incomePct = prevIncome !== null ? pctChange(income, prevIncome) : null;
  const expensesPct = prevExpensesAmount !== null ? pctChange(expenses, prevExpensesAmount) : null;
  const netPct = prevNet !== null ? pctChange(net, prevNet) : null;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayExpenses = transactions
    .filter((t) => t.type === 'expense' && (t.date || t.createdAt || '').startsWith(todayStr))
    .reduce((sum, t) => sum + t.amount, 0);

  const now = new Date();
  const daysElapsed = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const isCurrentMonth = transactions.some((t) =>
    (t.date || t.createdAt || '').startsWith(todayStr.slice(0, 7)),
  );
  const projectedExpenses =
    isCurrentMonth && expenses > 0 && daysElapsed < daysInMonth
      ? (expenses / daysElapsed) * daysInMonth
      : null;

  const cards = [
    {
      label: 'Income',
      value: `+${symbol}${fmt(convert(income))}`,
      color: theme.palette.success.light,
      gradient: isDark
        ? 'linear-gradient(135deg, rgba(52, 211, 153, 0.12) 0%, rgba(16, 185, 129, 0.04) 100%)'
        : 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)',
      border: isDark ? 'rgba(52, 211, 153, 0.2)' : 'rgba(16, 185, 129, 0.25)',
      glow: isDark ? 'rgba(52, 211, 153, 0.08)' : 'rgba(16, 185, 129, 0.1)',
      icon: <TrendingUpIcon sx={{ fontSize: 20 }} />,
      deltaPct: incomePct,
      prevAmount: prevIncome,
      higherIsBetter: true,
    },
    {
      label: 'Expenses',
      value: `-${symbol}${fmt(convert(expenses))}`,
      color: theme.palette.error.light,
      gradient: isDark
        ? 'linear-gradient(135deg, rgba(251, 113, 133, 0.12) 0%, rgba(244, 63, 94, 0.04) 100%)'
        : 'linear-gradient(135deg, rgba(244, 63, 94, 0.15) 0%, rgba(244, 63, 94, 0.05) 100%)',
      border: isDark ? 'rgba(251, 113, 133, 0.2)' : 'rgba(244, 63, 94, 0.25)',
      glow: isDark ? 'rgba(251, 113, 133, 0.08)' : 'rgba(244, 63, 94, 0.1)',
      icon: <TrendingDownIcon sx={{ fontSize: 20 }} />,
      deltaPct: expensesPct,
      prevAmount: prevExpensesAmount,
      higherIsBetter: false,
    },
    {
      label: 'Net Balance',
      value: `${net >= 0 ? '+' : '-'}${symbol}${fmt(convert(Math.abs(net)))}`,
      color: net >= 0 ? theme.palette.primary.main : theme.palette.error.light,
      gradient:
        net >= 0
          ? isDark
            ? 'linear-gradient(135deg, rgba(129, 140, 248, 0.12) 0%, rgba(99, 102, 241, 0.04) 100%)'
            : 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.05) 100%)'
          : isDark
          ? 'linear-gradient(135deg, rgba(251, 113, 133, 0.12) 0%, rgba(244, 63, 94, 0.04) 100%)'
          : 'linear-gradient(135deg, rgba(244, 63, 94, 0.15) 0%, rgba(244, 63, 94, 0.05) 100%)',
      border:
        net >= 0
          ? isDark
            ? 'rgba(129, 140, 248, 0.2)'
            : 'rgba(99, 102, 241, 0.25)'
          : isDark
          ? 'rgba(251, 113, 133, 0.2)'
          : 'rgba(244, 63, 94, 0.25)',
      glow:
        net >= 0
          ? isDark
            ? 'rgba(129, 140, 248, 0.08)'
            : 'rgba(99, 102, 241, 0.1)'
          : isDark
          ? 'rgba(251, 113, 133, 0.08)'
          : 'rgba(244, 63, 94, 0.1)',
      icon: <AccountBalanceIcon sx={{ fontSize: 20 }} />,
      deltaPct: netPct,
      prevAmount: prevNet,
      higherIsBetter: true,
    },
  ];

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {cards.map((card) => (
        <Grid item xs={12} sm={4} key={card.label}>
          <Card
            sx={{
              background: card.gradient,
              border: `1px solid ${card.border}`,
              boxShadow: `0 4px 24px ${card.glow}, 0 1px 4px rgba(0,0,0,0.3)`,
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: `0 8px 32px ${card.glow}, 0 2px 8px rgba(0,0,0,0.3)`,
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  {card.label}
                </Typography>
                <Box sx={{ color: card.color, opacity: 0.8, display: 'flex' }}>
                  {card.icon}
                </Box>
              </Box>
              <Typography variant="h5" fontWeight={700} sx={{ color: card.color, letterSpacing: '-0.02em' }}>
                {card.value}
              </Typography>
              <DeltaBadge
                pct={card.deltaPct}
                higherIsBetter={card.higherIsBetter}
                prevAmount={card.prevAmount}
                symbol={symbol}
                convert={convert}
              />
              {card.label === 'Expenses' && todayExpenses > 0 && (
                <Typography sx={{ fontSize: '0.65rem', mt: 0.5, color: 'text.disabled', fontWeight: 600 }}>
                  Today: {symbol}
                  {fmt(convert(todayExpenses))}
                </Typography>
              )}
              {card.label === 'Expenses' && projectedExpenses !== null && (
                <Typography sx={{ fontSize: '0.65rem', mt: 0.25, color: 'text.disabled', fontWeight: 500 }}>
                  On pace for {symbol}
                  {fmt(convert(projectedExpenses))}
                </Typography>
              )}
              {card.label === 'Net Balance' && income > 0 && (
                <Typography
                  sx={{
                    fontSize: '0.65rem',
                    mt: 0.5,
                    color: net >= 0 ? theme.palette.success.light : theme.palette.error.light,
                    fontWeight: 600,
                  }}
                >
                  {net >= 0
                    ? `${Math.round((net / income) * 100)}% savings rate`
                    : `${Math.round((Math.abs(net) / income) * 100)}% over income`}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default SummaryCards;
