import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../utils/authFetch";

/**
 * MfaSettingsPage
 *
 * Shows whether MFA is currently enabled (from /auth/me) and lets the user
 * - enable / re-configure MFA  -> /mfa/setup (the QR + confirm flow)
 * - disable MFA               -> DELETE /auth/mfa/disable
 *
 * Disabling fires `auth-change` so the rest of the UI (Navbar / Profile /
 * Settings) re-reads /auth/me and reflects mfaEnabled:false immediately.
 */
export default function MfaSettingsPage() {
  const [enabled, setEnabled] = useState(null); // null = loading
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Load current MFA status on mount and when auth-change fires.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        navigate("/login", { state: { from: "/mfa/settings" } });
        return;
      }
      try {
        const res = await authFetch("/api/v1/auth/me");
        if (!cancelled && res.ok) {
          const data = await res.json();
          setEnabled(!!data.mfaEnabled);
        } else if (!cancelled && res.status === 401) {
          navigate("/login", { state: { from: "/mfa/settings" } });
        }
      } catch {
        // ignored — UI shows "Checking…" until manual refresh
      }
    };
    load();
    const onAuth = () => load();
    window.addEventListener("auth-change", onAuth);
    return () => {
      cancelled = true;
      window.removeEventListener("auth-change", onAuth);
    };
  }, [navigate]);

  const handleDisable = async () => {
    setError("");
    setMessage("");
    if (!window.confirm(
      "Disable two-factor authentication?\n\n" +
      "Your account will be less secure — anyone with your password will be able to sign in."
    )) return;

    setLoading(true);
    try {
      const res = await authFetch("/api/v1/auth/mfa/disable", { method: "DELETE" });
      if (res.ok) {
        setMessage("MFA has been disabled.");
        setEnabled(false);
        // Tell the rest of the app to re-read /auth/me.
        window.dispatchEvent(new Event("auth-change"));
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Failed to disable MFA.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: 480 }}>
      <h2 className="mb-4">Two-Factor Authentication</h2>

      <div className={`alert ${enabled === null ? "alert-secondary" : enabled ? "alert-success" : "alert-warning"}`}>
        <i className={`bi ${enabled ? "bi-shield-check" : "bi-shield-exclamation"} me-2`}></i>
        {enabled === null
          ? "Checking status…"
          : enabled
            ? "MFA is currently ENABLED on your account."
            : "MFA is currently DISABLED. We strongly recommend enabling it."}
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="d-grid gap-2">
        <button
          className="btn btn-outline-primary"
          onClick={() => navigate("/mfa/setup")}
          disabled={loading}
        >
          <i className="bi bi-shield-plus me-2"></i>
          {enabled ? "Re-configure MFA" : "Enable MFA"}
        </button>
        {enabled && (
          <button
            className="btn btn-outline-danger"
            onClick={handleDisable}
            disabled={loading}
          >
            <i className="bi bi-shield-x me-2"></i>
            {loading ? "Disabling..." : "Disable MFA"}
          </button>
        )}
      </div>

      <div className="mt-3">
        <button className="btn btn-link mfa-instruction-text p-0" onClick={() => navigate("/profile")}>
          ← Back to Profile
        </button>
      </div>
    </div>
  );
}
