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

      const response = await fetch("http://localhost:8080/api/register", {
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
        throw new Error(data?.message || "Register failed.");
      }

      setMessage(data?.message || "Account created successfully.");
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
    window.location.href = "http://localhost:8080/oauth2/authorization/google";
  }

  function handleFacebookRegister() {
    window.location.href = "http://localhost:8080/oauth2/authorization/facebook";
  }

  return (
    <div className="page-container">
      <div className="auth-card">
        <h3 className="mb-4">Register</h3>

        <form onSubmit={handleSubmit}>
          <input
            className="form-control auth-input mb-3"
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            required
          />

          <input
            className="form-control auth-input mb-3"
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <input
            className="form-control auth-input mb-3"
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <input
            className="form-control auth-input mb-3"
            type="password"
            name="verifyPassword"
            placeholder="Verify Password"
            value={formData.verifyPassword}
            onChange={handleChange}
            required
          />

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