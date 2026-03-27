import React, { useState } from 'react';
import { Box, IconButton, Typography, Chip, Popover } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import dayjs, { Dayjs } from 'dayjs';

interface Props {
  selectedMonth: Dayjs | null;
  onChange: (month: Dayjs | null) => void;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const MonthPicker: React.FC<Props> = ({ selectedMonth, onChange }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [pickerYear, setPickerYear] = useState(() => (selectedMonth ?? dayjs()).year());

  const handlePrev = () => {
    const base = selectedMonth ?? dayjs();
    onChange(base.subtract(1, 'month'));
  };

  const handleNext = () => {
    const base = selectedMonth ?? dayjs();
    onChange(base.add(1, 'month'));
  };

  const openPicker = (e: React.MouseEvent<HTMLElement>) => {
    setPickerYear((selectedMonth ?? dayjs()).year());
    setAnchorEl(e.currentTarget);
  };

  const closePicker = () => setAnchorEl(null);

  const handleMonthSelect = (monthIndex: number) => {
    onChange(dayjs().year(pickerYear).month(monthIndex).startOf('month'));
    closePicker();
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
            onClick={openPicker}
            sx={{ minWidth: 148, textAlign: 'center', letterSpacing: '-0.01em', cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
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
              bgcolor: isDark ? 'rgba(129,140,248,0.1)' : 'rgba(99,102,241,0.12)',
              border: isDark ? '1px solid rgba(129,140,248,0.2)' : '1px solid rgba(99,102,241,0.25)',
              '&:hover': { bgcolor: isDark ? 'rgba(129,140,248,0.16)' : 'rgba(99,102,241,0.18)' },
            }}
          />
        </>
      )}

      {/* Month/year picker popover */}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={closePicker}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        PaperProps={{
          sx: {
            mt: 0.5,
            p: 2,
            border: '1px solid rgba(148,163,184,0.12)',
            borderRadius: 2,
            minWidth: 240,
          },
        }}
      >
        {/* Year row */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <IconButton size="small" onClick={() => setPickerYear((y) => y - 1)} sx={{ color: 'text.secondary', p: 0.5 }}>
            <ChevronLeftIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <Typography fontWeight={700} sx={{ fontSize: '0.95rem' }}>{pickerYear}</Typography>
          <IconButton size="small" onClick={() => setPickerYear((y) => y + 1)} sx={{ color: 'text.secondary', p: 0.5 }}>
            <ChevronRightIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        {/* Month grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.75 }}>
          {MONTHS.map((label, i) => {
            const isSelected = selectedMonth?.year() === pickerYear && selectedMonth?.month() === i;
            return (
              <Box
                key={label}
                onClick={() => handleMonthSelect(i)}
                sx={{
                  textAlign: 'center',
                  py: 0.75,
                  borderRadius: 1.5,
                  cursor: 'pointer',
                  bgcolor: isSelected
                    ? isDark ? 'rgba(129,140,248,0.2)' : 'rgba(99,102,241,0.15)'
                    : 'transparent',
                  border: '1px solid',
                  borderColor: isSelected
                    ? isDark ? 'rgba(129,140,248,0.5)' : 'rgba(99,102,241,0.4)'
                    : 'transparent',
                  '&:hover': { bgcolor: isDark ? 'rgba(129,140,248,0.1)' : 'rgba(99,102,241,0.12)' },
                }}
              >
                <Typography
                  sx={{
                    fontSize: '0.82rem',
                    fontWeight: isSelected ? 700 : 400,
                    color: isSelected ? theme.palette.primary.main : 'text.secondary',
                  }}
                >
                  {label}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Popover>
    </Box>
  );
};

export default MonthPicker;
