import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ToastMessage, ToastType } from '../types/index.js';
import { ToastContainer } from '../components/common/Toast.js';

interface NotificationContextType {
  toasts: ToastMessage[];
  notify: (type: ToastType, message: string, title?: string, duration?: number) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  dismiss: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (type: ToastType, message: string, title?: string, duration: number = 4000) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newToast: ToastMessage = {
        id,
        type,
        title,
        message,
        duration,
      };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }
    },
    [dismiss]
  );

  const success = useCallback((message: string, title?: string) => {
    notify('success', message, title);
  }, [notify]);

  const error = useCallback((message: string, title?: string) => {
    notify('error', message, title || 'Error', 6000);
  }, [notify]);

  const warning = useCallback((message: string, title?: string) => {
    notify('warning', message, title || 'Warning', 5000);
  }, [notify]);

  const info = useCallback((message: string, title?: string) => {
    notify('info', message, title);
  }, [notify]);

  return (
    <NotificationContext.Provider
      value={{
        toasts,
        notify,
        success,
        error,
        warning,
        info,
        dismiss,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </NotificationContext.Provider>
  );
};

export function useNotification(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
