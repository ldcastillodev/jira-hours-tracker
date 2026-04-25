import { useState, useEffect, useCallback } from 'react';

type ToastType = 'success' | 'error';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

let addToastGlobal: ((message: string, type: ToastType) => void) | null = null;

export function showToast(message: string, type: ToastType = 'success') {
  addToastGlobal?.(message, type);
}

let nextId = 0;

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  useEffect(() => {
    addToastGlobal = addToast;
    return () => {
      addToastGlobal = null;
    };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`animate-slide-in rounded-lg border px-4 py-2.5 text-xs font-medium shadow-lg backdrop-blur-sm ${
            t.type === 'success'
              ? 'border-mgs-green/30 bg-mgs-green/10 text-mgs-green-light'
              : 'border-mgs-red/30 bg-mgs-red/10 text-mgs-red-light'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
