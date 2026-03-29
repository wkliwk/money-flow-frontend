import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, IconButton, CircularProgress, Collapse } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import RefreshIcon from '@mui/icons-material/Refresh';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { getWeeklyPulse, generateWeeklyPulse, getPreviousPulse, WeeklyPulse } from '../../services/api';

const SpendingPulse: React.FC = () => {
  const theme = useTheme();
  const [pulse, setPulse] = useState<WeeklyPulse | null | undefined>(undefined);
  const [previousPulse, setPreviousPulse] = useState<WeeklyPulse | null>(null);
  const [generating, setGenerating] = useState(false);
  const [showPrevious, setShowPrevious] = useState(false);

  const currentWeekStart = (() => {
    const d = new Date();
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d.toISOString().split('T')[0];
  })();

  const isCurrentWeek = pulse && pulse.weekStart === currentWeekStart;

  const load = useCallback(async () => {
    try {
      const [p, prev] = await Promise.all([getWeeklyPulse(), getPreviousPulse()]);
      setPulse(p);
      setPreviousPulse(prev);
    } catch {
      setPulse(null);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleGenerate = async (force = false) => {
    setGenerating(true);
    try {
      const result = await generateWeeklyPulse(force);
      if (result.pulse) {
        setPulse(result.pulse);
      }
    } catch {
      // silently fail
    } finally {
      setGenerating(false);
    }
  };

  if (pulse === undefined) return null;

  const accentColor = theme.palette.mode === 'dark' ? '#a78bfa' : '#7c3aed';
  const bgColor = theme.palette.mode === 'dark' ? alpha('#7c3aed', 0.08) : alpha('#7c3aed', 0.06);
  const borderColor = theme.palette.mode === 'dark' ? alpha('#a78bfa', 0.2) : alpha('#7c3aed', 0.2);

  if (!pulse) {
    return (
      <Box
        sx={{
          mb: 2,
          p: 2,
          borderRadius: 2,
          bgcolor: bgColor,
          border: `1px solid ${borderColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesomeIcon sx={{ fontSize: 16, color: accentColor }} />
          <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>
            How was your week in money?
          </Typography>
        </Box>
        {generating ? (
          <CircularProgress size={16} sx={{ color: accentColor }} />
        ) : (
          <Typography
            component="span"
            onClick={() => handleGenerate(false)}
            sx={{ fontSize: '0.78rem', color: accentColor, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
          >
            Generate
          </Typography>
        )}
      </Box>
    );
  }

  const formattedDate = new Date(pulse.weekStart).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <Box sx={{ mb: 2 }}>
      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          bgcolor: bgColor,
          border: `1px solid ${borderColor}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <AutoAwesomeIcon sx={{ fontSize: 14, color: accentColor, mt: '1px' }} />
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Spending Pulse · {formattedDate}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            {!isCurrentWeek && (
              <IconButton
                size="small"
                onClick={() => handleGenerate(true)}
                disabled={generating}
                sx={{ p: 0.5, color: accentColor }}
                title="Generate this week's pulse"
              >
                {generating ? <CircularProgress size={13} sx={{ color: accentColor }} /> : <RefreshIcon sx={{ fontSize: 14 }} />}
              </IconButton>
            )}
          </Box>
        </Box>

        <Typography sx={{ fontSize: '0.85rem', color: 'text.primary', lineHeight: 1.55 }}>
          {pulse.narrative}
        </Typography>

        {previousPulse && (
          <Box sx={{ mt: 1.5 }}>
            <Typography
              component="span"
              onClick={() => setShowPrevious((v) => !v)}
              sx={{
                fontSize: '0.73rem',
                color: accentColor,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.25,
              }}
            >
              How was last week?
              {showPrevious ? <KeyboardArrowUpIcon sx={{ fontSize: 14 }} /> : <KeyboardArrowDownIcon sx={{ fontSize: 14 }} />}
            </Typography>
            <Collapse in={showPrevious}>
              <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', lineHeight: 1.5, mt: 1 }}>
                {previousPulse.narrative}
              </Typography>
            </Collapse>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default SpendingPulse;
