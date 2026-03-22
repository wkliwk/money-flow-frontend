import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Transaction } from '../../types';

interface Props {
  transactions: Transaction[];
}

const COLORS = ['#2196f3', '#f44336', '#4caf50', '#ff9800', '#9c27b0', '#00bcd4', '#795548'];

const CategoryChart: React.FC<Props> = ({ transactions }) => {
  const data = useMemo(() => {
    const expenses = transactions.filter((t) => t.type === 'expense');
    if (expenses.length === 0) return [];

    const totals: Record<string, number> = {};
    expenses.forEach((t) => {
      const key = t.category?.trim() || 'Other';
      totals[key] = (totals[key] || 0) + t.amount;
    });

    const sorted = Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    if (sorted.length <= 6) return sorted;

    const top5 = sorted.slice(0, 6);
    const otherValue = sorted.slice(6).reduce((sum, d) => sum + d.value, 0);
    return [...top5, { name: 'Other', value: otherValue }];
  }, [transactions]);

  if (data.length === 0) return null;

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Spending by Category
      </Typography>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `HK$${Number(value).toLocaleString()}`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default CategoryChart;
