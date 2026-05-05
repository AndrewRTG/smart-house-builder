import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare,
  Bell,
  Upload,
  Copy,
  Heart,
  Bookmark,
  Clock,
} from "lucide-react";
import "./Activity.css";

const API_BASE = "http://localhost:20025/api/v1";

/**
 * Map each ActivityItem.type (backend discriminator) to the UI pieces we
 * render. Kept in one place so ordering/phrasing changes don't scatter.
 *
 * The backend sends these strings as 'type' (see ActivityItem.java javadoc):
 *   COMMENT_WROTE, COMMENT_RECEIVED, SETUP_PUBLISHED, SETUP_COPIED,
 *   LIKE_GIVEN, WISHLIST_ADDED
 */
const TYPE_META = {
  COMMENT_WROTE: {
    icon: MessageSquare,
    actionText: "You commented on",
    tone: "comment",
  },
  COMMENT_RECEIVED: {
    icon: Bell,
    actionText: null, // composed at render time to include actor name
    tone: "incoming",
  },
  SETUP_PUBLISHED: {
    icon: Upload,
    actionText: "You published",
    tone: "publish",
  },
  SETUP_COPIED: {
    icon: Copy,
    actionText: "You copied",
    tone: "copy",
  },
  LIKE_GIVEN: {
    icon: Heart,
    actionText: "You liked",
    tone: "like",
  },
  WISHLIST_ADDED: {
    icon: Bookmark,
    actionText: "You saved",
    tone: "wishlist",
  },
};

// Render "2m ago" / "3h ago" / "5d ago" / fallback to a local date string.
// Backend sends the timestamp as "yyyy-MM-dd HH:mm:ss" (see ActivityItem's
// @JsonFormat), which Safari and older browsers refuse to parse with new
// Date(). We normalize to ISO by swapping the space for 'T' so every browser
// agrees on the value.
function formatRelativeDate(rawTimestamp) {
  if (!rawTimestamp) return "";
  const iso = typeof rawTimestamp === "string"
    ? rawTimestamp.replace(" ", "T")
    : rawTimestamp;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

export default function Activity() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchActivity();
  }, []);

  const fetchActivity = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("accessToken");
      if (!token) {
        // The Profile layout already gates on auth, but if someone lands here
        // without a token we want a clear message instead of a blank list.
        setError("Please log in to see your activity.");
        setItems([]);
        return;
      }

      const response = await fetch(`${API_BASE}/activity`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setItems(Array.isArray(data) ? data : []);
      } else if (response.status === 401) {
        setError("Your session has expired. Please log in again.");
      } else {
        setError("Couldn't load your activity. Try refreshing.");
      }
    } catch (err) {
      console.error("Failed to fetch activity:", err);
      setError("Couldn't load your activity. Try refreshing.");
    } finally {
      setLoading(false);
    }
  };

  // Build the target URL. For comment activities we append ?comment=<id> so
  // the destination page can scroll to and highlight that specific comment.
  const buildHref = (item) => {
    const basePath = item.targetType === "SETUP"
      ? `/setups/${item.targetId}`
      : `/articles/${item.targetId}`;
    return item.commentId ? `${basePath}?comment=${item.commentId}` : basePath;
  };

  const handleClick = (item) => {
    navigate(buildHref(item));
  };

  return (
    <div className="activity-container">
      <h2 className="activity-title">Your Activity</h2>

      {loading ? (
        <div className="activity-list">
          <div className="activity-loading">Loading your activity...</div>
        </div>
      ) : error ? (
        <div className="activity-list">
          <div className="empty-state">{error}</div>
        </div>
      ) : items.length === 0 ? (
        <div className="activity-list">
          <div className="empty-state">
            No activity yet. Comment on a setup, like one, or publish your
            own — it'll show up here.
          </div>
        </div>
      ) : (
        <div className="activity-list">
          {items.map((item, idx) => {
            const meta = TYPE_META[item.type] ?? {
              icon: Clock,
              actionText: "Activity",
              tone: "default",
            };
            const Icon = meta.icon;

            // COMMENT_RECEIVED is the only type where the action text depends
            // on another user's name, so we compose it here rather than
            // baking a placeholder into TYPE_META.
            const actionText =
              item.type === "COMMENT_RECEIVED"
                ? `${item.actorUsername || "Someone"} commented on`
                : meta.actionText;

            // The list key combines several fields because a user could
            // theoretically generate two items with the same commentId
            // (COMMENT_WROTE on their own post would also show up as
            // COMMENT_RECEIVED if we let it — we don't, but better safe).
            const key = `${item.type}-${item.commentId ?? "x"}-${item.targetType}-${item.targetId}-${idx}`;

            return (
              <button
                key={key}
                type="button"
                className={`activity-item activity-item-${meta.tone}`}
                onClick={() => handleClick(item)}
              >
                <div className={`activity-icon activity-icon-${meta.tone}`}>
                  <Icon size={18} />
                </div>
                <div className="activity-content">
                  <p className="activity-text">
                    <span className="activity-action">{actionText}</span>{" "}
                    <span className="activity-setup">
                      {item.targetTitle || "(untitled)"}
                    </span>
                  </p>
                  {item.excerpt && (
                    <p className="activity-excerpt">"{item.excerpt}"</p>
                  )}
                  <span className="activity-date">
                    {formatRelativeDate(item.timestamp)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
