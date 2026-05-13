import React from 'react';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CommentsSection from './CommentsSection';
import ErrorBanner from './ErrorBanner';
import { ErrorProvider } from '../context/ErrorContext';
import { renderWithRouter } from '../test/renderWithRouter';

function jsonResponse(body, ok = true, status = ok ? 200 : 500) {
  return {
    ok,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

function renderComments(props = {}) {
  return renderWithRouter(
    <ErrorProvider>
      <ErrorBanner />
      <CommentsSection targetId="7" targetType="ARTICLE" user={{ username: 'ana' }} {...props} />
    </ErrorProvider>
  );
}

const comments = [{
  id: 1,
  username: 'Ana',
  avatarUrl: '/ana.png',
  content: 'Root comment',
  createdAt: new Date().toISOString(),
  isOwner: true,
  replies: [{
    id: 2,
    username: 'Bob',
    deleted: true,
    content: 'Deleted reply',
    createdAt: [2026, 5, 13, 10, 0],
    replies: [],
  }],
}];

describe('CommentsSection', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.setItem('accessToken', 'token');
    global.fetch = vi.fn((url, options = {}) => {
      const target = String(url);
      if (target.includes('/comments?page=')) return Promise.resolve(jsonResponse({ content: comments }));
      if (options.method === 'POST') return Promise.resolve(jsonResponse({ id: 3 }));
      if (options.method === 'DELETE') return Promise.resolve(jsonResponse({}));
      return Promise.resolve(jsonResponse({}));
    });
    global.requestAnimationFrame = (cb) => {
      cb();
      return 1;
    };
    global.cancelAnimationFrame = vi.fn();
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('loads comments, highlights deep links, adds root comments and deletes owned comments', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderComments({ highlightCommentId: '1' });

    expect(await screen.findByText('Root comment')).toBeInTheDocument();
    expect(screen.getByText('Deleted reply')).toBeInTheDocument();
    await waitFor(() => expect(document.getElementById('comment-1')).toHaveClass('comment-highlight'));

    fireEvent.change(screen.getByPlaceholderText('Write a comment...'), { target: { value: 'New comment' } });
    fireEvent.click(screen.getByText('Post Comment'));
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      'http://localhost:20025/api/v1/articles/7/comments',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ content: 'New comment', parentCommentId: null }) })
    ));

    fireEvent.click(screen.getByLabelText('Delete comment'));
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      'http://localhost:20025/api/v1/comments/1',
      expect.objectContaining({ method: 'DELETE' })
    ));
  });

  it('submits and cancels replies', async () => {
    renderComments();
    expect(await screen.findByText('Root comment')).toBeInTheDocument();

    const root = screen.getByText('Root comment').closest('.comment-node');
    fireEvent.click(within(root).getAllByText('Reply')[0]);
    fireEvent.change(within(root).getByPlaceholderText('Write a reply...'), { target: { value: 'Reply text' } });
    fireEvent.click(within(root).getByText('Post'));

    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      'http://localhost:20025/api/v1/articles/7/comments',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ content: 'Reply text', parentCommentId: 1 }) })
    ));

    fireEvent.click(within(root).getAllByText('Reply')[0]);
    fireEvent.change(within(root).getByPlaceholderText('Write a reply...'), { target: { value: 'Cancel me' } });
    fireEvent.click(within(root).getByText('Cancel'));
    expect(within(root).queryByPlaceholderText('Write a reply...')).not.toBeInTheDocument();
  });

  it('shows guest prompt, empty state and error messages', async () => {
    fetch.mockResolvedValueOnce(jsonResponse({ content: [] }));
    const { unmount } = renderComments({ user: null, targetId: '9' });
    expect(await screen.findByText('Login to add a comment')).toBeInTheDocument();
    expect(await screen.findByText('No comments yet. Be the first!')).toBeInTheDocument();
    unmount();

    fetch
      .mockResolvedValueOnce(jsonResponse({ content: comments }))
      .mockResolvedValueOnce(jsonResponse({ message: 'No delete' }, false, 400));
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderComments();
    expect(await screen.findByText('Root comment')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Delete comment'));
    expect(await screen.findByText('No delete')).toBeInTheDocument();
  });
});
