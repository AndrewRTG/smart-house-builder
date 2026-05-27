import { useState } from "react";
import { Link } from "react-router-dom";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:20025'}/api/v1/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      // Always show the same message to prevent email enumeration
      setMessage("If an account exists with this email, a reset link has been sent. Check your inbox.");
      setEmail("");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="auth-card">
        <h3 className="mb-2">Forgot Password</h3>
        <p className="mfa-instruction-text mb-4" style={{ fontSize: "0.9rem" }}>
          Enter your email and we'll send you a reset link.
        </p>

        {message ? (
          <div className="alert alert-success">{message}</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <input
              className="form-control auth-input mb-3"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {error && <p className="auth-error">{error}</p>}
            <button
              type="submit"
              className="auth-submit-btn mb-3"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <Link to="/login" className="btn btn-link mfa-instruction-text p-0">
          ← Back to Login
        </Link>
      </div>
    </div>
  );
}
