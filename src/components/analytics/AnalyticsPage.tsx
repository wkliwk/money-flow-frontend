import React from 'react';
import { Box, Typography } from '@mui/material';
import { Transaction } from '../../types';
import SpendingForecast from '../dashboard/SpendingForecast';

interface Props {
  transactions: Transaction[];
  convert: (amount: number) => number;
  symbol: string;
}

const AnalyticsPage: React.FC<Props> = ({ transactions, convert, symbol }) => {
  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>
        Analytics
      </Typography>

      <SpendingForecast
        transactions={transactions}
        convert={convert}
        symbol={symbol}
      />
    </Box>
  );
};

export default AnalyticsPage;
