import { Navigate, Outlet, useLocation } from "react-router-dom";

/**
 * ProtectedRoute
 *
 * Single source of truth for "this part of the app needs an accessToken".
 * Replaces ad-hoc `localStorage.getItem('accessToken')` checks scattered
 * across ProfilePage, MfaSetupPage, MfaSettingsPage, etc.
 *
 * Wrap a group of routes:
 *   <Route element={<ProtectedRoute />}>
 *     <Route path="/profile"      element={<ProfilePage />} />
 *     <Route path="/mfa/setup"    element={<MfaSetupPage />} />
 *     <Route path="/mfa/settings" element={<MfaSettingsPage />} />
 *   </Route>
 *
 * If the user isn't logged in (no accessToken in localStorage), we redirect
 * them to /login and stash the intended destination in `location.state.from`
 * so LoginPage can navigate back there after a successful sign-in.
 *
 * NOTE: we deliberately don't validate the JWT here. Server-side validation
 * is the source of truth — `authFetch` already detects 401 and either
 * refreshes silently or clears local state. ProtectedRoute is only the
 * "is there even a token to try with?" gate.
 */
export default function ProtectedRoute() {
  const location = useLocation();
  const hasToken = Boolean(localStorage.getItem("accessToken"));
  if (!hasToken) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname + location.search,
          message: "Please sign in to continue.",
        }}
      />
    );
  }
  return <Outlet />;
}
