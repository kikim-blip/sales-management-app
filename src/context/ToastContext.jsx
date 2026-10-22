// src/context/ToastContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import ToastContainer from '../components/common/ToastContainer';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newToast = { id, message, type, duration };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, [removeToast]);

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur || 4500),
    warning: (msg, dur) => addToast(msg, 'warning', dur || 4000),
    info: (msg, dur) => addToast(msg, 'info', dur),
  };

  React.useEffect(() => {
    window.__SHOW_TOAST__ = (msg, type = 'info', dur) => {
      if (type === 'success') toast.success(msg, dur);
      else if (type === 'error') toast.error(msg, dur);
      else if (type === 'warning') toast.warning(msg, dur);
      else toast.info(msg, dur);
    };
    return () => {
      delete window.__SHOW_TOAST__;
    };
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, toast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Context 미제공 시 콘솔 및 폴백 동작
    return {
      addToast: (msg) => console.log('[Toast]', msg),
      removeToast: () => {},
      toast: {
        success: (msg) => console.log('[Toast Success]', msg),
        error: (msg) => console.error('[Toast Error]', msg),
        warning: (msg) => console.warn('[Toast Warning]', msg),
        info: (msg) => console.log('[Toast Info]', msg),
      },
    };
  }
  return ctx;
}
