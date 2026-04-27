/**
 * DEPRECATED 2026-04-27.
 *
 * The profile "settings" tab is served by Settings.jsx (in this same
 * folder), wired up in ProfilePage.jsx. This file is the older mock-data
 * version and is no longer imported anywhere — the only previous consumer
 * (ProfilePage) was changed to import SettingsPage from "./Settings".
 *
 * Kept as a stub instead of being deleted because the build folder is on
 * a Windows-mounted FS the dev sandbox can't `rm` from. Safe to delete by
 * hand: this file, AccountSettings.css. Nothing references either anymore.
 */
export default function AccountSettings() {
  return null;
}
