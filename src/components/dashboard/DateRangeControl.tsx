import React, { useState } from 'react';
import { Box, Chip, Popover, TextField, Button, Typography } from '@mui/material';
import dayjs, { Dayjs } from 'dayjs';
import MonthPicker from './MonthPicker';
import CurrencyPicker from './CurrencyPicker';
import { Currency } from '../../hooks/useFxRates';

export type DatePreset = 'week' | 'month' | 'last-month' | 'all-time' | 'custom';

interface Props {
  preset: DatePreset;
  selectedMonth: Dayjs | null;
  customStart: string;
  customEnd: string;
  currency: Currency;
  onPresetChange: (p: DatePreset) => void;
  onMonthChange: (m: Dayjs | null) => void;
  onCustomChange: (start: string, end: string) => void;
  onCurrencyChange: (c: Currency) => void;
}

const PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'last-month', label: 'Last Month' },
  { value: 'all-time', label: 'All Time' },
  { value: 'custom', label: 'Custom' },
];

const DateRangeControl: React.FC<Props> = ({
  preset,
  selectedMonth,
  customStart,
  customEnd,
  currency,
  onPresetChange,
  onMonthChange,
  onCustomChange,
  onCurrencyChange,
}) => {
  const [customAnchor, setCustomAnchor] = useState<HTMLElement | null>(null);
  const [draftStart, setDraftStart] = useState(customStart);
  const [draftEnd, setDraftEnd] = useState(customEnd);

  const handleChipClick = (p: DatePreset) => {
    if (p === 'custom') {
      setDraftStart(customStart || dayjs().startOf('month').format('YYYY-MM-DD'));
      setDraftEnd(customEnd || dayjs().format('YYYY-MM-DD'));
    }
    onPresetChange(p);
  };

  const openCustom = (e: React.MouseEvent<HTMLElement>) => {
    setDraftStart(customStart || dayjs().startOf('month').format('YYYY-MM-DD'));
    setDraftEnd(customEnd || dayjs().format('YYYY-MM-DD'));
    setCustomAnchor(e.currentTarget);
  };

  const applyCustom = () => {
    onCustomChange(draftStart, draftEnd);
    setCustomAnchor(null);
  };

  const customLabel = customStart && customEnd
    ? `${dayjs(customStart).format('MMM D')} – ${dayjs(customEnd).format('MMM D')}`
    : 'Custom';

  return (
    <Box>
      {/* Preset chips row */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
        {PRESETS.map(({ value, label }) => {
          const isActive = preset === value;
          const chipLabel = value === 'custom' && isActive ? customLabel : label;
          return (
            <Chip
              key={value}
              label={chipLabel}
              size="small"
              onClick={value === 'custom' && isActive ? openCustom : () => handleChipClick(value)}
              sx={{
                height: 26,
                fontSize: '0.75rem',
                fontWeight: isActive ? 700 : 400,
                color: isActive ? '#818cf8' : 'text.secondary',
                bgcolor: isActive ? 'rgba(129,140,248,0.12)' : 'transparent',
                border: '1px solid',
                borderColor: isActive ? 'rgba(129,140,248,0.3)' : 'rgba(148,163,184,0.12)',
                '&:hover': { bgcolor: isActive ? 'rgba(129,140,248,0.18)' : 'rgba(148,163,184,0.06)' },
              }}
            />
          );
        })}
        <Box sx={{ ml: 'auto' }}>
          <CurrencyPicker currency={currency} onChange={onCurrencyChange} />
        </Box>
      </Box>

      {/* Month navigation (only when 'month' preset) */}
      {preset === 'month' && (
        <Box sx={{ mt: 1.5 }}>
          <MonthPicker selectedMonth={selectedMonth} onChange={onMonthChange} />
        </Box>
      )}

      {/* Custom range popover */}
      <Popover
        open={Boolean(customAnchor)}
        anchorEl={customAnchor}
        onClose={() => setCustomAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{
          sx: {
            mt: 0.5,
            p: 2,
            bgcolor: '#1e293b',
            border: '1px solid rgba(148,163,184,0.12)',
            borderRadius: 2,
            minWidth: 260,
          },
        }}
      >
        <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1.5, color: 'text.secondary' }}>
          Custom date range
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <TextField
            label="From"
            type="date"
            size="small"
            value={draftStart}
            onChange={(e) => setDraftStart(e.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={{ max: draftEnd || undefined }}
            sx={{ '& input': { colorScheme: 'dark' } }}
          />
          <TextField
            label="To"
            type="date"
            size="small"
            value={draftEnd}
            onChange={(e) => setDraftEnd(e.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: draftStart || undefined, max: dayjs().format('YYYY-MM-DD') }}
            sx={{ '& input': { colorScheme: 'dark' } }}
          />
          <Button
            variant="contained"
            size="small"
            disabled={!draftStart || !draftEnd || draftStart > draftEnd}
            onClick={applyCustom}
            sx={{ mt: 0.5 }}
          >
            Apply
          </Button>
        </Box>
      </Popover>
    </Box>
  );
};

export default DateRangeControl;
