/**
 * DEPRECATED 2026-04-27. No consumer in the routed app — was only used by
 * the old AccountSettings.jsx, which is itself deprecated. We don't have
 * an i18n strategy yet; when we do, the language switcher should live in
 * the Navbar or in a real Settings tab section, not as a one-off dropdown
 * imported from a half-mock page.
 *
 * Stub kept to avoid a 404 if anything still imports the path. Delete by
 * hand once the obsolete AccountSettings.jsx is removed.
 */
export default function LanguageDropdown() {
  return null;
}
