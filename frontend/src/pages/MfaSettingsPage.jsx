import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function MfaSettingsPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleDisable = async () => {
    setError("");
    setMessage("");
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/login");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:20025/api/v1/auth/mfa/disable", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMessage("MFA has been disabled.");
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
      <h2 className="mb-4">MFA Settings</h2>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="d-grid gap-2">
        <button
          className="btn btn-outline-primary"
          onClick={() => navigate("/mfa/setup")}
        >
          <i className="bi bi-shield-plus me-2"></i>
          Enable / Re-configure MFA
        </button>
        <button
          className="btn btn-outline-danger"
          onClick={handleDisable}
          disabled={loading}
        >
          <i className="bi bi-shield-x me-2"></i>
          {loading ? "Disabling..." : "Disable MFA"}
        </button>
      </div>

      <div className="mt-3">
        <button className="btn btn-link mfa-instruction-text p-0" onClick={() => navigate("/")}>
          ← Back to Home
        </button>
      </div>
    </div>
  );
}
