import React, { useMemo } from 'react';
import { Box, Typography, ButtonBase, useTheme } from '@mui/material';
import type { Transaction } from '../../types';

interface Props {
  transactions: Transaction[];
  selectedDate: string | null;
  onDayChange: (date: string | null) => void;
  /** Number of days to show, ending today. Default 7. */
  days?: number;
  /** Symbol formatter for the tooltip title. */
  symbol?: string;
  convert?: (n: number) => number;
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MAX_BAR_HEIGHT = 24;
const MIN_VISIBLE_BAR_HEIGHT = 2;

function toIsoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function buildDayList(count: number): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (count - 1 - i));
    return d;
  });
}

const CalendarStrip: React.FC<Props> = ({
  transactions,
  selectedDate,
  onDayChange,
  days = 7,
  symbol = '',
  convert,
}) => {
  const theme = useTheme();
  const dayList = useMemo(() => buildDayList(days), [days]);

  const dailyExpense = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of transactions) {
      if (t.type !== 'expense' || !t.date) continue;
      const day = t.date.slice(0, 10);
      map.set(day, (map.get(day) ?? 0) + (t.amount ?? 0));
    }
    return map;
  }, [transactions]);

  const maxSpend = useMemo(() => {
    let max = 0;
    for (const d of dayList) {
      const amt = dailyExpense.get(toIsoDay(d)) ?? 0;
      if (amt > max) max = amt;
    }
    return max;
  }, [dayList, dailyExpense]);

  // Anything ≥ 80% of the week's max is "high spend" → render the bar in expense red.
  const highSpendThreshold = maxSpend * 0.8;

  return (
    <Box
      data-testid="calendar-strip"
      sx={{
        display: 'flex',
        gap: 1,
        py: 1.5,
        px: 0.5,
        overflowX: 'auto',
        mb: 1.5,
      }}
    >
      {dayList.map((d) => {
        const iso = toIsoDay(d);
        const isActive = selectedDate === iso;
        const isToday = iso === toIsoDay(new Date());
        const spend = dailyExpense.get(iso) ?? 0;
        const barHeight = maxSpend > 0 && spend > 0
          ? Math.max(MIN_VISIBLE_BAR_HEIGHT, Math.round((spend / maxSpend) * MAX_BAR_HEIGHT))
          : 0;
        const barColor = spend === 0
          ? 'transparent'
          : spend >= highSpendThreshold && maxSpend > 0
          ? theme.palette.error.main
          : '#E6E3DC';

        const title = spend > 0 && convert
          ? `${WEEKDAY_LABELS[d.getDay()]} ${d.getDate()} · ${symbol}${convert(spend).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
          : `${WEEKDAY_LABELS[d.getDay()]} ${d.getDate()}`;

        return (
          <ButtonBase
            key={iso}
            data-testid={`calendar-day-${iso}`}
            data-active={isActive ? 'true' : undefined}
            onClick={() => onDayChange(isActive ? null : iso)}
            aria-pressed={isActive}
            aria-label={`${WEEKDAY_LABELS[d.getDay()]} ${d.getDate()}${spend > 0 ? `, spent ${symbol}${spend.toFixed(0)}` : ', no spend'}`}
            title={title}
            sx={{
              flex: 1,
              minWidth: 44,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 0.5,
              py: 0.75,
              px: 0.5,
              borderRadius: '12px',
              border: '1px solid',
              borderColor: isActive ? '#D4D0F0' : 'transparent',
              bgcolor: isActive ? '#EEEDFC' : 'transparent',
              transition: 'all 0.12s ease',
              '&:hover': { bgcolor: isActive ? '#E6E4F9' : 'rgba(91,78,199,0.06)' },
            }}
          >
            <Typography
              sx={{
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                fontSize: '0.625rem',
                fontWeight: 500,
                color: isActive ? 'primary.main' : '#A8A29E',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {WEEKDAY_LABELS[d.getDay()]}
            </Typography>
            <Typography
              sx={{
                fontFamily: '"Space Grotesk", sans-serif',
                fontSize: '1rem',
                fontWeight: isToday || isActive ? 700 : 600,
                color: isActive ? 'primary.main' : '#1C1917',
                letterSpacing: '-0.3px',
                lineHeight: 1,
              }}
            >
              {d.getDate()}
            </Typography>
            <Box
              data-testid={`calendar-bar-${iso}`}
              sx={{
                width: '60%',
                height: MAX_BAR_HEIGHT,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
              }}
            >
              <Box
                data-bar-height={barHeight}
                sx={{
                  width: '100%',
                  borderRadius: '2px',
                  bgcolor: barColor,
                }}
                style={{ height: barHeight }}
              />
            </Box>
          </ButtonBase>
        );
      })}
    </Box>
  );
};

export default CalendarStrip;
