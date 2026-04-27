import { useState } from "react";
import LanguageDropdown from "./LanguageDropdown.jsx";
import "./AccountSettings.css";
import Sidebar from "./Sidebar.jsx";

export default function AccountSettings({ isDark, setIsDark, onNavigate, profile, setProfile, setups, setSetups, showModal, setShowModal, language, setLanguage }) {
  const [tempName, setTempName]       = useState(profile.name);
  const [tempEmail, setTempEmail]     = useState(profile.email);
  const [editingName, setEditingName]   = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [twoFA, setTwoFA]             = useState(true);

  const initials = profile.name.trim().split(" ").filter(Boolean).map((w) => w[0].toUpperCase()).slice(0, 2).join("");

  const handleSaveName = () => {
    if (tempName.trim()) setProfile({ ...profile, name: tempName.trim() });
    setEditingName(false);
  };

  const handleSaveEmail = () => {
    if (tempEmail.trim()) setProfile({ ...profile, email: tempEmail.trim() });
    setEditingEmail(false);
  };

  return (
    <div className={`app ${isDark ? "theme-dark" : "theme-light"}`}>
      <div className="layout">
        <Sidebar
          profile={profile}
          activePage="settings"
          onNavigate={onNavigate}
          setupCount={setups.length}
          setups={setups}
          onOpenModal={() => { onNavigate("mysetups"); setShowModal(true); }}
        />

        <main className="main-content">
          <section className="settings-section">
            <h2 className="settings-label">Profile photo</h2>
            <div className="profile-photo-big">{initials}</div>
          </section>

          <div className="settings-fields">
            {/* Nume */}
            <div className="settings-field">
              <div className="field-info">
                <span className="field-label">Name</span>
                {editingName ? (
                  <input
                    className="field-input"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") setEditingName(false); }}
                    autoFocus
                  />
                ) : (
                  <span className="field-value">{profile.name}</span>
                )}
              </div>
              <button className="edit-btn" onClick={editingName ? handleSaveName : () => { setTempName(profile.name); setEditingName(true); }}>
                {editingName ? "Save" : "Edit"}
              </button>
            </div>

            {/* Email */}
            <div className="settings-field">
              <div className="field-info">
                <span className="field-label">Email address</span>
                {editingEmail ? (
                  <input
                    className="field-input"
                    value={tempEmail}
                    onChange={(e) => setTempEmail(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSaveEmail(); if (e.key === "Escape") setEditingEmail(false); }}
                    autoFocus
                  />
                ) : (
                  <span className="field-value">{profile.email}</span>
                )}
              </div>
              <button className="edit-btn" onClick={editingEmail ? handleSaveEmail : () => { setTempEmail(profile.email); setEditingEmail(true); }}>
                {editingEmail ? "Save" : "Edit"}
              </button>
            </div>
          </div>
        </main>
      </div>

      <footer className="footer">
        <div className="footer-links">
          <a href="#">About</a><span>|</span>
          <a href="#">Contact</a><span>|</span>
          <a href="#">Privacy Policy</a>
        </div>
        <div className="footer-copy">©2026 SmartHouse-Builder.<br />All rights reserved.</div>
      </footer>
    </div>
  );
}
