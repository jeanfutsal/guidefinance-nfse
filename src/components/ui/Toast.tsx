"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { X, AlertCircle, CheckCircle } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
  duration?: number;
}

const TOAST_LIMIT = 5;

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const typeConfig: Record<ToastType, { icon: React.ReactNode; color: string }> = {
  success: {
    icon: <CheckCircle size={16} className="text-emerald-400" />,
    color: "border-emerald-500/50 bg-emerald-500/10 text-emerald-900/90",
  },
  error: {
    icon: <AlertCircle size={16} className="text-rose-400" />,
    color: "border-rose-500/50 bg-rose-500/10 text-rose-900/90",
  },
  info: {
    icon: <X size={16} className="text-blue-400" />,
    color: "border-blue-500/50 bg-blue-500/10 text-blue-900/90",
  },
  warning: {
    icon: <AlertCircle size={16} className="text-amber-400" />,
    color: "border-amber-500/50 bg-amber-500/10 text-amber-900/90",
  },
};

const toastContext = createContext<{
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
} | null>(null);

export function useToast() {
  const ctx = useContext(toastContext);
  if (!ctx) throw new Error("useToast deve ser usado dentro de ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = generateId();
    setToasts((prev) => {
      const next = [{ ...toast, id }, ...prev].slice(0, TOAST_LIMIT);
      return next;
    });
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <toastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastList removeToast={removeToast} />
    </toastContext.Provider>
  );
}

function ToastItem({ toast, removeToast }: { toast: Toast; removeToast: (id: string) => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const { icon, color } = typeConfig[toast.type];

  useEffect(() => {
    if (toast.duration !== 0) {
      timerRef.current = setTimeout(() => {
        removeToast(toast.id);
      }, toast.duration ?? 4000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast.id, toast.duration, removeToast]);

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border p-4 shadow-xl ${color} animate-in fade-in slide-in-from-right-2 duration-200`}
    >
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <div className="flex flex-col gap-0.5 leading-none">
        <h4 className="font-semibold text-sm">{toast.title}</h4>
        {toast.description && (
          <p className="text-xs opacity-90">{toast.description}</p>
        )}
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="absolute top-2 right-2 opacity-60 hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-current/10"
      >
        <X size={14} />
      </button>
    </div>
  );
}

function ToastList({ removeToast }: { removeToast: (id: string) => void }) {
  const { toasts } = useToast();
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto w-full max-w-xs">
          <ToastItem toast={toast} removeToast={removeToast} />
        </div>
      ))}
    </div>
  );
}