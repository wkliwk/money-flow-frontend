import React, { useState } from 'react';
import { Box, TextField, Typography, CircularProgress } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';
import { parseTransactionText, ParsedTransaction } from '../../services/api';

interface Props {
  onParsed: (result: ParsedTransaction) => void;
  onScanClick?: () => void;
}

const NlpInput: React.FC<Props> = ({ onParsed, onScanClick }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [justParsed, setJustParsed] = useState(false);

  const handleParse = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setLoading(true);
    setError('');
    setJustParsed(false);
    try {
      const result = await parseTransactionText(trimmed);
      onParsed(result);
      setText('');
      setJustParsed(true);
    } catch (err: any) {
      const status = err?.response?.status;
      const serverMsg = err?.response?.data?.error;
      if (status === 429) {
        setError('Too many requests — try again in a minute');
      } else if (status === 401) {
        setError('Session expired — please log in again');
      } else if (serverMsg) {
        setError(serverMsg);
      } else if (err?.message?.includes('Network Error')) {
        setError('Network error — check your connection');
      } else {
        setError('Could not parse — try entering manually');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        mb: 2,
        p: '14px 16px 12px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, #EEEDFC 0%, #F0EEFF 100%)',
        border: '1.5px solid #D4D0F0',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.25 }}>
        <Box
          sx={{
            width: 24,
            height: 24,
            borderRadius: '8px',
            bgcolor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <AutoAwesomeIcon sx={{ fontSize: 14, color: '#fff' }} />
        </Box>
        <Typography
          sx={{
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '0.72rem',
            fontWeight: 600,
            color: 'primary.main',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          Quick Entry
        </Typography>
        <Box sx={{ flex: 1 }} />
        {onScanClick && (
          <Box
            role="button"
            tabIndex={0}
            onClick={onScanClick}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onScanClick(); }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              padding: '4px 10px',
              borderRadius: '8px',
              bgcolor: '#fff',
              border: '1px solid #D4D0F0',
              cursor: 'pointer',
              fontSize: '0.7rem',
              fontWeight: 500,
              color: 'primary.main',
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              '&:hover': { bgcolor: '#FAFAFF' },
            }}
          >
            <CameraAltOutlinedIcon sx={{ fontSize: 14 }} />
            Scan
          </Box>
        )}
      </Box>
      <TextField
        size="small"
        fullWidth
        multiline
        maxRows={3}
        placeholder="e.g. 今日同Casey食咗麥當勞 $65"
        value={text}
        onChange={(e) => { setText(e.target.value); setError(''); setJustParsed(false); }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleParse();
          }
        }}
        disabled={loading}
        error={!!error}
        helperText={error || undefined}
        InputProps={{
          sx: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '1.0625rem',
            fontWeight: 500,
            lineHeight: 1.5,
            color: '#1C1917',
            padding: 0,
            '& fieldset': { border: 'none' },
            '&.Mui-focused fieldset': { border: 'none' },
            '&:hover fieldset': { border: 'none' },
          },
        }}
        sx={{
          '& .MuiFormHelperText-root': {
            mx: 0,
            mt: 0.75,
            fontSize: '0.72rem',
          },
        }}
      />
      {(loading || justParsed) && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1 }}>
          <Box
            sx={{
              flex: 1,
              height: 3,
              borderRadius: '2px',
              bgcolor: 'primary.main',
              opacity: loading ? 0.4 : 0.6,
              position: 'relative',
              overflow: 'hidden',
              ...(loading && {
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
                  animation: 'nlpShimmer 1.2s infinite',
                },
                '@keyframes nlpShimmer': {
                  '0%': { transform: 'translateX(-100%)' },
                  '100%': { transform: 'translateX(100%)' },
                },
              }),
            }}
          />
          {loading ? (
            <CircularProgress size={11} sx={{ color: 'primary.main' }} />
          ) : (
            <Typography
              sx={{
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                fontSize: '0.68rem',
                fontWeight: 500,
                color: 'primary.main',
                letterSpacing: '0.02em',
              }}
            >
              Parsed ✓
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default NlpInput;
