import { useState } from "react";
import LanguageDropdown from "./LanguageDropdown.jsx";
import "./Wishlist.css";
import Sidebar from "./Sidebar.jsx";

const wishlistSetups = [
  { id: 1, title: "Smart Security Suite", devices: 7, price: "1.100 EUR", tags: ["Securitate"], likes: 41, comments: 9 },
];
const wishlistDevices = [
  { id: 1, title: "Electric Hand Mixer Hamilton", price: "40.73 EUR", source: "Amazon", tags: ["Kitchen", "Overall pick"], comments: 25 },
];

export default function Wishlist({ isDark, setIsDark, onNavigate, profile, setProfile, setups, setSetups, showModal, setShowModal, language, setLanguage }) {
  const [setupsOpen, setSetupsOpen]   = useState(true);
  const [devicesOpen, setDevicesOpen] = useState(true);
  const [search, setSearch] = useState("");
  const filteredSetups = wishlistSetups.filter((item) =>
      item.title.toLowerCase().includes(search.toLowerCase())
  );
  const filteredDevices = wishlistDevices.filter((item) =>
      item.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`app ${isDark ? "theme-dark" : "theme-light"}`}>
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
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
                type="text"
                placeholder="Search a wishlist"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
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
                  {/* 4. Folosim lista filtrată aici */}
                  {filteredSetups.map((item) => (
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
                  {/* 5. Folosim lista filtrată și aici */}
                  {filteredDevices.map((item) => (
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
