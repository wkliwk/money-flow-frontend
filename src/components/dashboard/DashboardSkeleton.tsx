import React from 'react';
import { Box, Grid, Skeleton } from '@mui/material';

/**
 * Dashboard loading state per patterns.md:
 * - Summary cards: 3 cards, 80h, label-shape (60x12) + amount-shape (120x24)
 * - Chart: single rect 200h matching container
 * - List rows: 5 rows, ~56h, three-shape (icon, text, amount), same height/radius as real row
 *
 * MUI <Skeleton animation="wave"> matches the "shimmer 1.5s linear infinite" guidance.
 * Marked as aria-busy so assistive tech announces loading state.
 */
const DashboardSkeleton: React.FC = () => (
  <Box aria-busy="true" aria-live="polite" data-testid="dashboard-skeleton">
    {/* Summary cards row */}
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {[0, 1, 2].map((i) => (
        <Grid item xs={12} sm={4} key={i}>
          <Skeleton
            variant="rounded"
            height={80}
            animation="wave"
            sx={{ borderRadius: 2 }}
          />
        </Grid>
      ))}
    </Grid>

    {/* Chart placeholder */}
    <Skeleton
      variant="rounded"
      height={200}
      animation="wave"
      sx={{ borderRadius: 2, mb: 3 }}
    />

    {/* Recent list — five rows */}
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Box
          key={i}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 1.5,
            borderRadius: 2,
            border: (t) => `1px solid ${t.palette.divider}`,
          }}
        >
          <Skeleton variant="circular" width={32} height={32} animation="wave" />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="60%" height={14} animation="wave" />
            <Skeleton variant="text" width="40%" height={10} animation="wave" />
          </Box>
          <Skeleton variant="text" width={60} height={18} animation="wave" />
        </Box>
      ))}
    </Box>
  </Box>
);

export default DashboardSkeleton;
