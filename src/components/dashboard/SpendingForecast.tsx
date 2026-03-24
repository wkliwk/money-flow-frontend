import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Transaction } from '../../types';
import dayjs from 'dayjs';

interface Props {
  transactions: Transaction[];
  convert: (amount: number) => number;
  symbol: string;
}

const SpendingForecast: React.FC<Props> = ({ transactions, convert, symbol }) => {
  const forecastData = useMemo(() => {
    if (transactions.length === 0) return null;

    const now = dayjs();
    const currentMonth = now.month();
    const currentYear = now.year();
    const daysInMonth = now.daysInMonth();
    const daysRemaining = daysInMonth - now.date() + 1;

    // Get last 3 months of expense data grouped by category
    const threMonthsAgo = now.subtract(3, 'month');
    const categoryData: Record<
      string,
      { monthCounts: number; totalByMonth: Record<string, number> }
    > = {};

    transactions.forEach((t) => {
      if (t.type !== 'expense') return;
      const tDate = dayjs(t.date || t.createdAt);
      if (tDate.isBefore(threMonthsAgo)) return;

      const category = t.category || 'Other';
      if (!categoryData[category]) {
        categoryData[category] = { monthCounts: 0, totalByMonth: {} };
      }

      const monthKey = tDate.format('YYYY-MM');
      if (!categoryData[category].totalByMonth[monthKey]) {
        categoryData[category].totalByMonth[monthKey] = 0;
      }
      categoryData[category].totalByMonth[monthKey] += t.amount;
    });

    // Filter categories with 3+ months of data and calculate averages
    const forecastMap: Record<string, { avg: number; forecast: number }> = {};
    Object.entries(categoryData).forEach(([category, data]) => {
      const monthCount = Object.keys(data.totalByMonth).length;
      if (monthCount < 3) return; // Skip categories with less than 3 months

      const totalSpend = Object.values(data.totalByMonth).reduce((a, b) => a + b, 0);
      const avgPerDay = totalSpend / (monthCount * 30); // Approximate month as 30 days
      const forecast = avgPerDay * daysRemaining;

      forecastMap[category] = { avg: avgPerDay, forecast };
    });

    if (Object.keys(forecastMap).length === 0) return null;

    // Get actual spending so far this month
    const actualByCategory: Record<string, number> = {};
    transactions.forEach((t) => {
      if (t.type !== 'expense') return;
      const tDate = dayjs(t.date || t.createdAt);
      if (!tDate.isSame(now, 'month')) return;

      const category = t.category || 'Other';
      actualByCategory[category] = (actualByCategory[category] || 0) + t.amount;
    });

    // Build chart data
    const chartData = Object.entries(forecastMap)
      .sort(([, a], [, b]) => b.forecast - a.forecast)
      .map(([category, data]) => ({
        category,
        actual: actualByCategory[category] || 0,
        forecast: data.forecast,
        projected: (actualByCategory[category] || 0) + data.forecast,
      }));

    return {
      chartData,
      daysRemaining,
      totalForecast: Object.values(forecastMap).reduce(
        (sum, d) => sum + d.forecast,
        0
      ),
      totalProjected:
        Object.values(actualByCategory).reduce((a, b) => a + b, 0) +
        Object.values(forecastMap).reduce((sum, d) => sum + d.forecast, 0),
    };
  }, [transactions]);

  if (!forecastData) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
            Spending Forecast
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Not enough data to forecast. Need at least 3 months of transaction history.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
          Spending Forecast — {forecastData.daysRemaining} days remaining this month
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            Projected spending (remaining + actual):
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#818cf8' }}>
            {symbol}{convert(forecastData.totalProjected).toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}
          </Typography>
        </Box>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={forecastData.chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
            <XAxis dataKey="category" stroke="rgba(148,163,184,0.5)" />
            <YAxis stroke="rgba(148,163,184,0.5)" />
            <Tooltip
              formatter={(val: any) =>
                `${symbol}${convert(val as number).toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}`
              }
              contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: 'none' }}
            />
            <Legend />
            <Bar dataKey="actual" fill="#34d399" name="Actual (MTD)" />
            <Bar dataKey="forecast" fill="#818cf8" name="Forecast (remaining)" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default SpendingForecast;
