import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AppThemeProvider } from './ThemeContext';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import MainLayout from './components/MainLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import PrivacyPolicy from './components/PrivacyPolicy';

const GOOGLE_CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID ?? '';

const App: React.FC = () => {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <AppThemeProvider>
      <BrowserRouter>
        <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppThemeProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
