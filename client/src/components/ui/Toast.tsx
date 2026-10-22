import {
  CheckCircle2,
  CircleAlert,
  Info,
  X,
  XCircle,
} from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

type Toast = {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
};

type ToastOptions = {
  title: string;
  message?: string;
  duration?: number;
};

type ToastContextValue = {
  showToast: (type: ToastType, options: ToastOptions) => void;
  success: (options: ToastOptions) => void;
  error: (options: ToastOptions) => void;
  warning: (options: ToastOptions) => void;
  info: (options: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

let toastId = 0;

function getToastIcon(type: ToastType) {
  switch (type) {
    case 'success':
      return <CheckCircle2 className="h-5 w-5" />;
    case 'error':
      return <XCircle className="h-5 w-5" />;
    case 'warning':
      return <CircleAlert className="h-5 w-5" />;
    case 'info':
      return <Info className="h-5 w-5" />;
  }
}

function getToastStyles(type: ToastType) {
  switch (type) {
    case 'success':
      return {
        icon: 'text-emerald-600 dark:text-emerald-400',
        accent: 'border-l-emerald-600 dark:border-l-emerald-400',
      };
    case 'error':
      return {
        icon: 'text-red-600 dark:text-red-400',
        accent: 'border-l-red-600 dark:border-l-red-400',
      };
    case 'warning':
      return {
        icon: 'text-amber-600 dark:text-amber-400',
        accent: 'border-l-amber-600 dark:border-l-amber-400',
      };
    case 'info':
      return {
        icon: 'text-[var(--veyra-ink-soft)]',
        accent: 'border-l-[var(--veyra-line-strong)]',
      };
  }
}

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: number) => void;
}) {
  const styles = getToastStyles(toast.type);

  useEffect(() => {
    const duration = toast.type === 'error' ? 5000 : 3500;

    const timer = window.setTimeout(() => {
      onRemove(toast.id);
    }, duration);

    return () => window.clearTimeout(timer);
  }, [toast.id, toast.type, onRemove]);

  return (
    <div
      role="status"
      className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-[var(--veyra-line)] border-l-4 ${styles.accent} bg-[var(--veyra-popover)] p-4 shadow-lg`}
    >
      <div className={`mt-0.5 shrink-0 ${styles.icon}`}>
        {getToastIcon(toast.type)}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[var(--veyra-ink)]">
          {toast.title}
        </p>

        {toast.message && (
          <p className="mt-1 text-xs leading-5 text-[var(--veyra-ink-soft)]">
            {toast.message}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => onRemove(toast.id)}
        aria-label="Dismiss notification"
        className="shrink-0 rounded-md p-1 text-[var(--veyra-muted)] transition-colors hover:bg-[var(--veyra-paper-deep)] hover:text-[var(--veyra-ink)]"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, options: ToastOptions) => {
      const id = ++toastId;

      setToasts((current) => [
        ...current.slice(-3),
        {
          id,
          type,
          title: options.title,
          message: options.message,
        },
      ]);

      if (options.duration) {
        window.setTimeout(() => {
          removeToast(id);
        }, options.duration);
      }
    },
    [removeToast],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      showToast,
      success: (options) => showToast('success', options),
      error: (options) => showToast('error', options),
      warning: (options) => showToast('warning', options),
      info: (options) => showToast('info', options),
    }),
    [showToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-end gap-3 sm:left-auto sm:right-6 sm:w-auto"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used inside ToastProvider');
  }

  return context;
}