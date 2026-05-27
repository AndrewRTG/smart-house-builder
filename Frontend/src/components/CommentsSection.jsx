import { useState, useEffect } from 'react';
import { Trash2, Send } from 'lucide-react';
import { useError } from '../context/ErrorContext';
import './CommentsSection.css';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:20025'}/api/v1`;

function parseDate(value) {
  if (!value) return null;
  if (Array.isArray(value)) {
    const [y, m, d, h = 0, min = 0] = value;
    return new Date(y, m - 1, d, h, min);
  }
  return new Date(value);
}

function formatRelativeDate(value) {
  const date = parseDate(value);
  if (!date || isNaN(date.getTime())) return 'recent';
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' });
}

function CommentAvatar({ comment }) {
  const isDeleted = comment.deleted;
  const initial = isDeleted ? 'U' : (comment.username?.charAt(0)?.toUpperCase() || 'U');

  return (
    <div className={`comment-avatar ${isDeleted ? 'deleted' : ''}`}
      style={{ overflow: 'hidden', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {!isDeleted && comment.avatarUrl ? (
        <img
          src={comment.avatarUrl}
          alt={comment.username}
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
          onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
        />
      ) : null}
      <span style={{
        display: (!isDeleted && comment.avatarUrl) ? 'none' : 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
      }}>
        {initial}
      </span>
    </div>
  );
}

function CommentNode({ comment, targetId, targetType, user, depth = 0, onDelete, onReplySubmit }) {
  const { showError } = useError();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const maxDepth = 8;
  const indentLevel = Math.min(depth, maxDepth);

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyContent.trim() || !user) return;

    setIsSubmitting(true);
    try {
      const endpoint = targetType === 'SETUP'
        ? `/setups/${targetId}/comments`
        : `/articles/${targetId}/comments`;

      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: replyContent,
          parentCommentId: comment.id,
        }),
      });

      if (response.ok) {
        setReplyContent('');
        setShowReplyForm(false);
        onReplySubmit();
      } else {
        const data = await response.json().catch(() => null);
        const msg = data?.message || data?.error || `Failed to post reply (HTTP ${response.status})`;
        showError(msg);
      }
    } catch (error) {
      console.error('Error posting reply:', error);
      showError('Failed to post reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`comment-node ${depth > 0 ? 'reply-node' : 'root-node'}`}
      style={{ marginLeft: `${indentLevel * 20}px` }}
    >
      <div className="comment-indent-line" style={{ display: depth > 0 ? 'block' : 'none' }} />

      <div
        className={`comment-body ${comment.deleted ? 'deleted' : ''} ${depth > 0 ? 'reply-body' : ''}`}
        id={`comment-${comment.id}`}
      >
        <div className="comment-header">
          <div className="comment-user">
            <CommentAvatar comment={comment} />
            <div className="comment-info">
              <div className="comment-username">{comment.username}</div>
              <div className="comment-date">{formatRelativeDate(comment.createdAt)}</div>
            </div>
          </div>
          {comment.isOwner && !comment.deleted && (
            <button
              className="delete-btn"
              onClick={() => onDelete(comment.id)}
              title="Delete comment"
              aria-label="Delete comment"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>

        <p className={`comment-content ${comment.deleted ? 'deleted' : ''}`}>{comment.content}</p>

        <button
          className="reply-btn"
          onClick={() => setShowReplyForm(!showReplyForm)}
        >
          Reply
        </button>

        {showReplyForm && user && (
          <form onSubmit={handleReplySubmit} className="reply-form">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              className="reply-input"
              rows="2"
            />
            <div className="reply-actions">
              <button
                type="submit"
                className="reply-submit"
                disabled={!replyContent.trim() || isSubmitting}
              >
                <Send size={14} /> {isSubmitting ? 'Posting...' : 'Post'}
              </button>
              <button
                type="button"
                className="reply-cancel"
                onClick={() => {
                  setShowReplyForm(false);
                  setReplyContent('');
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="comment-replies">
          {comment.replies.map((reply) => (
            <CommentNode
              key={reply.id}
              comment={reply}
              targetId={targetId}
              targetType={targetType}
              user={user}
              depth={depth + 1}
              onDelete={onDelete}
              onReplySubmit={onReplySubmit}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommentsSection({ targetId, targetType, user, highlightCommentId }) {
  const { showError } = useError();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);

  useEffect(() => {
    fetchComments();
  }, [targetId, targetType, page]);

  useEffect(() => {
    if (!highlightCommentId || comments.length === 0) return;

    const raf = requestAnimationFrame(() => {
      const el = document.getElementById(`comment-${highlightCommentId}`);
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('comment-highlight');
      const timeout = setTimeout(() => {
        el.classList.remove('comment-highlight');
      }, 3200);
      el.dataset.highlightTimeout = String(timeout);
    });

    return () => cancelAnimationFrame(raf);
  }, [highlightCommentId, comments]);

  const fetchComments = async () => {
    if (!targetId) return;

    try {
      setLoading(true);
      const endpoint = targetType === 'SETUP'
        ? `/setups/${targetId}/comments?page=${page}&size=10`
        : `/articles/${targetId}/comments?page=${page}&size=10`;

      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });

      if (response.ok) {
        const data = await response.json();
        setComments(data.content || []);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    try {
      const endpoint = targetType === 'SETUP'
        ? `/setups/${targetId}/comments`
        : `/articles/${targetId}/comments`;

      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newComment, parentCommentId: null }),
      });

      if (response.ok) {
        setNewComment('');
        setPage(0);
        fetchComments();
      } else {
        const data = await response.json().catch(() => null);
        const msg = data?.message || data?.error || `Failed to add comment (HTTP ${response.status})`;
        showError(msg);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      showError('Failed to add comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE}/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        fetchComments();
      } else {
        const data = await response.json().catch(() => null);
        const msg = data?.message || data?.error || `Failed to delete comment (HTTP ${response.status})`;
        showError(msg);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      showError('Failed to delete comment');
    }
  };

  const commentCount = comments.reduce((count, comment) => {
    const countReplies = (replies) =>
      replies.reduce((acc, reply) => acc + 1 + countReplies(reply.replies || []), 0);
    return count + 1 + countReplies(comment.replies || []);
  }, 0);

  return (
    <div className="comments-section">
      <h3 className="comments-title">Comments ({commentCount})</h3>

      {user ? (
        <form onSubmit={handleAddComment} className="comment-form">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="comment-input"
            rows="3"
          />
          <button type="submit" className="comment-submit" disabled={!newComment.trim()}>
            <Send size={16} /> Post Comment
          </button>
        </form>
      ) : (
        <div className="login-prompt">
          <p>Login to add a comment</p>
        </div>
      )}

      <div className="comments-list">
        {loading ? (
          <p className="no-comments">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="no-comments">No comments yet. Be the first!</p>
        ) : (
          comments.map((comment) => (
            <CommentNode
              key={comment.id}
              comment={comment}
              targetId={targetId}
              targetType={targetType}
              user={user}
              depth={0}
              onDelete={handleDeleteComment}
              onReplySubmit={fetchComments}
            />
          ))
        )}
      </div>
    </div>
  );
}