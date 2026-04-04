import React, { useState, useEffect, useCallback } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { subscribeToast } from '../../toastEvents';

type ToastSeverity = 'success' | 'error' | 'warning' | 'info';

interface ToastState {
  open: boolean;
  message: string;
  severity: ToastSeverity;
}

const AUTO_HIDE_MS = 5000;

const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: '',
    severity: 'error',
  });

  const handleClose = useCallback((_?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setToast((prev) => ({ ...prev, open: false }));
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToast((event) => {
      setToast({ open: true, message: event.message, severity: event.severity });
    });
    return unsubscribe;
  }, []);

  return (
    <>
      {children}
      <Snackbar
        open={toast.open}
        autoHideDuration={AUTO_HIDE_MS}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleClose}
          severity={toast.severity}
          variant="filled"
          sx={{ width: '100%' }}
          role="alert"
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ToastProvider;
