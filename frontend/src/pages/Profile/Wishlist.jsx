import { useState, useEffect } from "react";
import { Bookmark, Trash2 } from "lucide-react";
import "./Wishlist.css";

const API_BASE = 'http://localhost:20025/api/v1';

export default function Wishlist() {
  const [wishlists, setWishlists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWishlists();
  }, []);

  const fetchWishlists = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE}/wishlists?page=0&size=50`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setWishlists(data.content || []);
      }
    } catch (error) {
      console.error('Failed to fetch wishlists:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (setupId) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE}/setups/${setupId}/wishlist`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        fetchWishlists();
      }
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
    }
  };

  return (
    <div className="wishlist-container">
      <h2 className="wishlist-title">My Wishlist</h2>
      {loading ? (
        <div className="loading">Loading wishlist...</div>
      ) : (
        <div className="wishlist-grid">
          {wishlists.length > 0 ? (
            wishlists.map((wishlist) => (
              <div key={wishlist.id} className="wishlist-card">
                <div className="card-header">
                  <div className="card-info">
                    <h3 className="card-title">{wishlist.setupName}</h3>
                    <p className="card-author">{new Date(wishlist.createdAt).toLocaleDateString()}</p>
                  </div>
                  <button className="remove-btn" title="Remove from wishlist" onClick={() => removeFromWishlist(wishlist.setupId)}>
                    <Trash2 size={16} />
                  </button>
                </div>
                <button className="copy-btn">Copy Setup</button>
              </div>
            ))
          ) : (
            <div className="empty-state">No wishlisted setups yet</div>
          )}
        </div>
      )}
    </div>
  );
}
