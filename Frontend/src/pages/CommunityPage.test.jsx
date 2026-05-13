import React from 'react';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CommunityPage from './CommunityPage';
import { ErrorProvider } from '../context/ErrorContext';
import ErrorBanner from '../components/ErrorBanner';
import { getCurrentUser } from '../utils/currentUser';
import { getStoredLikedItems, setStoredLike } from '../utils/likedItemsStorage';
import { renderWithRouter } from '../test/renderWithRouter';

vi.mock('../utils/currentUser', () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock('../utils/likedItemsStorage', () => ({
  getStoredLikedItems: vi.fn(),
  setStoredLike: vi.fn(),
}));

function jsonResponse(body, ok = true, status = ok ? 200 : 500) {
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

function renderCommunity(route = '/community') {
  return renderWithRouter(
    <ErrorProvider>
      <ErrorBanner />
      <Routes>
        <Route path="/community" element={<CommunityPage darkMode={false} />} />
        <Route path="/profile" element={<div>Profile route</div>} />
        <Route path="/builder" element={<div>Builder route</div>} />
        <Route path="/articles/create" element={<div>Create article route</div>} />
        <Route path="/login" element={<div>Login route</div>} />
        <Route path="/setup/:id" element={<div>Setup detail route</div>} />
        <Route path="/article/:id" element={<div>Article detail route</div>} />
      </Routes>
    </ErrorProvider>,
    { route }
  );
}

const setups = [
  {
    id: 1,
    name: 'Kitchen Automation',
    description: 'Lights and sensors',
    createdAt: '2026-05-10T10:00:00',
    likeCount: 4,
    commentCount: 2,
    user: { username: 'Mara' },
  },
  {
    id: 2,
    name: 'Security Pack',
    description: 'Cameras and alarm',
    createdAt: '2026-05-09T10:00:00',
    likeCount: 9,
    commentCount: 1,
    user: { username: 'Dan' },
  },
];

const articles = [
  {
    id: 10,
    title: 'Matter guide',
    content: 'A practical article about Matter devices',
    authorUsername: 'Ioana',
    createdAt: [2026, 5, 11, 12, 0],
    likeCount: 3,
    commentCount: 5,
    tags: ['Matter', 'Guide'],
  },
  {
    id: 11,
    title: 'Zigbee basics',
    content: 'Smart home hub notes',
    authorUsername: 'Radu',
    createdAt: '2026-05-08T12:00:00',
    likeCount: 1,
    commentCount: 0,
    tags: ['Zigbee'],
  },
];

describe('CommunityPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('accessToken', 'token');
    getCurrentUser.mockResolvedValue({ id: 7, username: 'ana', avatarUrl: '' });
    getStoredLikedItems.mockReturnValue({ 'setup-1': true });
    global.fetch = vi.fn((url, options = {}) => {
      const target = String(url);
      if (target.includes('/setups?page=')) return Promise.resolve(jsonResponse({ content: setups }));
      if (target.includes('/articles?page=')) return Promise.resolve(jsonResponse({ content: articles }));
      if (target.includes('/wishlists')) {
        return Promise.resolve(jsonResponse({ content: [{ id: 90, setupId: 1, setupName: 'Kitchen Automation' }] }));
      }
      if (target.includes('/setups/user/published')) return Promise.resolve(jsonResponse({ content: [setups[0]] }));
      if (target.includes('/articles/user/my-articles')) return Promise.resolve(jsonResponse([{ id: 99, likeCount: 6 }]));
      if (target.includes('/setups/2/wishlist')) return Promise.resolve(jsonResponse({ saved: true }));
      if (target.includes('/setups/1/like')) return Promise.resolve(jsonResponse({ isLiked: false, likeCount: 3 }));
      if (target.includes('/articles/10/like')) return Promise.resolve(jsonResponse({ isLiked: true, likeCount: 4 }));
      return Promise.resolve(jsonResponse({}));
    });
  });

  it('loads setups, user stats, wishlist state, and filters setup cards', async () => {
    renderCommunity();

    // Increase timeout to 3s to handle parallel test execution load that can slow async rendering
    await waitFor(() => {
      expect(screen.getByText('Kitchen Automation')).toBeInTheDocument();
    }, { timeout: 3000 });
    expect(screen.getByText('Security Pack')).toBeInTheDocument();
    expect(screen.getByText('ana')).toBeInTheDocument();
    expect(screen.getByText('Posts').parentElement).toHaveTextContent('2');
    expect(screen.getByText('Likes').parentElement).toHaveTextContent('10');

    fireEvent.change(screen.getByPlaceholderText(/Search setups and articles/), {
      target: { value: 'security' },
    });
    expect(screen.queryByText('Kitchen Automation')).not.toBeInTheDocument();
    expect(screen.getByText('Security Pack')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/Search setups and articles/), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByText('Most Liked'));
    const cards = screen.getAllByRole('heading', { level: 3 });
    expect(cards[0]).toHaveTextContent('Security Pack');

    fireEvent.click(screen.getByText('Saved'));
    expect(screen.getByText('Kitchen Automation')).toBeInTheDocument();
    expect(screen.queryByText('Security Pack')).not.toBeInTheDocument();
  });

  it('handles setup wishlist, like, copy modal, and detail navigation', async () => {
    renderCommunity();
    await waitFor(() => {
      expect(screen.getByText('Security Pack')).toBeInTheDocument();
    }, { timeout: 3000 });
    await screen.findByLabelText('Remove from wishlist');

    const securityCard = screen.getByText('Security Pack').closest('.setup-card');
    fireEvent.click(within(securityCard).getByLabelText('Save to wishlist'));
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      'http://localhost:20025/api/v1/setups/2/wishlist',
      expect.objectContaining({ method: 'POST' })
    ));

    const kitchenCard = screen.getByText('Kitchen Automation').closest('.setup-card');
    fireEvent.click(within(kitchenCard).getByTitle('Like'));
    await waitFor(() => expect(setStoredLike).toHaveBeenCalledWith('SETUP', 1, false, expect.objectContaining({ username: 'ana' })));

    fireEvent.click(within(kitchenCard).getByLabelText('Copy setup'));
    expect(screen.getByText('Copy Setup')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter setup name')).toHaveValue('Copy of Kitchen Automation');

    fireEvent.click(screen.getByText('Kitchen Automation'));
    expect(screen.getByText('Setup detail route')).toBeInTheDocument();
    expect(sessionStorage.getItem('community:lastState')).toContain('"activeTab":"setups"');
  });

  it('loads article tab, filters by tag, likes articles, and opens detail', async () => {
    renderCommunity();
    expect(await screen.findByText('Kitchen Automation')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Articles'));
    expect(screen.getByText('Matter guide')).toBeInTheDocument();
    expect(screen.getByText('Zigbee basics')).toBeInTheDocument();

    const articleCard = screen.getByText('Matter guide').closest('.article-card');
    fireEvent.click(within(articleCard).getByText('Matter'));
    expect(screen.getByText('Showing:')).toBeInTheDocument();
    expect(screen.queryByText('Zigbee basics')).not.toBeInTheDocument();

    fireEvent.click(within(articleCard).getByTitle('Like'));
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      'http://localhost:20025/api/v1/articles/10/like',
      expect.objectContaining({ method: 'POST' })
    ));

    fireEvent.click(within(articleCard).getByTitle('Comments'));
    expect(screen.getByText('Article detail route')).toBeInTheDocument();
  });

  it('opens the drawer and routes new post choices for authenticated and guest users', async () => {
    const { unmount } = renderCommunity();
    expect(await screen.findByText('Kitchen Automation')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Filters'));
    expect(screen.getByLabelText('Close filters')).toBeInTheDocument();
    const drawer = screen.getByLabelText('Close filters').closest('.drawer-panel');
    fireEvent.click(within(drawer).getByText('My Setups'));
    expect(screen.getByText('Profile route')).toBeInTheDocument();
    unmount();

    const authView = renderCommunity();
    expect(await screen.findByText('Kitchen Automation')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Filters'));
    fireEvent.click(screen.getByLabelText('Close filters'));
    expect(screen.queryByLabelText('Close filters')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('New Post'));
    fireEvent.click(screen.getByText('New Setup'));
    expect(screen.getByText('Builder route')).toBeInTheDocument();
    authView.unmount();

    getCurrentUser.mockResolvedValue(null);
    renderCommunity();
    expect(await screen.findByText('Kitchen Automation')).toBeInTheDocument();
    fireEvent.click(screen.getByText('New Post'));
    fireEvent.click(screen.getByText('New Article'));
    expect(screen.getByText('Login route')).toBeInTheDocument();
  });

  it('shows login errors for guest wishlist and like actions, then routes article creation for signed-in users', async () => {
    getCurrentUser.mockResolvedValueOnce(null);
    renderCommunity();
    expect(await screen.findByText('Kitchen Automation')).toBeInTheDocument();

    const kitchenCard = screen.getByText('Kitchen Automation').closest('.setup-card');
    fireEvent.click(within(kitchenCard).getByLabelText('Save to wishlist'));
    expect(await screen.findByText('Please login to save setups')).toBeInTheDocument();

    fireEvent.click(within(kitchenCard).getByTitle('Like'));
    expect(await screen.findByText('Please login to like')).toBeInTheDocument();

    fireEvent.click(screen.getByText('New Post'));
    fireEvent.click(screen.getByText('New Setup'));
    expect(screen.getByText('Login route')).toBeInTheDocument();
  });

  it('restores previous tab state and can route authenticated article creation', async () => {
    sessionStorage.setItem('community:lastState', JSON.stringify({
      scrollY: 120,
      activeTab: 'articles',
      page: 0,
    }));
    window.scrollTo = vi.fn();

    renderCommunity('/community');
    expect(await screen.findByText('Kitchen Automation')).toBeInTheDocument();
    fireEvent.click(screen.getByText('New Post'));
    fireEvent.click(screen.getByText('New Article'));
    expect(screen.getByText('Create article route')).toBeInTheDocument();
  });
});
