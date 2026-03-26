import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';

interface Props {
  budgets: Record<string, number>;
  categorySpend: Record<string, number>;
  convert: (hkd: number) => number;
  symbol: string;
  onCategoryClick?: (category: string) => void;
}

const BudgetProgress: React.FC<Props> = ({ budgets, categorySpend, convert, symbol, onCategoryClick }) => {
  const entries = Object.entries(budgets)
    .filter(([, limit]) => limit > 0)
    .map(([category, limit]) => {
      const spent = categorySpend[category] || 0;
      const pct = Math.min((spent / limit) * 100, 100);
      return { category, limit, spent, pct };
    })
    .sort((a, b) => b.pct - a.pct);

  if (entries.length === 0) return null;

  return (
    <Box sx={{ mb: 2, p: 2, borderRadius: 2, bgcolor: 'rgba(148,163,184,0.04)', border: '1px solid rgba(148,163,184,0.08)' }}>
      <Typography sx={{ fontSize: '0.65rem', color: 'text.disabled', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', mb: 1.5 }}>
        Budget
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {entries.map(({ category, limit, spent, pct }) => {
          const color = pct >= 90 ? '#fb7185' : pct >= 70 ? '#fbbf24' : '#34d399';
          return (
            <Box
              key={category}
              onClick={() => onCategoryClick?.(category)}
              sx={{ cursor: onCategoryClick ? 'pointer' : 'default' }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.25 }}>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: 'text.primary' }}>
                  {category}
                </Typography>
                <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>
                  {symbol}{convert(spent).toLocaleString(undefined, { maximumFractionDigits: 0 })} / {symbol}{convert(limit).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={pct}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: 'rgba(148,163,184,0.1)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 3,
                    bgcolor: color,
                  },
                }}
              />
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default BudgetProgress;
