import React from 'react';
import { Box, IconButton, Typography, Chip } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
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

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
      <CalendarTodayOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />

      {selectedMonth ? (
        <>
          <IconButton
            size="small"
            onClick={handlePrev}
            sx={{ color: 'text.secondary', p: 0.5 }}
          >
            <ChevronLeftIcon sx={{ fontSize: 20 }} />
          </IconButton>
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{ minWidth: 148, textAlign: 'center', letterSpacing: '-0.01em' }}
          >
            {selectedMonth.format('MMMM YYYY')}
          </Typography>
          <IconButton
            size="small"
            onClick={handleNext}
            sx={{ color: 'text.secondary', p: 0.5 }}
          >
            <ChevronRightIcon sx={{ fontSize: 20 }} />
          </IconButton>
          <Chip
            label="All Time"
            size="small"
            onClick={() => onChange(null)}
            sx={{
              ml: 1,
              height: 26,
              fontSize: '0.75rem',
              fontWeight: 500,
              color: 'text.secondary',
              bgcolor: 'transparent',
              border: '1px solid rgba(148,163,184,0.15)',
              '&:hover': { bgcolor: 'rgba(148,163,184,0.08)' },
            }}
          />
        </>
      ) : (
        <>
          <Typography variant="h6" fontWeight={700} color="text.secondary" sx={{ letterSpacing: '-0.01em' }}>
            All Time
          </Typography>
          <Chip
            label="This Month"
            size="small"
            onClick={() => onChange(dayjs())}
            sx={{
              ml: 1,
              height: 26,
              fontSize: '0.75rem',
              fontWeight: 500,
              color: 'primary.main',
              bgcolor: 'rgba(129,140,248,0.1)',
              border: '1px solid rgba(129,140,248,0.2)',
              '&:hover': { bgcolor: 'rgba(129,140,248,0.16)' },
            }}
          />
        </>
      )}
    </Box>
  );
};

export default MonthPicker;
