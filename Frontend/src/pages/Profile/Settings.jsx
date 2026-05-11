import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Edit2, Lock, Trash2, Upload, Check, X } from "lucide-react";
import { useError } from "../../context/ErrorContext";
import { authFetch } from "../../utils/authFetch";
import "./Settings.css";

const API_BASE = "http://localhost:20025/api/v1";

const MOCK_UPLOAD = false;

export default function Settings({ profile }) {
  const navigate = useNavigate();
  const { showError, showSuccess } = useError();
  const [username, setUsername] = useState(profile?.username || "");
  const [email, setEmail] = useState(profile?.email || "");
  const [mfaEnabled, setMfaEnabled] = useState(profile?.mfaEnabled || false);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || "");
  // Re-sync local state when the profile prop arrives (it's null on first
  // render while ProfilePage is fetching /auth/me).
  useEffect(() => { if (profile?.username) setUsername(profile.username); }, [profile?.username]);
  useEffect(() => { if (profile?.email) setEmail(profile.email); }, [profile?.email]);
  useEffect(() => { setMfaEnabled(!!profile?.mfaEnabled); }, [profile?.mfaEnabled]);
  useEffect(() => { setAvatarUrl(profile?.avatarUrl || ""); }, [profile?.avatarUrl]);
  const [editingUsername, setEditingUsername] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const usernameCheckTimeout = useRef(null);
  const avatarInputRef = useRef(null);

  const token = localStorage.getItem("accessToken");

  const checkUsernameAvailability = async (newUsername) => {
    if (!newUsername.trim() || newUsername === profile?.username) {
      setUsernameAvailable(null);
      return;
    }

    setCheckingUsername(true);
    try {
      const response = await fetch(`${API_BASE}/auth/check-username`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUsername }),
      });

      if (response.ok) {
        const data = await response.json();
        setUsernameAvailable(data.available);
        // Clear error if username becomes available
        // Username is available; no need to clear error here anymore
      }
    } catch (error) {
      console.error("Failed to check username:", error);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleUsernameChange = (e) => {
    const newUsername = e.target.value;
    setUsername(newUsername);

    if (usernameCheckTimeout.current) {
      clearTimeout(usernameCheckTimeout.current);
    }

    usernameCheckTimeout.current = setTimeout(() => {
      checkUsernameAvailability(newUsername);
      // Clear error when user fixes the username to be valid
      if (newUsername.trim() && newUsername !== profile?.username) {
        // Will be replaced by the validation result
      }
    }, 500);
  };

  const handleSaveUsername = async () => {
    console.log("Save clicked, usernameAvailable:", usernameAvailable);

    if (!username.trim()) {
      showError("Username cannot be empty");
      console.log("Error: empty username");
      return;
    }
    if (username === profile?.username) {
      setEditingUsername(false);
      return;
    }

    if (!token) {
      showError("Session expired. Please login again.");
      return;
    }

    if (usernameAvailable === false) {
      console.log("Setting error: username taken");
      showError("This username is already taken");
      return;
    }

    if (usernameAvailable === null) {
      showError("Please wait for validation to complete");
      return;
    }

    // Confirmation popup
    const confirmed = window.confirm(
      `Are you sure you want to change your username from "@${profile?.username}" to "@${username}"?`
    );

    if (!confirmed) return;

    setLoading(true);

    try {
      // authFetch handles 401 -> refresh -> retry so a stale access token
      // doesn't lose the user's edit.
      const response = await authFetch(`${API_BASE}/users/username`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newUsername: username }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || data.message || "Failed to update username");
      }

      showSuccess("Username updated successfully!");
      setEditingUsername(false);
      // Tell ProfilePage / Navbar to re-read /auth/me so the new username
      // shows up everywhere, not just here.
      window.dispatchEvent(new Event("auth-change"));
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEmail = async () => {
    if (!email.trim()) {
      showError("Email cannot be empty");
      return;
    }
    if (email === profile?.email) {
      setEditingEmail(false);
      return;
    }

    if (!token) {
      showError("Session expired. Please login again.");
      return;
    }

    // Confirmation popup
    const confirmed = window.confirm(
      `Are you sure you want to change your email from "${profile?.email}" to "${email}"?`
    );

    if (!confirmed) return;

    setLoading(true);

    try {
      const response = await authFetch(`${API_BASE}/users/email`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail: email }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || data.message || "Failed to update email");
      }

      showSuccess("Email updated successfully!");
      setEditingEmail(false);
      window.dispatchEvent(new Event("auth-change"));
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e, field) => {
    if (e.key === "Enter") {
      if (field === "username") {
        handleSaveUsername();
      } else if (field === "email") {
        handleSaveEmail();
      }
    } else if (e.key === "Escape") {
      if (field === "username") {
        setEditingUsername(false);
        setUsername(profile?.username || "");
      } else if (field === "email") {
        setEditingEmail(false);
        setEmail(profile?.email || "");
      }
    }
  };

  /**
   * 2FA toggle — proper flow, NOT the dangerous one-shot /users/mfa/toggle.
   *
   * To enable: redirect to /mfa/setup. That page calls /auth/mfa/setup,
   *   shows the QR + secret, and only flips mfaEnabled after the user
   *   enters a valid 6-digit TOTP through /auth/mfa/confirm. This prevents
   *   silent self-lockout (toggling on without ever pairing an app).
   *
   * To disable: DELETE /auth/mfa/disable directly (with confirm).
   */
  const handle2FAToggle = async () => {
    if (!mfaEnabled) {
      // Enable: send the user through the QR-code flow.
      navigate("/mfa/setup");
      return;
    }

    const confirmed = window.confirm(
      "Disable two-factor authentication?\n\n" +
      "Your account will be less secure — anyone with your password will be able to sign in."
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      if (!token) {
        showError("Session expired. Please login again.");
        return;
      }
      const response = await authFetch(`${API_BASE}/auth/mfa/disable`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || data.error || "Failed to disable 2FA");
      }
      setMfaEnabled(false);
      // Sync to /auth/me everywhere
      window.dispatchEvent(new Event("auth-change"));
      showSuccess("Two-factor authentication disabled.");
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Avatar upload — two-step:
   *   1) POST file to Florentina's /api/v1/images/upload, get { url, key }
   *   2) PUT that url to /api/v1/users/avatar so it persists on the User row
   *
   * Until step 1 exists we mock the upload by reading the file as a data URL.
   * That keeps the UI testable end-to-end (preview + persistence to DB) but
   * data URLs are huge and would balloon the DB, so we deliberately do NOT
   * persist them — when MOCK_UPLOAD is true we save a placeholder URL on the
   * backend and only use the local data URL for the in-page preview. As soon
   * as MOCK_UPLOAD is flipped to false, the real S3 URL gets stored.
   */
  const handleAvatarSelect = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showError("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showError("Avatar must be smaller than 5MB.");
      return;
    }

    setUploadingAvatar(true);
    try {
      let urlForBackend;
      let urlForPreview;

      if (MOCK_UPLOAD) {
        // Show real preview, persist a placeholder so we don't bloat the DB.
        urlForPreview = await readAsDataUrl(file);
        urlForBackend = "https://via.placeholder.com/150?text=Avatar";
      } else {
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await authFetch(`${API_BASE}/images/avatars`, {
          method: "POST",
          body: formData,
        });
        if (!uploadRes.ok) throw new Error("Image upload failed");
        const data = await uploadRes.json();
        urlForBackend = data.url;
        urlForPreview = data.url;
      }

      const saveRes = await authFetch(`${API_BASE}/users/avatar`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: urlForBackend }),
      });
      if (!saveRes.ok) {
        const data = await saveRes.json().catch(() => ({}));
        throw new Error(data.message || data.error || "Failed to save avatar");
      }

      setAvatarUrl(urlForPreview);
      window.dispatchEvent(new Event("auth-change"));
      showSuccess("Profile photo updated.");
    } catch (err) {
      showError(err.message);
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const readAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Could not read file"));
      reader.readAsDataURL(file);
    });

  /**
   * Delete account — the backend has no DELETE /users/me endpoint yet, so
   * this UI tells the truth: the request was queued (or, more honestly,
   * isn't implemented yet) and asks the user to email support. We do NOT
   * fake a success message claiming the account is gone.
   */
  const handleDeleteAccount = () => {
    window.alert(
      "Account deletion is not self-serve yet.\n\n" +
      "Please email support@smartbuildup.com from your registered address " +
      "and we'll permanently delete your data within 30 days."
    );
  };

  return (
    <div className="settings-container">
      <h1 className="settings-title">Account Settings</h1>

      {/* Profile Photo Section */}
      <div className="settings-section">
        <h2 className="section-title">Profile photo</h2>
        <div className="profile-photo-area">
          <div className="avatar-large">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile"
                className="avatar-image"
              />
            ) : (
              username?.charAt(0)?.toUpperCase() || "U"
            )}
          </div>
          <div className="avatar-actions">
            <button
              className="upload-btn"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar || loading}
            >
              <Upload size={16} />
              {uploadingAvatar ? "Uploading..." : "Change Photo"}
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleAvatarSelect(e.target.files?.[0])}
              hidden
            />
          </div>
        </div>
      </div>

      {/* Username Field */}
      <div className="settings-section">
        <div className="setting-row">
          <div className="setting-content">
            <label className="setting-label">Username</label>
            {editingUsername ? (
              <div className="input-with-validation">
                <input
                  type="text"
                  value={username}
                  onChange={handleUsernameChange}
                  onKeyDown={(e) => handleKeyDown(e, "username")}
                  className="setting-input"
                  autoFocus
                  disabled={loading}
                />
                {username !== profile?.username && (
                  <div className="validation-icon">
                    {checkingUsername ? (
                      <span className="checking">...</span>
                    ) : usernameAvailable === true ? (
                      <Check size={20} className="available" title="Username available" />
                    ) : usernameAvailable === false ? (
                      <X size={20} className="taken" title="Username taken" />
                    ) : null}
                  </div>
                )}
              </div>
            ) : (
              <p className="setting-value">@{username}</p>
            )}
          </div>
          <div className="button-group">
            {editingUsername ? (
              <>
                <button
                  className="edit-btn"
                  onClick={handleSaveUsername}
                  disabled={loading}
                >
                  Save
                </button>
                <button
                  className="cancel-btn"
                  onClick={() => {
                    setEditingUsername(false);
                    setUsername(profile?.username || "");
                    setUsernameAvailable(null);
                  }}
                  disabled={loading}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                className="edit-btn"
                onClick={() => setEditingUsername(true)}
                disabled={loading}
              >
                Edit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Email Field */}
      <div className="settings-section">
        <div className="setting-row">
          <div className="setting-content">
            <label className="setting-label">Email address</label>
            {editingEmail ? (
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, "email")}
                className="setting-input"
                autoFocus
                disabled={loading}
              />
            ) : (
              <p className="setting-value">{email}</p>
            )}
          </div>
          <div className="button-group">
            {editingEmail ? (
              <>
                <button
                  className="edit-btn"
                  onClick={handleSaveEmail}
                  disabled={loading}
                >
                  Save
                </button>
                <button
                  className="cancel-btn"
                  onClick={() => {
                    setEditingEmail(false);
                    setEmail(profile?.email || "");
                  }}
                  disabled={loading}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                className="edit-btn"
                onClick={() => setEditingEmail(true)}
                disabled={loading}
              >
                Edit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2FA Section */}
      <div className="settings-section">
        <div className="mfa-header">
          <div className="mfa-info">
            <h3 className="mfa-title">Two-Factor Authentication (2FA)</h3>
            <p className="mfa-description">
              {mfaEnabled
                ? "✅ Your account is secured with 2FA. You'll need an authenticator app to log in."
                : "🔓 2FA is not enabled. We recommend enabling it for maximum security."}
            </p>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={mfaEnabled}
              onChange={handle2FAToggle}
              disabled={loading}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        {!mfaEnabled && (
          <div className="mfa-guide">
            <h4>How to enable 2FA:</h4>
            <ol>
              <li>Download an authenticator app (Google Authenticator, Authy, Microsoft Authenticator)</li>
              <li>Click the toggle above</li>
              <li>Scan the QR code with your authenticator app</li>
              <li>Enter the 6-digit code to verify</li>
            </ol>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="settings-divider"></div>

      {/* Delete Account */}
      <div className="settings-section danger-zone">
        <button className="danger-btn" onClick={handleDeleteAccount}>
          <Trash2 size={16} />
          Delete Account
        </button>
        <p className="danger-warning">⚠️  This action is irreversible and will permanently delete all your data.</p>
      </div>
    </div>
  );
}
