import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Cpu,
  Heart,
  MessageCircle,
  Tag,
} from 'lucide-react';
import CommentsSection from '../components/CommentsSection';
import { useError } from '../context/ErrorContext';
import { getCurrentUser } from '../utils/currentUser';
import { getStoredLike, setStoredLike } from '../utils/likedItemsStorage';
import '../styles/DetailPage.css';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:20025'}/api/v1`;
const EURO_SYMBOL = '\u20AC';

const ARTICLE_TOPIC_MAP = [
  { label: 'Bucatarie', keywords: ['bucatarie', 'bucatariei', 'bucataria', 'kitchen'] },
  { label: 'Living', keywords: ['living', 'sufragerie'] },
  { label: 'Dormitor', keywords: ['dormitor', 'bedroom'] },
  { label: 'Baie', keywords: ['baie', 'bathroom'] },
  { label: 'Birou', keywords: ['birou', 'office'] },
  { label: 'Iluminat', keywords: ['lumina', 'lumini', 'iluminat', 'bec', 'becuri', 'led'] },
  { label: 'Securitate', keywords: ['securitate', 'camera', 'camere', 'sensor', 'senzor', 'alarma'] },
  { label: 'Climat', keywords: ['temperatura', 'climat', 'incalzire', 'aer conditionat', 'ventilatie'] },
  { label: 'Energie', keywords: ['energie', 'consum', 'solar', 'panou', 'panouri'] },
  { label: 'Automatizare', keywords: ['automatizare', 'automatizat', 'scenariu', 'routine', 'automation'] },
];

function parseDate(value) {
  if (!value) return null;
  if (Array.isArray(value)) {
    const [y, m, d, h = 0, min = 0] = value;
    return new Date(y, m - 1, d, h, min);
  }
  return new Date(value);
}

function formatDate(dateValue, options = {}) {
  if (!dateValue) return 'Nespecificat';
  const d = parseDate(dateValue);
  if (!d || isNaN(d.getTime())) return 'Nespecificat';
  return d.toLocaleDateString('ro-RO', {
    day: 'numeric', month: 'long', year: 'numeric', ...options,
  });
}

function formatRelativeDate(dateValue) {
  if (!dateValue) return 'recent';
  const date = parseDate(dateValue);
  if (!date || isNaN(date.getTime())) return 'recent';
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'acum cateva secunde';
  if (seconds < 3600) return `acum ${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `acum ${Math.floor(seconds / 3600)} h`;
  if (seconds < 604800) return `acum ${Math.floor(seconds / 86400)} zile`;
  return formatDate(dateValue, { month: 'short' });
}

function extractPriceLabel(text = '') {
  const normalizedText = text.replace(/\s+/g, ' ');
  const explicitMatch = normalizedText.match(
    /(?:pret|price|buget|budget|cost)\s*[:=-]?\s*(\d[\d.,]*)\s*(\$|\u20AC|ron|lei|usd|eur)?/i
  );

  if (explicitMatch) {
    return formatPrice(explicitMatch[1], explicitMatch[2]);
  }

  const looseMatch = normalizedText.match(/(\d[\d.,]*)\s*(\$|\u20AC|ron|lei|usd|eur)\b/i);
  if (looseMatch) {
    return formatPrice(looseMatch[1], looseMatch[2]);
  }

  return null;
}

function formatPrice(amount, currency) {
  if (!currency) return amount;

  const trimmedCurrency = currency.trim();
  if (trimmedCurrency === '$' || trimmedCurrency === EURO_SYMBOL) {
    return `${amount}${trimmedCurrency}`;
  }

  return `${amount} ${trimmedCurrency.toUpperCase()}`;
}

function getArticleTopics(article) {
  const source = `${article?.title || ''} ${article?.content || ''}`.toLowerCase();

  return ARTICLE_TOPIC_MAP.filter(({ keywords }) =>
    keywords.some((keyword) => source.includes(keyword))
  ).map(({ label }) => label);
}

function estimateReadingTime(text = '') {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 180));
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

export default function ArticleDetailPage({ darkMode }) {
  const { articleId } = useParams();
  const navigate = useNavigate();
  const { showError } = useError();
  // Same deep-link support as SetupDetailPage: /articles/17?comment=42 will
  // scroll/highlight comment 42 once the thread has loaded. See the twin
  // comment in SetupDetailPage for the full explanation.
  const [searchParams] = useSearchParams();
  const highlightCommentId = searchParams.get('comment');
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);

  useEffect(() => {
    fetchArticle();
    fetchCurrentUser();
  }, [articleId]);

  useEffect(() => {
    if (!user) {
      setIsLiked(false);
      return;
    }

    setIsLiked(getStoredLike('ARTICLE', articleId, user));
  }, [articleId, user]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/articles/${articleId}`);
      if (response.ok) {
        const data = await response.json();
        setArticle(data);
        setLikeCount(data.likeCount ?? 0);
        setCommentCount(data.commentCount ?? 0);
      }
    } catch (error) {
      console.error('Failed to fetch article:', error);
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
      const response = await fetch(`${API_BASE}/articles/${articleId}/like`, {
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
        setStoredLike('ARTICLE', articleId, data.isLiked, user);
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const articleInsights = useMemo(() => {
    if (!article) return null;

    const detectedTopics = getArticleTopics(article);
    const priceLabel = extractPriceLabel(`${article.title || ''} ${article.content || ''}`);
    const deviceCount = article.deviceIds?.length || 0;
    const readingTime = estimateReadingTime(article.content);
    const contentParagraphs = splitIntoParagraphs(article.content);
    const excerpt = buildExcerpt(article.content);
    const hasEdits = Boolean(
      article.updatedAt
      && article.createdAt
      && Math.abs(parseDate(article.updatedAt).getTime() - parseDate(article.createdAt).getTime()) > 60 * 1000
    );

    const displayTags = Array.from(new Set([
      ...detectedTopics,
      priceLabel ? `Pret ${priceLabel}` : null,
      deviceCount > 0 ? `${deviceCount} device${deviceCount === 1 ? '' : 's'}` : null,
      hasEdits ? 'Actualizat' : null,
    ].filter(Boolean))).slice(0, 6);

    return {
      detectedTopics,
      priceLabel,
      deviceCount,
      readingTime,
      contentParagraphs,
      excerpt,
      hasEdits,
      displayTags,
      primaryTopic: detectedTopics[0] || 'Smart home',
    };
  }, [article]);

  if (loading) {
    return <div className="detail-page"><div className="loading">Loading article...</div></div>;
  }

  if (!article) {
    return <div className="detail-page"><div className="error">Article not found</div></div>;
  }

  return (
    <div className={`detail-page ${darkMode ? 'dark' : 'light'}`}>
      <div className="detail-container article-detail-layout">
        <button className="back-btn" onClick={() => navigate('/community', { state: { restore: true } })}>
          <ArrowLeft size={20} /> Back to Community
        </button>

        <div className="article-detail-grid">
          <article className="article-detail-card">
            <div className="article-detail-header">
              <div className="user-info-compact">
                <div className="avatar-small" style={{ overflow: 'hidden', padding: 0 }}>
                  {article.authorAvatarUrl ? (
                    <img src={article.authorAvatarUrl} alt={article.authorUsername}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                      onError={e => e.target.style.display = 'none'} />
                  ) : (
                    article.authorUsername?.charAt(0)?.toUpperCase() || 'U'
                  )}
                </div>
                <div>
                  <div className="setup-author">{article.authorUsername || 'User'}</div>
                  <div className="setup-date">
                    Publicata {formatRelativeDate(article.createdAt)}
                    {articleInsights?.hasEdits ? ` | actualizata ${formatRelativeDate(article.updatedAt)}` : ''}
                  </div>
                </div>
              </div>
              <div className="article-type-pill">
                <Tag size={14} />
                <span>{articleInsights?.primaryTopic || 'Postare'}</span>
              </div>
            </div>

            <div className="article-detail-body">
              <span className="article-overline">Community post</span>
              <h1 className="article-card-title">{article.title}</h1>

              {article.imageUrl ? (
                <div className="article-cover-image">
                  <img
                    src={article.imageUrl}
                    alt={article.title}
                    style={{
                      width: '100%',
                      maxHeight: '400px',
                      objectFit: 'cover',
                      borderRadius: '12px',
                      marginBottom: '16px',
                      display: 'block',
                    }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              ) : null}

              {articleInsights?.excerpt ? (
                <p className="article-detail-excerpt">{articleInsights.excerpt}</p>
              ) : null}

              <div className="article-stats-row">
                <div className="article-stat-chip">
                  <Heart size={16} />
                  <span>{likeCount} like-uri</span>
                </div>
                <div className="article-stat-chip">
                  <MessageCircle size={16} />
                  <span>{commentCount} comentarii</span>
                </div>
                <div className="article-stat-chip">
                  <Cpu size={16} />
                  <span>{articleInsights?.deviceCount || 0} device-uri</span>
                </div>
                <div className="article-stat-chip">
                  <Clock3 size={16} />
                  <span>{articleInsights?.readingTime || 1} min citire</span>
                </div>
              </div>

              {articleInsights?.displayTags?.length ? (
                <div className="article-tag-list">
                  {articleInsights.displayTags.map((tag) => (
                    <span key={tag} className="article-tag-chip">{tag}</span>
                  ))}
                </div>
              ) : null}

              <div className="article-content-panel">
                {articleInsights?.contentParagraphs?.length ? (
                  articleInsights.contentParagraphs.map((paragraph, index) => (
                    <p key={`${article.id}-paragraph-${index}`} className="article-paragraph">
                      {paragraph}
                    </p>
                  ))
                ) : (
                  <p className="article-paragraph">{article.content}</p>
                )}
              </div>
            </div>

            <div className="article-detail-footer">
              <button className={`action-btn ${isLiked ? 'liked' : ''}`} onClick={toggleLike}>
                <Heart size={18} fill={isLiked ? '#e74c3c' : 'none'} color={isLiked ? '#e74c3c' : 'currentColor'} />
                <span>{likeCount}</span>
              </button>

              <div className="article-footer-meta">
                <CalendarDays size={16} />
                <span>{formatDate(article.createdAt)}</span>
              </div>
            </div>
          </article>

          <aside className="article-side-stack">
            <div className="article-side-card">
              <h2 className="article-side-title">Informatii rapide</h2>
              <div className="article-side-list">
                <div className="article-side-row">
                  <span className="article-side-label">Categorie</span>
                  <span className="article-side-value">{articleInsights?.primaryTopic || 'Smart home'}</span>
                </div>
                <div className="article-side-row">
                  <span className="article-side-label">Pret</span>
                  <span className="article-side-value">{articleInsights?.priceLabel || 'Nespecificat'}</span>
                </div>
                <div className="article-side-row">
                  <span className="article-side-label">Device-uri</span>
                  <span className="article-side-value">{articleInsights?.deviceCount || 0}</span>
                </div>
                <div className="article-side-row">
                  <span className="article-side-label">Citire</span>
                  <span className="article-side-value">{articleInsights?.readingTime || 1} min</span>
                </div>
                <div className="article-side-row">
                  <span className="article-side-label">Publicata</span>
                  <span className="article-side-value">{formatDate(article.createdAt)}</span>
                </div>
                <div className="article-side-row">
                  <span className="article-side-label">Actualizare</span>
                  <span className="article-side-value">
                    {articleInsights?.hasEdits ? formatDate(article.updatedAt) : 'Fara editari'}
                  </span>
                </div>
              </div>
            </div>

            <div className="article-side-card">
              <h2 className="article-side-title">Taguri</h2>
              <div className="article-side-tags">
                {articleInsights?.displayTags?.length ? (
                  articleInsights.displayTags.map((tag) => (
                    <span key={`side-${tag}`} className="article-side-tag">{tag}</span>
                  ))
                ) : (
                  <span className="article-side-empty">Postarea nu are taguri detectate inca.</span>
                )}
              </div>
            </div>
          </aside>
        </div>

        <div className="article-comments-container">
          <div className="comments-heading-row">
            <div>
              <h2 className="comments-heading">Discutie</h2>
              <p className="comments-subheading">
                Toate reactiile si comentariile pentru aceasta postare sunt aici.
              </p>
            </div>
            <span className="comments-total-pill">{commentCount} total</span>
          </div>
          <CommentsSection
            targetId={articleId}
            targetType="ARTICLE"
            user={user}
            highlightCommentId={highlightCommentId}
          />
        </div>
      </div>
    </div>
  );
}