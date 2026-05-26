import { useState, useEffect } from 'react';
import { Plus, Trash2, Eye, Edit3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../../utils/authFetch';
import './MyArticles.css';

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
  if (!d || isNaN(d.getTime())) return 'Unknown date';
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function MyArticles({ isDark, profile }) {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState([]);
  const [published, setPublished] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('drafts');
  const API_BASE = `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:20025'}/api/v1`;

  useEffect(() => {
    fetchAll();
  }, []);

  // One round trip per status. Keeps each list independent so toggling
  // tabs doesn't refetch — and lets the empty-state copy be tab-specific
  // ("No drafts yet" vs "Nothing published yet").
  const fetchAll = async () => {
    try {
      setLoading(true);
      const [draftsRes, pubRes] = await Promise.all([
        authFetch(`${API_BASE}/articles/user/drafts`),
        authFetch(`${API_BASE}/articles/user/published`),
      ]);
      if (draftsRes.ok) setDrafts(await draftsRes.json());
      if (pubRes.ok) setPublished(await pubRes.json());
    } catch (err) {
      console.error('Error fetching articles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (articleId) => {
    if (!window.confirm('Are you sure you want to delete this article?')) return;
    try {
      const response = await authFetch(`${API_BASE}/articles/${articleId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setDrafts((prev) => prev.filter((a) => a.id !== articleId));
        setPublished((prev) => prev.filter((a) => a.id !== articleId));
      } else {
        console.error('Failed to delete article');
      }
    } catch (error) {
      console.error('Error deleting article:', error);
    }
  };

  const handlePublish = async (articleId) => {
    try {
      const res = await authFetch(`${API_BASE}/articles/${articleId}/publish`, {
        method: 'PUT',
      });
      if (res.ok) {
        // Refresh both lists — the article should jump from drafts to published.
        fetchAll();
      } else {
        console.error('Failed to publish article');
      }
    } catch (err) {
      console.error('Error publishing article:', err);
    }
  };

  const handleView = (articleId) => navigate(`/article/${articleId}`);

  const renderArticleCard = (article, { isDraft }) => (
    <div key={article.id} className="article-card">
      {article.imageUrl && (
        <div style={{ marginBottom: '12px', borderRadius: '8px', overflow: 'hidden', maxHeight: '200px' }}>
          <img
            src={article.imageUrl}
            alt={article.title}
            style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
      )}
      <div className="article-content">
        <h3 className="article-title" style={{ color: isDark ? '#fff' : '#111' }}>{article.title}</h3>
        <p className="article-preview" style={{ color: isDark ? '#ccc' : '#444' }}>
          {article.content?.substring(0, 150)}{(article.content?.length || 0) > 150 ? '...' : ''}
        </p>
        {article.tags && article.tags.length > 0 && (
          <div className="my-article-tags">
            {article.tags.map((tag) => (
              <span key={tag} className="my-article-tag">{tag}</span>
            ))}
          </div>
        )}
        <div className="article-meta" style={{ color: isDark ? '#aaa' : '#555' }}>
          <span className="meta-item">
            <span className="label">Likes:</span> {article.likeCount || 0}
          </span>
          <span className="meta-item">
            <span className="label">Comments:</span> {article.commentCount || 0}
          </span>
          <span className="meta-item created-at">
            {formatDate(article.createdAt)}
          </span>
        </div>
      </div>
      <div className="card-buttons">
        <button
          className="btn-edit"
          onClick={() => navigate(`/articles/create?articleId=${article.id}`)}
          title="Edit article"
        >
          <Edit3 size={14} /> Edit
        </button>
        {isDraft ? (
          <button
            className="btn-publish"
            onClick={() => handlePublish(article.id)}
            title="Publish to the community"
          >
            Publish
          </button>
        ) : (
          <button
            className="btn-view"
            onClick={() => handleView(article.id)}
            title="View article"
          >
            <Eye size={14} /> View
          </button>
        )}
        <button
          className="btn-delete"
          onClick={() => handleDelete(article.id)}
          title="Delete article"
          aria-label="Delete article"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );

  const list = activeTab === 'drafts' ? drafts : published;
  const emptyCopy = activeTab === 'drafts'
    ? "You don't have any drafts. Start writing — your in-progress work will live here."
    : "You haven't published any articles yet.";

  return (
    <div className={`my-articles-container ${isDark ? 'dark' : 'light'}`}>
      <div className="articles-header">
        <h2>My Articles</h2>
        <button
          className="create-btn"
          onClick={() => navigate('/articles/create')}
        >
          <Plus size={18} /> New Article
        </button>
      </div>

      {/* Same tab UI MySetups uses, for consistency across the profile pages */}
      <div className="articles-tabs">
        <button
          type="button"
          className={`articles-tab ${activeTab === 'drafts' ? 'active' : ''}`}
          onClick={() => setActiveTab('drafts')}
          aria-pressed={activeTab === 'drafts'}
        >
          Drafts {drafts.length > 0 && <span className="tab-count">{drafts.length}</span>}
        </button>
        <button
          type="button"
          className={`articles-tab ${activeTab === 'published' ? 'active' : ''}`}
          onClick={() => setActiveTab('published')}
          aria-pressed={activeTab === 'published'}
        >
          Published {published.length > 0 && <span className="tab-count">{published.length}</span>}
        </button>
      </div>

      {loading ? (
        <p>Loading your articles...</p>
      ) : list.length === 0 ? (
        <div className="empty-state">
          <p>{emptyCopy}</p>
          <button
            className="cta-btn"
            onClick={() => navigate('/articles/create')}
          >
            {activeTab === 'drafts' ? 'Start a New Article' : 'Write Your First Article'}
          </button>
        </div>
      ) : (
        <div className="articles-list">
          {list.map((article) => renderArticleCard(article, { isDraft: activeTab === 'drafts' }))}
        </div>
      )}
    </div>
  );
}
