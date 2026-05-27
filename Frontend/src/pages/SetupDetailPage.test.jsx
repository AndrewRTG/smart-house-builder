import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SetupDetailPage from './SetupDetailPage';
import ErrorBanner from '../components/ErrorBanner';
import { ErrorProvider } from '../context/ErrorContext';
import { getCurrentUser } from '../utils/currentUser';
import { getStoredLike, setStoredLike } from '../utils/likedItemsStorage';
import { renderWithRouter } from '../test/renderWithRouter';

vi.mock('../components/CommentsSection', () => ({
  default: ({ targetId, targetType, highlightCommentId, user }) => (
    <div>
      Comments for {targetType} {targetId} {highlightCommentId} {user?.username || 'guest'}
    </div>
  ),
}));

vi.mock('../utils/currentUser', () => ({ getCurrentUser: vi.fn() }));
vi.mock('../utils/likedItemsStorage', () => ({
  getStoredLike: vi.fn(),
  setStoredLike: vi.fn(),
}));

function jsonResponse(body, ok = true, status = ok ? 200 : 500) {
  return { ok, status, json: async () => body };
}

function renderSetup(route = '/setups/42?comment=9') {
  return renderWithRouter(
    <ErrorProvider>
      <ErrorBanner />
      <Routes>
        <Route path="/setups/:setupId" element={<SetupDetailPage darkMode={false} />} />
        <Route path="/community" element={<div>Community route</div>} />
      </Routes>
    </ErrorProvider>,
    { route }
  );
}

const setup = {
  id: 42,
  name: 'Living smart cu lumini si camera',
  description: 'Primul paragraf despre lumini smart.\n\nAl doilea paragraf despre camera si automatizare.',
  authorUsername: 'Mara',
  createdAt: '2026-05-13T08:00:00',
  updatedAt: '2026-05-13T10:30:00',
  deviceIds: [1, 2, 3],
  likeCount: 6,
  wishlistCount: 2,
  commentCount: 4,
  isPublic: true,
  copiedFromId: 7,
  status: 'PUBLISHED',
};

describe('SetupDetailPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.setItem('accessToken', 'token');
    getCurrentUser.mockResolvedValue({ username: 'ana' });
    getStoredLike.mockReturnValue(true);
    delete window.location;
    window.location = { href: '' };
    global.fetch = vi.fn((url) => {
      const target = String(url);
      if (target.endsWith('/like')) return Promise.resolve(jsonResponse({ isLiked: false, likeCount: 5 }));
      if (target.endsWith('/wishlist')) return Promise.resolve(jsonResponse({ isWishlisted: true, count: 3 }));
      return Promise.resolve(jsonResponse(setup));
    });
  });

  it('renders setup insights, comments deep link and navigates back to community', async () => {
    renderSetup();

    expect(await screen.findByText(setup.name)).toBeInTheDocument();
    expect(screen.getByText('Mara')).toBeInTheDocument();
    expect(screen.getAllByText('Living').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Public').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Copiat din alt setup').length).toBeGreaterThan(0);
    expect(screen.getByText('Primul paragraf despre lumini smart.')).toBeInTheDocument();
    expect(screen.getByText('Al doilea paragraf despre camera si automatizare.')).toBeInTheDocument();
    expect(screen.getByText('Comments for SETUP 42 9 ana')).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Back to Community/));
    expect(screen.getByText('Community route')).toBeInTheDocument();
  });

  it('toggles like and wishlist for authenticated users', async () => {
    const { container } = renderSetup();
    expect(await screen.findByText(setup.name)).toBeInTheDocument();

    const [likeButton, wishlistButton] = container.querySelectorAll('.setup-detail-actions .action-btn');
    expect(likeButton).toHaveClass('liked');

    fireEvent.click(likeButton);
    await waitFor(() => expect(setStoredLike).toHaveBeenCalledWith('SETUP', '42', false, { username: 'ana' }));
    expect(likeButton).not.toHaveClass('liked');
    expect(likeButton).toHaveTextContent('5');

    fireEvent.click(wishlistButton);
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      'http://localhost:20025/api/v1/setups/42/wishlist',
      expect.objectContaining({ method: 'POST' })
    ));
    expect(wishlistButton).toHaveClass('saved');
    expect(wishlistButton).toHaveTextContent('3');
  });

  it('shows login errors for guests and session errors for expired wishlist calls', async () => {
    getCurrentUser.mockResolvedValueOnce(null);
    const { container, unmount } = renderSetup();
    expect(await screen.findByText(setup.name)).toBeInTheDocument();

    const [guestLikeButton, guestWishlistButton] = container.querySelectorAll('.setup-detail-actions .action-btn');
    fireEvent.click(guestLikeButton);
    expect(await screen.findByText('Please login to like')).toBeInTheDocument();
    fireEvent.click(guestWishlistButton);
    expect(await screen.findByText('Please login to save')).toBeInTheDocument();
    unmount();

    getCurrentUser.mockResolvedValueOnce({ username: 'ana' });
    localStorage.removeItem('accessToken');
    const second = renderSetup('/setups/43');
    expect(await screen.findByText(setup.name)).toBeInTheDocument();

    const wishlistButton = second.container.querySelectorAll('.setup-detail-actions .action-btn')[1];
    fireEvent.click(wishlistButton);
    expect(await screen.findByText('Session expired. Please login again.')).toBeInTheDocument();
  });

  it('handles missing setups and empty setup metadata', async () => {
    fetch.mockResolvedValueOnce(jsonResponse({}, false, 404));
    const { unmount } = renderSetup();
    expect(await screen.findByText('Setup not found')).toBeInTheDocument();
    unmount();

    fetch.mockResolvedValueOnce(jsonResponse({
      id: 55,
      name: 'Minimal setup',
      description: '',
      authorUsername: '',
      createdAt: null,
      updatedAt: null,
      deviceIds: [],
      likeCount: 0,
      wishlistCount: 0,
      commentCount: 0,
      isPublic: false,
      copiedFromId: null,
      status: null,
    }));

    renderSetup('/setups/55');

    expect(await screen.findByText('Minimal setup')).toBeInTheDocument();
    expect(screen.getByText('Acest setup nu are descriere inca.')).toBeInTheDocument();
    expect(screen.getAllByText('Privat').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Setup original').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Fara status').length).toBeGreaterThan(0);
    expect(screen.getByText(/Comments for SETUP 55\s+ana/)).toBeInTheDocument();
  });

  it('renders thumbnail device snapshots and exercises the lightbox controls', async () => {
    fetch.mockResolvedValueOnce(jsonResponse({
      ...setup,
      thumbnailUrl: '/layout.png',
      deviceSnapshots: JSON.stringify([
        { id: 1, name: 'Matter Hub', brand: 'Aqara', priceEUR: 99.49 },
        { id: 2, name: '', priceEUR: null },
      ]),
      description: 'x '.repeat(120),
      status: 'draft',
      isPublic: false,
      publishedAt: null,
    }));

    renderSetup('/setups/88');

    expect(await screen.findByText('Matter Hub')).toBeInTheDocument();
    expect(screen.getByText('Aqara')).toBeInTheDocument();
    expect(screen.getByText('Total: 99 EUR')).toBeInTheDocument();
    expect(screen.getAllByText(/^x x x/).length).toBeGreaterThan(1);

    const preview = screen.getByTitle('Click pentru zoom');
    fireEvent.keyDown(preview, { key: 'Enter' });
    expect(screen.getByLabelText('Close zoom')).toBeInTheDocument();

    fireEvent.click(screen.getByTitle('Zoom in (+)'));
    expect(screen.getByText('125%')).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Zoom out (-)'));
    expect(screen.getByText('100%')).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Reset (0)'));
    fireEvent.keyDown(window, { key: '+' });
    expect(screen.getByText('125%')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: '-' });
    fireEvent.keyDown(window, { key: '0' });
    expect(screen.getByText('100%')).toBeInTheDocument();

    fireEvent.error(screen.getAllByAltText(setup.name)[0]);
    fireEvent.click(screen.getByTitle('Close (Esc)'));
    expect(screen.queryByLabelText('Close zoom')).not.toBeInTheDocument();

    fireEvent.click(preview);
    const overlay = screen.getByLabelText('Close zoom');
    fireEvent.click(screen.getAllByAltText(setup.name)[1]);
    expect(screen.getByLabelText('Close zoom')).toBeInTheDocument();
    fireEvent.click(overlay);
    expect(screen.queryByLabelText('Close zoom')).not.toBeInTheDocument();
  });

  it('handles fetch, like, wishlist and malformed snapshot failures', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    fetch.mockRejectedValueOnce(new Error('load failed'));
    const { unmount } = renderSetup('/setups/99');
    expect(await screen.findByText('Setup not found')).toBeInTheDocument();
    expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch setup:', expect.any(Error));
    unmount();

    fetch.mockResolvedValueOnce(jsonResponse({
      ...setup,
      id: 91,
      deviceSnapshots: '{bad json',
    }));
    const first = renderSetup('/setups/91');
    expect(await screen.findByText(setup.name)).toBeInTheDocument();
    expect(screen.queryByText('Device-uri folosite')).not.toBeInTheDocument();
    first.unmount();

    getCurrentUser.mockResolvedValueOnce({ username: 'ana' });
    fetch.mockImplementation((url) => {
      const target = String(url);
      if (target.endsWith('/like')) return Promise.reject(new Error('like offline'));
      if (target.endsWith('/wishlist')) return Promise.resolve(jsonResponse({}, false, 401));
      return Promise.resolve(jsonResponse(setup));
    });

    const second = renderSetup('/setups/92');
    expect(await screen.findByText(setup.name)).toBeInTheDocument();
    const [likeButton, wishlistButton] = second.container.querySelectorAll('.setup-detail-actions .action-btn');
    fireEvent.click(likeButton);
    await waitFor(() => expect(consoleSpy).toHaveBeenCalledWith('Failed to toggle like:', expect.any(Error)));

    fireEvent.click(wishlistButton);
    expect(await screen.findByText('Session expired. Please login again.')).toBeInTheDocument();
    expect(window.location.href).toBe('/login');
    second.unmount();

    window.location.href = '';
    localStorage.setItem('accessToken', 'token');
    getCurrentUser.mockResolvedValueOnce({ username: 'ana' });
    fetch.mockImplementation((url) => {
      const target = String(url);
      if (target.endsWith('/wishlist')) return Promise.reject(new Error('wishlist offline'));
      return Promise.resolve(jsonResponse(setup));
    });

    const third = renderSetup('/setups/93');
    expect(await screen.findByText(setup.name)).toBeInTheDocument();
    const failedWishlistButton = third.container.querySelectorAll('.setup-detail-actions .action-btn')[1];
    fireEvent.click(failedWishlistButton);
    await waitFor(() => expect(consoleSpy).toHaveBeenCalledWith('Failed to toggle wishlist:', expect.any(Error)));
  });
});
