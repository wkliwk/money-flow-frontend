import React, { useMemo } from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import dayjs, { Dayjs } from 'dayjs';
import { Transaction } from '../../types';

interface Props {
  transactions: Transaction[];
  onMonthSelect: (month: Dayjs) => void;
}

const TrendsChart: React.FC<Props> = ({ transactions, onMonthSelect }) => {
  const data = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) =>
      dayjs().subtract(5 - i, 'month').startOf('month')
    );

    return months.map((m) => {
      const inMonth = transactions.filter((t) => {
        const d = dayjs(t.date || t.createdAt);
        return d.isValid() && d.isSame(m, 'month');
      });
      const income = inMonth.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expense = inMonth.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const net = income - expense;
      return { label: m.format('MMM'), month: m, income, expense, net };
    });
  }, [transactions]);

  const allZero = data.every((d) => d.income === 0 && d.expense === 0);
  if (allZero) return null;

  const formatValue = (v: number) =>
    v >= 1000 ? `HK$${(v / 1000).toFixed(0)}k` : `HK$${v}`;

  const handleBarClick = (e: unknown) => {
    const label = (e as { activeLabel?: string })?.activeLabel;
    if (!label) return;
    const idx = data.findIndex((d) => d.label === label);
    if (idx !== -1) onMonthSelect(data[idx].month);
  };

  return (
    <Card sx={{ mb: 3 }}>
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
          6-Month Trends
        </Typography>

        {/* Legend */}
        <Box sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#34d399' }} />
            <Typography variant="caption" color="text.secondary">Income</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#fb7185' }} />
            <Typography variant="caption" color="text.secondary">Expense</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 16, height: 2, bgcolor: '#818cf8', borderRadius: 1 }} />
            <Typography variant="caption" color="text.secondary">Net</Typography>
          </Box>
        </Box>

        <ResponsiveContainer width="100%" height={180}>
          <ComposedChart
            data={data}
            barCategoryGap="30%"
            barGap={3}
            onClick={handleBarClick}
            style={{ cursor: 'pointer' }}
          >
            <XAxis
              dataKey="label"
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatValue}
              tick={{ fill: '#64748b', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <Tooltip
              formatter={(value, name) => {
                const n = Number(value);
                if (name === 'Net') {
                  const sign = n >= 0 ? '+' : '';
                  return [`${sign}HK$${n.toLocaleString()}`, 'Net'];
                }
                return [`HK$${n.toLocaleString()}`, name as string];
              }}
              contentStyle={{
                background: '#1e293b',
                border: '1px solid rgba(148,163,184,0.1)',
                borderRadius: 8,
                color: '#f1f5f9',
                fontSize: 12,
              }}
              cursor={{ fill: 'rgba(148,163,184,0.05)' }}
            />
            <ReferenceLine y={0} stroke="rgba(148,163,184,0.15)" strokeDasharray="3 3" />
            <Bar dataKey="income" name="Income" radius={[4, 4, 0, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill="#34d399" fillOpacity={0.85} />
              ))}
            </Bar>
            <Bar dataKey="expense" name="Expense" radius={[4, 4, 0, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill="#fb7185" fillOpacity={0.85} />
              ))}
            </Bar>
            <Line
              type="monotone"
              dataKey="net"
              name="Net"
              stroke="#818cf8"
              strokeWidth={2}
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                return (
                  <circle
                    key={payload.label}
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill={payload.net >= 0 ? '#34d399' : '#fb7185'}
                    stroke="#1e293b"
                    strokeWidth={1.5}
                  />
                );
              }}
              activeDot={{ r: 5, strokeWidth: 1.5, stroke: '#1e293b' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', textAlign: 'center', mt: 0.5, fontSize: '0.65rem' }}>
          Tap a month to filter
        </Typography>
      </CardContent>
    </Card>
  );
};

export default TrendsChart;
