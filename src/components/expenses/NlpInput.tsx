import React, { useState } from 'react';
import { Box, TextField, IconButton, CircularProgress, Typography, Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { parseTransactionText, ParsedTransaction } from '../../services/api';

interface Props {
  onParsed: (result: ParsedTransaction) => void;
}

const NlpInput: React.FC<Props> = ({ onParsed }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleParse = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setLoading(true);
    setError('');
    try {
      const result = await parseTransactionText(trimmed);
      onParsed(result);
      setText('');
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 429) {
        setError('Too many requests — try again in a minute');
      } else {
        setError('Could not parse — try entering manually');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mb: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
        <AutoFixHighIcon sx={{ fontSize: 14, color: 'primary.main' }} />
        <Typography variant="caption" sx={{ fontSize: '0.68rem', color: 'primary.main', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Quick Entry
        </Typography>
        <Chip label="AI" size="small" sx={{ height: 16, fontSize: '0.6rem', bgcolor: isDark ? 'rgba(129,140,248,0.15)' : 'rgba(99,102,241,0.12)', color: 'primary.main', ml: 0.5 }} />
      </Box>
      <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'flex-start' }}>
        <TextField
          size="small"
          fullWidth
          multiline
          maxRows={2}
          placeholder="e.g. 今日同Casey食咗麥當勞 $65"
          value={text}
          onChange={(e) => { setText(e.target.value); setError(''); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleParse();
            }
          }}
          disabled={loading}
          error={!!error}
          helperText={error || undefined}
          sx={{
            '& .MuiInputBase-root': {
              fontSize: '0.88rem',
              py: 0.5,
              bgcolor: isDark ? 'rgba(129,140,248,0.04)' : 'rgba(99,102,241,0.04)',
              borderRadius: 2,
            },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: isDark ? 'rgba(129,140,248,0.2)' : 'rgba(99,102,241,0.2)',
            },
            '& .MuiInputBase-root:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'primary.main',
            },
          }}
        />
        <IconButton
          size="small"
          onClick={handleParse}
          disabled={loading || !text.trim()}
          sx={{
            mt: 0.25,
            bgcolor: isDark ? 'rgba(129,140,248,0.12)' : 'rgba(99,102,241,0.12)',
            border: `1px solid ${isDark ? 'rgba(129,140,248,0.25)' : 'rgba(99,102,241,0.25)'}`,
            '&:hover': { bgcolor: isDark ? 'rgba(129,140,248,0.22)' : 'rgba(99,102,241,0.22)' },
            '&.Mui-disabled': { opacity: 0.4 },
          }}
        >
          {loading ? <CircularProgress size={18} /> : <AutoFixHighIcon sx={{ fontSize: 18, color: 'primary.main' }} />}
        </IconButton>
      </Box>
    </Box>
  );
};

export default NlpInput;
