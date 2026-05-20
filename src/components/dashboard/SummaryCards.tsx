import React from 'react';
import { Grid, Card, CardContent, Typography, Box, Tooltip } from '@mui/material';
import { Transaction } from '../../types';
import { tokens } from '../../theme';

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
  if (pct === null || prevAmount === null) return null;
  const favorable = higherIsBetter ? pct >= 0 : pct <= 0;
  const color = favorable ? tokens.income : tokens.expense;
  const arrow = pct > 0 ? '↑' : pct < 0 ? '↓' : '→';
  const absPct = Math.abs(pct);
  const label = pct === 0 ? '→ 0%' : `${arrow}${absPct}%`;
  const tooltipText = `vs ${symbol}${fmt(convert(prevAmount))} last month`;

  return (
    <Tooltip title={tooltipText} arrow placement="bottom">
      <Typography
        component="span"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px',
          fontSize: '0.72rem',
          fontWeight: 500,
          mt: 1,
          color,
          cursor: 'default',
          fontFamily: `'Plus Jakarta Sans', sans-serif`,
        }}
      >
        {label} vs last month
      </Typography>
    </Tooltip>
  );
};

const SummaryCards: React.FC<Props> = ({ transactions, prevMonthTransactions, convert, symbol }) => {
  const income = transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const net = income - expenses;

  const hasPrev = prevMonthTransactions !== undefined && prevMonthTransactions.length > 0;
  const prevIncome = hasPrev
    ? prevMonthTransactions!.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
    : null;
  const prevExpensesAmount = hasPrev
    ? prevMonthTransactions!.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
    : null;
  const prevNet = prevIncome !== null && prevExpensesAmount !== null ? prevIncome - prevExpensesAmount : null;

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

  const savingsRate = income > 0 ? Math.round((net / income) * 100) : null;

  const cards = [
    {
      label: 'Income',
      value: `+${symbol}${fmt(convert(income))}`,
      valueColor: tokens.income,
      accent: false,
      deltaPct: incomePct,
      prevAmount: prevIncome,
      higherIsBetter: true,
      subtext: null,
    },
    {
      label: 'Expenses',
      value: `-${symbol}${fmt(convert(expenses))}`,
      valueColor: tokens.expense,
      accent: false,
      deltaPct: expensesPct,
      prevAmount: prevExpensesAmount,
      higherIsBetter: false,
      subtext: todayExpenses > 0 ? `Today: ${symbol}${fmt(convert(todayExpenses))}${projectedExpenses ? ` · pace ${symbol}${fmt(convert(projectedExpenses))}` : ''}` : null,
    },
    {
      label: 'Net Balance',
      value: `${net >= 0 ? '+' : '-'}${symbol}${fmt(convert(Math.abs(net)))}`,
      valueColor: net >= 0 ? tokens.primary : tokens.expense,
      accent: true,
      deltaPct: netPct,
      prevAmount: prevNet,
      higherIsBetter: true,
      subtext: savingsRate !== null
        ? (net < 0
          ? `Over income: ${symbol}${fmt(convert(Math.abs(net)))}`
          : `Savings rate: ${Math.max(0, savingsRate)}%`)
        : null,
    },
  ];

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {cards.map((card) => (
        <Grid item xs={12} sm={4} key={card.label}>
          <Card
            sx={{
              background: card.accent ? tokens.primaryLight : tokens.surface,
              border: `1px solid ${card.accent ? tokens.primaryBorder : tokens.border}`,
              borderRadius: '16px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
              },
            }}
          >
            <CardContent sx={{ p: '20px 24px', '&:last-child': { pb: '20px' } }}>
              <Typography
                sx={{
                  fontFamily: `'Plus Jakarta Sans', sans-serif`,
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: tokens.text3,
                  letterSpacing: '0.03em',
                  mb: 1,
                }}
              >
                {card.label}
              </Typography>
              <Typography
                sx={{
                  fontFamily: `'Space Grotesk', sans-serif`,
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: card.valueColor,
                  letterSpacing: '-1px',
                  lineHeight: 1.1,
                }}
              >
                {card.value}
              </Typography>
              <DeltaBadge
                pct={card.deltaPct}
                higherIsBetter={card.higherIsBetter}
                prevAmount={card.prevAmount}
                symbol={symbol}
                convert={convert}
              />
              {card.subtext && (
                <Typography sx={{ fontFamily: `'Plus Jakarta Sans', sans-serif`, fontSize: '0.7rem', color: tokens.text3, mt: 0.5, fontWeight: 500 }}>
                  {card.subtext}
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
