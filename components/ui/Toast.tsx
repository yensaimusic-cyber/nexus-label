import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

type Toast = { id: string; message: string; type?: 'success' | 'error' | 'info' };

const ToastContext = createContext<{
  addToast: (message: string, type?: Toast['type'], ttl?: number) => void;
}>({ addToast: () => {} });

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast['type'] = 'info', ttl = 5000) => {
    const id = Math.random().toString(36).slice(2, 9);
    const t: Toast = { id, message, type };
    setToasts((s) => [...s, t]);
    setTimeout(() => setToasts((s) => s.filter(x => x.id !== id)), ttl);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-3">
        {toasts.map(t => (
          <div key={t.id} className={`max-w-xs p-3 rounded-lg shadow-lg text-sm font-medium ${t.type === 'success' ? 'bg-green-700/90 text-white' : t.type === 'error' ? 'bg-red-700/90 text-white' : 'bg-gray-800/90 text-white'}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

export default ToastProvider;
