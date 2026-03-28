"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type ToastItem = {
  id: string;
  title: string;
  description?: string;
};

type ToastContextValue = {
  toast: (t: Omit<ToastItem, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function uid() {
  return `t_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

export function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((t: Omit<ToastItem, "id">) => {
    const id = uid();
    setItems((prev) => [...prev, { id, ...t }]);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  useEffect(() => {
    if (items.length === 0) return;
    const timers = items.map((it) =>
      window.setTimeout(() => {
        setItems((prev) => prev.filter((p) => p.id !== it.id));
      }, 3500),
    );
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [items]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex w-[min(420px,calc(100vw-2rem))] flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className="animated-sheen rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl px-4 py-3 shadow-cyber-soft"
          >
            <div className="text-sm font-semibold text-white">{t.title}</div>
            {t.description ? (
              <div className="mt-1 text-sm text-white/70">{t.description}</div>
            ) : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
