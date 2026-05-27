import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div className="page-container">
        <div className="auth-card">
          <p className="auth-error">Invalid or missing reset token.</p>
          <Link to="/forgot-password">Request a new reset link</Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:20025'}/api/v1/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        navigate("/login", { state: { message: "Password reset successful. You can now log in." } });
      } else {
        setError(data.message || "Failed to reset password. The link may have expired.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;

  return (
    <div className="page-container">
      <div className="auth-card">
        <h3 className="mb-4">Set New Password</h3>
        <form onSubmit={handleSubmit}>
          <input
            className="form-control auth-input mb-3"
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <input
            className="form-control auth-input mb-1"
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {confirmPassword.length > 0 && (
            <div
              style={{
                color: passwordsMatch ? "#198754" : "#dc3545",
                fontSize: "0.85rem",
                marginBottom: "12px",
                marginTop: "4px",
              }}
            >
              <i className={passwordsMatch ? "bi bi-check-circle-fill" : "bi bi-x-circle-fill"}></i>
              {" "}{passwordsMatch ? "Passwords match" : "Passwords do not match"}
            </div>
          )}
          {error && <p className="auth-error">{error}</p>}
          <button
            type="submit"
            className="auth-submit-btn mb-3"
            disabled={loading || !passwordsMatch}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
