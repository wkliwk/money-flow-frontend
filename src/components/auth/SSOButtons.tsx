import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Divider, Typography, Alert, CircularProgress } from '@mui/material';
import { GoogleLogin } from '@react-oauth/google';
import { appleAuthHelpers } from 'react-apple-signin-auth';
import { loginWithGoogle, loginWithApple } from '../../services/api';

const SSOButtons: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    const idToken = credentialResponse.credential;
    if (!idToken) {
      setError('Google sign-in failed. Please try again.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await loginWithGoogle(idToken);
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })
        .response?.data?.error;
      setError(msg || 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google sign-in was cancelled or failed.');
  };

  const handleAppleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await appleAuthHelpers.signIn({
        authOptions: {
          clientId: process.env.REACT_APP_APPLE_CLIENT_ID ?? '',
          scope: 'email name',
          redirectURI: window.location.origin,
          usePopup: true,
        },
      });
      if (!response?.authorization?.id_token) {
        setError('Apple sign-in failed. Please try again.');
        return;
      }
      await loginWithApple(response.authorization.id_token);
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })
        .response?.data?.error;
      if (msg) {
        setError(msg);
      } else {
        setError('Apple sign-in was cancelled or failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={28} />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              '& > div': { width: '100% !important' },
              '& iframe': { width: '100% !important' },
            }}
          >
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="filled_black"
              shape="rectangular"
              size="large"
              width="368"
              text="continue_with"
            />
          </Box>

          <Button
            disabled
            fullWidth
            variant="outlined"
            size="large"
            aria-label="Sign in with Apple"
            sx={{
              py: 1.25,
              fontSize: '0.9rem',
              fontWeight: 600,
              color: 'rgba(255,255,255,0.3)',
              bgcolor: 'rgba(0,0,0,0.3)',
              borderColor: 'rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              '&.Mui-disabled': {
                color: 'rgba(255,255,255,0.3)',
              },
            }}
          >
            <AppleIcon />
            Continue with Apple — Coming Soon
          </Button>
        </Box>
      )}

      <Divider sx={{ my: 3 }}>
        <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>
          or continue with email
        </Typography>
      </Divider>
    </Box>
  );
};

const AppleIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 814 1000"
    width="18"
    height="18"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.3-150.3-110.8C27.1 751.9 0 639.4 0 531.3c0-166.3 108.5-254.5 215.5-254.5 57.9 0 106.2 38.3 142.3 38.3 34.2 0 87.5-40.8 152.8-40.8 24.9 0 108.2 2.6 168.7 75.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z" />
  </svg>
);

export default SSOButtons;
