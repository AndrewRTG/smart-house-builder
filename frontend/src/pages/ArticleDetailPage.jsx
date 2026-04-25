import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Heart } from 'lucide-react';
import CommentsSection from '../components/CommentsSection';
import { useError } from '../context/ErrorContext';
import '../styles/DetailPage.css';

const API_BASE = 'http://localhost:20025/api/v1';

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

  useEffect(() => {
    fetchArticle();
    fetchCurrentUser();
  }, [articleId]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/articles/${articleId}`);
      if (response.ok) {
        const data = await response.json();
        setArticle(data);
        fetchLikeData();
      }
    } catch (error) {
      console.error('Failed to fetch article:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  };

  const fetchLikeData = async () => {
    try {
      const countResponse = await fetch(`${API_BASE}/articles/${articleId}/like-count`);
      if (countResponse.ok) {
        const countData = await countResponse.json();
        setLikeCount(countData.likeCount);
      }
    } catch (error) {
      console.error('Failed to fetch like data:', error);
    }
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
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  if (loading) {
    return <div className="detail-page"><div className="loading">Loading article...</div></div>;
  }

  if (!article) {
    return <div className="detail-page"><div className="error">Article not found</div></div>;
  }

  return (
    <div className={`detail-page ${darkMode ? 'dark' : 'light'}`}>
      <div className="detail-container">
        {/* Back Button */}
        <button className="back-btn" onClick={() => navigate('/community', { state: { restore: true } })}>
          <ArrowLeft size={20} /> Back to Community
        </button>

        {/* Article Card - Reddit Style */}
        <div className="article-card">
          {/* Header with author info */}
          <div className="article-card-header">
            <div className="user-info-compact">
              <div className="avatar-small">{article.user?.username?.charAt(0)?.toUpperCase() || 'U'}</div>
              <div>
                <div className="setup-author">{article.user?.username || 'User'}</div>
                <div className="setup-date">Posted {new Date(article.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="article-card-title">{article.title}</h1>

          {/* Content */}
          <div className="article-card-content">
            {article.content}
          </div>

          {/* Footer with actions */}
          <div className="article-card-footer">
            <button className={`action-btn ${isLiked ? 'liked' : ''}`} onClick={toggleLike}>
              <Heart size={18} fill={isLiked ? '#e74c3c' : 'none'} color={isLiked ? '#e74c3c' : 'currentColor'} />
              <span>{likeCount}</span>
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="article-divider"></div>

        {/* Comments Section */}
        <div className="article-comments-container">
          <h2 className="comments-heading">Comments</h2>
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
