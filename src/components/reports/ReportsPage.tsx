import React, { useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Skeleton,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import dayjs from 'dayjs';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { Transaction } from '../../types';
import EmptyState from '../EmptyState';

interface Props {
  transactions: Transaction[];
  convert: (hkd: number) => number;
  symbol: string;
  loading?: boolean;
  onAddTransaction?: () => void;
}

const CATEGORY_COLORS = [
  '#6366f1',
  '#f59e0b',
  '#10b981',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#06b6d4',
  '#84cc16',
];

function buildMonthOptions(): Array<{ value: string; label: string }> {
  const options: Array<{ value: string; label: string }> = [];
  for (let i = 0; i < 12; i++) {
    const d = dayjs().subtract(i, 'month');
    options.push({ value: d.format('YYYY-MM'), label: d.format('MMMM YYYY') });
  }
  return options;
}

const ReportsPage: React.FC<Props> = ({ transactions, convert, symbol, loading = false, onAddTransaction }) => {
  const theme = useTheme();
  const monthOptions = useMemo(() => buildMonthOptions(), []);
  const [selectedMonth, setSelectedMonth] = useState<string>(monthOptions[0].value);

  const handleMonthChange = (e: SelectChangeEvent) => setSelectedMonth(e.target.value);

  // Transactions in selected month
  const monthTxns = useMemo(
    () => transactions.filter((t) => dayjs(t.date || t.createdAt).format('YYYY-MM') === selectedMonth),
    [transactions, selectedMonth]
  );

  // 1. Donut data: spending by category (selected month)
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    monthTxns
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const cat = t.category?.trim() || 'Other';
        map[cat] = (map[cat] || 0) + t.amount;
      });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], idx) => ({
        name,
        value,
        color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
      }));
  }, [monthTxns]);

  // 2. Line chart: last 6 months trend (expenses)
  const trendData = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) =>
      dayjs().subtract(5 - i, 'month').startOf('month')
    );
    return months.map((m) => {
      const inMonth = transactions.filter((t) => {
        const d = dayjs(t.date || t.createdAt);
        return d.isValid() && d.isSame(m, 'month');
      });
      const expense = inMonth.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      return { label: m.format('MMM'), expense };
    });
  }, [transactions]);

  // 3. Bar chart: top 5 tags by total spend
  const tagData = useMemo(() => {
    const map: Record<string, { value: number; color?: string }> = {};
    transactions
      .filter((t) => t.type === 'expense' && Array.isArray(t.tags) && t.tags.length > 0)
      .forEach((t) => {
        (t.tags ?? []).forEach((tag) => {
          if (!tag?.name) return;
          if (!map[tag.name]) map[tag.name] = { value: 0, color: tag.color };
          map[tag.name].value += t.amount;
        });
      });
    return Object.entries(map)
      .map(([name, { value, color }], idx) => ({
        name,
        value,
        color: color || CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [transactions]);

  const formatTick = (v: number) => {
    const c = convert(v);
    return c >= 1000 ? `${symbol}${(c / 1000).toFixed(0)}k` : `${symbol}${c}`;
  };

  const cardSx = {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 2,
    bgcolor: theme.palette.background.paper,
    mb: 2.5,
  } as const;

  const sectionLabelSx = {
    display: 'block',
    color: 'text.disabled',
    fontSize: '0.65rem',
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    mb: 1.5,
  } as const;

  // Loading: skeleton charts
  if (loading) {
    return (
      <Box sx={{ pb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h6" fontWeight={700}>
            Reports
          </Typography>
          <Skeleton variant="rounded" width={160} height={36} />
        </Box>
        {[220, 220, 220].map((h, i) => (
          <Card key={i} elevation={0} sx={cardSx}>
            <CardContent>
              <Skeleton variant="text" width={140} sx={{ mb: 1.5 }} />
              <Skeleton variant="rounded" height={h} />
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  }

  const hasAnyData = transactions.length > 0;

  return (
    <Box sx={{ pb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssessmentIcon sx={{ color: 'primary.main' }} />
          <Typography variant="h6" fontWeight={700}>
            Reports
          </Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="reports-month-label">Month</InputLabel>
          <Select
            labelId="reports-month-label"
            value={selectedMonth}
            label="Month"
            onChange={handleMonthChange}
            inputProps={{ 'aria-label': 'Select report month' }}
          >
            {monthOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {!hasAnyData ? (
        <EmptyState
          heading="Nothing to report yet"
          subtext="Add your first transaction to see spending insights here."
          ctaLabel={onAddTransaction ? 'Add transaction' : undefined}
          onCta={onAddTransaction}
        />
      ) : (
        <>
          {/* Donut — Spending by category */}
          <Card elevation={0} sx={cardSx}>
            <CardContent>
              <Typography variant="caption" sx={sectionLabelSx}>
                Spending by Category
              </Typography>
              {categoryData.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                  No expenses in {dayjs(selectedMonth + '-01').format('MMMM YYYY')}.
                </Typography>
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'center', sm: 'flex-start' },
                    gap: 3,
                  }}
                >
                  <Box sx={{ width: { xs: 200, sm: 220 }, height: { xs: 200, sm: 220 }, flexShrink: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius="55%"
                          outerRadius="80%"
                          paddingAngle={2}
                        >
                          {categoryData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => {
                            const num = typeof value === 'number' ? value : 0;
                            return [`${symbol}${convert(num).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, ''] as [string, string];
                          }}
                          contentStyle={{
                            background: theme.palette.background.paper,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 8,
                            fontSize: '0.78rem',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                  <Box sx={{ flex: 1, width: '100%' }}>
                    {categoryData.map((cat) => {
                      const total = categoryData.reduce((s, c) => s + c.value, 0);
                      const pct = total > 0 ? Math.round((cat.value / total) * 100) : 0;
                      return (
                        <Box key={cat.name} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: cat.color, flexShrink: 0 }} />
                          <Typography sx={{ fontSize: '0.82rem', flex: 1 }}>{cat.name}</Typography>
                          <Typography sx={{ fontSize: '0.82rem', fontWeight: 700 }}>
                            {symbol}{convert(cat.value).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </Typography>
                          <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled', minWidth: 30, textAlign: 'right' }}>
                            {pct}%
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Line — Monthly trend (last 6 months) */}
          <Card elevation={0} sx={cardSx}>
            <CardContent>
              <Typography variant="caption" sx={sectionLabelSx}>
                Monthly Trend (Last 6 Months)
              </Typography>
              {trendData.every((d) => d.expense === 0) ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                  No spending in the last 6 months.
                </Typography>
              ) : (
                <Box sx={{ width: '100%', height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                      <CartesianGrid stroke={alpha(theme.palette.text.secondary, 0.12)} vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                        axisLine={{ stroke: alpha(theme.palette.text.secondary, 0.25) }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                        axisLine={{ stroke: alpha(theme.palette.text.secondary, 0.25) }}
                        tickLine={false}
                        tickFormatter={formatTick}
                      />
                      <Tooltip
                        formatter={(value) => {
                          const num = typeof value === 'number' ? value : 0;
                          return [`${symbol}${convert(num).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, 'Spending'] as [string, string];
                        }}
                        contentStyle={{
                          background: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 8,
                          fontSize: '0.78rem',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="expense"
                        stroke={theme.palette.primary.main}
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: theme.palette.primary.main }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Bar — Top 5 tags */}
          <Card elevation={0} sx={cardSx}>
            <CardContent>
              <Typography variant="caption" sx={sectionLabelSx}>
                Top Tags
              </Typography>
              {tagData.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                  Tag a few expenses to see your top tags here.
                </Typography>
              ) : (
                <Box sx={{ width: '100%', height: Math.max(180, tagData.length * 48) }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={tagData}
                      layout="vertical"
                      margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
                    >
                      <CartesianGrid stroke={alpha(theme.palette.text.secondary, 0.12)} horizontal={false} />
                      <XAxis
                        type="number"
                        tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                        axisLine={{ stroke: alpha(theme.palette.text.secondary, 0.25) }}
                        tickLine={false}
                        tickFormatter={formatTick}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={100}
                        tick={{ fill: theme.palette.text.primary, fontSize: 12 }}
                        axisLine={{ stroke: alpha(theme.palette.text.secondary, 0.25) }}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(value) => {
                          const num = typeof value === 'number' ? value : 0;
                          return [`${symbol}${convert(num).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, 'Total'] as [string, string];
                        }}
                        cursor={{ fill: alpha(theme.palette.text.secondary, 0.08) }}
                        contentStyle={{
                          background: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 8,
                          fontSize: '0.78rem',
                        }}
                      />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                        {tagData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
};

export default ReportsPage;
