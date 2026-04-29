import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Heart,
  Bookmark,
  CalendarDays,
  Clock3,
  Cpu,
  Layers3,
  ShieldCheck,
  Sparkles,
  Tag,
} from 'lucide-react';
import CommentsSection from '../components/CommentsSection';
import { useError } from '../context/ErrorContext';
import { getCurrentUser } from '../utils/currentUser';
import { getStoredLike, setStoredLike } from '../utils/likedItemsStorage';
import '../styles/DetailPage.css';

const API_BASE = 'http://localhost:20025/api/v1';

const SETUP_TOPIC_MAP = [
  { label: 'Bucatarie', keywords: ['bucatarie', 'kitchen', 'fridge', 'cuptor', 'oven', 'mixer'] },
  { label: 'Living', keywords: ['living', 'sufragerie', 'tv', 'televizor'] },
  { label: 'Dormitor', keywords: ['dormitor', 'bedroom'] },
  { label: 'Baie', keywords: ['baie', 'bathroom'] },
  { label: 'Spalatorie', keywords: ['masina de spalat', 'washing machine', 'laundry'] },
  { label: 'Iluminat', keywords: ['lumina', 'lumini', 'iluminat', 'bec', 'led'] },
  { label: 'Securitate', keywords: ['camera', 'camere', 'senzor', 'alarma', 'lock', 'yale'] },
  { label: 'Climat', keywords: ['termostat', 'temperatura', 'climat', 'aer conditionat', 'ventilatie'] },
  { label: 'Automatizare', keywords: ['automatizare', 'automation', 'routine', 'scenariu'] },
];

function formatDate(dateString, options = {}) {
  if (!dateString) return 'Nespecificat';
  return new Date(dateString).toLocaleDateString('ro-RO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...options,
  });
}

function formatRelativeDate(dateString) {
  if (!dateString) return 'recent';

  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'acum cateva secunde';
  if (seconds < 3600) return `acum ${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `acum ${Math.floor(seconds / 3600)} h`;
  if (seconds < 604800) return `acum ${Math.floor(seconds / 86400)} zile`;

  return formatDate(dateString, { month: 'short' });
}

function splitIntoParagraphs(text = '') {
  const cleanedText = text.trim();
  if (!cleanedText) return [];

  return cleanedText
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean);
}

function buildExcerpt(text = '') {
  const compact = text.replace(/\s+/g, ' ').trim();
  if (!compact) return '';
  if (compact.length <= 180) return compact;
  return `${compact.slice(0, 177).trim()}...`;
}

function estimateReadingTime(text = '') {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 180));
}

function getSetupTopics(setup) {
  const source = `${setup?.name || ''} ${setup?.description || ''}`.toLowerCase();

  return SETUP_TOPIC_MAP.filter(({ keywords }) =>
    keywords.some((keyword) => source.includes(keyword))
  ).map(({ label }) => label);
}

export default function SetupDetailPage({ darkMode }) {
  const { setupId } = useParams();
  const navigate = useNavigate();
  const { showError } = useError();
  // Deep-link from the Activity page: /setups/42?comment=7 means "open setup
  // 42 and scroll to comment 7". CommentsSection reads this prop and handles
  // the scroll/highlight once the comments have actually loaded.
  const [searchParams] = useSearchParams();
  const highlightCommentId = searchParams.get('comment');
  const [setup, setSetup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);

  useEffect(() => {
    fetchSetup();
    fetchCurrentUser();
  }, [setupId]);

  useEffect(() => {
    if (!user) {
      setIsLiked(false);
      return;
    }

    setIsLiked(getStoredLike('SETUP', setupId, user));
  }, [setupId, user]);

  const fetchSetup = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/setups/${setupId}`);
      if (response.ok) {
        const data = await response.json();
        setSetup(data);
        setLikeCount(data.likeCount ?? 0);
        setWishlistCount(data.wishlistCount ?? 0);
        setCommentCount(data.commentCount ?? 0);
      }
    } catch (error) {
      console.error('Failed to fetch setup:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    // Shared cache — see utils/currentUser.js for why.
    const data = await getCurrentUser();
    setUser(data);
  };

  const toggleLike = async () => {
    if (!user) {
      showError('Please login to like');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE}/setups/${setupId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.isLiked);
        setLikeCount(data.likeCount);
        setStoredLike('SETUP', setupId, data.isLiked, user);
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const toggleWishlist = async () => {
    if (!user) {
      showError('Please login to save');
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
        const data = await response.json();
        setIsWishlisted(data.isWishlisted);
        setWishlistCount(data.count ?? data.wishlistCount ?? wishlistCount);
      } else if (response.status === 401) {
        showError('Session expired. Please login again.');
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Failed to toggle wishlist:', error);
    }
  };

  const setupInsights = useMemo(() => {
    if (!setup) return null;

    const detectedTopics = getSetupTopics(setup);
    const deviceCount = setup.deviceIds?.length || 0;
    const descriptionParagraphs = splitIntoParagraphs(setup.description || '');
    const excerpt = buildExcerpt(setup.description || '');
    const readingTime = estimateReadingTime(setup.description || '');
    const hasEdits = Boolean(
      setup.updatedAt
      && setup.createdAt
      && Math.abs(new Date(setup.updatedAt).getTime() - new Date(setup.createdAt).getTime()) > 60 * 1000
    );
    const visibilityLabel = setup.isPublic ? 'Public' : 'Privat';
    const sourceLabel = setup.copiedFromId ? 'Copiat din alt setup' : 'Setup original';
    const statusLabel = setup.status || 'Fara status';

    const displayTags = Array.from(new Set([
      ...detectedTopics,
      visibilityLabel,
      sourceLabel,
      deviceCount > 0 ? `${deviceCount} device${deviceCount === 1 ? '' : '-uri'}` : 'Fara device-uri',
      hasEdits ? 'Actualizat' : null,
      statusLabel,
    ].filter(Boolean))).slice(0, 6);

    return {
      detectedTopics,
      deviceCount,
      descriptionParagraphs,
      excerpt,
      readingTime,
      hasEdits,
      visibilityLabel,
      sourceLabel,
      statusLabel,
      displayTags,
      primaryTopic: detectedTopics[0] || 'Smart home',
    };
  }, [setup]);

  if (loading) {
    return <div className="detail-page"><div className="loading">Loading setup...</div></div>;
  }

  if (!setup) {
    return <div className="detail-page"><div className="error">Setup not found</div></div>;
  }

  return (
    <div className={`detail-page ${darkMode ? 'dark' : 'light'}`}>
      <div className="detail-container article-detail-layout">
        <button className="back-btn" onClick={() => navigate('/community', { state: { restore: true } })}>
          <ArrowLeft size={20} /> Back to Community
        </button>

        <div className="article-detail-grid">
          <article className="setup-detail-card">
            <div className="setup-detail-header">
              <div className="user-info-compact">
                <div className="avatar-small">{setup.authorUsername?.charAt(0)?.toUpperCase() || 'U'}</div>
                <div>
                  <div className="setup-author">{setup.authorUsername || 'User'}</div>
                  <div className="setup-date">
                    Creat {formatRelativeDate(setup.createdAt)}
                    {setupInsights?.hasEdits ? ` | actualizat ${formatRelativeDate(setup.updatedAt)}` : ''}
                  </div>
                </div>
              </div>
              <div className="article-type-pill setup-type-pill">
                <Sparkles size={14} />
                <span>{setupInsights?.primaryTopic || 'Setup'}</span>
              </div>
            </div>

            <div className="setup-detail-body">
              <span className="article-overline">Smart setup</span>
              <h1 className="setup-detail-title">{setup.name}</h1>

              {setupInsights?.excerpt ? (
                <p className="setup-detail-excerpt">{setupInsights.excerpt}</p>
              ) : null}

              <div className="article-stats-row">
                <div className="article-stat-chip">
                  <Heart size={16} />
                  <span>{likeCount} like-uri</span>
                </div>
                <div className="article-stat-chip">
                  <Bookmark size={16} />
                  <span>{wishlistCount} salvate</span>
                </div>
                <div className="article-stat-chip">
                  <Cpu size={16} />
                  <span>{setupInsights?.deviceCount || 0} device-uri</span>
                </div>
                <div className="article-stat-chip">
                  <Clock3 size={16} />
                  <span>{setupInsights?.readingTime || 1} min citire</span>
                </div>
              </div>

              {setupInsights?.displayTags?.length ? (
                <div className="article-tag-list">
                  {setupInsights.displayTags.map((tag) => (
                    <span key={tag} className="article-tag-chip">{tag}</span>
                  ))}
                </div>
              ) : null}

              <div className="setup-hero-panel">
                <div className="setup-image-placeholder">
                  <svg viewBox="0 0 400 300" className="placeholder-icon">
                    <rect width="400" height="300" fill="currentColor" />
                    <path d="M160 120 L240 180 L200 240 L120 180 Z" fill="white" opacity="0.3" />
                    <circle cx="180" cy="140" r="10" fill="white" opacity="0.3" />
                  </svg>
                </div>
                <div className="setup-hero-copy">
                  <div className="setup-highlight-card">
                    <Layers3 size={18} />
                    <div>
                      <span className="setup-highlight-label">Structura setup-ului</span>
                      <strong>{setupInsights?.sourceLabel || 'Setup original'}</strong>
                    </div>
                  </div>
                  <div className="setup-highlight-card">
                    <ShieldCheck size={18} />
                    <div>
                      <span className="setup-highlight-label">Vizibilitate</span>
                      <strong>{setupInsights?.visibilityLabel || 'Nespecificat'}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="article-content-panel">
                {setupInsights?.descriptionParagraphs?.length ? (
                  setupInsights.descriptionParagraphs.map((paragraph, index) => (
                    <p key={`${setup.id}-paragraph-${index}`} className="article-paragraph">
                      {paragraph}
                    </p>
                  ))
                ) : (
                  <p className="article-paragraph">{setup.description || 'Acest setup nu are descriere inca.'}</p>
                )}
              </div>
            </div>

            <div className="setup-detail-footer">
              <div className="setup-detail-actions">
                <button className={`action-btn ${isLiked ? 'liked' : ''}`} onClick={toggleLike}>
                  <Heart size={18} fill={isLiked ? '#e74c3c' : 'none'} color={isLiked ? '#e74c3c' : 'currentColor'} />
                  <span>{likeCount}</span>
                </button>
                <button className={`action-btn ${isWishlisted ? 'saved' : ''}`} onClick={toggleWishlist}>
                  <Bookmark size={18} fill={isWishlisted ? '#5092ce' : 'none'} color={isWishlisted ? '#5092ce' : 'currentColor'} />
                  <span>{wishlistCount}</span>
                </button>
              </div>

              <div className="article-footer-meta">
                <CalendarDays size={16} />
                <span>{formatDate(setup.createdAt)}</span>
              </div>
            </div>
          </article>

          <aside className="article-side-stack">
            <div className="article-side-card">
              <h2 className="article-side-title">Informatii rapide</h2>
              <div className="article-side-list">
                <div className="article-side-row">
                  <span className="article-side-label">Categorie</span>
                  <span className="article-side-value">{setupInsights?.primaryTopic || 'Smart home'}</span>
                </div>
                <div className="article-side-row">
                  <span className="article-side-label">Status</span>
                  <span className="article-side-value">{setupInsights?.statusLabel || 'Fara status'}</span>
                </div>
                <div className="article-side-row">
                  <span className="article-side-label">Device-uri</span>
                  <span className="article-side-value">{setupInsights?.deviceCount || 0}</span>
                </div>
                <div className="article-side-row">
                  <span className="article-side-label">Vizibilitate</span>
                  <span className="article-side-value">{setupInsights?.visibilityLabel || 'Nespecificat'}</span>
                </div>
                <div className="article-side-row">
                  <span className="article-side-label">Sursa</span>
                  <span className="article-side-value">{setupInsights?.sourceLabel || 'Setup original'}</span>
                </div>
                <div className="article-side-row">
                  <span className="article-side-label">Publicat</span>
                  <span className="article-side-value">{formatDate(setup.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className="article-side-card">
              <h2 className="article-side-title">Taguri</h2>
              <div className="article-side-tags">
                {setupInsights?.displayTags?.length ? (
                  setupInsights.displayTags.map((tag) => (
                    <span key={`setup-side-${tag}`} className="article-side-tag">
                      <Tag size={12} />
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="article-side-empty">Setup-ul nu are taguri detectate inca.</span>
                )}
              </div>
            </div>
          </aside>
        </div>

        <div className="article-comments-container">
          <div className="comments-heading-row">
            <div>
              <h2 className="comments-heading">Comentarii</h2>
              <p className="comments-subheading">
                Discuțiile, feedback-ul și întrebările despre acest setup apar aici.
              </p>
            </div>
            <span className="comments-total-pill">{commentCount} total</span>
          </div>
          <CommentsSection
            targetId={setupId}
            targetType="SETUP"
            user={user}
            highlightCommentId={highlightCommentId}
          />
        </div>
      </div>
    </div>
  );
}
