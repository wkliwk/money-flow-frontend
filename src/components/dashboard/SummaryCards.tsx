import React from 'react';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
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

const SummaryCards: React.FC<Props> = ({ transactions, prevMonthTransactions, convert, symbol }) => {
  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const net = income - expenses;

  const prevExpenses = (prevMonthTransactions ?? [])
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const expenseDelta = prevMonthTransactions && prevMonthTransactions.length > 0 ? expenses - prevExpenses : null;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayExpenses = transactions
    .filter((t) => t.type === 'expense' && (t.date || t.createdAt || '').startsWith(todayStr))
    .reduce((sum, t) => sum + t.amount, 0);

  const now = new Date();
  const daysElapsed = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const isCurrentMonth = transactions.some((t) => (t.date || t.createdAt || '').startsWith(todayStr.slice(0, 7)));
  const projectedExpenses = isCurrentMonth && expenses > 0 && daysElapsed < daysInMonth
    ? (expenses / daysElapsed) * daysInMonth
    : null;

  const cards = [
    {
      label: 'Income',
      value: `+${symbol}${fmt(convert(income))}`,
      color: '#34d399',
      gradient: 'linear-gradient(135deg, rgba(52, 211, 153, 0.12) 0%, rgba(16, 185, 129, 0.04) 100%)',
      border: 'rgba(52, 211, 153, 0.2)',
      glow: 'rgba(52, 211, 153, 0.08)',
      icon: <TrendingUpIcon sx={{ fontSize: 20 }} />,
    },
    {
      label: 'Expenses',
      value: `-${symbol}${fmt(convert(expenses))}`,
      color: '#fb7185',
      gradient: 'linear-gradient(135deg, rgba(251, 113, 133, 0.12) 0%, rgba(244, 63, 94, 0.04) 100%)',
      border: 'rgba(251, 113, 133, 0.2)',
      glow: 'rgba(251, 113, 133, 0.08)',
      icon: <TrendingDownIcon sx={{ fontSize: 20 }} />,
    },
    {
      label: 'Net Balance',
      value: `${net >= 0 ? '+' : '-'}${symbol}${fmt(convert(Math.abs(net)))}`,
      color: net >= 0 ? '#818cf8' : '#fb7185',
      gradient: net >= 0
        ? 'linear-gradient(135deg, rgba(129, 140, 248, 0.12) 0%, rgba(99, 102, 241, 0.04) 100%)'
        : 'linear-gradient(135deg, rgba(251, 113, 133, 0.12) 0%, rgba(244, 63, 94, 0.04) 100%)',
      border: net >= 0 ? 'rgba(129, 140, 248, 0.2)' : 'rgba(251, 113, 133, 0.2)',
      glow: net >= 0 ? 'rgba(129, 140, 248, 0.08)' : 'rgba(251, 113, 133, 0.08)',
      icon: <AccountBalanceIcon sx={{ fontSize: 20 }} />,
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
              {card.label === 'Expenses' && todayExpenses > 0 && (
                <Typography sx={{ fontSize: '0.65rem', mt: 0.5, color: 'text.disabled', fontWeight: 600 }}>
                  Today: {symbol}{fmt(convert(todayExpenses))}
                </Typography>
              )}
              {card.label === 'Expenses' && projectedExpenses !== null && (
                <Typography sx={{ fontSize: '0.65rem', mt: 0.25, color: 'text.disabled', fontWeight: 500 }}>
                  On pace for {symbol}{fmt(convert(projectedExpenses))}
                </Typography>
              )}
              {card.label === 'Expenses' && expenseDelta !== null && (
                <Typography sx={{ fontSize: '0.65rem', mt: 0.25, color: expenseDelta > 0 ? '#fb7185' : '#34d399', fontWeight: 600 }}>
                  {expenseDelta > 0 ? '↑' : '↓'} {symbol}{fmt(convert(Math.abs(expenseDelta)))} vs last month
                </Typography>
              )}
              {card.label === 'Net Balance' && income > 0 && (
                <Typography sx={{ fontSize: '0.65rem', mt: 0.5, color: net >= 0 ? '#34d399' : '#fb7185', fontWeight: 600 }}>
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
