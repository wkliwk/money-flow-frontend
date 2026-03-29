import React, { useRef, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Collapse,
  Checkbox,
  Chip,
  Alert,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { scanStatement, applyStatementImport, StatementTxn, StatementScanResult } from '../../services/api';

function fmtAmount(txn: StatementTxn): string {
  const sign = txn.type === 'income' ? '+' : '-';
  return `${sign}${txn.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const StatementReconciler: React.FC<{ onImported?: () => void }> = ({ onImported }) => {
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<StatementScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const [showMatched, setShowMatched] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true);
    setResult(null);
    setError(null);
    setSelected(new Set());
    setImportedCount(null);
    try {
      const data = await scanStatement(file);
      setResult(data);
      // Pre-select all missing transactions
      setSelected(new Set(data.missing.map((_, i) => i)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed. Please try again.');
    } finally {
      setScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toggleSelect = (i: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const handleImport = async () => {
    if (!result || selected.size === 0) return;
    const toImport = result.missing.filter((_, i) => selected.has(i));
    setImporting(true);
    try {
      const { imported } = await applyStatementImport(toImport);
      setImportedCount(imported);
      setResult((prev) => prev ? { ...prev, missing: prev.missing.filter((_, i) => !selected.has(i)) } : prev);
      setSelected(new Set());
      onImported?.();
    } catch {
      setError('Import failed. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  const isDark = theme.palette.mode === 'dark';
  const borderColor = 'divider';

  return (
    <Box>
      <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
        Statement Reconciliation
      </Typography>
      <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled', mb: 1.5 }}>
        Upload a bank or credit card statement (PDF or image) to check for missing transactions.
      </Typography>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.heic,.webp"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <Button
        variant="outlined"
        size="small"
        startIcon={scanning ? <CircularProgress size={14} /> : <UploadFileIcon sx={{ fontSize: 16 }} />}
        disabled={scanning}
        onClick={() => fileInputRef.current?.click()}
        sx={{ fontSize: '0.78rem', mb: 1.5 }}
      >
        {scanning ? 'Scanning…' : 'Upload Statement'}
      </Button>

      {error && (
        <Alert severity="error" sx={{ mb: 1.5, fontSize: '0.78rem' }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {importedCount !== null && (
        <Alert severity="success" sx={{ mb: 1.5, fontSize: '0.78rem' }} onClose={() => setImportedCount(null)}>
          Imported {importedCount} transaction{importedCount !== 1 ? 's' : ''} successfully.
        </Alert>
      )}

      {result && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {/* Summary row */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              icon={<CheckCircleOutlineIcon sx={{ fontSize: 14 }} />}
              label={`${result.matched.length} matched`}
              size="small"
              sx={{ fontSize: '0.72rem', bgcolor: isDark ? alpha('#4ade80', 0.1) : alpha('#16a34a', 0.08), color: 'success.main', border: `1px solid ${isDark ? alpha('#4ade80', 0.2) : alpha('#16a34a', 0.15)}` }}
              onClick={() => setShowMatched((v) => !v)}
            />
            {result.missing.length > 0 && (
              <Chip
                icon={<AddCircleOutlineIcon sx={{ fontSize: 14 }} />}
                label={`${result.missing.length} missing`}
                size="small"
                sx={{ fontSize: '0.72rem', bgcolor: isDark ? alpha('#f87171', 0.1) : alpha('#dc2626', 0.08), color: 'error.light', border: `1px solid ${isDark ? alpha('#f87171', 0.2) : alpha('#dc2626', 0.15)}` }}
              />
            )}
            {result.discrepancies.length > 0 && (
              <Chip
                icon={<WarningAmberIcon sx={{ fontSize: 14 }} />}
                label={`${result.discrepancies.length} discrepancies`}
                size="small"
                sx={{ fontSize: '0.72rem', bgcolor: isDark ? alpha('#fbbf24', 0.1) : alpha('#d97706', 0.08), color: 'warning.main', border: `1px solid ${isDark ? alpha('#fbbf24', 0.2) : alpha('#d97706', 0.15)}` }}
              />
            )}
          </Box>

          {/* Matched (collapsible) */}
          {result.matched.length > 0 && (
            <Collapse in={showMatched}>
              <Box sx={{ borderRadius: 2, border: '1px solid', borderColor, overflow: 'hidden' }}>
                <Typography variant="caption" sx={{ display: 'block', px: 2, py: 1, fontSize: '0.68rem', color: 'success.main', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Matched in Money Flow
                </Typography>
                {result.matched.map((m, i) => (
                  <Box key={i} sx={{ px: 2, py: 1, borderTop: '1px solid', borderColor, display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                    <Box>
                      <Typography sx={{ fontSize: '0.8rem', fontWeight: 500 }}>{m.extracted.description}</Typography>
                      <Typography sx={{ fontSize: '0.68rem', color: 'text.disabled' }}>{fmtDate(m.extracted.date)} · {m.existingDescription}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: 'success.main', flexShrink: 0 }}>{fmtAmount(m.extracted)}</Typography>
                  </Box>
                ))}
              </Box>
            </Collapse>
          )}

          {/* Discrepancies */}
          {result.discrepancies.length > 0 && (
            <Box sx={{ borderRadius: 2, border: '1px solid', borderColor, overflow: 'hidden' }}>
              <Typography variant="caption" sx={{ display: 'block', px: 2, py: 1, fontSize: '0.68rem', color: 'warning.main', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Discrepancies
              </Typography>
              {result.discrepancies.map((d, i) => (
                <Box key={i} sx={{ px: 2, py: 1, borderTop: '1px solid', borderColor }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 500 }}>{d.extracted.description}</Typography>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, flexShrink: 0 }}>{fmtAmount(d.extracted)}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: '0.68rem', color: 'warning.main' }}>
                    {d.reason} · statement: {fmtDate(d.extracted.date)} · logged: {d.existingDescription}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}

          {/* Missing — selectable for import */}
          {result.missing.length > 0 && (
            <Box>
              <Box sx={{ borderRadius: 2, border: '1px solid', borderColor, overflow: 'hidden', mb: 1 }}>
                <Box sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="caption" sx={{ fontSize: '0.68rem', color: 'error.light', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Not in Money Flow
                  </Typography>
                  <Typography
                    component="span"
                    onClick={() => {
                      if (selected.size === result.missing.length) setSelected(new Set());
                      else setSelected(new Set(result.missing.map((_, i) => i)));
                    }}
                    sx={{ fontSize: '0.7rem', color: 'primary.main', cursor: 'pointer', fontWeight: 600 }}
                  >
                    {selected.size === result.missing.length ? 'Deselect all' : 'Select all'}
                  </Typography>
                </Box>
                {result.missing.map((txn, i) => (
                  <Box
                    key={i}
                    sx={{ px: 2, py: 1, borderTop: '1px solid', borderColor, display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                    onClick={() => toggleSelect(i)}
                  >
                    <Checkbox
                      checked={selected.has(i)}
                      size="small"
                      sx={{ p: 0, mr: 0.5 }}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => toggleSelect(i)}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: '0.8rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{txn.description}</Typography>
                      <Typography sx={{ fontSize: '0.68rem', color: 'text.disabled' }}>{fmtDate(txn.date)}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: txn.type === 'income' ? 'success.main' : 'error.light', flexShrink: 0 }}>
                      {fmtAmount(txn)}
                    </Typography>
                  </Box>
                ))}
              </Box>
              <Button
                variant="contained"
                size="small"
                disabled={selected.size === 0 || importing}
                startIcon={importing ? <CircularProgress size={14} color="inherit" /> : undefined}
                onClick={handleImport}
                sx={{ fontSize: '0.78rem' }}
              >
                {importing ? 'Importing…' : `Import ${selected.size} transaction${selected.size !== 1 ? 's' : ''}`}
              </Button>
            </Box>
          )}

          {result.missing.length === 0 && result.extracted.length > 0 && (
            <Typography sx={{ fontSize: '0.8rem', color: 'success.main', fontWeight: 500 }}>
              All statement transactions are accounted for in Money Flow.
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default StatementReconciler;
