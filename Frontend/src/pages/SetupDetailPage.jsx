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
  ZoomIn,
  ZoomOut,
  X,
  Maximize2,
} from 'lucide-react';
import CommentsSection from '../components/CommentsSection';
import { useError } from '../context/ErrorContext';
import { getCurrentUser } from '../utils/currentUser';
import { getStoredLike, setStoredLike } from '../utils/likedItemsStorage';
import { formatDate as fmtDate, formatRelativeDate as fmtRel } from '../utils/parseDate';
import '../styles/DetailPage.css';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:20025'}/api/v1`;

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

const formatDate = fmtDate;
const formatRelativeDate = fmtRel;

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
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxZoom, setLightboxZoom] = useState(1);

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
    const deviceCount = setup.deviceCount ?? setup.deviceIds?.length ?? 0;

    let deviceList = [];
    try {
      if (setup.deviceSnapshots) deviceList = JSON.parse(setup.deviceSnapshots) || [];
    } catch { deviceList = []; }
    const totalPrice = deviceList.reduce((sum, d) => sum + (Number(d.priceEUR) || 0), 0);
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

    // Prefer the user-chosen tags from the backend. Fall back to auto-detected
    // topics + meta info only if the setup has no tags at all (legacy data).
    const userTags = Array.isArray(setup.tags) ? setup.tags : [];
    const displayTags = userTags.length > 0
      ? userTags
      : Array.from(new Set([
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
      deviceList,
      totalPrice,
      primaryTopic: detectedTopics[0] || 'Smart home',
    };
  }, [setup]);

  const formatEur = (n) => new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Math.round(n));

  // Keyboard shortcuts for lightbox: Esc to close, +/- to zoom
  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      else if (e.key === '+' || e.key === '=') setLightboxZoom(z => Math.min(z + 0.25, 5));
      else if (e.key === '-') setLightboxZoom(z => Math.max(z - 0.25, 0.5));
      else if (e.key === '0') setLightboxZoom(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen]);

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
                <div
                  className="setup-image-placeholder"
                  style={setup.thumbnailUrl ? { padding: 0, overflow: 'hidden', background: '#000', cursor: 'zoom-in', position: 'relative' } : {}}
                  onClick={() => { if (setup.thumbnailUrl) { setLightboxZoom(1); setLightboxOpen(true); } }}
                  role={setup.thumbnailUrl ? 'button' : undefined}
                  tabIndex={setup.thumbnailUrl ? 0 : undefined}
                  onKeyDown={(e) => { if (setup.thumbnailUrl && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setLightboxZoom(1); setLightboxOpen(true); } }}
                  title={setup.thumbnailUrl ? 'Click pentru zoom' : undefined}
                >
                  {setup.thumbnailUrl ? (
                    <>
                      <img
                        src={setup.thumbnailUrl}
                        alt={setup.name}
                        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                      <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.6)', borderRadius: '999px', padding: '6px 10px', color: '#fff', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, pointerEvents: 'none' }}>
                        <Maximize2 size={12} /> Click pentru zoom
                      </div>
                    </>
                  ) : (
                    <svg viewBox="0 0 400 300" className="placeholder-icon">
                      <rect width="400" height="300" fill="currentColor" />
                      <path d="M160 120 L240 180 L200 240 L120 180 Z" fill="white" opacity="0.3" />
                      <circle cx="180" cy="140" r="10" fill="white" opacity="0.3" />
                    </svg>
                  )}
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

              {setupInsights?.deviceList?.length > 0 && (
                <div className="setup-devices-section" style={{ marginTop: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 12 }}>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                      Device-uri folosite <span style={{ fontWeight: 500, opacity: 0.7, fontSize: 14 }}>({setupInsights.deviceList.length})</span>
                    </h3>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#5092ce' }}>
                      Total: {formatEur(setupInsights.totalPrice)}
                    </div>
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {setupInsights.deviceList.map((d, idx) => (
                      <li key={`${d.id}-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: 12, background: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(80,146,206,0.06)', border: darkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(80,146,206,0.15)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#5092ce', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                            {(d.name || '?').charAt(0).toUpperCase()}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</div>
                            {d.brand && <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>{d.brand}</div>}
                          </div>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#5092ce', flexShrink: 0 }}>
                          {formatEur(d.priceEUR || 0)}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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
                <span>{formatDate(setup.publishedAt || setup.createdAt)}</span>
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
                  <span className="article-side-value">{setup.publishedAt ? formatDate(setup.publishedAt) : (setup.isPublic ? formatDate(setup.updatedAt) : 'Nepublicat')}</span>
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

        {lightboxOpen && setup.thumbnailUrl && (
          <div
            onClick={() => setLightboxOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 99999,
              background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'zoom-out', overflow: 'auto'
            }}
            role="button"
            tabIndex={0}
            aria-label="Close zoom"
          >
            <img
              src={setup.thumbnailUrl}
              alt={setup.name}
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: 'none', maxHeight: 'none',
                width: `${90 * lightboxZoom}vw`,
                height: 'auto',
                transition: 'width 0.15s ease-out',
                cursor: lightboxZoom > 1 ? 'grab' : 'zoom-in',
                boxShadow: '0 8px 40px rgba(0,0,0,0.5)'
              }}
            />
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
                display: 'flex', gap: 12, alignItems: 'center',
                padding: '10px 20px', borderRadius: 999,
                background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              <button
                onClick={() => setLightboxZoom(z => Math.max(z - 0.25, 0.5))}
                style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                title="Zoom out (-)"
              ><ZoomOut size={18} /></button>
              <span style={{ color: '#fff', fontSize: 13, fontWeight: 600, minWidth: 50, textAlign: 'center' }}>{Math.round(lightboxZoom * 100)}%</span>
              <button
                onClick={() => setLightboxZoom(z => Math.min(z + 0.25, 5))}
                style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                title="Zoom in (+)"
              ><ZoomIn size={18} /></button>
              <button
                onClick={() => setLightboxZoom(1)}
                style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: 999, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                title="Reset (0)"
              >Reset</button>
              <button
                onClick={() => setLightboxOpen(false)}
                style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginLeft: 8 }}
                title="Close (Esc)"
              ><X size={18} /></button>
            </div>
          </div>
        )}

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
