import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, TextField, Button, Typography, Link, Alert, CircularProgress, InputAdornment, IconButton,
} from '@mui/material';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { login } from '../../services/api';
import SSOButtons from './SSOButtons';
import { tokens } from '../../theme';

const DollarIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
  </svg>
);

const GoogleIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
  </svg>
);

const LoginPage: React.FC = () => {
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
      await login(email, password);
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })
        .response?.data?.error;
      setError(msg || 'Login failed. Please try again.');
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
          Track spending. See where your money goes.
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
          Sign in
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>
            {error}
          </Alert>
        )}

        {/* Google OAuth button */}
        <SSOButtons />

        {/* Divider */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, my: 2.5 }}>
          <Box sx={{ flex: 1, height: '1px', bgcolor: tokens.border }} />
          <Typography sx={{ fontFamily: `'Plus Jakarta Sans', sans-serif`, fontSize: 12, color: tokens.text3 }}>or</Typography>
          <Box sx={{ flex: 1, height: '1px', bgcolor: tokens.border }} />
        </Box>

        {/* Email / password form */}
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box>
            <Typography
              component="label"
              htmlFor="login-email"
              sx={{ fontFamily: `'Plus Jakarta Sans', sans-serif`, fontSize: 12, fontWeight: 600, color: tokens.text2, mb: 0.75, display: 'block' }}
            >
              Email
            </Typography>
            <TextField
              id="login-email"
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
              htmlFor="login-password"
              sx={{ fontFamily: `'Plus Jakarta Sans', sans-serif`, fontSize: 12, fontWeight: 600, color: tokens.text2, mb: 0.75, display: 'block' }}
            >
              Password
            </Typography>
            <TextField
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              size="small"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowPassword((s) => !s)} edge="end" aria-label={showPassword ? 'Hide' : 'Show'} title={showPassword ? 'Hide password' : 'Show password'}>
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
            {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign In'}
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
          Don&apos;t have an account?{' '}
          <Link
            component={RouterLink}
            to="/register"
            sx={{
              color: tokens.primary,
              fontWeight: 600,
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            Sign up
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default LoginPage;
