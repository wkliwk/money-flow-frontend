import React, { useCallback, useEffect, useState } from 'react';
import { Box, Typography, TextField, Button, InputAdornment, Skeleton } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getNetWorth, getLatestNetWorth, createNetWorth, NetWorthSnapshot } from '../../services/api';

interface Props {
  convert: (hkd: number) => number;
  symbol: string;
}

const ASSET_FIELDS = [
  { key: 'cash', label: 'Cash & Savings' },
  { key: 'investments', label: 'Investments' },
  { key: 'property', label: 'Property' },
  { key: 'other', label: 'Other Assets' },
] as const;

const LIABILITY_FIELDS = [
  { key: 'loans', label: 'Loans' },
  { key: 'creditCardDebt', label: 'Credit Card Debt' },
  { key: 'other', label: 'Other Liabilities' },
] as const;

const NetWorthPage: React.FC<Props> = ({ convert, symbol }) => {
  const theme = useTheme();
  const [snapshots, setSnapshots] = useState<NetWorthSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [assets, setAssets] = useState({ cash: 0, investments: 0, property: 0, other: 0 });
  const [liabilities, setLiabilities] = useState({ loans: 0, creditCardDebt: 0, other: 0 });

  const fetchData = useCallback(async () => {
    try {
      const [history, latest] = await Promise.all([getNetWorth(12), getLatestNetWorth()]);
      setSnapshots(history);
      if (latest) {
        setAssets(latest.assets);
        setLiabilities(latest.liabilities);
      }
    } catch { /* offline or no data */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalAssets = assets.cash + assets.investments + assets.property + assets.other;
  const totalLiabilities = liabilities.loans + liabilities.creditCardDebt + liabilities.other;
  const netWorth = totalAssets - totalLiabilities;

  const handleSave = async () => {
    setSaving(true);
    try {
      await createNetWorth({ assets, liabilities });
      await fetchData();
      setShowForm(false);
    } catch { /* error */ }
    setSaving(false);
  };

  const chartData = snapshots.map((s) => ({
    month: new Date(s.date).toLocaleDateString('en', { month: 'short', year: '2-digit' }),
    netWorth: s.netWorth,
    assets: (s.assets.cash || 0) + (s.assets.investments || 0) + (s.assets.property || 0) + (s.assets.other || 0),
    liabilities: (s.liabilities.loans || 0) + (s.liabilities.creditCardDebt || 0) + (s.liabilities.other || 0),
  }));

  if (loading) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto' }}>
        <Skeleton variant="text" width={120} height={14} sx={{ mb: 1 }} />
        <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: 'rgba(148,163,184,0.04)', border: '1px solid rgba(148,163,184,0.08)', mb: 2, textAlign: 'center' }}>
          <Skeleton variant="text" width="35%" height={18} sx={{ mx: 'auto', mb: 1 }} />
          <Skeleton variant="text" width="55%" height={44} sx={{ mx: 'auto' }} />
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 1 }}>
            <Skeleton variant="text" width={72} height={28} />
            <Skeleton variant="text" width={72} height={28} />
          </Box>
        </Box>
        <Box sx={{ mb: 2, p: 2, borderRadius: 2, bgcolor: 'rgba(148,163,184,0.04)', border: '1px solid rgba(148,163,184,0.08)' }}>
          <Skeleton variant="text" width={80} height={14} sx={{ mb: 1 }} />
          <Skeleton variant="rounded" width="100%" height={180} />
        </Box>
        <Skeleton variant="rounded" width="100%" height={44} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" width="100%" height={240} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto' }}>
      {/* Summary Card */}
      <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: 'rgba(148,163,184,0.04)', border: '1px solid rgba(148,163,184,0.08)', mb: 2, textAlign: 'center' }}>
        <Typography sx={{ fontSize: '0.65rem', color: 'text.disabled', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', mb: 0.5 }}>
          Net Worth
        </Typography>
        <Typography sx={{ fontSize: '2rem', fontWeight: 800, color: netWorth >= 0 ? theme.palette.success.light : theme.palette.error.light, lineHeight: 1.2 }}>
          {netWorth < 0 ? '-' : ''}{symbol}{convert(Math.abs(netWorth)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 1 }}>
          <Box>
            <Typography sx={{ fontSize: '0.65rem', color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Assets</Typography>
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: theme.palette.success.light }}>{symbol}{convert(totalAssets).toLocaleString(undefined, { maximumFractionDigits: 0 })}</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: '0.65rem', color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Liabilities</Typography>
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: theme.palette.error.light }}>{symbol}{convert(totalLiabilities).toLocaleString(undefined, { maximumFractionDigits: 0 })}</Typography>
          </Box>
        </Box>
      </Box>

      {/* Chart */}
      {chartData.length >= 2 && (
        <Box sx={{ mb: 2, p: 2, borderRadius: 2, bgcolor: 'rgba(148,163,184,0.04)', border: '1px solid rgba(148,163,184,0.08)' }}>
          <Typography sx={{ fontSize: '0.65rem', color: 'text.disabled', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', mb: 1 }}>
            Trend
          </Typography>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: theme.palette.text.secondary }} />
              <YAxis tick={{ fontSize: 10, fill: theme.palette.text.secondary }} tickFormatter={(v) => `${symbol}${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => [`${symbol}${convert(Number(value)).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, '']} />
              <Line type="monotone" dataKey="netWorth" stroke={theme.palette.primary.main} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      )}

      {/* Update Button or Form */}
      {!showForm ? (
        <Button
          variant="contained"
          fullWidth
          onClick={() => setShowForm(true)}
          sx={{ mb: 2, py: 1.25 }}
        >
          {snapshots.length === 0 ? 'Add First Snapshot' : 'Update Net Worth'}
        </Button>
      ) : (
        <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(148,163,184,0.04)', border: '1px solid rgba(148,163,184,0.08)', mb: 2 }}>
          <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', mb: 1.5 }}>
            Assets
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
            {ASSET_FIELDS.map(({ key, label }) => (
              <TextField
                key={key}
                label={label}
                type="number"
                size="small"
                fullWidth
                value={assets[key] || ''}
                onChange={(e) => setAssets((prev) => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
                InputProps={{ startAdornment: <InputAdornment position="start"><Typography sx={{ fontSize: '0.78rem', color: 'text.disabled' }}>HK$</Typography></InputAdornment> }}
                inputProps={{ min: 0 }}
              />
            ))}
          </Box>

          <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', mb: 1.5 }}>
            Liabilities
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
            {LIABILITY_FIELDS.map(({ key, label }) => (
              <TextField
                key={key}
                label={label}
                type="number"
                size="small"
                fullWidth
                value={liabilities[key] || ''}
                onChange={(e) => setLiabilities((prev) => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
                InputProps={{ startAdornment: <InputAdornment position="start"><Typography sx={{ fontSize: '0.78rem', color: 'text.disabled' }}>HK$</Typography></InputAdornment> }}
                inputProps={{ min: 0 }}
              />
            ))}
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button size="small" onClick={() => setShowForm(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
            <Button size="small" variant="contained" onClick={handleSave} disabled={saving} sx={{ flex: 1 }}>
              {saving ? 'Saving...' : 'Save Snapshot'}
            </Button>
          </Box>
        </Box>
      )}

      {/* Breakdown */}
      {(totalAssets > 0 || totalLiabilities > 0) && (
        <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(148,163,184,0.04)', border: '1px solid rgba(148,163,184,0.08)' }}>
          <Typography sx={{ fontSize: '0.65rem', color: 'text.disabled', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', mb: 1.5 }}>
            Breakdown
          </Typography>
          {totalAssets > 0 && (
            <Box sx={{ mb: 1.5 }}>
              <Typography sx={{ fontSize: '0.72rem', color: theme.palette.success.light, fontWeight: 600, mb: 0.5 }}>Assets</Typography>
              {ASSET_FIELDS.filter(({ key }) => assets[key] > 0).map(({ key, label }) => (
                <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                  <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>{label}</Typography>
                  <Typography sx={{ fontSize: '0.78rem', color: 'text.primary', fontWeight: 600 }}>{symbol}{convert(assets[key]).toLocaleString(undefined, { maximumFractionDigits: 0 })}</Typography>
                </Box>
              ))}
            </Box>
          )}
          {totalLiabilities > 0 && (
            <Box>
              <Typography sx={{ fontSize: '0.72rem', color: theme.palette.error.light, fontWeight: 600, mb: 0.5 }}>Liabilities</Typography>
              {LIABILITY_FIELDS.filter(({ key }) => liabilities[key] > 0).map(({ key, label }) => (
                <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                  <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>{label}</Typography>
                  <Typography sx={{ fontSize: '0.78rem', color: 'text.primary', fontWeight: 600 }}>{symbol}{convert(liabilities[key]).toLocaleString(undefined, { maximumFractionDigits: 0 })}</Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default NetWorthPage;
