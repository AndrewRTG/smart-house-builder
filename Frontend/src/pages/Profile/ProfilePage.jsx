import { useState, useEffect } from "react";
import { User, Bookmark, Settings, Activity, FileText } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authFetch } from "../../utils/authFetch";
import MySetups from "./MySetups";
import Wishlist from "./Wishlist";
import SettingsPage from "./Settings";
import ActivityPage from "./Activity";
import MyArticles from "./MyArticles";
import "./ProfilePage.css";

const initialSetups = [
  { id: 1, title: "Living Room Pro", status: "Publicat", statusColor: "published", devices: 12, price: "2.400 EUR", tags: ["Confort", "Entertainment"], likes: 84, comments: 23 },
  { id: 2, title: "Smart Security Suite", status: "Publicat", statusColor: "published", devices: 7, price: "1.100 EUR", tags: ["Securitate"], likes: 41, comments: 9 },
  { id: 3, title: "Dormitor Automatizat", status: "Ciornă", statusColor: "draft", devices: 5, price: "650 EUR", tags: ["Confort", "Energie"], likes: 7, comments: 2 },
];

export default function ProfilePage({ darkMode }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = searchParams.get("tab") || "mysetups";
  const [user, setUser] = useState(null);

  const setPage = (newPage) => {
    setSearchParams({ tab: newPage });
  };

  // Re-fetch the profile when this page mounts AND every time the auth
  // state changes (e.g. user logs in in another tab, or username/email is
  // updated from Settings). Without this listener Profile would show stale
  // data after the Settings tab successfully PUT-s a new username.
  useEffect(() => {
    fetchUser();
    const onAuthChange = () => fetchUser();
    window.addEventListener("auth-change", onAuthChange);
    return () => window.removeEventListener("auth-change", onAuthChange);
  }, []);

  const fetchUser = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      // Not logged in — bounce to login. ProtectedRoute would do the same
      // but ProfilePage isn't wrapped in one yet, so guard locally.
      navigate("/login", { state: { from: "/profile", message: "Please sign in to continue." } });
      return;
    }
    try {
      // authFetch will try POST /auth/refresh once if the access token has
      // expired, then replay /auth/me with the new bearer.
      const response = await authFetch("/api/v1/auth/me");
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else if (response.status === 401) {
        // Refresh also failed — bounce to login.
        navigate("/login", { state: { from: "/profile", message: "Your session expired." } });
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
    }
  };

  const sharedProps = {
    isDark: darkMode,
    onNavigate: setPage,
    profile: user,
  };

  return (
    <div className={`profile-page ${darkMode ? "dark" : "light"}`}>
      {/* HEADER */}
      <header className="profile-header">
        <div className="header-content">
          <div className="user-intro">
            <div className="user-avatar-large">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="Profile"
                  className="user-avatar-img"
                  onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
                />
              ) : null}
              <span className="user-avatar-fallback" style={user?.avatarUrl ? { display: "none" } : {}}>
                {user?.username?.charAt(0)?.toUpperCase() || "U"}
              </span>
            </div>
            <div className="user-info-section">
              <h1 className="user-name">{user?.username || "Loading…"}</h1>
              <p className="user-email">{user?.email || ""}</p>
            </div>
          </div>
          <button className="settings-btn" onClick={() => setPage("settings")}>
            <Settings size={18} /> Settings
          </button>
        </div>
      </header>

      {/* TABS */}
      <nav className="profile-tabs">
        <button
          className={`tab-btn ${page === "mysetups" ? "active" : ""}`}
          onClick={() => setPage("mysetups")}
        >
          <User size={18} /> My Setups
        </button>
        <button
          className={`tab-btn ${page === "myarticles" ? "active" : ""}`}
          onClick={() => setPage("myarticles")}
        >
          <FileText size={18} /> My Articles
        </button>
        <button
          className={`tab-btn ${page === "wishlist" ? "active" : ""}`}
          onClick={() => setPage("wishlist")}
        >
          <Bookmark size={18} /> Wishlist
        </button>
        <button
          className={`tab-btn ${page === "activity" ? "active" : ""}`}
          onClick={() => setPage("activity")}
        >
          <Activity size={18} /> Activity
        </button>
      </nav>

      {/* CONTENT */}
      <main className="profile-content">
        {page === "mysetups" && <MySetups {...sharedProps} />}
        {page === "myarticles" && <MyArticles isDark={darkMode} profile={user} />}
        {page === "wishlist" && <Wishlist {...sharedProps} />}
        {page === "activity" && <ActivityPage {...sharedProps} />}
        {page === "settings" && <SettingsPage profile={user} />}
      </main>

      {/* FOOTER */}
      <footer className="profile-footer">
        <div className="footer-links">
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
          <a href="#privacy">Privacy Policy</a>
        </div>
        <p className="footer-text">©2026 SmartHouse-Builder. All rights reserved.</p>
      </footer>
    </div>
  );
}
