import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Heart, Bookmark } from 'lucide-react';
import CommentsSection from '../components/CommentsSection';
import { useError } from '../context/ErrorContext';
import { getCurrentUser } from '../utils/currentUser';
import '../styles/DetailPage.css';

const API_BASE = 'http://localhost:20025/api/v1';

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

  useEffect(() => {
    fetchSetup();
    fetchCurrentUser();
  }, [setupId]);

  const fetchSetup = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/setups/${setupId}`);
      if (response.ok) {
        const data = await response.json();
        setSetup(data);
        fetchLikeData();
        fetchWishlistCount();
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

  const fetchLikeData = async () => {
    try {
      const countResponse = await fetch(`${API_BASE}/setups/${setupId}/like-count`);
      if (countResponse.ok) {
        const countData = await countResponse.json();
        setLikeCount(countData.likeCount);
      }
    } catch (error) {
      console.error('Failed to fetch like data:', error);
    }
  };

  const fetchWishlistCount = async () => {
    try {
      const countResponse = await fetch(`${API_BASE}/setups/${setupId}/wishlist-count`);
      if (countResponse.ok) {
        const countData = await countResponse.json();
        setWishlistCount(countData.count);
      }
    } catch (error) {
      console.error('Failed to fetch wishlist count:', error);
    }
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
        fetchWishlistCount();
      } else if (response.status === 401) {
        showError('Session expired. Please login again.');
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Failed to toggle wishlist:', error);
    }
  };

  if (loading) {
    return <div className="detail-page"><div className="loading">Loading setup...</div></div>;
  }

  if (!setup) {
    return <div className="detail-page"><div className="error">Setup not found</div></div>;
  }

  return (
    <div className={`detail-page ${darkMode ? 'dark' : 'light'}`}>
      <div className="detail-container">
        {/* Back Button */}
        <button className="back-btn" onClick={() => navigate('/community', { state: { restore: true } })}>
          <ArrowLeft size={20} /> Back to Community
        </button>

        {/* Setup Card - Reddit Style */}
        <div className="setup-card">
          {/* Header with author info */}
          <div className="setup-card-header">
            <div className="user-info-compact">
              <div className="avatar-small">{setup.user?.username?.charAt(0)?.toUpperCase() || 'U'}</div>
              <div>
                <div className="setup-author">{setup.user?.username || 'User'}</div>
                <div className="setup-date">Posted {new Date(setup.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="setup-card-title">{setup.name}</h1>

          {/* Image */}
          <div className="setup-image-placeholder">
            <svg viewBox="0 0 400 300" className="placeholder-icon">
              <rect width="400" height="300" fill="currentColor" />
              <path d="M160 120 L240 180 L200 240 L120 180 Z" fill="white" opacity="0.3" />
              <circle cx="180" cy="140" r="10" fill="white" opacity="0.3" />
            </svg>
          </div>

          {/* Description */}
          <div className="setup-card-content">
            <h3 className="setup-section-title">Description</h3>
            <p className="setup-description">{setup.description}</p>

            {setup.deviceIds && (
              <>
                <h3 className="setup-section-title">Devices</h3>
                <p className="device-count">Contains {setup.deviceIds?.length || 0} device(s)</p>
              </>
            )}

            {setup.status && (
              <>
                <h3 className="setup-section-title">Status</h3>
                <p className={`status-badge ${setup.status.toLowerCase()}`}>{setup.status}</p>
              </>
            )}
          </div>

          {/* Footer with actions */}
          <div className="setup-card-footer">
            <button className={`action-btn ${isLiked ? 'liked' : ''}`} onClick={toggleLike}>
              <Heart size={18} fill={isLiked ? '#e74c3c' : 'none'} color={isLiked ? '#e74c3c' : 'currentColor'} />
              <span>{likeCount}</span>
            </button>
            <button className={`action-btn ${isWishlisted ? 'saved' : ''}`} onClick={toggleWishlist}>
              <Bookmark size={18} fill={isWishlisted ? '#5092ce' : 'none'} color={isWishlisted ? '#5092ce' : 'currentColor'} />
              <span>{wishlistCount}</span>
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="setup-divider"></div>

        {/* Comments Section */}
        <div className="setup-comments-container">
          <h2 className="comments-heading">Comments</h2>
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
