import { useError } from '../context/ErrorContext';
import { X } from 'lucide-react';
import './ErrorBanner.css';

export default function ErrorBanner() {
  const { message, kind, visible, clearToast } = useError();

  if (!visible) {
    return null;
  }

  return (
    <div className={`error-banner error-banner-${kind}`}>
      <div className="error-banner-content">
        {message}
      </div>
      <button
        className="error-banner-close"
        onClick={clearToast}
        aria-label="Close notification"
      >
        <X size={18} />
      </button>
    </div>
  );
}
