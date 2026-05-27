import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './NotificationBell.css';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:20025'}/api/v1`;
const POLL_INTERVAL_MS = 30_000;

export default function NotificationBell({ darkMode }) {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const intervalRef = useRef(null);

  const fetchUnread = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const count = await res.json();
        setUnreadCount(typeof count === 'number' ? count : 0);
      } else {
        setUnreadCount(0);
      }
    } catch {
      // network error — keep stale count, don't spam console
    }
  }, []);

  useEffect(() => {
    fetchUnread();
    intervalRef.current = setInterval(fetchUnread, POLL_INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
  }, [fetchUnread]);

  // Re-poll when the user comes back to the tab.
  useEffect(() => {
    const onVisible = () => { if (!document.hidden) fetchUnread(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [fetchUnread]);

  const handleClick = async () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        await fetch(`${API_BASE}/notifications/read-all`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // ignore — we navigate regardless
      }
      setUnreadCount(0);
    }
    navigate('/profile?tab=activity');
  };

  return (
    <button
      type="button"
      className={`notif-bell-btn${darkMode ? ' dark-mode' : ''}`}
      onClick={handleClick}
      aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
    >
      <svg
        className="notif-bell-icon"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {unreadCount > 0 && (
        <span className="notif-bell-badge" aria-hidden="true">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}
