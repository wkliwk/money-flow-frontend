import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import GetAppIcon from '@mui/icons-material/GetApp';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import dayjs, { Dayjs } from 'dayjs';
import { Transaction } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  transactions: Transaction[];
  selectedMonth: Dayjs | null;
  convert: (hkd: number) => number;
  symbol: string;
}

const MonthlyReportModal: React.FC<Props> = ({
  open,
  onClose,
  transactions,
  selectedMonth,
  convert,
  symbol,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const month = selectedMonth || dayjs();
  const monthStr = month.format('MMMM YYYY');

  // Filter transactions for selected month
  const monthTransactions = transactions.filter((t) => {
    const tDate = dayjs(t.date || t.createdAt);
    return tDate.isSame(month, 'month');
  });

  // Calculate stats
  const expenses = monthTransactions.filter((t) => t.type === 'expense');
  const income = monthTransactions.filter((t) => t.type === 'income');
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
  const netBalance = totalIncome - totalExpenses;

  // Category breakdown
  const categoryMap: Record<string, number> = {};
  expenses.forEach((t) => {
    const cat = t.category || 'Uncategorized';
    categoryMap[cat] = (categoryMap[cat] || 0) + t.amount;
  });
  const categories = Object.entries(categoryMap)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);

  // Calculate statistics
  const avgTransaction = monthTransactions.length > 0 ? totalExpenses / expenses.length : 0;
  const highestDay = monthTransactions.reduce((max, t) => {
    if (t.type !== 'expense') return max;
    const tDate = dayjs(t.date || t.createdAt).format('YYYY-MM-DD');
    const dayAmount = monthTransactions
      .filter((dt) => dt.type === 'expense' && dayjs(dt.date || dt.createdAt).format('YYYY-MM-DD') === tDate)
      .reduce((sum, dt) => sum + dt.amount, 0);
    return dayAmount > max.amount ? { date: tDate, amount: dayAmount } : max;
  }, { date: '', amount: 0 });

  const handleExportPDF = async () => {
    if (!contentRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= 297 - 20;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= 297 - 20;
      }

      pdf.save(`money-flow-report-${month.format('YYYY-MM')}.pdf`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Monthly Report — {monthStr}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Box ref={contentRef} sx={{ bgcolor: 'background.paper', p: 2 }}>
          {/* Header */}
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
              Money Flow
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Monthly Report — {monthStr}
            </Typography>
            <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
              Generated on {dayjs().format('MMM D, YYYY')}
            </Typography>
          </Box>

          {/* Summary Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}>
                <CardContent>
                  <Typography color="text.secondary" variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 700 }}>
                    Total Income
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ mt: 0.5, color: '#34d399', fontWeight: 700, letterSpacing: '-0.01em' }}
                  >
                    {symbol}{convert(totalIncome).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </Typography>
                  <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
                    {income.length} transactions
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'rgba(251,113,133,0.1)', border: '1px solid rgba(251,113,133,0.2)' }}>
                <CardContent>
                  <Typography color="text.secondary" variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 700 }}>
                    Total Expenses
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ mt: 0.5, color: '#fb7185', fontWeight: 700, letterSpacing: '-0.01em' }}
                  >
                    {symbol}{convert(totalExpenses).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </Typography>
                  <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
                    {expenses.length} transactions
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.2)' }}>
                <CardContent>
                  <Typography color="text.secondary" variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 700 }}>
                    Net Balance
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      mt: 0.5,
                      color: netBalance >= 0 ? '#34d399' : '#fb7185',
                      fontWeight: 700,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {netBalance >= 0 ? '+' : '-'}{symbol}
                    {convert(Math.abs(netBalance)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'rgba(148,163,184,0.1)', border: '1px solid rgba(148,163,184,0.2)' }}>
                <CardContent>
                  <Typography color="text.secondary" variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 700 }}>
                    Avg Expense
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 0.5, fontWeight: 700, letterSpacing: '-0.01em' }}>
                    {symbol}{convert(avgTransaction).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </Typography>
                  <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
                    per transaction
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Category Breakdown */}
          {categories.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                Expenses by Category
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'rgba(148,163,184,0.08)' }}>
                    <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      Amount
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      % of Total
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categories.map((cat) => (
                    <TableRow key={cat.name}>
                      <TableCell>{cat.name}</TableCell>
                      <TableCell align="right">
                        {symbol}{convert(cat.amount).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
                        {totalExpenses > 0 ? ((cat.amount / totalExpenses) * 100).toFixed(1) : 0}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}

          {/* Key Metrics */}
          <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid rgba(148,163,184,0.1)' }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
              Key Metrics
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    HIGHEST SPEND DAY
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {highestDay.date ? dayjs(highestDay.date).format('MMM D') : '—'} (
                    {symbol}
                    {convert(highestDay.amount).toLocaleString(undefined, { maximumFractionDigits: 0 })})
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    TOTAL TRANSACTIONS
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {monthTransactions.length} (+ {income.length}, - {expenses.length})
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Footer */}
          <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid rgba(148,163,184,0.1)', textAlign: 'center' }}>
            <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.7rem' }}>
              This is an auto-generated report. Keep for your records.
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose}>Close</Button>
        <Button
          variant="contained"
          startIcon={<GetAppIcon />}
          onClick={handleExportPDF}
          disabled={exporting}
          size="small"
        >
          {exporting ? 'Exporting...' : 'Export PDF'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MonthlyReportModal;
