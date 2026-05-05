import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    usernameOrEmail: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(location.state?.message || "");
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      setLoading(true);

      let response;
      try {
        response = await fetch("http://localhost:20025/api/v1/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            identifier: formData.usernameOrEmail,
            password: formData.password,
          }),
        });
      } catch (networkErr) {
        // Browser couldn't even reach the backend. The most common cause
        // is the Spring Boot server not running on :20025, or a CORS
        // preflight blocked because the dev server is on the wrong port.
        // Without this branch the user just sees "Failed to fetch" with
        // no hint about what to do.
        throw new Error(
          "Couldn't reach the server. Make sure the backend is running on http://localhost:20025 and that you're on http://localhost:5173."
        );
      }

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        // Spring's default error envelope is { timestamp, status, error, message }.
        // 401 = bad credentials. 403 = account locked / not verified.
        // Anything else = server bug; show the message verbatim.
        const fallback = response.status === 401
          ? "Invalid username or password."
          : response.status === 403
            ? "Account is locked or not verified."
            : `Login failed (HTTP ${response.status}).`;
        throw new Error(data?.message || data?.error || fallback);
      }

      if (data.mfaRequired) {
        sessionStorage.setItem("mfaToken", data.mfaToken);
        navigate("/mfa/verify");
      } else {
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        window.dispatchEvent(new Event("auth-change"));
        // setMessage(...) here would never render — the component unmounts
        // the moment navigate() runs. Drop it.
        navigate("/profile", { replace: true });
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleLogin() {
    window.location.href = "http://localhost:20025/oauth2/authorization/google";
  }

  function handleFacebookLogin() {
    window.location.href = "http://localhost:20025/oauth2/authorization/facebook";
  }

  return (
    <div className="page-container">
      <div className="auth-card">
        <h3 className="mb-4">Sign In</h3>

        <form onSubmit={handleSubmit}>
          <input
            className="form-control auth-input mb-3"
            type="text"
            name="usernameOrEmail"
            placeholder="Username or Email"
            value={formData.usernameOrEmail}
            onChange={handleChange}
            required
          />

          <input
            className="form-control auth-input mb-2"
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <div className="forgot-password-wrapper mb-3">
            {/* <Link>, not <a href>. <a href> would do a full page reload
                and lose React state (e.g. the email the user just typed). */}
            <Link to="/forgot-password" className="forgot-password-link">
              Forgot password?
            </Link>
          </div>

          {error && <p className="auth-error">{error}</p>}
          {message && <p className="auth-success">{message}</p>}

          <button
            type="submit"
            className="auth-submit-btn mb-3"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </form>

        <div className="auth-divider">
          <span>or continue with</span>
        </div>

        <div className="social-auth-buttons mb-4">
          <button
            type="button"
            className="social-auth-btn google-btn"
            onClick={handleGoogleLogin}
          >
            <i className="bi bi-google"></i>
            <span>Google</span>
          </button>

          <button
            type="button"
            className="social-auth-btn facebook-btn"
            onClick={handleFacebookLogin}
          >
            <i className="bi bi-facebook"></i>
            <span>Facebook</span>
          </button>
        </div>

        <hr style={{ borderColor: "var(--divider-color)" }} />

        <p className="mt-3 mb-3" style={{ color: "var(--text-secondary)" }}>
          Not a member?
        </p>

        <Link
          to="/register"
          className="btn"
          style={{
            backgroundColor: "var(--btn-bg)",
            color: "var(--btn-text)",
            border: "none",
          }}
        >
          Register here
        </Link>
      </div>
    </div>
  );
}

export default LoginPage;