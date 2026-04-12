import { createContext, useContext, useState, useCallback } from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

/**
 * Toast Notification Context
 * Provides toast notifications throughout the app
 */
export const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now();
    const toast = { id, message, type };

    setToasts((prev) => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback(
    (message, duration) => addToast(message, 'success', duration),
    [addToast]
  );

  const error = useCallback(
    (message, duration) => addToast(message, 'error', duration ?? 5000),
    [addToast]
  );

  const warning = useCallback(
    (message, duration) => addToast(message, 'warning', duration),
    [addToast]
  );

  const info = useCallback(
    (message, duration) => addToast(message, 'info', duration),
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

/**
 * Hook to use toast notifications
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

/**
 * Toast Container Component
 * Renders all active toasts
 */
function ToastContainer({ toasts, onRemove }) {
  const toastConfig = {
    success: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      icon: CheckCircle2,
      color: 'text-emerald-400',
    },
    error: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      icon: AlertCircle,
      color: 'text-red-400',
    },
    warning: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      icon: AlertTriangle,
      color: 'text-amber-400',
    },
    info: {
      bg: 'bg-accent/10',
      border: 'border-accent/30',
      icon: Info,
      color: 'text-accent',
    },
  };

  return (
    <div
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
      aria-label="Notifications"
    >
      {toasts.map((toast) => {
        const config = toastConfig[toast.type] || toastConfig.info;
        const Icon = config.icon;

        return (
          <div
            key={toast.id}
            className={`${config.bg} ${config.border} border rounded-lg p-4 flex items-start gap-3 max-w-sm shadow-lg pointer-events-auto animate-in fade-in slide-in-from-right-4 duration-200`}
            role="alert"
            aria-live="polite"
          >
            <Icon size={18} className={`${config.color} shrink-0 mt-0.5`} aria-hidden="true" />
            <p className="text-sm text-slate-200 flex-1">{toast.message}</p>
            <button
              onClick={() => onRemove(toast.id)}
              className="text-slate-400 hover:text-slate-200 shrink-0 transition-colors duration-150"
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default ToastProvider;
