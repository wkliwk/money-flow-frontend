import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, TextField, Button, Typography, Link, Alert, CircularProgress, InputAdornment, IconButton,
} from '@mui/material';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { register } from '../../services/api';
import SSOButtons from './SSOButtons';
import { tokens } from '../../theme';

const DollarIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
  </svg>
);

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(email, password);
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })
        .response?.data?.error;
      setError(msg || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: tokens.primaryDark,
      }}
    >
      {/* Brand hero — top section */}
      <Box
        sx={{
          bgcolor: tokens.primaryDark,
          px: 3,
          pt: '80px',
          pb: '40px',
          flexShrink: 0,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <Box sx={{
          position: 'absolute', top: -60, right: -40,
          width: 180, height: 180, borderRadius: '50%',
          bgcolor: 'rgba(91,78,199,0.12)', pointerEvents: 'none',
        }} />
        <Box sx={{
          position: 'absolute', bottom: -30, left: -20,
          width: 120, height: 120, borderRadius: '50%',
          bgcolor: 'rgba(91,78,199,0.08)', pointerEvents: 'none',
        }} />

        {/* Logo + wordmark */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, position: 'relative', zIndex: 1 }}>
          <Box
            sx={{
              width: 44, height: 44, borderRadius: '14px',
              bgcolor: tokens.primary,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <DollarIcon />
          </Box>
          <Typography
            sx={{
              fontFamily: `'Space Grotesk', sans-serif`,
              fontSize: 26,
              fontWeight: 700,
              color: '#fff',
              letterSpacing: '-0.5px',
            }}
          >
            MoneyFlow
          </Typography>
        </Box>
        <Typography
          sx={{
            fontFamily: `'Plus Jakarta Sans', sans-serif`,
            fontSize: 15,
            color: 'rgba(255,255,255,0.5)',
            lineHeight: 1.4,
            position: 'relative',
            zIndex: 1,
          }}
        >
          Start tracking your finances today.
        </Typography>
      </Box>

      {/* Form bottom sheet */}
      <Box
        sx={{
          flex: 1,
          bgcolor: tokens.surface,
          borderRadius: '24px 24px 0 0',
          mt: '-20px',
          px: 3,
          pt: '28px',
          pb: 3,
          display: 'flex',
          flexDirection: 'column',
          maxWidth: 480,
          width: '100%',
          alignSelf: 'center',
          mx: 'auto',
        }}
      >
        <Typography
          sx={{
            fontFamily: `'Space Grotesk', sans-serif`,
            fontSize: 22,
            fontWeight: 700,
            color: tokens.text1,
            letterSpacing: '-0.3px',
            mb: 3,
          }}
        >
          Create account
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>
            {error}
          </Alert>
        )}

        <SSOButtons />

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box>
            <Typography
              component="label"
              htmlFor="register-email"
              sx={{ fontFamily: `'Plus Jakarta Sans', sans-serif`, fontSize: 12, fontWeight: 600, color: tokens.text2, mb: 0.75, display: 'block' }}
            >
              Email
            </Typography>
            <TextField
              id="register-email"
              type="email"
              fullWidth
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  bgcolor: tokens.surfaceAlt,
                  '& fieldset': { borderColor: tokens.border, borderWidth: '1.5px' },
                  '&:hover fieldset': { borderColor: tokens.primary, borderWidth: '1.5px' },
                  '&.Mui-focused fieldset': { borderColor: tokens.primary, borderWidth: '1.5px' },
                },
                '& .MuiInputBase-input': {
                  fontFamily: `'Plus Jakarta Sans', sans-serif`,
                  fontSize: '0.875rem',
                  py: '12px',
                  px: '14px',
                  color: tokens.text1,
                  '&::placeholder': { color: tokens.text3 },
                },
              }}
            />
          </Box>
          <Box>
            <Typography
              component="label"
              htmlFor="register-password"
              sx={{ fontFamily: `'Plus Jakarta Sans', sans-serif`, fontSize: 12, fontWeight: 600, color: tokens.text2, mb: 0.75, display: 'block' }}
            >
              Password
            </Typography>
            <TextField
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              size="small"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setShowPassword((s) => !s)}
                      edge="end"
                      aria-label={showPassword ? 'Hide' : 'Show'}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword
                        ? <VisibilityOffOutlinedIcon sx={{ fontSize: 18, color: tokens.text3 }} />
                        : <VisibilityOutlinedIcon sx={{ fontSize: 18, color: tokens.text3 }} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  bgcolor: tokens.surfaceAlt,
                  '& fieldset': { borderColor: tokens.border, borderWidth: '1.5px' },
                  '&:hover fieldset': { borderColor: tokens.primary, borderWidth: '1.5px' },
                  '&.Mui-focused fieldset': { borderColor: tokens.primary, borderWidth: '1.5px' },
                },
                '& .MuiInputBase-input': {
                  fontFamily: `'Plus Jakarta Sans', sans-serif`,
                  fontSize: '0.875rem',
                  py: '12px',
                  px: '14px',
                  color: tokens.text1,
                  '&::placeholder': { color: tokens.text3 },
                },
              }}
            />
          </Box>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            sx={{
              mt: 1,
              py: '14px',
              borderRadius: '14px',
              fontSize: '0.9375rem',
              fontWeight: 600,
              bgcolor: tokens.primary,
              '&:hover': { bgcolor: tokens.primaryHover },
            }}
          >
            {loading ? <CircularProgress size={22} color="inherit" /> : 'Create Account'}
          </Button>
        </Box>

        <Typography
          align="center"
          sx={{
            fontFamily: `'Plus Jakarta Sans', sans-serif`,
            fontSize: '0.8125rem',
            color: tokens.text3,
            mt: 'auto',
            pt: 3,
          }}
        >
          Already have an account?{' '}
          <Link
            component={RouterLink}
            to="/login"
            sx={{
              color: tokens.primary,
              fontWeight: 600,
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            Sign in
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default RegisterPage;
