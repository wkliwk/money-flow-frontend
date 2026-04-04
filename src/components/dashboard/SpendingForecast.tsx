import React, { useMemo } from 'react';
import { Box, Typography, LinearProgress, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import dayjs, { Dayjs } from 'dayjs';
import { Transaction } from '../../types';
import { ITEM_PRESETS } from '../expenses/ItemPicker';

interface Props {
  transactions: Transaction[];
  budgets: Record<string, number>;
  selectedMonth: Dayjs | null;
  convert: (hkd: number) => number;
  symbol: string;
}

interface CategoryForecast {
  category: string;
  spent: number;
  projected: number;
  budget: number | null;
  status: 'on-track' | 'near-limit' | 'over-budget' | 'no-budget';
}

const ITEM_TO_CATEGORY: Record<string, string> = {};
ITEM_PRESETS.forEach((p) => { ITEM_TO_CATEGORY[p.label] = p.category; });

function getDaysInfo(month: Dayjs): { elapsed: number; total: number } {
  const now = dayjs();
  const total = month.daysInMonth();
  const isCurrentMonth = month.isSame(now, 'month');
  const elapsed = isCurrentMonth ? now.date() : total;
  return { elapsed, total };
}

const SpendingForecast: React.FC<Props> = ({ transactions, budgets, selectedMonth, convert, symbol }) => {
  const theme = useTheme();

  const forecast = useMemo(() => {
    const month = selectedMonth ?? dayjs();
    const { elapsed, total } = getDaysInfo(month);

    const expenses = transactions.filter((t) => t.type === 'expense');
    if (expenses.length === 0 || elapsed === 0) return null;

    // Total projection
    const totalSpent = expenses.reduce((sum, t) => sum + t.amount, 0);
    const dailyRate = totalSpent / elapsed;
    const projectedTotal = dailyRate * total;
    const totalBudget = Object.values(budgets).reduce((sum, v) => sum + v, 0);

    // Per-category projection
    const categorySpent: Record<string, number> = {};
    expenses.forEach((t) => {
      const item = t.item || '';
      const cat = ITEM_TO_CATEGORY[item] || t.category || 'Other';
      categorySpent[cat] = (categorySpent[cat] || 0) + t.amount;
    });

    const categories: CategoryForecast[] = Object.entries(categorySpent)
      .map(([category, spent]) => {
        const projected = (spent / elapsed) * total;
        const budget = budgets[category] || null;
        let status: CategoryForecast['status'] = 'no-budget';
        if (budget) {
          const pct = projected / budget;
          if (pct > 1) status = 'over-budget';
          else if (pct >= 0.8) status = 'near-limit';
          else status = 'on-track';
        }
        return { category, spent, projected, budget, status };
      })
      .sort((a, b) => b.projected - a.projected)
      .slice(0, 6);

    // Overall status
    let overallStatus: 'on-track' | 'near-limit' | 'over-budget' | 'no-budget' = 'no-budget';
    if (totalBudget > 0) {
      const pct = projectedTotal / totalBudget;
      if (pct > 1) overallStatus = 'over-budget';
      else if (pct >= 0.8) overallStatus = 'near-limit';
      else overallStatus = 'on-track';
    }

    const isCurrentMonth = month.isSame(dayjs(), 'month');

    return {
      totalSpent,
      projectedTotal,
      totalBudget: totalBudget > 0 ? totalBudget : null,
      dailyRate,
      categories,
      overallStatus,
      elapsed,
      total,
      isCurrentMonth,
    };
  }, [transactions, budgets, selectedMonth]);

  if (!forecast) return null;

  // For past months, projection = actual, so skip the widget
  if (!forecast.isCurrentMonth) return null;

  const statusColor = (status: CategoryForecast['status']): string => {
    switch (status) {
      case 'on-track': return theme.palette.success.light;
      case 'near-limit': return theme.palette.warning.main;
      case 'over-budget': return theme.palette.error.light;
      default: return theme.palette.info.light;
    }
  };

  const statusLabel = (status: CategoryForecast['status']): string => {
    switch (status) {
      case 'on-track': return 'On track';
      case 'near-limit': return 'Near limit';
      case 'over-budget': return 'Over budget';
      default: return '';
    }
  };

  const StatusIcon = forecast.overallStatus === 'over-budget' || forecast.overallStatus === 'near-limit'
    ? TrendingUpIcon
    : TrendingDownIcon;

  const overallColor = statusColor(forecast.overallStatus);

  return (
    <Box
      sx={{
        mb: 2,
        p: 2,
        borderRadius: 2,
        bgcolor: 'rgba(148,163,184,0.04)',
        border: '1px solid rgba(148,163,184,0.08)',
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography
          sx={{
            fontSize: '0.65rem',
            color: 'text.disabled',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          Spending Forecast
        </Typography>
        {forecast.totalBudget && (
          <Tooltip title={statusLabel(forecast.overallStatus)} arrow>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <StatusIcon sx={{ fontSize: '0.85rem', color: overallColor }} />
              <Typography
                sx={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: overallColor,
                }}
              >
                {statusLabel(forecast.overallStatus)}
              </Typography>
            </Box>
          </Tooltip>
        )}
      </Box>

      {/* Total projection */}
      <Box sx={{ mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, mb: 0.5 }}>
          <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: 'text.primary', fontVariantNumeric: 'tabular-nums' }}>
            {symbol}{convert(forecast.projectedTotal).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled' }}>
            projected
          </Typography>
          {forecast.totalBudget && (
            <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled' }}>
              / {symbol}{convert(forecast.totalBudget).toLocaleString(undefined, { maximumFractionDigits: 0 })} budget
            </Typography>
          )}
        </Box>
        <Typography sx={{ fontSize: '0.68rem', color: 'text.disabled', mb: 0.75 }}>
          Based on {symbol}{convert(forecast.dailyRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}/day over {forecast.elapsed} day{forecast.elapsed !== 1 ? 's' : ''}
        </Typography>
        {forecast.totalBudget && (
          <LinearProgress
            variant="determinate"
            value={Math.min((forecast.projectedTotal / forecast.totalBudget) * 100, 100)}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: 'rgba(148,163,184,0.1)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                bgcolor: overallColor,
              },
            }}
          />
        )}
      </Box>

      {/* Per-category projections */}
      {forecast.categories.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {forecast.categories.map(({ category, spent, projected, budget, status }) => {
            const color = statusColor(status);
            const pct = budget ? Math.min((projected / budget) * 100, 100) : null;
            return (
              <Box key={category}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.25 }}>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.primary' }}>
                    {category}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
                      {symbol}{convert(spent).toLocaleString(undefined, { maximumFractionDigits: 0 })} → {symbol}{convert(projected).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </Typography>
                    {budget && (
                      <Typography sx={{ fontSize: '0.65rem', color, fontWeight: 600 }}>
                        {statusLabel(status)}
                      </Typography>
                    )}
                  </Box>
                </Box>
                {pct !== null && (
                  <LinearProgress
                    variant="determinate"
                    value={pct}
                    sx={{
                      height: 4,
                      borderRadius: 2,
                      bgcolor: 'rgba(148,163,184,0.08)',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 2,
                        bgcolor: color,
                      },
                    }}
                  />
                )}
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default SpendingForecast;
