import { useState } from "react";
import LanguageDropdown from "./LanguageDropdown.jsx";
import "./MySetups.css";
import Sidebar from "./Sidebar.jsx";

export default function MySetups({ isDark, setIsDark, onNavigate, profile, setProfile, setups, setSetups, showModal, setShowModal, language, setLanguage }) {
  const [search, setSearch]       = useState("");
  const [newTitle, setNewTitle]   = useState("");
  const [titleError, setTitleError] = useState(false);

  const filtered = setups.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenModal = () => {
    setNewTitle("");
    setTitleError(false);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setNewTitle("");
    setTitleError(false);
  };

  const handleCreateSetup = () => {
    if (!newTitle.trim()) { setTitleError(true); return; }
    setSetups([...setups, {
      id: Date.now(),
      title: newTitle.trim(),
      status: "Ciornă",
      statusColor: "draft",
      devices: 0,
      price: "—",
      tags: [],
      likes: 0,
      comments: 0,
    }]);
    handleCloseModal();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter")  handleCreateSetup();
    if (e.key === "Escape") handleCloseModal();
  };

  return (
    <div className={`app ${isDark ? "theme-dark" : "theme-light"}`}>
      <div className="layout">
        <Sidebar
          profile={profile}
          activePage="mysetups"
          onNavigate={onNavigate}
          setupCount={setups.length}
          setups={setups}
          onOpenModal={handleOpenModal}
        />

        <main className="main-content">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search for a setup"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="cards-grid">
            {filtered.map((setup) => (
              <div className="setup-card" key={setup.id}>
                <div className="card-image">
                  <span className={`status-badge ${setup.statusColor}`}>{setup.status}</span>
                </div>
                <div className="card-body">
                  <h3 className="card-title">{setup.title}</h3>
                  <div className="card-meta">
                    <span>🏠 {setup.devices} dispozitive</span>
                    <span className="price">{setup.price}</span>
                  </div>
                  <div className="card-tags">
                    {setup.tags.map((tag) => <span key={tag} className="tag">{tag}</span>)}
                  </div>
                  <div className="card-actions">
                    <span>❤ {setup.likes}</span>
                    <span>💬 {setup.comments}</span>
                  </div>
                </div>
              </div>
            ))}

            <div className="setup-card add-card" onClick={handleOpenModal}>
              <div className="add-content">
                <span className="add-icon">+</span>
                <span>Adaugă setup nou</span>
              </div>
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

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Setup nou</h2>
              <button className="modal-close" onClick={handleCloseModal}>✕</button>
            </div>
            <p className="modal-subtitle">
              Introdu un titlu pentru noul tău setup. Îl vei putea completa mai târziu.
            </p>
            <div className="modal-field">
              <label className="modal-label">Titlu setup</label>
              <input
                className={`modal-input ${titleError ? "input-error" : ""}`}
                type="text"
                placeholder="ex: Dormitor Automatizat"
                value={newTitle}
                onChange={(e) => { setNewTitle(e.target.value); if (titleError) setTitleError(false); }}
                onKeyDown={handleKeyDown}
                autoFocus
              />
              {titleError && <span className="error-msg">⚠ Te rog introdu un titlu.</span>}
            </div>
            <div className="modal-info">
              <span className="modal-badge draft">Ciornă</span>
              <span className="modal-info-text">Setup-ul va fi salvat ca ciornă</span>
            </div>
            <div className="modal-actions">
              <button className="modal-btn-cancel" onClick={handleCloseModal}>Anulează</button>
              <button className="modal-btn-create" onClick={handleCreateSetup}>Creează setup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
