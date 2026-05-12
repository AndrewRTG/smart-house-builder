import { useState, useEffect, useMemo } from 'react';
import { Bookmark, Copy, MessageCircle, FileText, Settings, Heart, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import CopySetupModal from '../components/CopySetupModal';
import NewPostModal from '../components/NewPostModal';
import { useError } from '../context/ErrorContext';
import { getCurrentUser } from '../utils/currentUser';
import { fuzzyFilter } from '../utils/fuzzySearch';
import { getStoredLikedItems, setStoredLike } from '../utils/likedItemsStorage';
import '../styles/CommunityPage.css';

function parseDate(value) {
  if (!value) return null;
  if (Array.isArray(value)) {
    const [y, m, d, h = 0, min = 0] = value;
    return new Date(y, m - 1, d, h, min);
  }
  return new Date(value);
}

function formatDate(value) {
  const d = parseDate(value);
  if (!d || isNaN(d.getTime())) return 'Dată necunoscută';
  return d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function CommunityPage({ darkMode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { showError } = useError();
  const [activeTab, setActiveTab] = useState('setups');
  const [setups, setSetups] = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [wishlist, setWishlist] = useState(new Set());
  const [likes, setLikes] = useState(new Map());
  const [likeCounts, setLikeCounts] = useState(new Map());
  const [commentCounts, setCommentCounts] = useState(new Map());
  const [page, setPage] = useState(0);
  const [user, setUser] = useState(null);
  const [userStats, setUserStats] = useState({ posts: 0, likes: 0 });
  const [priceRange, setPriceRange] = useState(500);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [selectedSetupToCopy, setSelectedSetupToCopy] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [newPostModalOpen, setNewPostModalOpen] = useState(false);
  const [activeTagFilter, setActiveTagFilter] = useState(null);


  const API_BASE = 'http://localhost:20025/api/v1';

  // ---- Fuzzy search ------------------------------------------------------
  // useMemo so we don't re-score the entire list on every unrelated re-render
  // (e.g. when a like count changes). Re-runs only when the data or the
  // query change.
  // For setups we fuzzy-match against name + description + author username.
  // For articles we match against title + content + author username.
  const filteredSetups = useMemo(
    () => fuzzyFilter(setups, searchQuery, (s) => [
      s.name, s.description, s.user?.username,
    ]),
    [setups, searchQuery]
  );
  const filteredArticles = useMemo(() => {
    const byTag = activeTagFilter
      ? articles.filter((a) =>
          (a.tags || []).some((t) => t.toLowerCase() === activeTagFilter.toLowerCase())
        )
      : articles;
    return fuzzyFilter(byTag, searchQuery, (a) => [
      a.title, a.content, a.authorUsername,
    ]);
  }, [articles, searchQuery, activeTagFilter]);

  // Collect distinct tags from current articles for the filter chip row.
  const availableTags = useMemo(() => {
    const set = new Set();
    articles.forEach((a) => (a.tags || []).forEach((t) => set.add(t)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [articles]);

  // Restore scroll position and tab on mount
  useEffect(() => {
    if (location.state?.restore) {
      const saved = sessionStorage.getItem('community:lastState');
      if (saved) {
        const { scrollY, activeTab: savedTab, page: savedPage } = JSON.parse(saved);
        if (savedTab) setActiveTab(savedTab);
        if (savedPage !== undefined) setPage(savedPage);
        // scroll after next paint so content has rendered
        requestAnimationFrame(() => {
          setTimeout(() => window.scrollTo(0, scrollY), 50);
        });
      }
    }
  }, [location]);

  useEffect(() => {
    fetchSetups();
    fetchArticles();
    fetchCurrentUser();
  }, [page]);

  useEffect(() => {
    if (!user) {
      setLikes(new Map());
      return;
    }

    const storedLikes = getStoredLikedItems(user);
    setLikes(new Map(Object.entries(storedLikes)));
  }, [user]);

  const fetchCurrentUser = async () => {
    // Use the shared cache instead of hitting /auth/me on every page mount.
    // Multiple components calling this within ~60s collapse to one network
    // request, which prevented the rate limiter from blanking us out.
    const data = await getCurrentUser();
    if (data) {
      setUser(data);
      setUserStats({ posts: 12, likes: 47 });
    } else {
      setUser(null);
    }
  };

  const fetchSetups = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/setups?page=${page}&size=10`);
      const data = await response.json();
      const items = data.content || [];
      setSetups(items);

      // The backend now ships likeCount / wishlistCount / commentCount
      // INLINE on each SetupResponse (see SetupController.toResponse). No
      // more N+1: one COUNT per setup, server-side, in the same transaction
      // as the list query, instead of three round trips per card from the
      // browser. Seed the count maps in one synchronous pass.
      setLikeCounts((prev) => {
        const next = new Map(prev);
        for (const s of items) next.set(`setup-${s.id}`, s.likeCount ?? 0);
        return next;
      });
      setCommentCounts((prev) => {
        const next = new Map(prev);
        for (const s of items) next.set(`setup-${s.id}`, s.commentCount ?? 0);
        return next;
      });
    } catch (error) {
      console.error('Failed to fetch setups:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchArticles = async () => {
    try {
      const response = await fetch(`${API_BASE}/articles?page=${page}&size=10`);
      const data = await response.json();
      const items = data.content || [];
      setArticles(items);

      // Counts inline (same fix as fetchSetups).
      setLikeCounts((prev) => {
        const next = new Map(prev);
        for (const a of items) next.set(`article-${a.id}`, a.likeCount ?? 0);
        return next;
      });
      setCommentCounts((prev) => {
        const next = new Map(prev);
        for (const a of items) next.set(`article-${a.id}`, a.commentCount ?? 0);
        return next;
      });
    } catch (error) {
      console.error('Failed to fetch articles:', error);
    }
  };

  const fetchSetupLikeData = async (setupId) => {
    try {
      const token = localStorage.getItem('accessToken');
      const countResponse = await fetch(`${API_BASE}/setups/${setupId}/like-count`);
      if (countResponse.ok) {
        const countData = await countResponse.json();
        setLikeCounts((prev) => new Map(prev).set(`setup-${setupId}`, countData.likeCount));
      }

      // Check if current user liked it
      if (token) {
        // We could add an endpoint to check if user liked this, for now we'll rely on the toggle to update
      }
    } catch (error) {
      console.error('Failed to fetch like data:', error);
    }
  };

  const fetchArticleLikeData = async (articleId) => {
    try {
      const token = localStorage.getItem('accessToken');
      const countResponse = await fetch(`${API_BASE}/articles/${articleId}/like-count`);
      if (countResponse.ok) {
        const countData = await countResponse.json();
        setLikeCounts((prev) => new Map(prev).set(`article-${articleId}`, countData.likeCount));
      }
    } catch (error) {
      console.error('Failed to fetch like data:', error);
    }
  };

  const fetchSetupCommentCount = async (setupId) => {
    try {
      const response = await fetch(`${API_BASE}/setups/${setupId}/comment-count`);
      if (response.ok) {
        const data = await response.json();
        setCommentCounts((prev) => new Map(prev).set(`setup-${setupId}`, data.commentCount));
      }
    } catch (error) {
      console.error('Failed to fetch comment count:', error);
    }
  };

  const fetchArticleCommentCount = async (articleId) => {
    try {
      const response = await fetch(`${API_BASE}/articles/${articleId}/comment-count`);
      if (response.ok) {
        const data = await response.json();
        setCommentCounts((prev) => new Map(prev).set(`article-${articleId}`, data.commentCount));
      }
    } catch (error) {
      console.error('Failed to fetch comment count:', error);
    }
  };

  const handleCopySetup = (setup) => {
    setSelectedSetupToCopy(setup);
    setCopyModalOpen(true);
  };

  const goToDetail = (path) => {
    sessionStorage.setItem('community:lastState', JSON.stringify({
      scrollY: window.scrollY,
      activeTab,
      page
    }));
    navigate(path, { state: { restore: true } });
  };

  const openArticleDetail = (articleId) => {
    goToDetail(`/article/${articleId}`);
  };

  const openSetupDetail = (setupId) => {
    goToDetail(`/setup/${setupId}`);
  };

  const isInteractiveTarget = (event) => {
    const target = event.target;
    return typeof target?.closest === 'function'
      && Boolean(target.closest('button, a, input, textarea, select'));
  };

  const handleArticleCardClick = (event, articleId) => {
    if (isInteractiveTarget(event)) return;
    openArticleDetail(articleId);
  };

  const handleSetupCardClick = (event, setupId) => {
    if (isInteractiveTarget(event)) return;
    openSetupDetail(setupId);
  };

  const handleArticleCardKeyDown = (event, articleId) => {
    if (isInteractiveTarget(event)) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    openArticleDetail(articleId);
  };

  const handleSetupCardKeyDown = (event, setupId) => {
    if (isInteractiveTarget(event)) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    openSetupDetail(setupId);
  };

  const toggleWishlist = async (setupId, isWishlisted) => {
    if (!user) {
      showError('Please login to save setups');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        showError('Session expired. Please login again.');
        return;
      }

      const response = await fetch(`${API_BASE}/setups/${setupId}/wishlist`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const newWishlist = new Set(wishlist);
        if (isWishlisted) {
          newWishlist.delete(setupId);
        } else {
          newWishlist.add(setupId);
        }
        setWishlist(newWishlist);
      } else if (response.status === 401) {
        showError('Session expired. Please login again.');
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
      } else {
        console.error(`Wishlist error: ${response.status}`, await response.text());
      }
    } catch (error) {
      console.error('Failed to toggle wishlist:', error);
    }
  };

  const toggleLike = async (targetId, targetType) => {
    if (!user) {
      showError('Please login to like');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const endpoint = targetType === 'SETUP'
        ? `/setups/${targetId}/like`
        : `/articles/${targetId}/like`;

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const key = `${targetType.toLowerCase()}-${targetId}`;

        // Update like state
        const newLikes = new Map(likes);
        newLikes.set(key, data.isLiked);
        setLikes(newLikes);
        setStoredLike(targetType, targetId, data.isLiked, user);

        // Update like count
        const newCounts = new Map(likeCounts);
        newCounts.set(key, data.likeCount);
        setLikeCounts(newCounts);
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const getLikeCount = (targetId, targetType) => {
    const key = `${targetType.toLowerCase()}-${targetId}`;
    return likeCounts.get(key) || 0;
  };

  const getCommentCount = (targetId, targetType) => {
    const key = `${targetType.toLowerCase()}-${targetId}`;
    return commentCounts.get(key) || 0;
  };

  const isLiked = (targetId, targetType) => {
    const key = `${targetType.toLowerCase()}-${targetId}`;
    return likes.get(key) || false;
  };

  return (
    <div className="community-container">
      {/* SIDEBAR */}
      <div className="community-sidebar">
        <div
          className="sidebar-section user-profile"
          onClick={() => navigate('/profile')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/profile'); } }}
          role="button"
          tabIndex={0}
          style={{ cursor: 'pointer' }}
        >
          <div className="user-avatar" style={{ overflow: 'hidden', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} onError={e => e.target.style.display='none'} />
            ) : (
              user?.username?.charAt(0)?.toUpperCase() || 'U'
            )}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.username || 'User'}</div>
            <div className="user-stats">
              <span className="stat-item">{userStats.posts} <small>Postări</small></span>
              <span className="stat-item">{userStats.likes} <small>Like-uri</small></span>
            </div>
          </div>
        </div>

        <button className="sidebar-btn add-new" onClick={() => setNewPostModalOpen(true)}>+ Postare noua</button>

        <div className="sidebar-links">
          <button className="sidebar-link" onClick={() => navigate('/profile?tab=wishlist')}>
            <Bookmark size={16} /> Wishlist
          </button>
          <button className="sidebar-link" onClick={() => navigate('/profile?tab=myarticles')}>
            <FileText size={16} /> My Articles
          </button>
          <button className="sidebar-link" onClick={() => navigate('/profile?tab=mysetups')}>
            <Settings size={16} /> My Setups
          </button>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-title">Pret</div>
          <div className="price-range">
            <span>0</span>
            <input
              type="range"
              min="0"
              max="1000"
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              className="range-input"
            />
            <span>{priceRange}</span>
          </div>
          <input type="text" placeholder="Introduceti categoria produsului" className="sidebar-input" />
        </div>

        <div className="sidebar-section">
          <div className="sidebar-title">Device Type</div>
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input type="checkbox" /> Bec
            </label>
            <label className="checkbox-label">
              <input type="checkbox" defaultChecked /> Masina de spalat
            </label>
            <label className="checkbox-label">
              <input type="checkbox" /> Mixer
            </label>
            <label className="checkbox-label">
              <input type="checkbox" /> Other Devices
            </label>
          </div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-title">Protocol</div>
          <select className="sidebar-select">
            <option>Select Protocol</option>
            <option>Zigbee</option>
            <option>Z-Wave</option>
            <option>Wi-Fi</option>
            <option>Matter</option>
          </select>
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input type="checkbox" /> Zigbee
            </label>
            <label className="checkbox-label">
              <input type="checkbox" defaultChecked /> Z-Wave
            </label>
            <label className="checkbox-label">
              <input type="checkbox" /> Wi-Fi
            </label>
            <label className="checkbox-label">
              <input type="checkbox" /> Matter
            </label>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="community-main">
        <h1 className="community-title">Community</h1>

        {/* CONTROLS - Search + Tabs on same line */}
        <div className="community-controls">
          <button className="filters-btn" onClick={() => setDrawerOpen(true)}>
            ☰ Filters
          </button>
          <div className="search-box">
            {/*
              Wired to fuzzyFilter (utils/fuzzySearch.js). Empty input falls
              through and returns the full list untouched; non-empty input
              is matched as a fuzzy subsequence against the per-tab fields
              listed in the useMemo blocks below, then sorted best-first.
            */}
            <input
              type="text"
              placeholder="Search setups and articles (fuzzy — typos OK)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="tabs">
            <button
              className={`tab ${activeTab === 'setups' ? 'active' : ''}`}
              onClick={() => setActiveTab('setups')}
            >
              Setups
            </button>
            <button
              className={`tab ${activeTab === 'articles' ? 'active' : ''}`}
              onClick={() => setActiveTab('articles')}
            >
              Articles
            </button>
          </div>
        </div>

        {/* CONTENT - Slider effect */}
        <div className="content-slider">
          <div className={`content-pane ${activeTab === 'setups' ? 'active' : ''}`}>
            {loading ? (
              <div className="loading">Loading setups...</div>
            ) : filteredSetups.length > 0 ? (
              <div className="setups-grid">
                {filteredSetups.map((setup) => (
                  <div
                    key={setup.id}
                    className="setup-card clickable-card"
                    onClick={(event) => handleSetupCardClick(event, setup.id)}
                    onKeyDown={(event) => handleSetupCardKeyDown(event, setup.id)}
                    role="link"
                    tabIndex={0}
                    aria-label={`Open setup ${setup.name}`}
                  >
                    <div className="setup-header">
                      <div className="user-info-compact">
                        <div className="avatar-small" style={{ overflow: 'hidden', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {setup.user?.avatarUrl ? (
                            <img src={setup.user.avatarUrl} alt={setup.user?.username}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                              onError={e => e.target.style.display = 'none'} />
                          ) : (
                            setup.user?.username?.[0]?.toUpperCase() || 'U'
                          )}
                        </div>
                        <div>
                          <div className="setup-author">
                            {setup.user?.username || 'User'}
                          </div>
                          <div className="setup-date">
                            {formatDate(setup.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div className="setup-actions">
                        <Copy size={18} onClick={() => handleCopySetup(setup)} className="action-icon" />
                        <Bookmark
                          size={18}
                          className={`action-icon ${wishlist.has(setup.id) ? 'filled' : ''}`}
                          onClick={() => toggleWishlist(setup.id, wishlist.has(setup.id))}
                        />
                      </div>
                    </div>

                    <h3 className="setup-title">{setup.name}</h3>
                    <p className="setup-description">{setup.description}</p>

                    <div className="setup-image-placeholder">
                      <svg viewBox="0 0 200 150" className="placeholder-icon">
                        <rect width="200" height="150" fill="currentColor" />
                        <path
                          d="M80 60 L120 90 L100 120 L60 90 Z"
                          fill="white"
                          opacity="0.3"
                        />
                        <circle cx="90" cy="70" r="5" fill="white" opacity="0.3" />
                      </svg>
                    </div>

                    <div className="setup-footer">
                      <div className="footer-actions">
                        <button
                          className={`footer-icon-btn ${isLiked(setup.id, 'SETUP') ? 'liked' : ''}`}
                          onClick={() => toggleLike(setup.id, 'SETUP')}
                          title="Like"
                        >
                          <Heart size={20} fill={isLiked(setup.id, 'SETUP') ? '#e74c3c' : 'none'} color={isLiked(setup.id, 'SETUP') ? '#e74c3c' : 'currentColor'} />
                          <span className="count">{getLikeCount(setup.id, 'SETUP')}</span>
                        </button>
                        <button
                          className="footer-icon-btn"
                          onClick={() => openSetupDetail(setup.id)}
                          title="Comments"
                        >
                          <MessageCircle size={20} />
                          <span className="count">{getCommentCount(setup.id, 'SETUP')}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">No setups found</div>
            )}
          </div>

          <div className={`content-pane ${activeTab === 'articles' ? 'active' : ''}`}>
            {/* Tag filter chips — only render when there are tags to filter by */}
            {availableTags.length > 0 && (
              <div className="tag-filter-bar">
                <span className="tag-filter-label">Filter by tag:</span>
                <button
                  className={`tag-filter-chip ${activeTagFilter === null ? 'active' : ''}`}
                  onClick={() => setActiveTagFilter(null)}
                >
                  All
                </button>
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    className={`tag-filter-chip ${activeTagFilter === tag ? 'active' : ''}`}
                    onClick={() => setActiveTagFilter(activeTagFilter === tag ? null : tag)}
                  >
                    {tag}
                    {activeTagFilter === tag && <X size={12} style={{ marginLeft: 4 }} />}
                  </button>
                ))}
              </div>
            )}

            {loading ? (
              <div className="loading">Loading articles...</div>
            ) : filteredArticles.length > 0 ? (
              <div className="articles-grid">
                {filteredArticles.map((article) => (
                  <div
                    key={article.id}
                    className="article-card clickable-card"
                    onClick={(event) => handleArticleCardClick(event, article.id)}
                    onKeyDown={(event) => handleArticleCardKeyDown(event, article.id)}
                    role="link"
                    tabIndex={0}
                    aria-label={`Open article ${article.title}`}
                  >
                    <div className="article-header">
                      <div className="user-info-compact">
                        <div className="avatar-small" style={{ overflow: 'hidden', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {article.authorAvatarUrl ? (
                            <img src={article.authorAvatarUrl} alt={article.authorUsername}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                              onError={e => e.target.style.display = 'none'} />
                          ) : (
                            article.authorUsername?.[0]?.toUpperCase() || 'U'
                          )}
                        </div>
                        <div>
                          <div className="setup-author">
                            {article.authorUsername || 'User'}
                          </div>
                          <div className="setup-date">
                            {formatDate(article.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <h3 className="article-title">{article.title}</h3>

                    {article.imageUrl && (
                      <div style={{ margin: '8px 0', borderRadius: '8px', overflow: 'hidden', maxHeight: '180px' }}>
                        <img
                          src={article.imageUrl}
                          alt={article.title}
                          style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }}
                          onError={e => e.target.style.display = 'none'}
                        />
                      </div>
                    )}

                    <p className="article-content">{article.content}</p>

                    {article.tags && article.tags.length > 0 && (
                      <div className="article-tags">
                        {article.tags.map((tag) => (
                          <button
                            key={tag}
                            className={`article-tag ${activeTagFilter === tag ? 'active' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTagFilter(activeTagFilter === tag ? null : tag);
                            }}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="article-footer">
                      <div className="footer-actions">
                        <button
                          className={`footer-icon-btn ${isLiked(article.id, 'ARTICLE') ? 'liked' : ''}`}
                          onClick={() => toggleLike(article.id, 'ARTICLE')}
                          title="Like"
                        >
                          <Heart size={20} fill={isLiked(article.id, 'ARTICLE') ? '#e74c3c' : 'none'} color={isLiked(article.id, 'ARTICLE') ? '#e74c3c' : 'currentColor'} />
                          <span className="count">{getLikeCount(article.id, 'ARTICLE')}</span>
                        </button>
                        <button
                          className="footer-icon-btn"
                          onClick={() => openArticleDetail(article.id)}
                          title="Comments"
                        >
                          <MessageCircle size={20} />
                          <span className="count">{getCommentCount(article.id, 'ARTICLE')}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                {activeTagFilter
                  ? `No articles tagged "${activeTagFilter}". `
                  : 'No articles found. '}
                {activeTagFilter && (
                  <button
                    className="empty-clear-filter"
                    onClick={() => setActiveTagFilter(null)}
                  >
                    Clear filter
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="community-footer">
        <div className="footer-links">
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
          <a href="#privacy">Privacy Policy</a>
        </div>
        <p className="footer-text">©2026 SmartHouse-Builder. All rights reserved.</p>
      </footer>
      {drawerOpen && (
          <div className="drawer-overlay" onClick={() => setDrawerOpen(false)}>
            <div className="drawer-panel" onClick={e => e.stopPropagation()}>
              <button className="drawer-close" onClick={() => setDrawerOpen(false)}>✕</button>

              <div className="sidebar-section user-profile" onClick={() => { navigate('/profile'); setDrawerOpen(false); }}>
                <div className="user-avatar" style={{ overflow: 'hidden', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} onError={e => e.target.style.display='none'} />
                  ) : (
                    user?.username?.charAt(0)?.toUpperCase() || 'U'
                  )}
                </div>
                <div className="user-info">
                  <div className="user-name">{user?.username || 'User'}</div>
                  <div className="user-stats">
                    <span className="stat-item">{userStats.posts} <small>Postări</small></span>
                    <span className="stat-item">{userStats.likes} <small>Like-uri</small></span>
                  </div>
                </div>
              </div>

              <button className="sidebar-btn" onClick={() => { setDrawerOpen(false); setNewPostModalOpen(true); }}>+ Postare noua</button>

              <div className="sidebar-links">
                <button className="sidebar-link" onClick={() => { navigate('/profile?tab=wishlist'); setDrawerOpen(false); }}>
                  <Bookmark size={16} /> Wishlist
                </button>
                <button className="sidebar-link" onClick={() => { navigate('/profile?tab=myarticles'); setDrawerOpen(false); }}>
                  <FileText size={16} /> My Articles
                </button>
                <button className="sidebar-link" onClick={() => { navigate('/profile?tab=mysetups'); setDrawerOpen(false); }}>
                  <Settings size={16} /> My Setups
                </button>
              </div>

              <div className="sidebar-section">
                <div className="sidebar-title">Pret</div>
                <div className="price-range">
                  <span>0</span>
                  <input type="range" min="0" max="1000" value={priceRange}
                         onChange={(e) => setPriceRange(e.target.value)} className="range-input" />
                  <span>{priceRange}</span>
                </div>
                <input type="text" placeholder="Introduceti categoria produsului" className="sidebar-input" />
              </div>

              <div className="sidebar-section">
                <div className="sidebar-title">Device Type</div>
                <div className="checkbox-group">
                  <label className="checkbox-label"><input type="checkbox" /> Bec</label>
                  <label className="checkbox-label"><input type="checkbox" defaultChecked /> Masina de spalat</label>
                  <label className="checkbox-label"><input type="checkbox" /> Mixer</label>
                  <label className="checkbox-label"><input type="checkbox" /> Other Devices</label>
                </div>
              </div>

              <div className="sidebar-section">
                <div className="sidebar-title">Protocol</div>
                <select className="sidebar-select">
                  <option>Select Protocol</option>
                  <option>Zigbee</option>
                  <option>Z-Wave</option>
                  <option>Wi-Fi</option>
                  <option>Matter</option>
                </select>
                <div className="checkbox-group">
                  <label className="checkbox-label"><input type="checkbox" /> Zigbee</label>
                  <label className="checkbox-label"><input type="checkbox" defaultChecked /> Z-Wave</label>
                  <label className="checkbox-label"><input type="checkbox" /> Wi-Fi</label>
                  <label className="checkbox-label"><input type="checkbox" /> Matter</label>
                </div>
              </div>
            </div>
          </div>
      )}
      {/* COPY SETUP MODAL */}
      <CopySetupModal
        isOpen={copyModalOpen}
        onClose={() => setCopyModalOpen(false)}
        originalSetup={selectedSetupToCopy}
        onSuccess={() => {
          // Modal already shows success toast and closes
          // Optionally refetch setups here if needed
        }}
      />

      {/* NEW POST MODAL — asks Setup vs Article */}
      <NewPostModal
        isOpen={newPostModalOpen}
        darkMode={darkMode}
        onClose={() => setNewPostModalOpen(false)}
        onChooseSetup={() => {
          setNewPostModalOpen(false);
          if (!user) {
            navigate('/login', { state: { from: '/builder', message: 'Please sign in to create a setup.' } });
            return;
          }
          navigate('/builder');
        }}
        onChooseArticle={() => {
          setNewPostModalOpen(false);
          if (!user) {
            navigate('/login', { state: { from: '/articles/create', message: 'Please sign in to write an article.' } });
            return;
          }
          navigate('/articles/create');
        }}
      />
    </div>
  );
}