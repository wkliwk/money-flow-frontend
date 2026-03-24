import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Button, TextField, Card, CardContent, LinearProgress, Grid } from '@mui/material';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import dayjs from 'dayjs';
import { getNetWorthSnapshots, getLatestNetWorth, createNetWorthSnapshot, updateNetWorthSnapshot } from '../../services/api';
import { NetWorthSnapshot } from '../../services/api';

interface NetWorthPageProps {
  convert: (amount: number) => number;
  symbol: string;
}

const NetWorthPage: React.FC<NetWorthPageProps> = ({ convert, symbol }) => {
  const [snapshots, setSnapshots] = useState<NetWorthSnapshot[]>([]);
  const [latest, setLatest] = useState<NetWorthSnapshot | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [assets, setAssets] = useState({ cash: 0, investments: 0, property: 0, other: 0 });
  const [liabilities, setLiabilities] = useState({ loans: 0, creditCardDebt: 0, other: 0 });
  const [loading, setLoading] = useState(true);

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const snaps = await getNetWorthSnapshots(12);
        const lat = await getLatestNetWorth();
        setSnapshots(snaps || []);
        setLatest(lat);
        if (lat) {
          setAssets(lat.assets || {});
          setLiabilities(lat.liabilities || {});
        }
      } catch {
        // silent fail
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalAssets = useMemo(() => {
    return (assets.cash || 0) + (assets.investments || 0) + (assets.property || 0) + (assets.other || 0);
  }, [assets]);

  const totalLiabilities = useMemo(() => {
    return (liabilities.loans || 0) + (liabilities.creditCardDebt || 0) + (liabilities.other || 0);
  }, [liabilities]);

  const netWorth = totalAssets - totalLiabilities;

  const chartData = useMemo(() => {
    return (snapshots || []).map((s) => ({
      date: dayjs(s.date).format('MMM D'),
      netWorth: (s.netWorth || 0),
    }));
  }, [snapshots]);

  const handleSave = async () => {
    try {
      if (latest && editingId) {
        await updateNetWorthSnapshot(editingId, { assets, liabilities });
      } else {
        const newSnapshot = await createNetWorthSnapshot({ assets, liabilities });
        setLatest(newSnapshot);
        setEditingId(null);
      }
      // Refresh data
      const snaps = await getNetWorthSnapshots(12);
      setSnapshots(snaps);
    } catch {
      // error handling
    }
  };

  if (loading) return <Typography>Loading...</Typography>;

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>
        Net Worth
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)' }}>
            <CardContent>
              <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled', textTransform: 'uppercase', fontWeight: 700, mb: 1 }}>
                Total Assets
              </Typography>
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: '#34d399' }}>
                {symbol}{convert(totalAssets).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'rgba(251,113,133,0.1)', border: '1px solid rgba(251,113,133,0.3)' }}>
            <CardContent>
              <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled', textTransform: 'uppercase', fontWeight: 700, mb: 1 }}>
                Total Liabilities
              </Typography>
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: '#fb7185' }}>
                {symbol}{convert(totalLiabilities).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.3)' }}>
            <CardContent>
              <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled', textTransform: 'uppercase', fontWeight: 700, mb: 1 }}>
                Net Worth
              </Typography>
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: netWorth >= 0 ? '#34d399' : '#fb7185' }}>
                {symbol}{convert(netWorth).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.3)' }}>
            <CardContent>
              <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled', textTransform: 'uppercase', fontWeight: 700, mb: 1 }}>
                Ratio
              </Typography>
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: 'text.primary' }}>
                {totalAssets > 0 ? (totalAssets / totalLiabilities || 1).toFixed(1) : '—'}x
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Net Worth Trend Chart */}
      {chartData.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              12-Month Trend
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                <XAxis dataKey="date" stroke="rgba(148,163,184,0.5)" />
                <YAxis stroke="rgba(148,163,184,0.5)" />
                <Tooltip formatter={(val) => `${symbol}${convert(val as number).toLocaleString()}`} />
                <Line type="monotone" dataKey="netWorth" stroke="#818cf8" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Forms */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Assets
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <TextField
                  label="Cash"
                  type="number"
                  value={assets.cash || 0}
                  onChange={(e) => setAssets({ ...assets, cash: parseFloat(e.target.value) || 0 })}
                  size="small"
                />
                <TextField
                  label="Investments"
                  type="number"
                  value={assets.investments || 0}
                  onChange={(e) => setAssets({ ...assets, investments: parseFloat(e.target.value) || 0 })}
                  size="small"
                />
                <TextField
                  label="Property"
                  type="number"
                  value={assets.property || 0}
                  onChange={(e) => setAssets({ ...assets, property: parseFloat(e.target.value) || 0 })}
                  size="small"
                />
                <TextField
                  label="Other"
                  type="number"
                  value={assets.other || 0}
                  onChange={(e) => setAssets({ ...assets, other: parseFloat(e.target.value) || 0 })}
                  size="small"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Liabilities
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <TextField
                  label="Loans"
                  type="number"
                  value={liabilities.loans || 0}
                  onChange={(e) => setLiabilities({ ...liabilities, loans: parseFloat(e.target.value) || 0 })}
                  size="small"
                />
                <TextField
                  label="Credit Card Debt"
                  type="number"
                  value={liabilities.creditCardDebt || 0}
                  onChange={(e) => setLiabilities({ ...liabilities, creditCardDebt: parseFloat(e.target.value) || 0 })}
                  size="small"
                />
                <TextField
                  label="Other"
                  type="number"
                  value={liabilities.other || 0}
                  onChange={(e) => setLiabilities({ ...liabilities, other: parseFloat(e.target.value) || 0 })}
                  size="small"
                />
                <Button variant="contained" onClick={handleSave} sx={{ mt: 1 }}>
                  Save Snapshot
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default NetWorthPage;
