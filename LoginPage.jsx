import { Link } from "react-router-dom";
import { useState } from "react";

function LoginPage() {
  const [formData, setFormData] = useState({
    usernameOrEmail: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
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

      const response = await fetch("http://localhost:8080/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usernameOrEmail: formData.usernameOrEmail,
          password: formData.password,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Login failed.");
      }

      setMessage(data?.message || "Login successful.");
      setFormData({
        usernameOrEmail: "",
        password: "",
      });
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
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
            className="form-control auth-input mb-3"
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          {error && <p className="auth-error">{error}</p>}
          {message && <p className="auth-success">{message}</p>}

          <button
            type="submit"
            className="auth-submit-btn mb-4"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </form>

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