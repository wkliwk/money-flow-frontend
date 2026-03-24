import React, { useRef, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Collapse,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { importExpensesCSV, ImportResult } from '../../services/api';

interface Props {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

function parsePreview(file: File): Promise<string[][]> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) || '';
      const lines = text.split('\n').filter(Boolean).slice(0, 4); // header + 3 rows
      resolve(lines.map((l) => l.split(',').map((c) => c.trim().replace(/^"|"$/g, ''))));
    };
    reader.readAsText(file);
  });
}

const ImportModal: React.FC<Props> = ({ open, onClose, onImported }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string[][] | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorsExpanded, setErrorsExpanded] = useState(false);

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setErrorsExpanded(false);
    setLoading(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setError(null);
    const rows = await parsePreview(f);
    setPreview(rows);
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const res = await importExpensesCSV(file);
      setResult(res);
      if (res.imported > 0) onImported();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Import failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Import transactions
        <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent>
        {!result && (
          <>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Upload a CSV file with columns: <strong>date, description, amount</strong> (category, type, notes optional).
            </Typography>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <Button variant="outlined" onClick={() => inputRef.current?.click()} fullWidth>
              {file ? `📄 ${file.name}` : 'Choose CSV file'}
            </Button>

            {preview && preview.length > 1 && (
              <Box sx={{ mt: 2, overflowX: 'auto' }}>
                <Typography variant="caption" color="text.disabled" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em' }}>
                  Preview (first 3 rows)
                </Typography>
                <Table size="small" sx={{ mt: 0.5 }}>
                  <TableHead>
                    <TableRow>
                      {preview[0].map((h, i) => (
                        <TableCell key={i} sx={{ fontSize: '0.72rem', fontWeight: 700, py: 0.5 }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {preview.slice(1).map((row, ri) => (
                      <TableRow key={ri}>
                        {row.map((cell, ci) => (
                          <TableCell key={ci} sx={{ fontSize: '0.72rem', py: 0.5, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cell}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}

            {error && (
              <Typography color="error" variant="body2" mt={2}>{error}</Typography>
            )}

            <Box sx={{ mt: 3, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button onClick={handleClose} disabled={loading}>Cancel</Button>
              <Button
                variant="contained"
                onClick={handleImport}
                disabled={!file || loading}
                startIcon={loading ? <CircularProgress size={16} /> : undefined}
              >
                {loading ? 'Importing…' : 'Import'}
              </Button>
            </Box>
          </>
        )}

        {result && (
          <Box>
            <Typography variant="h6" fontWeight={700} mb={1}>
              {result.imported > 0 ? '✅' : '⚠️'} Import complete
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Imported <strong>{result.imported}</strong> transaction{result.imported !== 1 ? 's' : ''}.
              {result.skipped > 0 && ` ${result.skipped} row${result.skipped !== 1 ? 's' : ''} skipped.`}
            </Typography>

            {result.errors.length > 0 && (
              <Box mt={2}>
                <Button
                  size="small"
                  onClick={() => setErrorsExpanded((v) => !v)}
                  endIcon={errorsExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  sx={{ mb: 0.5 }}
                >
                  {result.errors.length} skipped row{result.errors.length !== 1 ? 's' : ''} with issues
                </Button>
                <Collapse in={errorsExpanded}>
                  <Box sx={{ pl: 1, borderLeft: '2px solid rgba(251,113,133,0.3)' }}>
                    {result.errors.map((e) => (
                      <Typography key={e.row} variant="caption" color="text.secondary" display="block">
                        Row {e.row}: {e.reason}
                      </Typography>
                    ))}
                  </Box>
                </Collapse>
              </Box>
            )}

            <Box mt={3} display="flex" justifyContent="flex-end" gap={1}>
              <Button onClick={reset}>Import another file</Button>
              <Button variant="contained" onClick={handleClose}>Done</Button>
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ImportModal;
