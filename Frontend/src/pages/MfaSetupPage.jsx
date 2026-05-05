import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { authFetch } from "../utils/authFetch";

export default function MfaSetupPage() {
  const [setupData, setSetupData] = useState(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/login");
      return;
    }
    // authFetch handles 401 -> refresh -> retry transparently, so a stale
    // access token doesn't kick the user off the MFA setup page.
    authFetch("/api/v1/auth/mfa/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed to load MFA setup.");
        const data = await r.json();
        setSetupData(data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message || "Failed to load MFA setup.");
        setLoading(false);
      });
  }, [navigate]);

  const handleConfirm = async () => {
    setError("");
    const res = await authFetch("/api/v1/auth/mfa/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Backend MfaSetupConfirmRequest only has { code }. The verify-mfa
      // endpoint takes mfaToken; this is the *post-login* setup confirm.
      body: JSON.stringify({ code }),
    });
    if (res.ok) {
      setSuccess(true);
      // Tell Navbar / ProfilePage that mfaEnabled just flipped, so /auth/me
      // gets re-queried and the MFA settings page shows the new state.
      window.dispatchEvent(new Event("auth-change"));
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.message || "Invalid code. Please try again.");
    }
  };

  if (loading) return <div className="container mt-5"><p>Loading...</p></div>;

  return (
    <div className="container mt-5" style={{ maxWidth: 480 }}>
      <h2 className="mb-4">Set Up Two-Factor Authentication</h2>

      {success ? (
        <div className="alert alert-success">
          <i className="bi bi-shield-check me-2"></i>
          MFA enabled successfully! Your account is now protected.
          <div className="mt-3">
            <button className="btn btn-primary" onClick={() => navigate("/")}>
              Go to Home
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="mfa-instruction-text">
            Scan the QR code below with <strong>Google Authenticator</strong> or{" "}
            <strong>Authy</strong>.
          </p>

          {setupData?.qrCodeUri && (
            <div className="mb-3 text-center">
              <QRCodeSVG value={setupData.qrCodeUri} size={200} />
            </div>
          )}

          <div className="mb-3">
            <label
              className="form-label mfa-instruction-text"
              style={{ fontSize: "0.85rem" }}
            >
              Or enter this secret manually in your app:
            </label>
            <code
              className="d-block bg-light p-2 rounded"
              style={{ wordBreak: "break-all" }}
            >
              {setupData?.secret}
            </code>
          </div>

          <hr />

          <p>Enter the 6-digit code from your authenticator app to confirm setup:</p>
          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="123456"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            />
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <button
            className="btn btn-success w-100"
            onClick={handleConfirm}
            disabled={code.length !== 6}
          >
            Confirm &amp; Enable MFA
          </button>

          <div className="mt-3 text-center">
            <button
              className="btn btn-link text-muted"
              onClick={() => navigate("/mfa/settings")}
            >
              Back to MFA Settings
            </button>
          </div>
        </>
      )}
    </div>
  );
}
