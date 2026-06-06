import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Skeleton,
  Chip,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import dayjs from 'dayjs';
import { Transaction } from '../../types';
import { getMonthlyReport, MonthlyReportEntry } from '../../services/api';

interface Props {
  transactions: Transaction[];
  convert: (hkd: number) => number;
  symbol: string;
}

const CATEGORY_COLORS = [
  '#6366f1',
  '#f59e0b',
  '#10b981',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
];

const SpendingInsightsPage: React.FC<Props> = ({ transactions, convert, symbol }) => {
  const theme = useTheme();
  const [report, setReport] = useState<MonthlyReportEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    getMonthlyReport(6)
      .then(setReport)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const currentMonth = dayjs().format('YYYY-MM');
  const prevMonth = dayjs().subtract(1, 'month').format('YYYY-MM');

  const currentMonthTxns = useMemo(
    () => transactions.filter((t) => dayjs(t.date || t.createdAt).format('YYYY-MM') === currentMonth),
    [transactions, currentMonth]
  );

  const prevMonthTxns = useMemo(
    () => transactions.filter((t) => dayjs(t.date || t.createdAt).format('YYYY-MM') === prevMonth),
    [transactions, prevMonth]
  );

  const currentExpenses = useMemo(
    () => currentMonthTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    [currentMonthTxns]
  );

  const prevExpenses = useMemo(
    () => prevMonthTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    [prevMonthTxns]
  );

  const daysInMonth = dayjs().daysInMonth();
  const dayOfMonth = dayjs().date();
  const avgDailySpend = dayOfMonth > 0 ? currentExpenses / dayOfMonth : 0;

  const topCategories = useMemo(() => {
    const map: Record<string, number> = {};
    currentMonthTxns
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const cat = t.category || 'Other';
        map[cat] = (map[cat] || 0) + t.amount;
      });
    const total = Object.values(map).reduce((s, v) => s + v, 0);
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat, amount]) => ({ cat, amount, pct: total > 0 ? Math.round((amount / total) * 100) : 0 }));
  }, [currentMonthTxns]);

  const forecastCategories = useMemo(() => {
    const currentMonth = dayjs().startOf('month');
    const monthKeys = Array.from({ length: 3 }, (_, idx) => currentMonth.subtract(idx + 1, 'month').format('YYYY-MM'));
    const daysInMonth = dayjs().daysInMonth();
    const dayOfMonth = dayjs().date();
    const remainingDays = Math.max(daysInMonth - dayOfMonth, 0);

    const historicalByCategory: Record<string, Record<string, number>> = {};
    const currentMonthByCategory: Record<string, number> = {};

    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const key = dayjs(t.date || t.createdAt).format('YYYY-MM');
        const category = t.category || 'Other';

        if (monthKeys.includes(key)) {
          if (!historicalByCategory[category]) historicalByCategory[category] = {};
          historicalByCategory[category][key] = (historicalByCategory[category][key] || 0) + t.amount;
        }

        if (key === dayjs().format('YYYY-MM')) {
          currentMonthByCategory[category] = (currentMonthByCategory[category] || 0) + t.amount;
        }
      });

    return Object.entries(historicalByCategory)
      .map(([category, monthly]) => {
        const historicalSpendMonths = monthKeys.filter((m) => typeof monthly[m] === 'number');
        if (historicalSpendMonths.length < 3) return null;

        const historicalTotal = monthKeys.reduce((sum, m) => sum + (monthly[m] || 0), 0);
        const averageMonthly = historicalTotal / 3;
        const avgDailySpend = averageMonthly / daysInMonth;
        const currentSpend = currentMonthByCategory[category] || 0;
        const forecastRemaining = Math.max(avgDailySpend * remainingDays, 0);

        return {
          category,
          actualSpend: currentSpend,
          forecastRemainingSpend: forecastRemaining,
          forecastTotal: currentSpend + forecastRemaining,
        };
      })
      .filter((item): item is { category: string; actualSpend: number; forecastRemainingSpend: number; forecastTotal: number } => item !== null)
      .filter((item) => item.forecastRemainingSpend > 0)
      .sort((a, b) => b.forecastRemainingSpend - a.forecastRemainingSpend)
      .slice(0, 5);
  }, [transactions]);

  const forecastChartData = useMemo(
    () =>
      forecastCategories.map((entry) => ({
        category: entry.category,
        Actual: Math.round(convert(entry.actualSpend)),
        Forecast: Math.round(convert(entry.forecastTotal)),
      })),
    [forecastCategories, convert],
  );

  const biggestExpense = useMemo(
    () =>
      currentMonthTxns
        .filter((t) => t.type === 'expense')
        .sort((a, b) => b.amount - a.amount)[0] ?? null,
    [currentMonthTxns]
  );

  const spendDelta = prevExpenses > 0 ? ((currentExpenses - prevExpenses) / prevExpenses) * 100 : null;

  const chartData = report.map((entry) => ({
    label: dayjs(entry.month + '-01').format('MMM'),
    Income: Math.round(convert(entry.income)),
    Expenses: Math.round(convert(entry.expenses)),
  }));

  const incomeColor = theme.palette.success.main;
  const expenseColor = theme.palette.error.main;
  const cardBg = theme.palette.background.paper;
  const mutedText = theme.palette.text.secondary;
  const forecastBase = theme.palette.warning.main;
  const forecastAccent = theme.palette.info.main;

  return (
    <Box sx={{ pb: 4 }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2.5 }}>
        Spending Insights
      </Typography>

      {/* Month comparison summary */}
      {spendDelta !== null && (
        <Box
          sx={{
            mb: 2.5,
            py: 1.25,
            px: 2,
            borderRadius: 2,
            bgcolor: alpha(
              spendDelta <= 0 ? theme.palette.success.main : theme.palette.error.main,
              0.1
            ),
            border: `1px solid ${alpha(
              spendDelta <= 0 ? theme.palette.success.main : theme.palette.error.main,
              0.25
            )}`,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          {spendDelta <= 0 ? (
            <TrendingDownIcon sx={{ color: theme.palette.success.main, fontSize: 20 }} />
          ) : (
            <TrendingUpIcon sx={{ color: theme.palette.error.main, fontSize: 20 }} />
          )}
          <Typography
            sx={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: spendDelta <= 0 ? theme.palette.success.main : theme.palette.error.main,
            }}
          >
            You spent {Math.abs(Math.round(spendDelta))}%{' '}
            {spendDelta <= 0 ? 'less' : 'more'} than last month
          </Typography>
        </Box>
      )}

      {/* Bar chart — 6-month income vs expenses */}
      <Card elevation={0} sx={{ mb: 2.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 2, bgcolor: cardBg }}>
        <CardContent sx={{ pb: '12px !important' }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
            Income vs Expenses — last 6 months
          </Typography>
          {loading ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 1.5, py: 1 }}>
              {Array.from({ length: 6 }).map((_, idx) => (
                <Skeleton key={idx} variant="rounded" height={200} />
              ))}
            </Box>
          ) : error ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
              Could not load report data.
            </Typography>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barGap={4} barCategoryGap="30%" data-testid="insights-chart">
              <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: mutedText }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: mutedText }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${symbol}${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`}
                  width={45}
                />
                <Tooltip
                  formatter={(value) => `${symbol}${convert(Number(value)).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                  contentStyle={{
                    background: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Income" fill={incomeColor} radius={[3, 3, 0, 0]} />
                <Bar dataKey="Expenses" fill={expenseColor} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Spending forecast — category projection */}
      {forecastChartData.length > 0 && (
        <Card elevation={0} sx={{ mb: 2.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 2, bgcolor: cardBg }}>
          <CardContent sx={{ pb: '12px !important' }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
              Spending Forecast
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.25 }}>
              Projected remaining spend by category based on the last 3 months.
            </Typography>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={forecastChartData} barGap={4} barCategoryGap="30%" data-testid="forecast-chart">
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 11, fill: mutedText }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={40}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: mutedText }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${symbol}${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`}
                  width={45}
                />
                <Tooltip
                  formatter={(value) => `${symbol}${convert(Number(value)).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                  contentStyle={{
                    background: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Actual" fill={forecastBase} radius={[3, 3, 0, 0]} />
                <Bar dataKey="Forecast" fill={forecastAccent} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            <Box sx={{ mt: 1.5, display: 'grid', gap: 0.75 }}>
              {forecastCategories.map((entry) => (
                <Box
                  key={entry.category}
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {entry.category}
                  </Typography>
                  <Typography variant="caption" sx={{ color: mutedText }}>
                    {symbol}
                    {convert(entry.forecastRemainingSpend).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    {' '}
                    remaining
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Stats row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2.5 }}>
        <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, bgcolor: cardBg }}>
          <CardContent sx={{ pb: '12px !important' }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}>
              Avg daily spend
            </Typography>
            <Typography variant="h6" fontWeight={700} sx={{ mt: 0.5, fontSize: '1.1rem' }}>
              {symbol}{convert(avgDailySpend).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              day {dayOfMonth} of {daysInMonth}
            </Typography>
          </CardContent>
        </Card>

        <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, bgcolor: cardBg }}>
          <CardContent sx={{ pb: '12px !important' }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}>
              Biggest expense
            </Typography>
            {biggestExpense ? (
              <>
                <Typography variant="h6" fontWeight={700} sx={{ mt: 0.5, fontSize: '1.1rem' }}>
                  {symbol}{convert(biggestExpense.amount).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: '0.7rem', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {biggestExpense.item || biggestExpense.description}
                </Typography>
              </>
            ) : (
              <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                No expenses yet
              </Typography>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Top 3 categories */}
      <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, bgcolor: cardBg }}>
        <CardContent sx={{ pb: '12px !important' }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
            Top categories this month
          </Typography>
          {topCategories.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No expenses this month.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              {topCategories.map(({ cat, amount, pct }, i) => (
                <Box key={cat}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
                          flexShrink: 0,
                        }}
                      />
                      <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.85rem' }}>
                        {cat}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.85rem' }}>
                        {symbol}{convert(amount).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </Typography>
                      <Chip
                        label={`${pct}%`}
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          bgcolor: alpha(CATEGORY_COLORS[i % CATEGORY_COLORS.length], 0.15),
                          color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
                          '& .MuiChip-label': { px: 0.75 },
                        }}
                      />
                    </Box>
                  </Box>
                  <Box sx={{ height: 4, borderRadius: 2, bgcolor: theme.palette.divider, overflow: 'hidden' }}>
                    <Box
                      sx={{
                        height: '100%',
                        width: `${pct}%`,
                        borderRadius: 2,
                        bgcolor: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
                      }}
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default SpendingInsightsPage;
