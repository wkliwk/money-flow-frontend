import React from 'react';
import { Grid, Card, CardContent, Typography } from '@mui/material';
import { Transaction } from '../../types';

interface Props {
  transactions: Transaction[];
}

const fmt = (n: number) =>
  n.toLocaleString('en-HK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const SummaryCards: React.FC<Props> = ({ transactions }) => {
  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const net = income - expenses;

  const cards = [
    { label: 'Total Income', value: `+HK$${fmt(income)}`, color: 'success.main' },
    { label: 'Total Expenses', value: `-HK$${fmt(expenses)}`, color: 'error.main' },
    {
      label: 'Net Balance',
      value: `${net >= 0 ? '+' : '-'}HK$${fmt(Math.abs(net))}`,
      color: net >= 0 ? 'success.main' : 'error.main',
    },
  ];

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {cards.map((card) => (
        <Grid item xs={12} sm={4} key={card.label}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {card.label}
              </Typography>
              <Typography variant="h5" fontWeight={600} color={card.color}>
                {card.value}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default SummaryCards;
