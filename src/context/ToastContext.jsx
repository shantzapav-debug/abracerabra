import { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toastState, setToastState] = useState({ msg: '', type: '', show: false });
  const timerRef = useRef(null);

  const toast = useCallback((msg, type = '') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToastState({ msg, type, show: true });
    timerRef.current = setTimeout(() => {
      setToastState((s) => ({ ...s, show: false }));
    }, 2600);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        className={`toast${toastState.show ? ' show' : ''}${toastState.type ? ` ${toastState.type}` : ''}`}
        role="status"
        aria-live="polite"
        hidden={!toastState.show && !toastState.msg}
      >
        {toastState.msg}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
