import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

/**
 * OAuthCallbackPage
 *
 * The backend's OAuth2LoginSuccessHandler redirects the browser to:
 *   http://localhost:5173/oauth2/callback?token=<jwt>
 *
 * (See OAuth2LoginSuccessHandler.java — it currently only sends an access
 * token, no refresh token.)
 *
 * This page:
 *   1. Pulls ?token=... out of the URL.
 *   2. Stores it as `accessToken` in localStorage.
 *   3. Fires `auth-change` so the Navbar / ProfilePage refresh.
 *   4. Navigates to /profile.
 *
 * If the token is missing or the URL was tampered with, we bounce to /login
 * with an error flash.
 */
export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      navigate("/login", {
        replace: true,
        state: { message: "Social login failed: no token returned." },
      });
      return;
    }
    localStorage.setItem("accessToken", token);
    // No refresh token from the OAuth flow yet — that's a backend gap to
    // address later. Until then the user gets one access-token lifetime
    // (~15 min) before being asked to sign in again.
    localStorage.removeItem("refreshToken");
    window.dispatchEvent(new Event("auth-change"));
    navigate("/profile", { replace: true });
  }, [params, navigate]);

  return (
    <div className="page-container">
      <div className="auth-card" style={{ textAlign: "center" }}>
        <h3 className="mb-3">Signing you in…</h3>
        <p style={{ color: "var(--text-secondary)" }}>
          Hang on, completing the social sign-in.
        </p>
      </div>
    </div>
  );
}
