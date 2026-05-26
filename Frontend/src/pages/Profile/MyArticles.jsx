import { useState, useEffect } from 'react';
import { Plus, Trash2, Eye, Edit3, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../../utils/authFetch';
import { fuzzyFilter } from '../../utils/fuzzySearch';
import { MY_SETUPS_PAGE_SIZE } from '../../config/pagination';
import Pagination from '../../components/Pagination';
import '../Profile/MySetups.css';
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
  const [draftsPage, setDraftsPage] = useState(0);
  const [publishedPage, setPublishedPage] = useState(0);
  const [draftsTotalPages, setDraftsTotalPages] = useState(1);
  const [publishedTotalPages, setPublishedTotalPages] = useState(1);
  const [draftsTotal, setDraftsTotal] = useState(0);
  const [publishedTotal, setPublishedTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('drafts');
  const [search, setSearch] = useState('');
  const API_BASE = 'http://localhost:20025/api/v1';

  useEffect(() => {
    fetchAll();
  }, [draftsPage, publishedPage]);

  // One round trip per status, both paginated server-side. Tab toggling
  // doesn't refetch — only page changes do.
  const fetchAll = async () => {
    try {
      setLoading(true);
      const [draftsRes, pubRes] = await Promise.all([
        authFetch(`${API_BASE}/articles/user/drafts?page=${draftsPage}&size=${MY_SETUPS_PAGE_SIZE}`),
        authFetch(`${API_BASE}/articles/user/published?page=${publishedPage}&size=${MY_SETUPS_PAGE_SIZE}`),
      ]);
      if (draftsRes.ok) {
        const d = await draftsRes.json();
        setDrafts(d.content || []);
        setDraftsTotalPages(d.totalPages || 1);
        setDraftsTotal(d.totalElements || 0);
      }
      if (pubRes.ok) {
        const d = await pubRes.json();
        setPublished(d.content || []);
        setPublishedTotalPages(d.totalPages || 1);
        setPublishedTotal(d.totalElements || 0);
      }
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

  const rawList = activeTab === 'drafts' ? drafts : published;
  const list = fuzzyFilter(rawList, search, (a) => [a.title, a.content, ...(a.tags || [])]);
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

      <div className="search-bar">
        <Tag size={18} className="search-icon" />
        <input
          type="text"
          placeholder="Search for an article"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Same tab UI MySetups uses, for consistency across the profile pages */}
      <div className="articles-tabs">
        <button
          type="button"
          className={`articles-tab ${activeTab === 'drafts' ? 'active' : ''}`}
          onClick={() => setActiveTab('drafts')}
          aria-pressed={activeTab === 'drafts'}
        >
          Drafts {draftsTotal > 0 && <span className="tab-count">{draftsTotal}</span>}
        </button>
        <button
          type="button"
          className={`articles-tab ${activeTab === 'published' ? 'active' : ''}`}
          onClick={() => setActiveTab('published')}
          aria-pressed={activeTab === 'published'}
        >
          Published {publishedTotal > 0 && <span className="tab-count">{publishedTotal}</span>}
        </button>
      </div>

      {loading ? (
        <p>Loading your articles...</p>
      ) : list.length === 0 ? (
        <div className="empty-state">
          <p>{emptyCopy}</p>
        </div>
      ) : (
        <>
          <div className="articles-list">
            {list.map((article) => renderArticleCard(article, { isDraft: activeTab === 'drafts' }))}
          </div>
          {!search && activeTab === 'drafts' && (
            <Pagination currentPage={draftsPage} totalPages={draftsTotalPages} onPageChange={setDraftsPage} />
          )}
          {!search && activeTab === 'published' && (
            <Pagination currentPage={publishedPage} totalPages={publishedTotalPages} onPageChange={setPublishedPage} />
          )}
        </>
      )}
    </div>
  );
}
