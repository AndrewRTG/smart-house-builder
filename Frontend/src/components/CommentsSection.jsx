import { useState, useEffect } from 'react';
import { Trash2, Send } from 'lucide-react';
import { useError } from '../context/ErrorContext';
import './CommentsSection.css';

const API_BASE = 'http://localhost:20025/api/v1';

// Recursive comment node component
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
        showError('Failed to post reply');
      }
    } catch (error) {
      console.error('Error posting reply:', error);
      showError('Failed to post reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatRelativeDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

    return date.toLocaleDateString();
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
            <div className={`comment-avatar ${comment.deleted ? 'deleted' : ''}`}>
              {/* For a [deleted] stub the server sends username="User", so
                  charAt(0) produces "U" — exactly the "U in a grey circle"
                  the design calls for. No special-case in the JSX. */}
              {comment.username?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="comment-info">
              <div className="comment-username">{comment.username}</div>
              <div className="comment-date">{formatRelativeDate(comment.createdAt)}</div>
            </div>
          </div>
          {/* Red trash icon, hover-only visibility via CSS. Only shown for
              the author's own live comments — the server already refuses to
              return isOwner=true for deleted stubs. */}
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

        {/* Replying to a [deleted] stub is still allowed — standard forum
            behavior — because the thread underneath might still be active. */}
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

      {/* Render replies recursively */}
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

  /**
   * Deep-link handler: when the Activity page sends the user here with
   * ?comment=<id>, scroll to that comment and flash the highlight class for
   * a few seconds so they can see which one they came for.
   *
   * We run this after `comments` changes — that's the moment the DOM nodes
   * with id="comment-<id>" actually exist. We also defer inside a rAF so the
   * browser has laid out the tree before we measure/scroll.
   *
   * The highlight class is removed after 3s (matches the keyframe duration
   * in CommentsSection.css) so re-focusing the tab doesn't re-animate.
   */
  useEffect(() => {
    if (!highlightCommentId || comments.length === 0) return;

    const raf = requestAnimationFrame(() => {
      const el = document.getElementById(`comment-${highlightCommentId}`);
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('comment-highlight');
      // Strip the class after the animation finishes; otherwise a later
      // re-render won't re-trigger it (CSS animations only run on class add).
      const timeout = setTimeout(() => {
        el.classList.remove('comment-highlight');
      }, 3200);
      // Return a cleanup that the outer effect can't really use (since we're
      // inside rAF), but stash it so hot-reload doesn't leave dangling
      // timeouts.
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
        showError('Failed to add comment');
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
      // CommentController exposes a top-level DELETE /api/v1/comments/{id}
      // (verified against CommentController.java line 64). It does NOT
      // expose /setups/{id}/comments/{cid} — that route doesn't exist.
      // I previously swapped to the nested form based on a stale spec;
      // that's what was making delete silently fail. Reverted.
      const response = await fetch(`${API_BASE}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchComments();
      } else {
        // Surface the server's actual error so the next debugging round
        // doesn't have to read the network tab to find out what went wrong.
        const data = await response.json().catch(() => null);
        const msg = data?.message
          || data?.error
          || `Failed to delete comment (HTTP ${response.status})`;
        showError(msg);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      showError('Failed to delete comment');
    }
  };

  const commentCount = comments.reduce((count, comment) => {
    const countReplies = (replies) => {
      return replies.reduce((acc, reply) => acc + 1 + countReplies(reply.replies || []), 0);
    };
    return count + 1 + countReplies(comment.replies || []);
  }, 0);

  return (
    <div className="comments-section">
      <h3 className="comments-title">Comments ({commentCount})</h3>

      {/* Top-level Comment Form */}
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

      {/* Comments Tree */}
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
