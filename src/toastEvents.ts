type ToastSeverity = 'success' | 'error' | 'warning' | 'info';

interface ToastEvent {
  message: string;
  severity: ToastSeverity;
}

type ToastListener = (event: ToastEvent) => void;

const listeners: Set<ToastListener> = new Set();

export const subscribeToast = (listener: ToastListener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const emitToast = (message: string, severity: ToastSeverity = 'error'): void => {
  listeners.forEach((listener) => listener({ message, severity }));
};
