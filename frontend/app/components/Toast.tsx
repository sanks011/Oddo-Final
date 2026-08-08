"use client";

import { useState, createContext, useContext, ReactNode } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto border-2 border-[#173300] rounded-2xl p-4 shadow-[4px_4px_0px_#173300] flex items-center justify-between gap-3 transform transition-all duration-300 animate-bounce-short ${
              t.type === "success"
                ? "bg-[#FFEB5B] text-[#173300]"
                : t.type === "error"
                ? "bg-red-500 text-white"
                : t.type === "warning"
                ? "bg-amber-400 text-[#173300]"
                : "bg-[#173300] text-[#FFEB5B]"
            }`}
          >
            <div className="flex items-start gap-2 text-xs font-mono font-extrabold leading-snug">
              <span className="text-base shrink-0">
                {t.type === "success" ? "🎉" : t.type === "error" ? "⚠️" : t.type === "warning" ? "🔔" : "ℹ️"}
              </span>
              <span>{t.message}</span>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-xs font-bold font-mono px-2 py-0.5 rounded-lg border border-current opacity-80 hover:opacity-100 shrink-0"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Return fallback in case provider is unmounted
    return {
      showToast: (msg: string, type: ToastType = "info") => {
        alert(`${type.toUpperCase()}: ${msg}`);
      },
    };
  }
  return context;
}
