import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ArticleDetailPage from './ArticleDetailPage';
import ErrorBanner from '../components/ErrorBanner';
import { ErrorProvider } from '../context/ErrorContext';
import { getCurrentUser } from '../utils/currentUser';
import { getStoredLike, setStoredLike } from '../utils/likedItemsStorage';
import { renderWithRouter } from '../test/renderWithRouter';

vi.mock('../components/CommentsSection', () => ({
  default: ({ targetId, highlightCommentId }) => <div>Comments for {targetId} {highlightCommentId}</div>,
}));

vi.mock('../utils/currentUser', () => ({ getCurrentUser: vi.fn() }));
vi.mock('../utils/likedItemsStorage', () => ({
  getStoredLike: vi.fn(),
  setStoredLike: vi.fn(),
}));

function jsonResponse(body, ok = true) {
  return { ok, json: async () => body };
}

function renderArticle(route = '/articles/17?comment=4') {
  return renderWithRouter(
    <ErrorProvider>
      <ErrorBanner />
      <Routes>
        <Route path="/articles/:articleId" element={<ArticleDetailPage darkMode={false} />} />
        <Route path="/community" element={<div>Community route</div>} />
      </Routes>
    </ErrorProvider>,
    { route }
  );
}

const article = {
  id: 17,
  title: 'Bucatarie smart cu buget 1200 RON',
  content: 'Primul paragraf despre lumini si senzori.\n\nAl doilea paragraf despre automatizare si cost.',
  authorUsername: 'Mara',
  authorAvatarUrl: '/avatar.png',
  imageUrl: '/cover.png',
  createdAt: '2026-05-13T10:00:00',
  updatedAt: '2026-05-13T10:05:00',
  deviceIds: [1, 2],
  likeCount: 5,
  commentCount: 3,
};

describe('ArticleDetailPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.setItem('accessToken', 'token');
    getCurrentUser.mockResolvedValue({ username: 'ana' });
    getStoredLike.mockReturnValue(true);
    global.fetch = vi.fn((url, options = {}) => {
      if (String(url).endsWith('/like')) return Promise.resolve(jsonResponse({ isLiked: false, likeCount: 4 }));
      return Promise.resolve(jsonResponse(article));
    });
  });

  it('renders article insights and toggles likes', async () => {
    renderArticle();

    expect(await screen.findByText(article.title)).toBeInTheDocument();
    expect(screen.getAllByText('Pret 1200 RON')).toHaveLength(2);
    expect(screen.getAllByText('2 devices')).toHaveLength(2);
    expect(screen.getByText('Comments for 17 4')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /5/ }));
    await waitFor(() => expect(setStoredLike).toHaveBeenCalledWith('ARTICLE', '17', false, { username: 'ana' }));
    expect(screen.getByText('4')).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Back to Community/));
    expect(screen.getByText('Community route')).toBeInTheDocument();
  });

  it('shows login error for guest likes and not-found when fetch has no ok response', async () => {
    getCurrentUser.mockResolvedValueOnce(null);
    renderArticle();
    expect(await screen.findByText(article.title)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /5/ }));
    expect(await screen.findByText('Please login to like')).toBeInTheDocument();

    fetch.mockResolvedValueOnce(jsonResponse({}, false));
    renderArticle('/articles/18');
    expect(await screen.findByText('Article not found')).toBeInTheDocument();
  });
});
