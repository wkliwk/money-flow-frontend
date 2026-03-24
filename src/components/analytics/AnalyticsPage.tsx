import React, { useMemo, useState } from 'react';
import { Box, Typography } from '@mui/material';
import dayjs, { Dayjs } from 'dayjs';
import { Transaction } from '../../types';
import TrendsChart from '../dashboard/TrendsChart';
import CategoryChart from '../dashboard/CategoryChart';

interface AnalyticsPageProps {
  transactions: Transaction[];
  convert: (amount: number) => number;
  symbol: string;
}

const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ transactions, convert, symbol }) => {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());

  const monthFiltered = useMemo(() => {
    return transactions.filter((t) => {
      const d = dayjs(t.date || t.createdAt);
      return d.isSame(selectedDate, 'month');
    });
  }, [transactions, selectedDate]);

  const handleMonthSelect = (month: Dayjs) => {
    setSelectedDate(month);
  };

  const handleCategoryClick = (category: string) => {
    // This would be handled by parent component if needed
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>
        Analytics
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Trends */}
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
            Spending Trends
          </Typography>
          <TrendsChart
            transactions={transactions}
            onMonthSelect={handleMonthSelect}
            convert={convert}
            symbol={symbol}
          />
        </Box>

        {/* Category Breakdown */}
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
            Category Breakdown
          </Typography>
          <CategoryChart
            transactions={monthFiltered}
            onCategoryClick={handleCategoryClick}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default AnalyticsPage;
