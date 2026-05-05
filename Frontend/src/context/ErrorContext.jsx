import { createContext, useContext, useState, useRef } from 'react';

const ErrorContext = createContext();

export function ErrorProvider({ children }) {
  const [message, setMessage] = useState('');
  const [kind, setKind] = useState('error'); // 'error' or 'success'
  const [visible, setVisible] = useState(false);
  const dismissTimeoutRef = useRef(null);

  const clearToast = () => {
    if (dismissTimeoutRef.current) {
      clearTimeout(dismissTimeoutRef.current);
    }
    setVisible(false);
  };

  const showError = (msg, durationMs = 5000) => {
    // Cancel any pending dismissal
    if (dismissTimeoutRef.current) {
      clearTimeout(dismissTimeoutRef.current);
    }
    setMessage(msg);
    setKind('error');
    setVisible(true);

    // Schedule auto-dismiss
    dismissTimeoutRef.current = setTimeout(() => {
      setVisible(false);
    }, durationMs);
  };

  const showSuccess = (msg, durationMs = 3500) => {
    // Cancel any pending dismissal
    if (dismissTimeoutRef.current) {
      clearTimeout(dismissTimeoutRef.current);
    }
    setMessage(msg);
    setKind('success');
    setVisible(true);

    // Schedule auto-dismiss
    dismissTimeoutRef.current = setTimeout(() => {
      setVisible(false);
    }, durationMs);
  };

  const value = {
    message,
    kind,
    visible,
    showError,
    showSuccess,
    clearToast,
  };

  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  );
}

export function useError() {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within ErrorProvider');
  }
  return context;
}

export default ErrorProvider;
