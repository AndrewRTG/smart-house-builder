import { Link } from 'react-router-dom';

/**
 * 404 catch-all. Anything not matched by the other routes lands here.
 */
export default function NotFoundPage() {
  return (
    <div className="page-container">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <h2 className="mb-3">404 — Page not found</h2>
        <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
          The page you tried to open doesn't exist (or was moved).
        </p>
        <Link
          to="/"
          className="auth-submit-btn"
          style={{ display: 'inline-block', textDecoration: 'none' }}
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
