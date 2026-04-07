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

      const response = await fetch("http://localhost:20025/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: formData.usernameOrEmail,
          password: formData.password,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Login failed.");
      }

      if (data.mfaRequired) {
        sessionStorage.setItem("mfaToken", data.mfaToken);
        navigate("/mfa/verify");
      } else {
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        navigate("/");
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
            <a
              href="/forgot-password"
              className="forgot-password-link"
            >
              Forgot password?
            </a>
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