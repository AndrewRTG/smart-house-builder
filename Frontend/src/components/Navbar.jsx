import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { getCurrentUser, invalidateCurrentUser } from "../utils/currentUser";
import NotificationBell from "./NotificationBell";
import "./Navbar.css";

function base64UrlDecode(s) {
  let str = s.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return atob(str);
}

function getTokenExpiryMs(token) {
  if (!token) return null;
  try {
    const payload = JSON.parse(base64UrlDecode(token.split(".")[1]));
    if (!payload?.exp) return null;
    return payload.exp * 1000;
  } catch {
    return null;
  }
}

function isTokenValid() {
  const token = localStorage.getItem("accessToken");
  if (!token) return false;
  const expMs = getTokenExpiryMs(token);
  if (!expMs) return true;
  return Date.now() < expMs;
}

function Navbar({ darkMode, setDarkMode }) {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(isTokenValid());
  const [user, setUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const refreshAuthState = useCallback(() => {
    const valid = isTokenValid();
    setIsLoggedIn((prev) => {
      if (prev !== valid) {
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

  useEffect(() => {
    if (!isLoggedIn) {
      setUser(null);
      return;
    }

    const fetchUser = async () => {
      const data = await getCurrentUser();
      if (data) {
        setUser(data);
      } else if (!localStorage.getItem("accessToken")) {
        setIsLoggedIn(false);
        setUser(null);
      }
    };

    fetchUser();
  }, [isLoggedIn]);

  useEffect(() => {
    const onAuthChange = (e) => {
      // Optimistic patch — if Settings ships the new avatarUrl on the event,
      // apply it immediately so the navbar updates with zero round-trip.
      const newAvatar = e?.detail?.avatarUrl;
      if (newAvatar) {
        setUser((prev) => (prev ? { ...prev, avatarUrl: newAvatar } : prev));
      }
      refreshAuthState();
      // currentUser cache is invalidated by the listener in currentUser.js;
      // re-fetch so other fields (username, email) stay in sync too.
      if (isTokenValid()) {
        getCurrentUser({ force: true }).then((data) => { if (data) setUser(data); });
      }
    };
    const onStorage = (e) => {
      if (e.key === "accessToken" || e.key === null) refreshAuthState();
    };
    const pollId = setInterval(refreshAuthState, 30 * 1000);
    const onVisibility = () => {
      if (!document.hidden) refreshAuthState();
    };

    window.addEventListener("auth-change", onAuthChange);
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("auth-change", onAuthChange);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibility);
      clearInterval(pollId);
    };
  }, [refreshAuthState]);

  async function handleLogout() {
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      try {
        await fetch(`${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:20025'}/api/v1/auth/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
      } catch {
        // ignore; local logout still succeeds
      }
    }

    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setIsLoggedIn(false);
    setUser(null);
    invalidateCurrentUser();
    window.dispatchEvent(new Event("auth-change"));
    navigate("/login");
  }

  const avatarText = user?.username?.charAt(0)?.toUpperCase() || "U";
  const userAvatar = user?.avatarUrl || user?.profileImageUrl || user?.imageUrl || null;
  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const [avatarError, setAvatarError] = useState(false);
  // Reset error flag when URL changes (după un nou upload)
  useEffect(() => { setAvatarError(false); }, [userAvatar]);

  return (
    <nav className={`builder-navbar ${darkMode ? "dark-mode" : ""}`}>
      <Link className="builder-navbar-logo" to="/" onClick={closeMobileMenu}>
        <div className="builder-navbar-logo-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
            <polyline points="9 21 9 12 15 12 15 21" />
          </svg>
        </div>
        <span className="builder-navbar-logo-text">
          Smart <span className="builder-navbar-logo-accent">House</span> Builder
        </span>
      </Link>
      <button
          className={`builder-navbar-mobile-toggle ${isMobileMenuOpen ? "open" : ""}`}
          type="button"
          aria-label="Toggle navigation menu"
          aria-expanded={isMobileMenuOpen}
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
      >
        <span />
        <span />
        <span />
      </button>

      <div className="builder-navbar-links">
        <Link to="/builder" className="builder-navbar-link">Builder</Link>
        <div className="builder-navbar-divider" />
        <Link to="/products" className="builder-navbar-link">Products</Link>
        <div className="builder-navbar-divider" />
        <Link to="/community" className="builder-navbar-link">Community</Link>
      </div>

      <div className="builder-navbar-actions">
        <button className="builder-navbar-wizard-btn" type="button" onClick={() => navigate("/builder?mode=wizard")}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          Setup Wizard
        </button>

        <div className="builder-navbar-divider" />

        {isLoggedIn ? (
          <>
            <button className="builder-navbar-avatar-btn" type="button" onClick={() => navigate("/profile")}>
              {userAvatar && !avatarError ? (
                <img
                  src={userAvatar}
                  alt="Profile"
                  className="builder-navbar-avatar-img"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <span className="builder-navbar-avatar-fallback">{avatarText}</span>
              )}
            </button>
            <NotificationBell darkMode={darkMode} />
            <div className="builder-navbar-divider" />
            <Link to="/mfa/settings" className="builder-navbar-link">MFA</Link>
            <div className="builder-navbar-divider" />
            <button type="button" className="builder-navbar-link builder-navbar-link-button" onClick={handleLogout}>
              Logout
            </button>
            <div className="builder-navbar-divider" />
          </>
        ) : (
          <>
            <Link to="/register" className="builder-navbar-link">Register</Link>
            <div className="builder-navbar-divider" />
            <Link to="/login" className="builder-navbar-link">Log In</Link>
            <div className="builder-navbar-divider" />
          </>
        )}

        <button
          className={`builder-navbar-theme-toggle ${darkMode ? "active" : ""}`}
          type="button"
          onClick={() => setDarkMode(!darkMode)}
          aria-label="Toggle dark mode"
        >
          <div className="builder-toggle-track">
            <div className="builder-toggle-thumb">
              {darkMode ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
            </div>
          </div>
        </button>
      </div>
      <div className={`builder-navbar-mobile-menu ${isMobileMenuOpen ? "open" : ""}`}>
        <Link to="/builder" className="builder-navbar-mobile-link" onClick={closeMobileMenu}>
          Builder
        </Link>

        <Link to="/products" className="builder-navbar-mobile-link" onClick={closeMobileMenu}>
          Products
        </Link>

        <Link to="/community" className="builder-navbar-mobile-link" onClick={closeMobileMenu}>
          Community
        </Link>

        <button
            className="builder-navbar-mobile-primary"
            type="button"
            onClick={() => {
              closeMobileMenu();
              navigate("/builder?mode=wizard");
            }}
        >
          Setup Wizard
        </button>

        {isLoggedIn ? (
            <>
              <button
                  className="builder-navbar-mobile-link builder-navbar-mobile-button"
                  type="button"
                  onClick={() => {
                    closeMobileMenu();
                    navigate("/profile");
                  }}
              >
                Profile
              </button>

              <Link to="/mfa/settings" className="builder-navbar-mobile-link" onClick={closeMobileMenu}>
                MFA
              </Link>

              <button
                  type="button"
                  className="builder-navbar-mobile-link builder-navbar-mobile-button"
                  onClick={() => {
                    closeMobileMenu();
                    handleLogout();
                  }}
              >
                Logout
              </button>
            </>
        ) : (
            <>
              <Link to="/register" className="builder-navbar-mobile-link" onClick={closeMobileMenu}>
                Register
              </Link>

              <Link to="/login" className="builder-navbar-mobile-link" onClick={closeMobileMenu}>
                Log In
              </Link>
            </>
        )}

        <button
            className="builder-navbar-mobile-link builder-navbar-mobile-button"
            type="button"
            onClick={() => {
              setDarkMode(!darkMode);
              closeMobileMenu();
            }}
        >
          {darkMode ? "Light mode" : "Dark mode"}
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
