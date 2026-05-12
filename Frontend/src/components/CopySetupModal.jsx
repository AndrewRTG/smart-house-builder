import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useError } from '../context/ErrorContext';
import './CopySetupModal.css';

const API_BASE = 'http://localhost:20025/api/v1';

export default function CopySetupModal({ isOpen, onClose, originalSetup, onSuccess }) {
  const { showError, showSuccess } = useError();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && originalSetup) {
      setName(`Copy of ${originalSetup.name}`);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, originalSetup]);

  const handleCopy = async () => {
    if (!name.trim()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        showError('Please login');
        window.location.href = '/login';
        return;
      }

      const response = await fetch(`${API_BASE}/setups/${originalSetup.id}/copy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        // Backend CopySetupRequest field is `name` (verified against
        // CopySetupRequest.java in this repo). Earlier I incorrectly
        // changed this to `newName` based on a stale spec — reverted.
        body: JSON.stringify({ name: name.trim() }),
      });

      if (response.status === 201) {
        const data = await response.json();
        onSuccess(data);
        showSuccess(`Copied to My Setups as DRAFT: ${name.trim()}`);
        onClose();
      } else if (response.status === 401) {
        showError('Please login');
        window.location.href = '/login';
      } else {
        const data = await response.json().catch(() => null);
        const msg = data?.error || data?.message || response.statusText || 'Copy failed';
        showError(msg);
      }
    } catch (error) {
      console.error('Copy setup failed:', error);
      showError('Failed to copy setup');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleCopy();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
      role="button"
      tabIndex={0}
      aria-label="Close modal"
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="dialog"
        tabIndex={-1}
      >
        <div className="modal-header">
          <h2 className="modal-title">Copy Setup</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <label className="modal-label">Setup Name</label>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter setup name"
            className="modal-input"
            disabled={loading}
          />
          <p className="modal-hint">Your setup will be created as a DRAFT</p>
        </div>

        <div className="modal-footer">
          <button
            className="modal-btn modal-btn-cancel"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="modal-btn modal-btn-create"
            onClick={handleCopy}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Draft'}
          </button>
        </div>
      </div>
    </div>
  );
}
