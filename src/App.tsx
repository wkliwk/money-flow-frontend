import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AppThemeProvider } from './ThemeContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import { CircularProgress, Box } from '@mui/material';

const LoginPage = lazy(() => import('./components/auth/LoginPage'));
const RegisterPage = lazy(() => import('./components/auth/RegisterPage'));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'));
const MainLayout = lazy(() => import('./components/MainLayout'));
const ComponentsPage = lazy(() => import('./pages/dev/ComponentsPage'));

const GOOGLE_CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID ?? '';

const PageLoader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
    <CircularProgress />
  </Box>
);

const App: React.FC = () => {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <AppThemeProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/dev/components" element={<ComponentsPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <MainLayout initialTab={6} />
              </ProtectedRoute>
            }
          />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AppThemeProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
