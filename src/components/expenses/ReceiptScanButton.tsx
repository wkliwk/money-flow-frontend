import React, { useRef } from 'react';
import { Box, CircularProgress, IconButton, Tooltip, Typography } from '@mui/material';
import DocumentScannerIcon from '@mui/icons-material/DocumentScanner';

interface Props {
  onFileSelected: (file: File) => void;
  loading: boolean;
  size?: 'small' | 'medium';
}

const ReceiptScanButton: React.FC<Props> = ({ onFileSelected, loading, size = 'medium' }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (loading) return;
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelected(file);
    }
    // Reset so same file can be re-selected
    e.target.value = '';
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleChange}
        aria-label="Scan receipt"
      />
      <Tooltip title="Scan receipt" placement="top">
        <span>
          <IconButton
            size={size}
            onClick={handleClick}
            disabled={loading}
            aria-label="Scan receipt with camera or upload photo"
            sx={{
              color: loading ? 'text.disabled' : 'rgba(129,140,248,0.85)',
              bgcolor: 'rgba(129,140,248,0.08)',
              border: '1px solid rgba(129,140,248,0.2)',
              borderRadius: 2,
              '&:hover': {
                bgcolor: 'rgba(129,140,248,0.15)',
                borderColor: 'rgba(129,140,248,0.4)',
              },
              '&:disabled': {
                bgcolor: 'rgba(148,163,184,0.05)',
                borderColor: 'rgba(148,163,184,0.1)',
              },
            }}
          >
            {loading ? (
              <CircularProgress size={size === 'small' ? 16 : 20} sx={{ color: 'rgba(129,140,248,0.6)' }} />
            ) : (
              <DocumentScannerIcon sx={{ fontSize: size === 'small' ? 18 : 22 }} />
            )}
          </IconButton>
        </span>
      </Tooltip>
      {loading && (
        <Typography variant="caption" sx={{ color: 'rgba(129,140,248,0.8)', fontSize: '0.72rem', fontStyle: 'italic' }}>
          Scanning receipt...
        </Typography>
      )}
    </Box>
  );
};

export default ReceiptScanButton;
