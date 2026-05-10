import { useContext } from 'react';
import { ToastContext, ToastApi } from '../components/Toast/ToastProvider';

export const useToast = (): ToastApi => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used inside <ToastProvider>');
  }
  return ctx;
};

export default useToast;
