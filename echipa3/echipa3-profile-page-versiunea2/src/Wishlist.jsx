import { useState } from "react";
import LanguageDropdown from "./LanguageDropdown";
import "./Wishlist.css";
import Sidebar from "./Sidebar";

const wishlistSetups = [
  { id: 1, title: "Smart Security Suite", devices: 7, price: "1.100 EUR", tags: ["Securitate"], likes: 41, comments: 9 },
];
const wishlistDevices = [
  { id: 1, title: "Electric Hand Mixer Hamilton", price: "40.73 EUR", source: "Amazon", tags: ["Kitchen", "Overall pick"], comments: 25 },
];

export default function Wishlist({ isDark, setIsDark, onNavigate, profile, setProfile, setups, setSetups, showModal, setShowModal, language, setLanguage }) {
  const [setupsOpen, setSetupsOpen]   = useState(true);
  const [devicesOpen, setDevicesOpen] = useState(true);

  return (
    <div className={`app ${isDark ? "theme-dark" : "theme-light"}`}>
      <header className="navbar">
        <div className="navbar-left">
          <span className="logo">logo</span>
          <nav className="nav-links">
            <a href="#">Builder</a><span className="divider">|</span>
            <a href="#">Products</a><span className="divider">|</span>
            <a href="#">Community</a>
          </nav>
        </div>
        <div className="navbar-right">
          <span className="icon-btn" onClick={() => onNavigate("mysetups")} title="Profilul meu" style={{cursor:"pointer"}}>👤</span>
          <LanguageDropdown language={language} setLanguage={setLanguage} />
          <button className="theme-toggle" onClick={() => setIsDark(!isDark)}>
            {isDark ? "☀️" : "🌙"}
          </button>
        </div>
      </header>

      <div className="layout">
        <Sidebar
          profile={profile}
          activePage="wishlist"
          onNavigate={onNavigate}
          setupCount={setups.length}
          setups={setups}
          onOpenModal={() => { onNavigate("mysetups"); setShowModal(true); }}
        />

        <main className="main-content">
          <h1 className="page-title">Wishlist</h1>
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input type="text" placeholder="Search a wishlist" />
          </div>

          <section className="wishlist-section">
            <div className="section-header" onClick={() => setSetupsOpen(!setupsOpen)}>
              <h2 className="section-title">Setup-uri</h2>
              <span className="section-toggle">
                <span style={{ display:"inline-block", transition:"transform 0.25s ease", transform: setupsOpen ? "rotate(0deg)" : "rotate(180deg)" }}>▲</span>
              </span>
            </div>
            {setupsOpen && (
              <div className="wishlist-cards">
                {wishlistSetups.map((item) => (
                  <div className="wishlist-card" key={item.id}>
                    <div className="card-image" />
                    <div className="card-body">
                      <h3 className="card-title">{item.title}</h3>
                      <div className="card-meta">
                        <span>🏠 {item.devices} dispozitive</span>
                        <span className="price">{item.price}</span>
                      </div>
                      <div className="card-tags">
                        {item.tags.map((tag) => <span key={tag} className="tag">{tag}</span>)}
                      </div>
                      <div className="card-actions">
                        <span>❤ {item.likes}</span><span>💬 {item.comments}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="wishlist-section">
            <div className="section-header" onClick={() => setDevicesOpen(!devicesOpen)}>
              <h2 className="section-title">Devices</h2>
              <span className="section-toggle">
                <span style={{ display:"inline-block", transition:"transform 0.25s ease", transform: devicesOpen ? "rotate(0deg)" : "rotate(180deg)" }}>▲</span>
              </span>
            </div>
            {devicesOpen && (
              <div className="wishlist-cards">
                {wishlistDevices.map((item) => (
                  <div className="wishlist-card" key={item.id}>
                    <div className="card-image" />
                    <div className="card-body">
                      <h3 className="card-title">{item.title}</h3>
                      <div className="card-meta">
                        <span className="price">{item.price}</span>
                        <span className="source-badge">{item.source}</span>
                      </div>
                      <div className="card-tags">
                        {item.tags.map((tag) => <span key={tag} className="tag">{tag}</span>)}
                      </div>
                      <div className="card-actions"><span>💬 {item.comments}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
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
