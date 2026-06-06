import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  SelectChangeEvent,
  Skeleton,
  Typography,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import DownloadIcon from '@mui/icons-material/Download';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import dayjs from 'dayjs';
import { Transaction } from '../../types';
import { getMonthlyReport, MonthlyReportEntry, getBudgets, Budget } from '../../services/api';

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

const MonthlyReportPage: React.FC<Props> = ({ transactions, convert, symbol }) => {
  const theme = useTheme();
  const printRef = useRef<HTMLDivElement>(null);

  const monthOptions = useMemo(() => buildMonthOptions(), []);
  const [selectedMonth, setSelectedMonth] = useState<string>(monthOptions[0].value);
  const [report, setReport] = useState<MonthlyReportEntry[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    Promise.all([getMonthlyReport(13), getBudgets()])
      .then(([reportData, budgetData]) => {
        setReport(reportData);
        setBudgets(budgetData);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const handleMonthChange = useCallback((e: SelectChangeEvent) => {
    setSelectedMonth(e.target.value);
  }, []);

  const selectedEntry = useMemo(
    () => report.find((r) => r.month === selectedMonth) ?? null,
    [report, selectedMonth]
  );

  const prevMonthKey = useMemo(
    () => dayjs(selectedMonth + '-01').subtract(1, 'month').format('YYYY-MM'),
    [selectedMonth]
  );

  const prevEntry = useMemo(
    () => report.find((r) => r.month === prevMonthKey) ?? null,
    [report, prevMonthKey]
  );

  const monthTxns = useMemo(
    () => transactions.filter((t) => dayjs(t.date || t.createdAt).format('YYYY-MM') === selectedMonth),
    [transactions, selectedMonth]
  );

  const prevMonthTxns = useMemo(
    () => transactions.filter((t) => dayjs(t.date || t.createdAt).format('YYYY-MM') === prevMonthKey),
    [transactions, prevMonthKey]
  );

  // Category breakdown for selected month
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    monthTxns
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const cat = t.category || 'Other';
        map[cat] = (map[cat] || 0) + t.amount;
      });
    const total = Object.values(map).reduce((s, v) => s + v, 0);
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], idx) => ({
        name,
        value,
        pct: total > 0 ? Math.round((value / total) * 100) : 0,
        color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
      }));
  }, [monthTxns]);

  // Top 5 categories
  const top5 = useMemo(() => categoryBreakdown.slice(0, 5), [categoryBreakdown]);

  // Previous month category breakdown for MoM comparison
  const prevCategoryMap = useMemo(() => {
    const map: Record<string, number> = {};
    prevMonthTxns
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const cat = t.category || 'Other';
        map[cat] = (map[cat] || 0) + t.amount;
      });
    return map;
  }, [prevMonthTxns]);

  // Budget map
  const budgetMap = useMemo(
    () => Object.fromEntries(budgets.map((b) => [b.category, b.limit])),
    [budgets]
  );

  // Summary totals — prefer API data, fall back to client-side
  const totalIncome = selectedEntry?.income ?? monthTxns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = selectedEntry?.expenses ?? monthTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const netSavings = selectedEntry?.net ?? (totalIncome - totalExpenses);

  const prevTotalExpenses = prevEntry?.expenses ?? prevMonthTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const expenseDelta = prevTotalExpenses > 0 ? ((totalExpenses - prevTotalExpenses) / prevTotalExpenses) * 100 : null;

  const hasData = monthTxns.length > 0 || (selectedEntry && (selectedEntry.income > 0 || selectedEntry.expenses > 0));

  const handleDownloadPdf = useCallback(() => {
    const monthLabel = dayjs(selectedMonth + '-01').format('MMMM YYYY');
    const printWindow = window.open('', '_blank');
    if (!printWindow || !printRef.current) return;

    const styles = `
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 24px; color: #1e293b; background: #fff; }
        h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; color: #1e293b; }
        .subtitle { font-size: 13px; color: #64748b; margin-bottom: 24px; }
        .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
        .summary-card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; }
        .summary-card .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #94a3b8; font-weight: 700; margin-bottom: 6px; }
        .summary-card .value { font-size: 22px; font-weight: 700; }
        .income-val { color: #10b981; }
        .expense-val { color: #ef4444; }
        .net-pos { color: #6366f1; }
        .net-neg { color: #ef4444; }
        .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #94a3b8; margin: 24px 0 12px; }
        .category-row { display: flex; align-items: center; margin-bottom: 10px; gap: 10px; }
        .category-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
        .category-name { flex: 1; font-size: 14px; }
        .category-bar-wrap { width: 100px; background: #f1f5f9; border-radius: 4px; height: 6px; }
        .category-bar { background: #6366f1; height: 6px; border-radius: 4px; }
        .category-amount { font-size: 14px; font-weight: 600; min-width: 80px; text-align: right; }
        .category-pct { font-size: 12px; color: #94a3b8; min-width: 36px; text-align: right; }
        .mom-banner { border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; font-size: 14px; font-weight: 600; }
        .mom-up { background: #fef2f2; color: #ef4444; }
        .mom-down { background: #f0fdf4; color: #10b981; }
        .mom-flat { background: #f8fafc; color: #64748b; }
        .budget-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
        .budget-label { flex: 1; font-size: 13px; }
        .budget-progress { width: 120px; background: #f1f5f9; border-radius: 4px; height: 6px; }
        .budget-fill-ok { background: #10b981; height: 6px; border-radius: 4px; }
        .budget-fill-warn { background: #f59e0b; height: 6px; border-radius: 4px; }
        .budget-fill-over { background: #ef4444; height: 6px; border-radius: 4px; }
        .budget-amounts { font-size: 12px; color: #64748b; min-width: 120px; text-align: right; }
        @media print { body { padding: 0; } }
      </style>
    `;

    const summaryHtml = `
      <div class="summary-grid">
        <div class="summary-card">
          <div class="label">Income</div>
          <div class="value income-val">${symbol}${convert(totalIncome).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
        </div>
        <div class="summary-card">
          <div class="label">Expenses</div>
          <div class="value expense-val">${symbol}${convert(totalExpenses).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
        </div>
        <div class="summary-card">
          <div class="label">Net Savings</div>
          <div class="value ${netSavings >= 0 ? 'net-pos' : 'net-neg'}">${netSavings >= 0 ? '+' : ''}${symbol}${convert(netSavings).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
        </div>
      </div>
    `;

    const momHtml = expenseDelta !== null ? `
      <div class="mom-banner ${expenseDelta > 0 ? 'mom-up' : expenseDelta < 0 ? 'mom-down' : 'mom-flat'}">
        ${expenseDelta > 0 ? '↑' : expenseDelta < 0 ? '↓' : '→'} Spending ${expenseDelta > 0 ? 'up' : expenseDelta < 0 ? 'down' : 'flat'} ${Math.abs(Math.round(expenseDelta))}% vs ${dayjs(prevMonthKey + '-01').format('MMMM')}
      </div>
    ` : '';

    const categoryHtml = top5.length > 0 ? `
      <div class="section-title">Top Categories</div>
      ${top5.map((c) => `
        <div class="category-row">
          <div class="category-dot" style="background:${c.color}"></div>
          <div class="category-name">${c.name}</div>
          <div class="category-bar-wrap"><div class="category-bar" style="width:${c.pct}%;background:${c.color}"></div></div>
          <div class="category-amount">${symbol}${convert(c.value).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          <div class="category-pct">${c.pct}%</div>
        </div>
      `).join('')}
    ` : '';

    const budgetCategories = Object.entries(budgetMap).filter(([, limit]) => limit > 0);
    const budgetHtml = budgetCategories.length > 0 ? `
      <div class="section-title">Budget vs Actual</div>
      ${budgetCategories.map(([cat, limit]) => {
        const spent = categoryBreakdown.find((c) => c.name === cat)?.value ?? 0;
        const pct = Math.min(Math.round((spent / limit) * 100), 100);
        const overClass = spent > limit ? 'budget-fill-over' : pct >= 80 ? 'budget-fill-warn' : 'budget-fill-ok';
        return `
          <div class="budget-row">
            <div class="budget-label">${cat}</div>
            <div class="budget-progress"><div class="${overClass}" style="width:${pct}%"></div></div>
            <div class="budget-amounts">${symbol}${convert(spent).toLocaleString(undefined, { maximumFractionDigits: 0 })} / ${symbol}${convert(limit).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          </div>
        `;
      }).join('')}
    ` : '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Money Flow — ${monthLabel}</title>
          ${styles}
        </head>
        <body>
          <h1>Monthly Report</h1>
          <div class="subtitle">${monthLabel} &nbsp;·&nbsp; Generated ${dayjs().format('D MMM YYYY')}</div>
          ${summaryHtml}
          ${momHtml}
          ${categoryHtml}
          ${budgetHtml}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  }, [selectedMonth, totalIncome, totalExpenses, netSavings, expenseDelta, prevMonthKey, top5, categoryBreakdown, budgetMap, convert, symbol]);

  const cardBg = theme.palette.background.paper;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 1 }}>
        <Skeleton variant="text" width={160} height={20} />
        <Skeleton variant="rounded" width="100%" height={64} />
        <Skeleton variant="rounded" width="100%" height={240} />
        <Skeleton variant="rounded" width="100%" height={180} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">Could not load report data. Please try again later.</Typography>
      </Box>
    );
  }

  return (
    <Box ref={printRef} sx={{ pb: 4 }}>
      {/* Header row */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h6" fontWeight={700}>
          Monthly Report
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="month-select-label">Month</InputLabel>
            <Select
              labelId="month-select-label"
              value={selectedMonth}
              label="Month"
              onChange={handleMonthChange}
            >
              {monthOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadPdf}
            disabled={!hasData}
            aria-label="Download PDF report"
          >
            Download PDF
          </Button>
        </Box>
      </Box>

      {/* Empty state */}
      {!hasData ? (
        <Card
          elevation={0}
          sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, bgcolor: cardBg, py: 6, textAlign: 'center' }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            No transactions for {dayjs(selectedMonth + '-01').format('MMMM YYYY')}.
          </Typography>
          <Typography variant="caption" color="text.disabled">
            Add some transactions to see your monthly report.
          </Typography>
        </Card>
      ) : (
        <>
          {/* MoM comparison banner */}
          {expenseDelta !== null && (
            <Box
              sx={{
                mb: 2.5,
                py: 1.25,
                px: 2,
                borderRadius: 2,
                bgcolor: alpha(
                  expenseDelta > 0 ? theme.palette.error.main : expenseDelta < 0 ? theme.palette.success.main : theme.palette.text.secondary,
                  0.1
                ),
                border: `1px solid ${alpha(
                  expenseDelta > 0 ? theme.palette.error.main : expenseDelta < 0 ? theme.palette.success.main : theme.palette.text.secondary,
                  0.25
                )}`,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              {expenseDelta < 0 ? (
                <TrendingDownIcon sx={{ color: theme.palette.success.main, fontSize: 20 }} />
              ) : expenseDelta > 0 ? (
                <TrendingUpIcon sx={{ color: theme.palette.error.main, fontSize: 20 }} />
              ) : (
                <TrendingFlatIcon sx={{ color: theme.palette.text.secondary, fontSize: 20 }} />
              )}
              <Typography
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: expenseDelta > 0 ? theme.palette.error.main : expenseDelta < 0 ? theme.palette.success.main : theme.palette.text.secondary,
                }}
              >
                Spending {expenseDelta > 0 ? 'up' : expenseDelta < 0 ? 'down' : 'flat'}{' '}
                {Math.abs(Math.round(expenseDelta))}% vs{' '}
                {dayjs(prevMonthKey + '-01').format('MMMM')}
              </Typography>
            </Box>
          )}

          {/* Summary cards */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)' },
              gap: 1.5,
              mb: 2.5,
            }}
          >
            {[
              { label: 'Income', value: totalIncome, color: theme.palette.success.main, prefix: '+' },
              { label: 'Expenses', value: totalExpenses, color: theme.palette.error.main, prefix: '-' },
              {
                label: 'Net Savings',
                value: netSavings,
                color: netSavings >= 0 ? theme.palette.primary.main : theme.palette.error.main,
                prefix: netSavings >= 0 ? '+' : '',
              },
            ].map(({ label, value, color, prefix }) => (
              <Card
                key={label}
                elevation={0}
                sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, bgcolor: cardBg }}
              >
                <CardContent sx={{ p: '14px 16px !important' }}>
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      color: 'text.disabled',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      mb: 0.5,
                    }}
                  >
                    {label}
                  </Typography>
                  <Typography variant="h6" fontWeight={700} sx={{ color, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                    {prefix}{symbol}{convert(Math.abs(value)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>

          {/* Category pie chart + top 5 */}
          {categoryBreakdown.length > 0 && (
            <Card
              elevation={0}
              sx={{ mb: 2.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 2, bgcolor: cardBg }}
            >
              <CardContent>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
                  Category Breakdown
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'center', sm: 'flex-start' },
                    gap: 3,
                  }}
                >
                  {/* Pie chart */}
                  <Box sx={{ width: { xs: 180, sm: 200 }, height: { xs: 180, sm: 200 }, flexShrink: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryBreakdown}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius="55%"
                          outerRadius="80%"
                          paddingAngle={2}
                        >
                          {categoryBreakdown.map((entry) => (
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

                  {/* Top 5 legend */}
                  <Box sx={{ flex: 1, width: '100%' }}>
                    {top5.map((cat, idx) => {
                      const prevCatAmount = prevCategoryMap[cat.name] ?? 0;
                      const catDelta =
                        prevCatAmount > 0
                          ? Math.round(((cat.value - prevCatAmount) / prevCatAmount) * 100)
                          : null;
                      return (
                        <Box key={cat.name} sx={{ mb: idx < top5.length - 1 ? 1.5 : 0 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              mb: 0.5,
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box
                                sx={{
                                  width: 10,
                                  height: 10,
                                  borderRadius: '50%',
                                  bgcolor: cat.color,
                                  flexShrink: 0,
                                }}
                              />
                              <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>
                                {cat.name}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {catDelta !== null && (
                                <Chip
                                  label={`${catDelta > 0 ? '+' : ''}${catDelta}%`}
                                  size="small"
                                  sx={{
                                    height: 18,
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    bgcolor: alpha(
                                      catDelta > 0 ? theme.palette.error.main : theme.palette.success.main,
                                      0.12
                                    ),
                                    color: catDelta > 0 ? theme.palette.error.main : theme.palette.success.main,
                                    '& .MuiChip-label': { px: 0.75 },
                                  }}
                                />
                              )}
                              <Typography sx={{ fontSize: '0.82rem', fontWeight: 700 }}>
                                {symbol}{convert(cat.value).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                              </Typography>
                              <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled', minWidth: 30 }}>
                                {cat.pct}%
                              </Typography>
                            </Box>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={cat.pct}
                            sx={{
                              height: 4,
                              borderRadius: 2,
                              bgcolor: alpha(cat.color, 0.15),
                              '& .MuiLinearProgress-bar': { bgcolor: cat.color, borderRadius: 2 },
                            }}
                          />
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Budget vs Actual */}
          {Object.keys(budgetMap).length > 0 && (
            <Card
              elevation={0}
              sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, bgcolor: cardBg }}
            >
              <CardContent>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
                  Budget vs Actual
                </Typography>
                {Object.entries(budgetMap)
                  .filter(([, limit]) => limit > 0)
                  .map(([cat, limit]) => {
                    const spent = categoryBreakdown.find((c) => c.name === cat)?.value ?? 0;
                    const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
                    const isOver = spent > limit;
                    const isNear = !isOver && pct >= 80;
                    const barColor = isOver
                      ? theme.palette.error.main
                      : isNear
                      ? theme.palette.warning.main
                      : theme.palette.success.main;

                    return (
                      <Box key={cat} sx={{ mb: 2 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 0.5,
                          }}
                        >
                          <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>{cat}</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {isOver && (
                              <Chip
                                label="Over budget"
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: '0.62rem',
                                  fontWeight: 700,
                                  bgcolor: alpha(theme.palette.error.main, 0.12),
                                  color: theme.palette.error.main,
                                  '& .MuiChip-label': { px: 0.75 },
                                }}
                              />
                            )}
                            <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
                              {symbol}{convert(spent).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                              {' / '}
                              {symbol}{convert(limit).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </Typography>
                          </Box>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(pct, 100)}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            bgcolor: alpha(barColor, 0.15),
                            '& .MuiLinearProgress-bar': { bgcolor: barColor, borderRadius: 3 },
                          }}
                        />
                      </Box>
                    );
                  })}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </Box>
  );
};

export default MonthlyReportPage;
