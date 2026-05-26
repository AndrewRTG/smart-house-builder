import { useState, useEffect, useMemo } from 'react';
import {
  Bookmark,
  Copy,
  MessageCircle,
  FileText,
  Settings,
  Heart,
  X,
  Clock,
  TrendingUp,
  LayoutGrid,
  Plus,
  Filter,
  History,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import CopySetupModal from '../components/CopySetupModal';
import NewPostModal from '../components/NewPostModal';
import { useError } from '../context/ErrorContext';
import { getCurrentUser } from '../utils/currentUser';
import { fuzzyFilter } from '../utils/fuzzySearch';
import { getStoredLikedItems, setStoredLike } from '../utils/likedItemsStorage';
import '../styles/CommunityPage.css';
import { COMMUNITY_PAGE_SIZE } from '../config/pagination';
import Pagination from '../components/Pagination';

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

/**
 * Sidebar contents — extracted into a helper so the desktop sidebar and the
 * mobile drawer render the EXACT same UI with the same wiring. Everything
 * here is contextual: the "Sort" pills and the tab-specific quick-filter
 * sections switch based on `activeTab`. Hardcoded "device type" and "price"
 * checkboxes that didn't actually filter anything were removed.
 */
function renderSidebar({
  user,
  userStats,
  navigate,
  onNewPost,
  activeTab,
  sortMode,
  setSortMode,
  setupFilter,
  setSetupFilter,
  availableTags,
  activeTagFilter,
  setActiveTagFilter,
}) {
  return (
    <>
      <button
        type="button"
        className="sidebar-section user-profile"
        onClick={() => navigate('/profile')}
      >
        <div className="user-avatar" style={{ overflow: 'hidden', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt="avatar"
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            user?.username?.charAt(0)?.toUpperCase() || 'U'
          )}
        </div>
        <div className="user-info">
          <div className="user-name">{user?.username || 'Sign in'}</div>
          <div className="user-stats">
            <span className="stat-item">{userStats.posts} <small>Posts</small></span>
            <span className="stat-item">{userStats.likes} <small>Likes</small></span>
          </div>
        </div>
      </button>

      <button className="sidebar-btn add-new" onClick={onNewPost}>
        <Plus size={16} /> New Post
      </button>

      <div className="sidebar-section">
        <div className="sidebar-title">Sort</div>
        <div className="pill-row pill-row-equal">
          <button
            type="button"
            className={`pill ${sortMode === 'newest' ? 'active' : ''}`}
            onClick={() => setSortMode('newest')}
            aria-pressed={sortMode === 'newest'}
          >
            <Clock size={14} /> Newest
          </button>
          <button
            type="button"
            className={`pill ${sortMode === 'oldest' ? 'active' : ''}`}
            onClick={() => setSortMode('oldest')}
            aria-pressed={sortMode === 'oldest'}
          >
            <History size={14} /> Oldest
          </button>
          <button
            type="button"
            className={`pill ${sortMode === 'mostLiked' ? 'active' : ''}`}
            onClick={() => setSortMode('mostLiked')}
            aria-pressed={sortMode === 'mostLiked'}
          >
            <TrendingUp size={14} /> Most Liked
          </button>
        </div>
      </div>

      {activeTab === 'setups' && (
        <div className="sidebar-section">
          <div className="sidebar-title">Filter setups</div>
          <div className="pill-row pill-row-equal">
            <button
              type="button"
              className={`pill ${setupFilter === 'all' ? 'active' : ''}`}
              onClick={() => setSetupFilter('all')}
              aria-pressed={setupFilter === 'all'}
            >
              <LayoutGrid size={14} /> All
            </button>
            <button
              type="button"
              className={`pill ${setupFilter === 'saved' ? 'active' : ''}`}
              onClick={() => setSetupFilter('saved')}
              aria-pressed={setupFilter === 'saved'}
            >
              <Bookmark size={14} /> Saved
            </button>
          </div>
        </div>
      )}

      {activeTab === 'articles' && availableTags.length > 0 && (
        <div className="sidebar-section">
          <div className="sidebar-title">Filter by tag</div>
          <div className="pill-row pill-row-wrap">
            <button
              type="button"
              className={`pill ${activeTagFilter === null ? 'active' : ''}`}
              onClick={() => setActiveTagFilter(null)}
            >
              All
            </button>
            {availableTags.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`pill ${activeTagFilter === tag ? 'active' : ''}`}
                onClick={() => setActiveTagFilter(activeTagFilter === tag ? null : tag)}
                aria-pressed={activeTagFilter === tag}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="sidebar-section">
        <div className="sidebar-title">My library</div>
        <div className="sidebar-links">
          <button className="sidebar-link" onClick={() => navigate('/profile?tab=mysetups')}>
            <Settings size={16} /> My Setups
          </button>
          <button className="sidebar-link" onClick={() => navigate('/profile?tab=myarticles')}>
            <FileText size={16} /> My Articles
          </button>
          <button className="sidebar-link" onClick={() => navigate('/profile?tab=wishlist')}>
            <Bookmark size={16} /> Wishlist
          </button>
        </div>
      </div>
    </>
  );
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
  const PAGE_SIZE = COMMUNITY_PAGE_SIZE;

  const [setupPage, setSetupPage] = useState(0);
  const [articlePage, setArticlePage] = useState(0);
  const [setupTotalPages, setSetupTotalPages] = useState(1);
  const [articleTotalPages, setArticleTotalPages] = useState(1);
  const [user, setUser] = useState(null);
  const [userStats, setUserStats] = useState({ posts: 0, likes: 0 });
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [selectedSetupToCopy, setSelectedSetupToCopy] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [newPostModalOpen, setNewPostModalOpen] = useState(false);
  const [activeTagFilter, setActiveTagFilter] = useState(null);
  const [sortMode, setSortMode] = useState('newest'); // 'newest' | 'mostLiked'
  const [setupFilter, setSetupFilter] = useState('all'); // 'all' | 'saved'


  const API_BASE = 'http://localhost:20025/api/v1';

  // ---- Fuzzy search ------------------------------------------------------
  // useMemo so we don't re-score the entire list on every unrelated re-render
  // (e.g. when a like count changes). Re-runs only when the data or the
  // query change.
  // For setups we fuzzy-match against name + description + author username.
  // For articles we match against title + content + author username.
  // Stable sort comparator — newest-first uses createdAt, mostLiked uses
  // the likeCount the backend ships inline on each list response. We sort
  // AFTER the fuzzy filter so search results stay in score-order when the
  // user is searching (sort only kicks in for the unfiltered list).
  const sortedSetups = useMemo(() => {
    let list;
    if (sortMode === 'mostLiked') {
      list = [...setups].sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
    } else if (sortMode === 'oldest') {
      list = [...setups].sort((a, b) => {
        const da = new Date(a.createdAt || 0).getTime();
        const db = new Date(b.createdAt || 0).getTime();
        return da - db;
      });
    } else {
      list = [...setups].sort((a, b) => {
        const da = new Date(a.createdAt || 0).getTime();
        const db = new Date(b.createdAt || 0).getTime();
        return db - da;
      });
    }
    return setupFilter === 'saved'
      ? list.filter((s) => wishlist.has(s.id))
      : list;
  }, [setups, sortMode, setupFilter, wishlist]);

  const filteredSetups = useMemo(
    () => fuzzyFilter(sortedSetups, searchQuery, (s) => [
      s.name, s.description, s.authorUsername,
    ]),
    [sortedSetups, searchQuery]
  );

  const sortedArticles = useMemo(() => {
    if (sortMode === 'mostLiked') {
      return [...articles].sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
    }
    if (sortMode === 'oldest') {
      return [...articles].sort((a, b) => {
        const da = new Date(a.createdAt || 0).getTime();
        const db = new Date(b.createdAt || 0).getTime();
        return da - db;
      });
    }
    return [...articles].sort((a, b) => {
      const da = new Date(a.createdAt || 0).getTime();
      const db = new Date(b.createdAt || 0).getTime();
      return db - da;
    });
  }, [articles, sortMode]);

  const filteredArticles = useMemo(() => {
    const byTag = activeTagFilter
      ? sortedArticles.filter((a) =>
          (a.tags || []).some((t) => t.toLowerCase() === activeTagFilter.toLowerCase())
        )
      : sortedArticles;
    return fuzzyFilter(byTag, searchQuery, (a) => [
      a.title, a.content, a.authorUsername
    ]);
  }, [sortedArticles, searchQuery, activeTagFilter]);

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
        const {
          scrollY,
          activeTab: savedTab,
          setupPage: savedSetupPage,
          articlePage: savedArticlePage
        } = JSON.parse(saved);

        if (savedTab) setActiveTab(savedTab);
        if (savedSetupPage !== undefined) setSetupPage(savedSetupPage);
        if (savedArticlePage !== undefined) setArticlePage(savedArticlePage);
        // scroll after next paint so content has rendered
        requestAnimationFrame(() => {
          setTimeout(() => window.scrollTo(0, scrollY), 50);
        });
      }
    }
  }, [location]);

  useEffect(() => {
    fetchCurrentUser();
    const onAuthChange = (e) => {
      const newAvatar = e?.detail?.avatarUrl;
      if (newAvatar) {
        setUser((prev) => (prev ? { ...prev, avatarUrl: newAvatar } : prev));
        setSetups((prev) => prev.map((s) =>
          user && s.authorId === user.id ? { ...s, authorAvatarUrl: newAvatar } : s
        ));
        setArticles((prev) => prev.map((a) =>
          user && a.authorId === user.id ? { ...a, authorAvatarUrl: newAvatar } : a
        ));
      }
      fetchCurrentUser();
      fetchSetups();
      fetchArticles();
    };
    window.addEventListener('auth-change', onAuthChange);
    return () => window.removeEventListener('auth-change', onAuthChange);
  }, []);

  const isSetupFilterActive = Boolean(
    searchQuery || activeTagFilter || setupFilter === 'saved' || sortMode === 'mostLiked'
  );
  const isArticleFilterActive = Boolean(
    searchQuery || activeTagFilter || sortMode === 'mostLiked'
  );

  useEffect(() => {
    fetchSetups();
  }, [setupPage, isSetupFilterActive, sortMode]);

  useEffect(() => {
    fetchArticles();
  }, [articlePage, isArticleFilterActive, sortMode]);

  useEffect(() => {
    if (!user) {
      setLikes(new Map());
      setWishlist(new Set());
      return;
    }

    const storedLikes = getStoredLikedItems(user);
    setLikes(new Map(Object.entries(storedLikes)));
    fetchMyWishlist();
  }, [user]);

  const fetchMyWishlist = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      const res = await fetch(`${API_BASE}/wishlists?page=0&size=200`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const items = data.content || data || [];
      const ids = new Set(
        items
          .map((it) => it?.setupId ?? it?.setup?.id ?? it?.id)
          .filter((v) => v != null)
      );
      setWishlist(ids);
    } catch (e) {
      console.error('Failed to load wishlist:', e);
    }
  };

  const fetchCurrentUser = async () => {
    // Use the shared cache instead of hitting /auth/me on every page mount.
    // Multiple components calling this within ~60s collapse to one network
    // request, which prevented the rate limiter from blanking us out.
    const data = await getCurrentUser();
    if (data) {
      setUser(data);
      fetchUserStats();
    } else {
      setUser(null);
      setUserStats({ posts: 0, likes: 0 });
    }
  };

  // Real Posts + Likes counts for the sidebar user card.
  //
  // "Posts" = community-visible content the user authored = published setups
  // + articles. Drafts are intentionally excluded because they aren't
  // visible to the community; the sidebar represents the user's footprint
  // on the public feed.
  //
  // "Likes" = total likes received across all of the user's content (both
  // setups and articles). Uses the `likeCount` field the backend already
  // ships inline on each list response, so no extra round trips per item.
  //
  // TODO (Phase 4 follow-up): add a dedicated `GET /api/v1/users/me/stats`
  // endpoint so this becomes one cached round trip instead of two list
  // fetches. Fine for now since size=200 covers any realistic case.
  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setUserStats({ posts: 0, likes: 0 });
        return;
      }
      const [pubRes, artRes] = await Promise.all([
        fetch(`${API_BASE}/setups/user/published?page=0&size=200`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/articles/user/my-articles`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      const publishedSetups = pubRes.ok ? (await pubRes.json()).content || [] : [];
      const myArticles = artRes.ok ? (await artRes.json()) || [] : [];

      const setupLikes = publishedSetups.reduce((sum, s) => sum + (s.likeCount || 0), 0);
      const articleLikes = myArticles.reduce((sum, a) => sum + (a.likeCount || 0), 0);

      setUserStats({
        posts: publishedSetups.length + myArticles.length,
        likes: setupLikes + articleLikes,
      });
    } catch (err) {
      console.error('Failed to compute user stats:', err);
      setUserStats({ posts: 0, likes: 0 });
    }
  };

  const fetchSetups = async () => {
    try {
      setLoading(true);
      const effectivePage = isSetupFilterActive ? 0 : setupPage;
      const effectiveSize = isSetupFilterActive ? 1000 : PAGE_SIZE;
      // Server-side sort so newest/oldest work across the entire feed, not
      // just within the current page. mostLiked stays client-side because
      // likeCount isn't a column on Setup (it's a derived COUNT query).
      const sortParam = sortMode === 'oldest'
        ? '&sort=createdAt,asc'
        : sortMode === 'newest'
          ? '&sort=createdAt,desc'
          : '';
      const response = await fetch(`${API_BASE}/setups?page=${effectivePage}&size=${effectiveSize}${sortParam}`);
      const data = await response.json();
      const items = data.content || [];

      setSetups(items);
      setSetupTotalPages(data.totalPages || 1);

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
      const effectivePage = isArticleFilterActive ? 0 : articlePage;
      const effectiveSize = isArticleFilterActive ? 1000 : PAGE_SIZE;
      const sortDir = sortMode === 'oldest' ? 'asc' : 'desc';
      const response = await fetch(`${API_BASE}/articles?page=${effectivePage}&size=${effectiveSize}&sortField=createdAt&sortDir=${sortDir}`);
      const data = await response.json();
      const items = data.content || [];

      setArticles(items);
      setArticleTotalPages(data.totalPages || 1);

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
      setupPage,
      articlePage
    }));
    navigate(path, { state: { restore: true } });
  };

  const openArticleDetail = (articleId) => {
    goToDetail(`/article/${articleId}`);
  };

  const openSetupDetail = (setupId) => {
    goToDetail(`/setup/${setupId}`);
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

  const renderPagination = (currentPage, totalPages, onPageChange) => {
    if (totalPages <= 1) return null;

    return (
        <div className="community-pagination">
          <button
              type="button"
              className="pagination-btn"
              disabled={currentPage === 0}
              onClick={() => onPageChange(currentPage - 1)}
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, index) => (
              <button
                  key={index}
                  type="button"
                  className={`pagination-btn ${currentPage === index ? 'active' : ''}`}
                  onClick={() => onPageChange(index)}
              >
                {index + 1}
              </button>
          ))}

          <button
              type="button"
              className="pagination-btn"
              disabled={currentPage >= totalPages - 1}
              onClick={() => onPageChange(currentPage + 1)}
          >
            Next
          </button>
        </div>
    );
  };

  return (
    <div className="community-container">
      {/* SIDEBAR */}
      <div className="community-sidebar">
        {renderSidebar({
          user,
          userStats,
          navigate,
          onNewPost: () => setNewPostModalOpen(true),
          activeTab,
          sortMode,
          setSortMode,
          setupFilter,
          setSetupFilter,
          availableTags,
          activeTagFilter,
          setActiveTagFilter,
        })}
      </div>

      {/* MAIN CONTENT */}
      <div className="community-main">
        <h1 className="community-title">Community</h1>

        {/* CONTROLS - Search + Tabs on same line */}
        <div className="community-controls">
          <button className="filters-btn" onClick={() => setDrawerOpen(true)}>
            <Filter size={16} /> Filters
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
                    <>
              <div className="setups-grid">
                {filteredSetups.map((setup) => (
                  <div key={setup.id} className="setup-card">
                    <div className="setup-header">
                      <div className="user-info-compact">
                        <div className="avatar-small" style={{ overflow: 'hidden', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {setup.authorAvatarUrl ? (
                            <img src={setup.authorAvatarUrl} alt={setup.authorUsername}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                              onError={e => e.target.style.display = 'none'} />
                          ) : (
                            setup.authorUsername?.[0]?.toUpperCase() || 'U'
                          )}
                        </div>
                        <div>
                          <div className="setup-author">
                            {setup.authorUsername || 'User'}
                          </div>
                          <div className="setup-date">
                            {formatDate(setup.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div className="setup-actions">
                        <button
                          type="button"
                          className="card-icon-btn"
                          onClick={() => handleCopySetup(setup)}
                          title="Copy this setup"
                          aria-label="Copy setup"
                        >
                          <Copy size={18} />
                        </button>
                        <button
                          type="button"
                          className={`card-icon-btn ${wishlist.has(setup.id) ? 'saved' : ''}`}
                          onClick={() => toggleWishlist(setup.id, wishlist.has(setup.id))}
                          title={wishlist.has(setup.id) ? 'Remove from wishlist' : 'Save to wishlist'}
                          aria-label={wishlist.has(setup.id) ? 'Remove from wishlist' : 'Save to wishlist'}
                          aria-pressed={wishlist.has(setup.id)}
                        >
                          <Bookmark size={18} fill={wishlist.has(setup.id) ? 'currentColor' : 'none'} />
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="setup-title-btn"
                      onClick={() => openSetupDetail(setup.id)}
                    >
                      <h3 className="setup-title">{setup.name}</h3>
                    </button>
                    <p className="setup-description">{setup.description}</p>

                    <button
                      type="button"
                      className="setup-image-placeholder"
                      onClick={() => openSetupDetail(setup.id)}
                      style={setup.thumbnailUrl ? { padding: 8, overflow: 'hidden', cursor: 'pointer', border: 'none', background: '#1a1a1e', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' } : { cursor: 'pointer', border: 'none' }}
                      title="Vezi detalii"
                    >
                      {setup.thumbnailUrl ? (
                        <img
                          src={setup.thumbnailUrl}
                          alt={setup.name}
                          style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto', objectFit: 'contain', display: 'block' }}
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <svg viewBox="0 0 200 150" className="placeholder-icon">
                          <rect width="200" height="150" fill="currentColor" />
                          <path
                            d="M80 60 L120 90 L100 120 L60 90 Z"
                            fill="white"
                            opacity="0.3"
                          />
                          <circle cx="90" cy="70" r="5" fill="white" opacity="0.3" />
                        </svg>
                      )}
                    </button>

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

                {!isSetupFilterActive && <Pagination currentPage={setupPage} totalPages={setupTotalPages} onPageChange={setSetupPage} />}
                    </>

            ) : (
              <div className="empty-state">No setups found</div>
            )}
          </div>

          <div className={`content-pane ${activeTab === 'articles' ? 'active' : ''}`}>
            {/* Tag filtering moved to sidebar. Keep an inline indicator when a
                tag is active so the user can see (and clear) the current
                filter without scrolling up to the sidebar. */}
            {activeTagFilter && (
              <div className="active-tag-banner">
                <span>Showing: <strong>{activeTagFilter}</strong></span>
                <button
                  type="button"
                  className="active-tag-clear"
                  onClick={() => setActiveTagFilter(null)}
                  aria-label="Clear tag filter"
                >
                  <X size={14} /> Clear
                </button>
              </div>
            )}

            {loading ? (
              <div className="loading">Loading articles...</div>
            ) : filteredArticles.length > 0 ? (
                <>
              <div className="articles-grid">
                {filteredArticles.map((article) => (
                  <div key={article.id} className="article-card">
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

                    <button
                      type="button"
                      className="setup-title-btn"
                      onClick={() => openArticleDetail(article.id)}
                    >
                      <h3 className="article-title">{article.title}</h3>
                    </button>

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
              {!isArticleFilterActive && <Pagination currentPage={articlePage} totalPages={articleTotalPages} onPageChange={setArticlePage} />}
              </>
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
              <button
                className="drawer-close"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close filters"
              >
                <X size={20} />
              </button>
              {renderSidebar({
                user,
                userStats,
                navigate: (path) => { navigate(path); setDrawerOpen(false); },
                onNewPost: () => { setDrawerOpen(false); setNewPostModalOpen(true); },
                activeTab,
                sortMode,
                setSortMode,
                setupFilter,
                setSetupFilter,
                availableTags,
                activeTagFilter,
                setActiveTagFilter: (t) => { setActiveTagFilter(t); setDrawerOpen(false); },
              })}
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