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
  if (!d || isNaN(d.getTime())) return 'Dată necunoscută';
  return d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function MyArticles({ isDark, profile }) {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_BASE = 'http://localhost:20025/api/v1';

  useEffect(() => {
    fetchMyArticles();
  }, []);

  const fetchMyArticles = async () => {
    try {
      setLoading(true);
      const response = await authFetch(`${API_BASE}/articles/user/my-articles`);
      if (response.ok) {
        const data = await response.json();
        setArticles(data);
      } else {
        console.error('Failed to fetch articles:', response.status);
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (articleId) => {
    if (!confirm('Are you sure you want to delete this article?')) return;

    try {
      const response = await authFetch(`${API_BASE}/articles/${articleId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setArticles(articles.filter(a => a.id !== articleId));
      } else {
        console.error('Failed to delete article');
      }
    } catch (error) {
      console.error('Error deleting article:', error);
    }
  };

  const handleView = (articleId) => {
    navigate(`/article/${articleId}`);
  };

  if (loading) {
    return <div className="my-articles-container"><p>Loading your articles...</p></div>;
  }

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

      {articles.length === 0 ? (
        <div className="empty-state">
          <p>You haven't written any articles yet.</p>
          <button
            className="cta-btn"
            onClick={() => navigate('/articles/create')}
          >
            Write Your First Article
          </button>
        </div>
      ) : (
        <div className="articles-list">
          {articles.map(article => (
            <div key={article.id} className="article-card">
              {article.imageUrl && (
                <div style={{ marginBottom: '12px', borderRadius: '8px', overflow: 'hidden', maxHeight: '200px' }}>
                  <img
                    src={article.imageUrl}
                    alt={article.title}
                    style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }}
                    onError={e => e.target.style.display = 'none'}
                  />
                </div>
              )}
              <div className="article-content">
                <h3 className="article-title" style={{ color: isDark ? '#fff' : '#111' }}>{article.title}</h3>
                <p className="article-preview" style={{ color: isDark ? '#ccc' : '#444' }}>{article.content.substring(0, 150)}...</p>
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
                <button
                  className="btn-view"
                  onClick={() => handleView(article.id)}
                  title="View article"
                >
                  <Eye size={14} /> View
                </button>
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
          ))}
        </div>
      )}
    </div>
  );
}