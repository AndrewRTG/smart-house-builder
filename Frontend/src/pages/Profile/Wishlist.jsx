import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { useError } from "../../context/ErrorContext";
import { authFetch } from "../../utils/authFetch";
import ProductCard from "../../components/catalog/ProductCard";
import "./Wishlist.css";

const API_BASE = `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:20025'}/api/v1`;

export default function Wishlist({ isDark }) {
  const { showError, showSuccess } = useError();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchWishlist();
  }, []);

  async function fetchWishlist() {
    setLoading(true);
    try {
      // 🟢 Modificat endpoint-ul către cel de dispozitive conform WishlistController
      const res = await authFetch(`${API_BASE}/wishlists/devices?page=0&size=50`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.content || []);
      } else {
        showError("Couldn't load your wishlisted devices.");
      }
    } catch (err) {
      console.error("Failed to fetch device wishlist:", err);
      showError("Network error loading wishlist.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(deviceId) {
    if (working) return;
    setWorking(true);
    try {
      // 🟢 Se apelează endpoint-ul de toggle pentru dispozitivul selectat
      const res = await authFetch(`${API_BASE}/devices/${deviceId}/wishlist`, {
        method: "POST",
      });
      if (res.ok) {
        showSuccess("Item removed from wishlist.");
        fetchWishlist(); // Reîmprospătăm lista reală din DB
      } else {
        showError("Failed to remove item.");
      }
    } catch (err) {
      console.error("Failed to remove device from wishlist:", err);
      showError("Error connecting to server.");
    } finally {
      setWorking(false);
    }
  }

  const filtered = items.filter((it) =>
    (it.deviceName || "").toLowerCase().includes(search.toLowerCase()) ||
    (it.deviceBrand || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`my-articles-container ${isDark ? "dark" : "light"}`} style={{ padding: "0" }}>
      <div className="search-bar" style={{ marginBottom: "24px" }}>
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search devices..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <p>Loading your wishlisted devices...</p>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <p>No wishlisted devices yet.</p>
        </div>
      ) : (
        <div className="products-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
          {filtered.map((item) => {
            // 🟢 Maparea proprietăților exact din DeviceWishlistResponse (DTO-ul din backend-ul tău)
            const deviceProps = {
              id: item.deviceId,
              name: item.deviceName || "Unknown Device",
              imageUrl: item.deviceImageUrl || "",
              bestPrice: item.deviceBestPrice || 0,
              bestStoreName: item.deviceBrand || "Smart Brand",
              specifications: { roomTag: "Favorite" }
            };

            return (
              <div key={deviceProps.id} style={{ position: "relative" }}>
                <ProductCard device={deviceProps} viewMode="grid" initialIsWishlisted={true} />
                
                
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}