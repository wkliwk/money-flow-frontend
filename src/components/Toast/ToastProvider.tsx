import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Snackbar,
  Alert,
  Button,
  Box,
  useMediaQuery,
  useTheme,
} from '@mui/material';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  duration?: number;
  action?: ToastAction;
  /** Called after the toast auto-dismisses (timeout). NOT called when the action button is clicked. */
  onTimeout?: () => void;
}

export interface ToastItem {
  id: string;
  message: React.ReactNode;
  variant: ToastVariant;
  duration: number;
  action?: ToastAction;
  onTimeout?: () => void;
}

export interface ToastApi {
  success: (message: React.ReactNode, options?: ToastOptions) => string;
  error: (message: React.ReactNode, options?: ToastOptions) => string;
  info: (message: React.ReactNode, options?: ToastOptions) => string;
  warning: (message: React.ReactNode, options?: ToastOptions) => string;
  dismiss: (id: string) => void;
}

const DEFAULT_DURATIONS: Record<ToastVariant, number> = {
  success: 3000,
  error: 6000,
  info: 4000,
  warning: 5000,
};

const MAX_VISIBLE = 3;

export const ToastContext = createContext<ToastApi | null>(null);

let toastCounter = 0;
const nextId = (): string => {
  toastCounter += 1;
  return `toast-${Date.now()}-${toastCounter}`;
};

interface Props {
  children: React.ReactNode;
}

const ToastProvider: React.FC<Props> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const enqueue = useCallback(
    (variant: ToastVariant, message: React.ReactNode, options?: ToastOptions): string => {
      const id = nextId();
      const item: ToastItem = {
        id,
        message,
        variant,
        duration: options?.duration ?? DEFAULT_DURATIONS[variant],
        action: options?.action,
        onTimeout: options?.onTimeout,
      };
      setToasts((prev) => {
        const next = [...prev, item];
        // FIFO eviction: drop the oldest if we exceed the max.
        if (next.length > MAX_VISIBLE) {
          return next.slice(next.length - MAX_VISIBLE);
        }
        return next;
      });
      return id;
    },
    []
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (message, options) => enqueue('success', message, options),
      error: (message, options) => enqueue('error', message, options),
      info: (message, options) => enqueue('info', message, options),
      warning: (message, options) => enqueue('warning', message, options),
      dismiss,
    }),
    [enqueue, dismiss]
  );

  const anchorOrigin = isMobile
    ? ({ vertical: 'bottom', horizontal: 'center' } as const)
    : ({ vertical: 'bottom', horizontal: 'right' } as const);

  // One Snackbar wraps a Stack so multiple toasts stack vertically with a single positioning system.
  return (
    <ToastContext.Provider value={api}>
      {children}
      <Snackbar
        open={toasts.length > 0}
        anchorOrigin={anchorOrigin}
        sx={{
          bottom: { xs: 'calc(56px + env(safe-area-inset-bottom) + 24px) !important', sm: '24px !important' },
          right: { xs: 8, sm: 24 },
          left: { xs: 8, sm: 'auto' },
          maxWidth: { xs: 'calc(100% - 16px)', sm: 420 },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
          {toasts.map((t) => (
            <ToastEntry key={t.id} toast={t} onClose={dismiss} />
          ))}
        </Box>
      </Snackbar>
    </ToastContext.Provider>
  );
};

interface EntryProps {
  toast: ToastItem;
  onClose: (id: string) => void;
}

const ToastEntry: React.FC<EntryProps> = ({ toast, onClose }) => {
  const timeoutFiredRef = useRef(false);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      timeoutFiredRef.current = true;
      if (toast.onTimeout) toast.onTimeout();
      onClose(toast.id);
    }, toast.duration);
    return () => {
      window.clearTimeout(handle);
    };
  }, [toast.id, toast.duration, toast.onTimeout, onClose]);

  const handleActionClick = useCallback(() => {
    if (toast.action) toast.action.onClick();
    onClose(toast.id);
  }, [toast.action, toast.id, onClose]);

  const handleAlertClose = useCallback(() => {
    onClose(toast.id);
  }, [toast.id, onClose]);

  return (
    <Alert
      severity={toast.variant}
      variant="filled"
      onClose={handleAlertClose}
      sx={{
        width: '100%',
        alignItems: 'center',
        boxShadow: '0 8px 32px rgba(0,0,0,0.24)',
        '& .MuiAlert-message': { flex: 1 },
      }}
      action={
        toast.action ? (
          <Button
            size="small"
            onClick={handleActionClick}
            sx={{ color: 'inherit', fontWeight: 700, ml: 1 }}
          >
            {toast.action.label}
          </Button>
        ) : undefined
      }
    >
      {toast.message}
    </Alert>
  );
};

export default ToastProvider;
