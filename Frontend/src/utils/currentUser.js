/**
 * currentUser — single in-memory cache for /auth/me.
 *
 * Why this exists:
 *   Navbar, ProfilePage, CommunityPage, SetupDetailPage, ArticleDetailPage,
 *   MfaSettingsPage all want to know "who is the logged-in user?". Each
 *   used to hit GET /api/v1/auth/me on mount. With React 18 StrictMode
 *   doubling every effect, a single navigation could fire 10+ requests in
 *   a few hundred ms — enough to trip the backend rate limiter and silently
 *   return null. The user appeared logged-out on Community while logged-in
 *   on the Navbar.
 *
 * What it does:
 *   - Caches the latest /auth/me response in module memory.
 *   - De-duplicates concurrent calls behind a single in-flight promise.
 *   - Cache lasts 60 seconds so back-to-back navigations reuse it; after
 *     that we re-hit the server in case the profile changed elsewhere.
 *   - Listens to "auth-change" events (login, logout, token refresh) and
 *     invalidates the cache so the very next caller forces a refresh.
 *
 * API:
 *   getCurrentUser({ force = false }) -> Promise<User | null>
 *   invalidateCurrentUser()          -> void
 */

import { authFetch } from './authFetch';

const TTL_MS = 60 * 1000;

let cached = null;          // last successful user object
let cachedAt = 0;            // ms epoch when 'cached' was set
let inFlight = null;         // shared promise during a fetch

function isFresh() {
  return cached !== null && Date.now() - cachedAt < TTL_MS;
}

export function invalidateCurrentUser() {
  cached = null;
  cachedAt = 0;
  inFlight = null;
}

// Any auth state change (login, logout, token refresh) drops the cache so
// the next consumer fetches fresh data with the new token.
if (typeof window !== 'undefined') {
  window.addEventListener('auth-change', invalidateCurrentUser);
}

export async function getCurrentUser({ force = false } = {}) {
  if (!force && isFresh()) return cached;
  if (inFlight) return inFlight;

  // No token at all? Don't even hit the server — saves a 401.
  if (!localStorage.getItem('accessToken')) {
    cached = null;
    cachedAt = Date.now();
    return null;
  }

  inFlight = (async () => {
    try {
      const res = await authFetch('/api/v1/auth/me');
      if (res.ok) {
        cached = await res.json();
        cachedAt = Date.now();
        return cached;
      }
      // 401 / 403 / 429 -> treat as "no user" but DON'T poison the cache
      // for long; let the next page try again after TTL.
      cached = null;
      cachedAt = Date.now();
      return null;
    } catch {
      cached = null;
      cachedAt = Date.now();
      return null;
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}
