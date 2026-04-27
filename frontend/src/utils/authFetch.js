/**
 * authFetch — minimal fetch wrapper with auto refresh-on-401.
 *
 * Why this exists:
 *   The backend hands out short-lived access tokens (~15 min). Without this
 *   helper, every page that calls a protected endpoint after the token
 *   expires gets a 401, and the Navbar boots the user back to /login. With
 *   this helper, the first 401 triggers POST /auth/refresh; if that
 *   succeeds we replay the original request with the new token. The user
 *   never notices.
 *
 * Usage:
 *   import { authFetch } from "../utils/authFetch";
 *   const res = await authFetch("/api/v1/auth/me");
 *   if (res.ok) { ... }
 *
 * The function:
 *   - Adds Authorization: Bearer <accessToken> automatically.
 *   - On a 401, calls /auth/refresh once with the refreshToken.
 *   - If refresh succeeds, stores the new tokens, fires "auth-change",
 *     and retries the original request once.
 *   - If refresh fails (or no refresh token), clears tokens, fires
 *     "auth-change" (so Navbar logs out), and returns the 401 to caller.
 *
 * It is deliberately a thin wrapper around fetch — same Response API. No
 * JSON parsing, no error throwing. Each caller decides how to handle the
 * response.
 */

const API_ROOT = "http://localhost:20025";

// Single shared in-flight refresh promise so 5 parallel 401s → 1 refresh.
let inFlightRefresh = null;

async function refreshAccessToken() {
  if (inFlightRefresh) return inFlightRefresh;
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return null;

  inFlightRefresh = (async () => {
    try {
      const res = await fetch(`${API_ROOT}/api/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.accessToken) {
        localStorage.setItem("accessToken", data.accessToken);
      }
      if (data.refreshToken) {
        localStorage.setItem("refreshToken", data.refreshToken);
      }
      // Notify Navbar / ProfilePage that tokens just rotated.
      window.dispatchEvent(new Event("auth-change"));
      return data.accessToken || null;
    } catch {
      return null;
    } finally {
      inFlightRefresh = null;
    }
  })();
  return inFlightRefresh;
}

/**
 * Drop-in replacement for fetch().
 *
 * Accepts the same `path` (absolute URL or path starting with /) and `init`
 * (method, body, headers) as fetch. If `init.skipAuth` is true, no
 * Authorization header is added and 401 is not retried (useful for
 * /auth/login itself).
 */
export async function authFetch(path, init = {}) {
  const url = path.startsWith("http") ? path : `${API_ROOT}${path}`;
  const skipAuth = init.skipAuth === true;
  const buildHeaders = () => {
    const h = { ...(init.headers || {}) };
    if (!skipAuth) {
      const token = localStorage.getItem("accessToken");
      if (token) h["Authorization"] = `Bearer ${token}`;
    }
    return h;
  };

  const doFetch = () => fetch(url, { ...init, headers: buildHeaders() });

  let response;
  try {
    response = await doFetch();
  } catch (e) {
    // Network error — surface a synthetic Response so callers don't blow up
    // on response.ok.
    return new Response(null, { status: 0, statusText: "Network error" });
  }

  if (response.status === 401 && !skipAuth && !path.includes("/auth/refresh")) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      // Retry once with the new token.
      try {
        response = await doFetch();
      } catch {
        return new Response(null, { status: 0, statusText: "Network error" });
      }
    } else {
      // Refresh failed — purge local tokens so the Navbar shows login.
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      window.dispatchEvent(new Event("auth-change"));
    }
  }
  return response;
}
