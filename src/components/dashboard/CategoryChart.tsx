import React, { useMemo } from 'react';
import { Typography, Card, CardContent, useTheme, useMediaQuery } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Transaction } from '../../types';

interface Props {
  transactions: Transaction[];
}

const COLORS = ['#818cf8', '#34d399', '#fb7185', '#fbbf24', '#38bdf8', '#a78bfa', '#f472b6'];

const CategoryChart: React.FC<Props> = ({ transactions }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
    <Card sx={{ mb: 3, p: 0 }}>
      <CardContent sx={{ p: 3 }}>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontWeight: 600,
            fontSize: '0.7rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            display: 'block',
            mb: 2,
          }}
        >
          Spending by Category
        </Typography>
        <ResponsiveContainer width="100%" height={isMobile ? 160 : 220}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={3}
            >
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} opacity={0.9} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [`HK$${Number(value).toLocaleString()}`, '']}
              contentStyle={{
                background: '#1e293b',
                border: '1px solid rgba(148,163,184,0.1)',
                borderRadius: 8,
                color: '#f1f5f9',
                fontSize: 13,
              }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default CategoryChart;
