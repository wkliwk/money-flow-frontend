import React from 'react';
import { Box, Typography } from '@mui/material';
import { Dayjs } from 'dayjs';
import { Transaction } from '../../types';
import TrendsChart from '../dashboard/TrendsChart';
import CategoryChart from '../dashboard/CategoryChart';

interface Props {
  transactions: Transaction[];
  monthFiltered: Transaction[];
  onMonthSelect: (month: Dayjs) => void;
  onCategoryClick: (cat: string) => void;
  convert: (hkd: number) => number;
  symbol: string;
}

const AnalyticsPage: React.FC<Props> = ({
  transactions,
  monthFiltered,
  onMonthSelect,
  onCategoryClick,
  convert,
  symbol,
}) => (
  <Box>
    <Typography
      variant="caption"
      sx={{
        color: 'text.disabled',
        fontSize: '0.65rem',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        fontWeight: 700,
        display: 'block',
        mb: 1.5,
      }}
    >
      6-Month Trend
    </Typography>
    <TrendsChart
      transactions={transactions}
      onMonthSelect={onMonthSelect}
      convert={convert}
      symbol={symbol}
    />
    <Typography
      variant="caption"
      sx={{
        color: 'text.disabled',
        fontSize: '0.65rem',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        fontWeight: 700,
        display: 'block',
        mt: 3,
        mb: 1.5,
      }}
    >
      Category Breakdown
    </Typography>
    <CategoryChart transactions={monthFiltered} onCategoryClick={onCategoryClick} />
  </Box>
);

export default AnalyticsPage;
