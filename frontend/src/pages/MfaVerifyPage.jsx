import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";


export default function MfaVerifyPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const mfaToken = sessionStorage.getItem("mfaToken");

  useEffect(() => {
    if (!mfaToken) {
      navigate("/login");
    }
  }, [mfaToken, navigate]);

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:20025/api/v1/auth/verify-mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mfaToken, code }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        sessionStorage.removeItem("mfaToken");
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        setMessage("Verification successful! Access granted.");
        navigate("/profile");

      } else {
        setError(data.message || "Invalid code. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  if (!mfaToken) return null;

  return (
    <div className="page-container">
      <div className="auth-card">
        <h3 className="mb-4">Two-Factor Verification</h3>
        <p className="text-muted mb-3">
          Enter the 6-digit code from your authenticator app.
        </p>
        <input
          type="text"
          className="form-control auth-input mb-3"
          placeholder="123456"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          autoFocus
        />
        {error && <p className="auth-error">{error}</p>}
        {message && <p className="auth-success">{message}</p>} {/* Super! */}
        <button
          className="auth-submit-btn mb-3"
          onClick={handleVerify}
          disabled={code.length !== 6 || loading}
        >
          {loading ? "Verifying..." : "Verify"}
        </button>
      </div>
    </div>
  );
}
