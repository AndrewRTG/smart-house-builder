import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CatalogPage from './CatalogPage';

vi.mock('../components/catalog/SideBar', () => ({
  default: ({ setFilters }) => (
    <aside>
      <button
        type="button"
        onClick={() => setFilters({
          minPrice: 50,
          maxPrice: 500,
          categories: ['Smart Cameras', 'Unknown Category'],
          protocols: ['Matter', 'WiFi'],
          brand: '',
        })}
      >
        Apply filters
      </button>
    </aside>
  ),
}));

vi.mock('../components/catalog/ProductCard.jsx', () => ({
  default: ({ device, viewMode }) => (
    <article data-testid="product-card">
      <h2>{device.name}</h2>
      <span>{device.brand}</span>
      <span>{device.bestPrice}</span>
      <span>{viewMode}</span>
    </article>
  ),
}));

const devices = [
  { id: 1, name: 'Zeta Camera', brand: 'ZBrand', bestPrice: 300, createdAt: '2026-05-10T10:00:00' },
  { id: 2, name: 'Alpha Hub', brand: 'ABrand', bestPrice: 100, createdAt: '2026-05-11T10:00:00' },
  { id: 3, name: 'Beta Sensor', brand: 'BBrand', bestPrice: 200, createdAt: '2026-05-09T10:00:00' },
];

function jsonResponse(body) {
  return { json: async () => body };
}

async function advanceCatalogDebounce() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 250));
  });
}

describe('CatalogPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn(() => Promise.resolve(jsonResponse(devices)));
  });

  it('loads devices, switches layout, and sorts by every visible option', async () => {
    const { container } = render(<CatalogPage darkMode={false} />);

    expect(screen.getByText('Searching products...')).toBeInTheDocument();
    await advanceCatalogDebounce();
    expect(await screen.findByText('Alpha Hub')).toBeInTheDocument();

    const orderedNames = () => screen.getAllByTestId('product-card').map((card) => within(card).getByRole('heading').textContent);
    expect(orderedNames()).toEqual(['Alpha Hub', 'Beta Sensor', 'Zeta Camera']);

    fireEvent.click(screen.getByText('Name'));
    expect(orderedNames()).toEqual(['Alpha Hub', 'Beta Sensor', 'Zeta Camera']);

    fireEvent.click(screen.getByText('Brand'));
    expect(orderedNames()).toEqual(['Alpha Hub', 'Beta Sensor', 'Zeta Camera']);

    fireEvent.click(screen.getByText('Date added'));
    expect(orderedNames()).toEqual(['Beta Sensor', 'Zeta Camera', 'Alpha Hub']);

    fireEvent.click(screen.getByTitle('Sort Ascending'));
    expect(orderedNames()).toEqual(['Alpha Hub', 'Zeta Camera', 'Beta Sensor']);

    fireEvent.click(container.querySelector('.btn-group button'));
    expect(screen.getAllByText('list')).toHaveLength(3);

    fireEvent.click(container.querySelectorAll('.btn-group button')[1]);
    expect(screen.getAllByText('grid')).toHaveLength(3);

    fireEvent.click(screen.getByText('Price'));
    expect(orderedNames()).toEqual(['Zeta Camera', 'Beta Sensor', 'Alpha Hub']);
  });

  it('passes search, category, protocol, and price filters to the API', async () => {
    render(<CatalogPage darkMode />);
    await advanceCatalogDebounce();
    await screen.findByText('Alpha Hub');

    fireEvent.change(screen.getByPlaceholderText(/Search by brand/), { target: { value: 'philips' } });
    await advanceCatalogDebounce();

    fireEvent.click(screen.getByText('Apply filters'));
    await advanceCatalogDebounce();

    await waitFor(() => {
      const lastUrl = new URL(String(fetch.mock.calls.at(-1)[0]));
      expect(lastUrl.searchParams.get('brand')).toBe('philips');
      expect(lastUrl.searchParams.get('minPrice')).toBe('50');
      expect(lastUrl.searchParams.get('maxPrice')).toBe('500');
      expect(lastUrl.searchParams.getAll('categoryIds')).toEqual(['1']);
      const actualProtocols = lastUrl.searchParams.getAll('protocols');
      const lowerCaseProtocols = actualProtocols.map(p => p.toLowerCase());
      expect(lowerCaseProtocols).toContain('matter');
      expect(lowerCaseProtocols).toContain('wifi');
    });
  });

  it('shows the empty state and recovers from failed fetches', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    fetch.mockResolvedValueOnce(jsonResponse([]));

    const { unmount } = render(<CatalogPage darkMode={false} />);
    await advanceCatalogDebounce();
    expect(await screen.findByText('No products found.')).toBeInTheDocument();
    unmount();

    fetch.mockRejectedValueOnce(new Error('offline'));
    render(<CatalogPage darkMode={false} />);
    await advanceCatalogDebounce();
    expect(await screen.findByText('No products found.')).toBeInTheDocument();
    expect(consoleSpy).toHaveBeenCalled();
  });
});
