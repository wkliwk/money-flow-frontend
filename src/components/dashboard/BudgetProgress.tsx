import React from 'react';
import { Box, Typography, LinearProgress, Button } from '@mui/material';

interface Props {
  budgets: Record<string, number>;
  categorySpend: Record<string, number>;
  convert: (hkd: number) => number;
  symbol: string;
  onGoToSettings: () => void;
}

function getColor(pct: number): 'success' | 'warning' | 'error' {
  if (pct >= 100) return 'error';
  if (pct >= 75) return 'warning';
  return 'success';
}

const BudgetProgress: React.FC<Props> = ({ budgets, categorySpend, convert, symbol, onGoToSettings }) => {
  const entries = Object.entries(budgets).filter(([, limit]) => limit > 0);

  if (entries.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 3 }}>
        <Typography variant="body2" color="text.secondary" mb={1}>
          No budgets set yet.
        </Typography>
        <Button size="small" variant="outlined" onClick={onGoToSettings}>
          Set budgets
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {entries.map(([cat, limit]) => {
        const spent = categorySpend[cat] || 0;
        const pct = Math.min(Math.round((spent / limit) * 100), 100);
        const color = getColor(pct);
        const spentDisplay = `${symbol}${convert(spent).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
        const limitDisplay = `${symbol}${convert(limit).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

        return (
          <Box key={cat}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" fontWeight={600}>{cat}</Typography>
              <Typography variant="body2" color="text.secondary">
                {spentDisplay} / {limitDisplay} — {pct}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={pct}
              color={color}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        );
      })}
    </Box>
  );
};

export default BudgetProgress;
