import React from 'react';
import { Box, IconButton, Typography, Button } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import dayjs, { Dayjs } from 'dayjs';

interface Props {
  selectedMonth: Dayjs | null;
  onChange: (month: Dayjs | null) => void;
}

const MonthPicker: React.FC<Props> = ({ selectedMonth, onChange }) => {
  const handlePrev = () => {
    const base = selectedMonth ?? dayjs();
    onChange(base.subtract(1, 'month'));
  };

  const handleNext = () => {
    const base = selectedMonth ?? dayjs();
    onChange(base.add(1, 'month'));
  };

  const handleAllTime = () => {
    onChange(null);
  };

  const handleCurrentMonth = () => {
    onChange(dayjs());
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
      {selectedMonth ? (
        <>
          <IconButton size="small" onClick={handlePrev}>
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="h6" fontWeight={600} sx={{ minWidth: 160, textAlign: 'center' }}>
            {selectedMonth.format('MMMM YYYY')}
          </Typography>
          <IconButton size="small" onClick={handleNext}>
            <ChevronRightIcon />
          </IconButton>
          <Button size="small" variant="outlined" onClick={handleAllTime} sx={{ ml: 1 }}>
            All Time
          </Button>
        </>
      ) : (
        <>
          <Typography variant="h6" fontWeight={600} color="text.secondary">
            All Time
          </Typography>
          <Button size="small" variant="outlined" onClick={handleCurrentMonth} sx={{ ml: 1 }}>
            This Month
          </Button>
        </>
      )}
    </Box>
  );
};

export default MonthPicker;
