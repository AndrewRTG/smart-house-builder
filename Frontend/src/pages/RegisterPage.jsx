import { Link } from "react-router-dom";
import { useState } from "react";

function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    verifyPassword: "",
    acceptedTerms: false,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    setFieldErrors({});

    if (formData.password !== formData.verifyPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!formData.acceptedTerms) {
      setError("You must accept the Terms of Service.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:20025'}/api/v1/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (data?.fields) {
          setFieldErrors(data.fields);
        } else {
          setError(data?.error || "Register failed.");
        }
        return;
      }

      setMessage("Account created successfully. Please check your email to verify your account.");
      setFormData({
        username: "",
        email: "",
        password: "",
        verifyPassword: "",
        acceptedTerms: false,
      });
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleRegister() {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:20025'}/oauth2/authorization/google`;
  }

  function handleFacebookRegister() {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:20025'}/oauth2/authorization/facebook`;
  }

  return (
    <div className="page-container">
      <div className="auth-card">
        <h3 className="mb-4">Register</h3>

        <form onSubmit={handleSubmit}>
          <input
            className="form-control auth-input mb-1"
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            required
          />
          {fieldErrors.username && <p className="auth-error mb-2">{fieldErrors.username}</p>}

          <input
            className="form-control auth-input mb-1"
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          {fieldErrors.email && <p className="auth-error mb-2">{fieldErrors.email}</p>}

          <input
            className="form-control auth-input mb-1"
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          {fieldErrors.password && <p className="auth-error mb-2">{fieldErrors.password}</p>}

          <input
            className="form-control auth-input mb-3"
            type="password"
            name="verifyPassword"
            placeholder="Verify Password"
            value={formData.verifyPassword}
            onChange={handleChange}
            required
          />
          {formData.verifyPassword.length > 0 && (
            <div style={{ color: formData.password === formData.verifyPassword ? "#198754" : "#dc3545", fontSize: "0.85rem", marginTop: "4px", marginBottom: "8px" }}>
              <i className={formData.password === formData.verifyPassword ? "bi bi-check-circle-fill" : "bi bi-x-circle-fill"}></i>
              {" "}{formData.password === formData.verifyPassword ? "Passwords match" : "Passwords do not match"}
            </div>
          )}

          <div className="form-check mb-3">
            <input
              className="form-check-input"
              type="checkbox"
              id="terms"
              name="acceptedTerms"
              checked={formData.acceptedTerms}
              onChange={handleChange}
            />
            <label
              className="form-check-label"
              htmlFor="terms"
              style={{ color: "var(--text-secondary)" }}
            >
              I have read and consent to the Terms of Service
            </label>
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
            onClick={handleGoogleRegister}
          >
            <i className="bi bi-google"></i>
            <span>Google</span>
          </button>

          <button
            type="button"
            className="social-auth-btn facebook-btn"
            onClick={handleFacebookRegister}
          >
            <i className="bi bi-facebook"></i>
            <span>Facebook</span>
          </button>
        </div>

        <hr style={{ borderColor: "var(--divider-color)" }} />

        <p className="mt-3 mb-3" style={{ color: "var(--text-secondary)" }}>
          Already a member?
        </p>

        <Link
          to="/login"
          className="btn"
          style={{
            backgroundColor: "var(--btn-bg)",
            color: "var(--btn-text)",
            border: "none",
          }}
        >
          Sign In here
        </Link>
      </div>
    </div>
  );
}

export default RegisterPage;