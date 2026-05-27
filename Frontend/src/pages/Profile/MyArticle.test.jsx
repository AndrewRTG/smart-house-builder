import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import MyArticles from './MyArticles';
import { authFetch } from '../../utils/authFetch';

vi.mock('../../utils/authFetch', () => ({
  authFetch: vi.fn(),
}));

vi.mock('../../components/catalog/ProductCard', () => ({
  default: ({ device }) => (
    <div data-testid="product-card">
      <h4>{device.name}</h4>
      <span>{device.bestPrice} EUR</span>
    </div>
  ),
}));

describe('Componenta MyArticles', () => {
  const mockDrafts = {
    content: [
      { id: 1, title: 'Draft Article 1', content: 'Content 1', tags: ['Tech'], likeCount: 5, commentCount: 2, createdAt: '2026-05-27T12:00:00Z' }
    ],
    totalPages: 1,
    totalElements: 1
  };

  const mockPublished = {
    content: [
      { id: 2, title: 'Published Article 1', content: 'Content 2', tags: ['SmartHouse'], likeCount: 12, commentCount: 4, createdAt: '2026-05-26T12:00:00Z' }
    ],
    totalPages: 1,
    totalElements: 1
  };

  const mockWishlist = {
    content: [
      { deviceId: 4595, deviceName: 'Premium Philips Hue Pack', deviceBestPrice: 349, deviceBrand: 'Philips', deviceImageUrl: '' }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();

    authFetch.mockImplementation((url) => {
      if (url.includes('/articles/user/drafts')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockDrafts) });
      }
      if (url.includes('/articles/user/published')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockPublished) });
      }
      if (url.includes('/wishlists/devices')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockWishlist) });
      }
      return Promise.resolve({ ok: false });
    });
  });

  it('randează corect tab-ul de Drafts în mod implicit', async () => {
    render(
      <MemoryRouter>
        <MyArticles isDark={false} profile={{}} />
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: /My Articles/i })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/Draft Article 1/i)).toBeInTheDocument();
    });
  });

  it('schimbă tab-ul și afișează articolele Published', async () => {
    render(
      <MemoryRouter>
        <MyArticles isDark={false} profile={{}} />
      </MemoryRouter>
    );

    const publishedTabButton = screen.getByRole('button', { name: /Published/i });
    fireEvent.click(publishedTabButton);

    await waitFor(() => {
      expect(screen.getByText(/Published Article 1/i)).toBeInTheDocument();
    });
  });

  it('schimbă tab-ul pe Wishlist și randează ProductCard cu datele din backend', async () => {
    render(
      <MemoryRouter>
        <MyArticles isDark={false} profile={{}} />
      </MemoryRouter>
    );

    const wishlistTabButton = screen.getByRole('button', { name: /Wishlist/i });
    fireEvent.click(wishlistTabButton);

    await waitFor(() => {
      expect(screen.getByText(/Premium Philips Hue Pack/i)).toBeInTheDocument();
      // 🟢 Folosim getAllByTestId pentru a accepta multiple carduri randate corect
      expect(screen.getAllByTestId('product-card').length).toBeGreaterThan(0);
    });
  });
});