import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";

// Decode a JWT and return its expiry time in ms, or null if invalid.
function getTokenExpiryMs(token) {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload?.exp) return null;
    return payload.exp * 1000;
  } catch {
    return null;
  }
}

// True if a token is present AND not expired.
function isTokenValid() {
  const token = localStorage.getItem("accessToken");
  if (!token) return false;
  const expMs = getTokenExpiryMs(token);
  if (!expMs) return true; // couldn't decode, assume valid and let server reject
  return Date.now() < expMs;
}

function Navbar({ darkMode, setDarkMode }) {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(isTokenValid());
  const [user, setUser] = useState(null);

  // Re-sync isLoggedIn from localStorage + JWT expiry.
  const refreshAuthState = useCallback(() => {
    const valid = isTokenValid();
    setIsLoggedIn((prev) => {
      if (prev !== valid) {
        // If we just transitioned to "invalid", purge stale tokens.
        if (!valid) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          setUser(null);
        }
        return valid;
      }
      return prev;
    });
  }, []);

  // Fetch user profile when logged in.
  useEffect(() => {
    if (!isLoggedIn) {
      setUser(null);
      return;
    }
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const response = await fetch("http://localhost:20025/api/v1/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setUser(data);
        } else if (response.status === 401) {
          // Token was rejected by the server — force logout.
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          setIsLoggedIn(false);
          window.dispatchEvent(new Event("auth-change"));
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };
    fetchUser();
  }, [isLoggedIn]);

  // React to auth changes from: (a) this tab, (b) other tabs, (c) JWT expiring over time.
  useEffect(() => {
    // (a) same-tab custom event (dispatch after login, logout, 401)
    const onAuthChange = () => refreshAuthState();
    window.addEventListener("auth-change", onAuthChange);

    // (b) cross-tab storage event (e.g. logout in another tab)
    const onStorage = (e) => {
      if (e.key === "accessToken" || e.key === null) refreshAuthState();
    };
    window.addEventListener("storage", onStorage);

    // (c) poll every 30 seconds to catch JWT expiry even with no activity
    const pollId = setInterval(refreshAuthState, 30 * 1000);

    // Also re-check when the tab regains focus
    const onVisibility = () => { if (!document.hidden) refreshAuthState(); };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("auth-change", onAuthChange);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibility);
      clearInterval(pollId);
    };
  }, [refreshAuthState]);

  function handleLogout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setIsLoggedIn(false);
    setUser(null);
    window.dispatchEvent(new Event("auth-change"));
    navigate("/login");
  }

  return (
    <nav
      className="navbar navbar-expand-lg px-3 py-3 custom-navbar"
      style={{ backgroundColor: "var(--navbar-bg)" }}
    >
      <div className="container-fluid">
        <Link
          className="navbar-brand fw-bold"
          to="/"
          style={{ color: "var(--text-main)" }}
        >
          Smart House
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNavbar"
          aria-controls="mainNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
          style={{
            borderColor: "var(--text-main)",
            backgroundColor: "transparent",
          }}
        >
          <span
            className="navbar-toggler-icon"
            style={{
              filter: darkMode ? "invert(1)" : "invert(0)",
            }}
          ></span>
        </button>

        <div className="collapse navbar-collapse" id="mainNavbar">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link
                to="/builder"
                className="nav-link"
                style={{ color: "var(--text-main)" }}
              >
                Builder
              </Link>
            </li>

            <li className="nav-item">
              <Link
                to="/products"
                className="nav-link"
                style={{ color: "var(--text-main)" }}
              >
                Products
              </Link>
            </li>

            <li className="nav-item">
              <Link
                to="/community"
                className="nav-link"
                style={{ color: "var(--text-main)" }}
              >
                Community
              </Link>
            </li>
          </ul>

          <div className="d-flex align-items-center gap-3">
            {isLoggedIn ? (
              <>
                {user && (
                  <div
                    className="d-flex align-items-center gap-2"
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate("/profile")}
                    title={user.username}
                  >
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        backgroundColor: "#00d4ff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: "700",
                        fontSize: "14px",
                      }}
                    >
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="navbar-auth-link" style={{ marginBottom: 0 }}>
                      {user.username}
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  className="navbar-auth-link"
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  onClick={handleLogout}
                >
                  <i className="bi bi-box-arrow-right me-1"></i>Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="navbar-auth-link">
                  Login
                </Link>
                <Link to="/register" className="navbar-auth-link">
                  Register
                </Link>
              </>
            )}

            <button
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Toggle theme"
              className="theme-toggle"
              type="button"
            >
              <div
                className={`theme-toggle-knob ${darkMode ? "dark" : "light"}`}
              >
                <i
                  className={`bi ${
                    darkMode ? "bi-moon-stars-fill" : "bi-sun-fill"
                  }`}
                ></i>
              </div>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
