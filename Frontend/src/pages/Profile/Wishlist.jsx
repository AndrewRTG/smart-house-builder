import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, Eye } from "lucide-react";
import { useError } from "../../context/ErrorContext";
import "./Wishlist.css";

const API_BASE = "http://localhost:20025/api/v1";

/**
 * Wishlist (Profile tab)
 *
 * Backend-wired:
 *   - GET  /wishlists?page=&size=        list of wishlisted setups
 *   - POST /setups/{id}/wishlist         TOGGLE (so calling once removes)
 *   - GET  /setups/{id}                  on click -> detail page
 *
 * Notes:
 *   - The toggle endpoint adds-if-missing / removes-if-present, so we MUST
 *     disable the remove button while a request is in flight; otherwise a
 *     double-click would silently re-add the item.
 *   - This component used to render a hardcoded mock list AND read setups
 *     from props that ProfilePage no longer passes — that crashed on first
 *     render. The mock is gone; no props are required now.
 */
export default function Wishlist({ isDark, onNavigate }) {
  const navigate = useNavigate();
  const { showError, showSuccess } = useError();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(true);

  useEffect(() => { fetchWishlist(); }, []);

  async function fetchWishlist() {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        // The Profile shell should have already bounced the user; defensive.
        setItems([]);
        setLoading(false);
        return;
      }
      const res = await fetch(`${API_BASE}/wishlists?page=0&size=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data.content || []);
      } else {
        showError("Couldn't load your wishlist.");
      }
    } catch (err) {
      console.error("Failed to fetch wishlist:", err);
      showError("Couldn't load your wishlist.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(setupId) {
    if (working) return; // race-protection — a 2nd click would re-add it
    setWorking(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API_BASE}/setups/${setupId}/wishlist`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (res.ok) {
        showSuccess("Removed from wishlist.");
        fetchWishlist();
      } else {
        const data = await res.json().catch(() => null);
        showError(data?.message || data?.error || "Failed to remove.");
      }
    } catch (err) {
      console.error("Failed to remove from wishlist:", err);
      showError("Failed to remove.");
    } finally {
      setWorking(false);
    }
  }

  const filtered = items.filter((it) =>
    (it.setupName || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`app ${isDark ? "theme-dark" : "theme-light"}`}>
      <div className="layout">
        <main className="main-content">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search wishlist"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <section className="wishlist-section">
            <div
              className="section-header"
              onClick={() => setOpen(!open)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter") setOpen(!open); }}
              style={{ cursor: "pointer" }}
            >
              <h2 className="section-title">Saved setups ({items.length})</h2>
              <span className="section-toggle">
                <span style={{
                  display: "inline-block", transition: "transform 0.25s ease",
                  transform: open ? "rotate(0deg)" : "rotate(180deg)",
                }}>▲</span>
              </span>
            </div>

            {open && (
              <div className="wishlist-cards">
                {loading ? (
                  <div className="loading">Loading wishlist…</div>
                ) : filtered.length === 0 ? (
                  <div className="empty-state">No wishlisted setups yet.</div>
                ) : (
                  filtered.map((item) => (
                    <div className="wishlist-card" key={item.id || item.setupId}>
                      <div className="card-image" />
                      <div className="card-body">
                        <h3 className="card-title">{item.setupName || "Untitled"}</h3>
                        <p className="card-author">
                          Saved {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ""}
                        </p>
                        <div className="card-buttons" style={{ display: "flex", gap: 8, marginTop: 8 }}>
                          <button
                            type="button"
                            className="btn-view"
                            onClick={() => navigate(`/setups/${item.setupId}`)}
                          >
                            <Eye size={14} style={{ marginRight: 6 }} />
                            View
                          </button>
                          <button
                            type="button"
                            className="remove-btn"
                            disabled={working}
                            onClick={() => handleRemove(item.setupId)}
                            title="Remove from wishlist"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </section>
        </main>
      </div>
      <footer className="footer">
        <div className="footer-links">
          <a href="#about">About</a><span>|</span>
          <a href="#contact">Contact</a><span>|</span>
          <a href="#privacy">Privacy Policy</a>
        </div>
        <div className="footer-copy">©2026 SmartHouse-Builder.<br />All rights reserved.</div>
      </footer>
    </div>
  );
}
