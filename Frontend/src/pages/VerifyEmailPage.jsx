import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

/**
 * VerifyEmailPage
 *
 * Lands here from the click in the welcome email:
 *   https://app/verify-email?token=...
 *
 * Calls GET /api/v1/auth/verify-email?token=... and shows the result.
 * The endpoint is publicly accessible (no Authorization header).
 */
const API_BASE = `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:20025'}/api/v1`;

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState('loading'); // 'loading' | 'ok' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg('Missing verification token in the link.');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `${API_BASE}/auth/verify-email?token=${encodeURIComponent(token)}`,
          { method: 'GET' }
        );
        if (cancelled) return;
        if (res.ok) {
          setStatus('ok');
        } else {
          const data = await res.json().catch(() => null);
          setStatus('error');
          setErrorMsg(data?.message || data?.error || 'The link is invalid or has expired.');
        }
      } catch {
        if (!cancelled) {
          setStatus('error');
          setErrorMsg("Couldn't reach the server. Please try again later.");
        }
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  return (
    <div className="page-container">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <h3 className="mb-3">Email verification</h3>
        {status === 'loading' && <p>Verifying your email…</p>}
        {status === 'ok' && (
          <>
            <div className="alert alert-success">
              <i className="bi bi-check-circle-fill me-2"></i>
              Your email is verified. You can now sign in.
            </div>
            <Link to="/login" className="auth-submit-btn" style={{ display: 'inline-block', textDecoration: 'none' }}>
              Go to Login
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="alert alert-danger">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {errorMsg}
            </div>
            <Link to="/login" className="btn btn-link">Back to Login</Link>
          </>
        )}
      </div>
    </div>
  );
}
