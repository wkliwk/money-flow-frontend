import React, { useMemo, useState } from 'react';
import { Box, Typography, Card, CardContent, useTheme } from '@mui/material';
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
  convert: (hkd: number) => number;
  symbol: string;
}

const TrendsChart: React.FC<Props> = ({ transactions, onMonthSelect, convert, symbol }) => {
  const theme = useTheme();
  const [showYtd, setShowYtd] = useState(false);

  const data = useMemo(() => {
    const months = showYtd
      ? Array.from({ length: dayjs().month() + 1 }, (_, i) =>
          dayjs().startOf('year').add(i, 'month')
        )
      : Array.from({ length: 6 }, (_, i) =>
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
  }, [transactions, showYtd]);

  const allZero = data.every((d) => d.income === 0 && d.expense === 0);
  if (allZero) return null;

  const formatValue = (v: number) => {
    const c = convert(v);
    return c >= 1000 ? `${symbol}${(c / 1000).toFixed(0)}k` : `${symbol}${c}`;
  };

  const handleBarClick = (e: unknown) => {
    const label = (e as { activeLabel?: string })?.activeLabel;
    if (!label) return;
    const idx = data.findIndex((d) => d.label === label);
    if (idx !== -1) onMonthSelect(data[idx].month);
  };

  const incomeColor = theme.palette.success.main;
  const expenseColor = theme.palette.error.main;
  const netColor = theme.palette.primary.main;
  const tickColor = theme.palette.text.secondary;
  const bgPaper = theme.palette.background.paper;

  return (
    <Card sx={{ mb: 3 }}>
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
            {showYtd ? `${dayjs().year()} Year to Date` : '6-Month Trends'}
          </Typography>
          <Typography
            variant="caption"
            onClick={() => setShowYtd((v) => !v)}
            sx={{ fontSize: '0.68rem', color: showYtd ? 'primary.main' : 'text.disabled', fontWeight: 600, cursor: 'pointer', userSelect: 'none', letterSpacing: '0.03em' }}
          >
            {showYtd ? '6M' : 'YTD'}
          </Typography>
        </Box>

        {/* Legend */}
        <Box sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
            <Typography variant="caption" color="text.secondary">Income</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main' }} />
            <Typography variant="caption" color="text.secondary">Expense</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 16, height: 2, bgcolor: 'primary.main', borderRadius: 1 }} />
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
              tick={{ fill: tickColor, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatValue}
              tick={{ fill: tickColor, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <Tooltip
              formatter={(value, name) => {
                const n = convert(Number(value));
                if (name === 'Net') {
                  const sign = n >= 0 ? '+' : '';
                  return [`${sign}${symbol}${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, 'Net'];
                }
                return [`${symbol}${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, name as string];
              }}
              contentStyle={{
                background: bgPaper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 8,
                color: theme.palette.text.primary,
                fontSize: 12,
              }}
              cursor={{ fill: theme.palette.action.hover }}
            />
            <ReferenceLine y={0} stroke={theme.palette.divider} strokeDasharray="3 3" />
            <Bar dataKey="income" name="Income" radius={[4, 4, 0, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={incomeColor} fillOpacity={0.85} />
              ))}
            </Bar>
            <Bar dataKey="expense" name="Expense" radius={[4, 4, 0, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={expenseColor} fillOpacity={0.85} />
              ))}
            </Bar>
            <Line
              type="monotone"
              dataKey="net"
              name="Net"
              stroke={netColor}
              strokeWidth={2}
              dot={(props: Record<string, unknown>) => {
                const { cx, cy, payload } = props as { cx: number; cy: number; payload: { label: string; net: number } };
                return (
                  <circle
                    key={payload.label}
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill={payload.net >= 0 ? incomeColor : expenseColor}
                    stroke={bgPaper}
                    strokeWidth={1.5}
                  />
                );
              }}
              activeDot={{ r: 5, strokeWidth: 1.5, stroke: bgPaper }}
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
