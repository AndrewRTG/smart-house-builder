import "./Activity.css";
import LanguageDropdown from "./LanguageDropdown.jsx";
import Sidebar from "./Sidebar.jsx";

const activities = [
  { id: 1, text: "Ai adăugat în lista de dorințe Setup-ul Smart Security Suite", time: "acum 2 ore", post: null },
  { id: 2, text: "Ai adăugat în lista de dorințe Setup-ul Smart Security Suite", time: "acum 2 ore",
    post: { author: "Petru Sichim", authorInitials: "P", postedAt: "acum 2 ore", title: "Living room minimalist + Google Home", description: "Design curat și control vocal perfect. Google Home a integrat totul discret, fără cabluri la vedere. Recomand!", likes: 103, comments: 20 } },
  { id: 3, text: "Ai adăugat în lista de dorințe Setup-ul Smart Security Suite", time: "acum 3 ore",
    post: { author: "Petru Sichim", authorInitials: "P", postedAt: "acum 3 ore", title: "Living room minimalist + Google Home", description: "Design curat și control vocal perfect. Google Home a integrat totul discret, fără cabluri la vedere. Recomand!", likes: 103, comments: 21 } },
];

export default function Activity({ isDark, setIsDark, onNavigate, profile, setProfile, setups, setSetups, showModal, setShowModal, language, setLanguage }) {
  return (
    <div className={`app ${isDark ? "theme-dark" : "theme-light"}`}>
      <div className="layout">
        <Sidebar
          profile={profile}
          activePage="activity"
          onNavigate={onNavigate}
          setupCount={setups.length}
          setups={setups}
          onOpenModal={() => { onNavigate("mysetups"); setShowModal(true); }}
        />

        <main className="main-content">
          <div className="activity-feed">
            {activities.map((item) => (
              <div key={item.id} className="activity-item">
                <div className="activity-notification">
                  <span className="activity-text">
                    {item.text.split("Setup-ul")[0]}
                    <strong>Setup-ul {item.text.split("Setup-ul")[1]}</strong>
                  </span>
                  <span className="activity-time">{item.time}</span>
                </div>
                {item.post && (
                  <div className="activity-post">
                    <div className="post-header">
                      <div className="post-avatar">{item.post.authorInitials}</div>
                      <div>
                        <div className="post-author">{item.post.author}</div>
                        <div className="post-time">{item.post.postedAt}</div>
                      </div>
                    </div>
                    <div className="post-title">{item.post.title}</div>
                    <div className="post-description">{item.post.description}</div>
                    <div className="post-image"><span className="post-image-icon">🖼</span></div>
                    <div className="post-actions">
                      <span>❤ {item.post.likes}</span>
                      <span>💬 {item.post.comments}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
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
