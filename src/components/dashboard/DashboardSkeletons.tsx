import React from 'react';
import { Grid, Card, CardContent, Box, Skeleton } from '@mui/material';

export const SummaryCardsSkeleton: React.FC = () => (
  <Grid container spacing={2} sx={{ mb: 3 }}>
    {[0, 1, 2].map((i) => (
      <Grid item xs={12} sm={4} key={i}>
        <Card
          sx={{
            border: '1px solid rgba(148,163,184,0.12)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Skeleton variant="text" width={60} height={14} />
              <Skeleton variant="circular" width={20} height={20} />
            </Box>
            <Skeleton variant="text" width="70%" height={32} />
            <Skeleton variant="text" width={40} height={12} sx={{ mt: 0.5 }} />
          </CardContent>
        </Card>
      </Grid>
    ))}
  </Grid>
);

export const CategoryChartSkeleton: React.FC = () => (
  <Card sx={{ mb: 3, p: 0 }}>
    <CardContent sx={{ p: 3 }}>
      <Skeleton variant="text" width={140} height={14} sx={{ mb: 2 }} />
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 220 }}>
        <Skeleton variant="circular" width={160} height={160} />
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
        {[0, 1, 2, 3].map((i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Skeleton variant="circular" width={8} height={8} />
            <Skeleton variant="text" width={40} height={14} />
          </Box>
        ))}
      </Box>
    </CardContent>
  </Card>
);

export const SpendingBreakdownSkeleton: React.FC = () => (
  <Box sx={{ mb: 2, px: 0.5 }}>
    <Skeleton variant="text" width={130} height={14} sx={{ mb: 1.5 }} />
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Box key={i}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
            <Skeleton variant="text" width={80 + i * 10} height={16} />
            <Skeleton variant="text" width={50} height={16} />
          </Box>
          <Skeleton variant="rectangular" width="100%" height={4} sx={{ borderRadius: 2 }} />
        </Box>
      ))}
    </Box>
  </Box>
);

export const TrendsChartSkeleton: React.FC = () => (
  <Card sx={{ mb: 3 }}>
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Skeleton variant="text" width={100} height={14} />
        <Skeleton variant="text" width={30} height={14} />
      </Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
        {[0, 1, 2].map((i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Skeleton variant="circular" width={8} height={8} />
            <Skeleton variant="text" width={40} height={14} />
          </Box>
        ))}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 180, px: 2 }}>
        {[65, 85, 45, 90, 60, 75].map((h, i) => (
          <Box key={i} sx={{ flex: 1, display: 'flex', gap: 0.5, alignItems: 'flex-end' }}>
            <Skeleton variant="rectangular" width="45%" height={`${h}%`} sx={{ borderRadius: '4px 4px 0 0' }} />
            <Skeleton variant="rectangular" width="45%" height={`${h * 0.7}%`} sx={{ borderRadius: '4px 4px 0 0' }} />
          </Box>
        ))}
      </Box>
    </CardContent>
  </Card>
);

export const BudgetProgressSkeleton: React.FC = () => (
  <Box sx={{ mb: 2, p: 2, borderRadius: 2, bgcolor: 'rgba(148,163,184,0.04)', border: '1px solid rgba(148,163,184,0.08)' }}>
    <Skeleton variant="text" width={50} height={12} sx={{ mb: 1.5 }} />
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {[0, 1, 2].map((i) => (
        <Box key={i}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.25 }}>
            <Skeleton variant="text" width={70 + i * 15} height={16} />
            <Skeleton variant="text" width={90} height={14} />
          </Box>
          <Skeleton variant="rectangular" width="100%" height={6} sx={{ borderRadius: 3 }} />
        </Box>
      ))}
    </Box>
  </Box>
);
