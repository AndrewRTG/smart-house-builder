import { useState, useEffect } from 'react';
import { Plus, Trash2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../../utils/authFetch';
import './MyArticles.css';

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
              <div className="article-content">
                <h3 className="article-title">{article.title}</h3>
                <p className="article-preview">{article.content.substring(0, 150)}...</p>
                {article.tags && article.tags.length > 0 && (
                  <div className="my-article-tags">
                    {article.tags.map((tag) => (
                      <span key={tag} className="my-article-tag">{tag}</span>
                    ))}
                  </div>
                )}
                <div className="article-meta">
                  <span className="meta-item">
                    <span className="label">Likes:</span> {article.likeCount || 0}
                  </span>
                  <span className="meta-item">
                    <span className="label">Comments:</span> {article.commentCount || 0}
                  </span>
                  <span className="meta-item created-at">
                    {new Date(article.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="article-actions">
                <button
                  className="action-btn view-btn"
                  onClick={() => handleView(article.id)}
                  title="View article"
                >
                  <Eye size={18} />
                </button>
                <button
                  className="action-btn delete-btn"
                  onClick={() => handleDelete(article.id)}
                  title="Delete article"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
