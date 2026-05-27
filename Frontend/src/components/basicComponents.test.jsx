import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ErrorBanner from './ErrorBanner';
import { ErrorProvider, useError } from '../context/ErrorContext';
import ProtectedRoute from './ProtectedRoute';
import NewPostModal from './NewPostModal';
import CopySetupModal from './CopySetupModal';
import ProductCard from './catalog/ProductCard';
import Sidebar from './catalog/SideBar';
import { renderWithRouter } from '../test/renderWithRouter';
import { Routes, Route, MemoryRouter } from 'react-router-dom';

vi.mock('../utils/currentUser', () => ({
  getCurrentUser: vi.fn(),
  invalidateCurrentUser: vi.fn(),
}));

function ErrorHarness() {
  const { showError, showSuccess } = useError();
  return (
    <>
      <ErrorBanner />
      <button type="button" onClick={() => showError('Broken')}>Show error</button>
      <button type="button" onClick={() => showSuccess('Saved')}>Show success</button>
    </>
  );
}

describe('shared UI components', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('shows and clears error toasts from the error context', () => {
    render(
      <ErrorProvider>
        <ErrorHarness />
      </ErrorProvider>
    );

    expect(screen.queryByText('Broken')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Show error'));
    expect(screen.getByText('Broken')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Close notification'));
    expect(screen.queryByText('Broken')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Show success'));
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  it('redirects guests and renders protected content for authenticated users', () => {
    renderWithRouter(
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<div>Private profile</div>} />
        </Route>
        <Route path="/login" element={<div>Login target</div>} />
      </Routes>,
      { route: '/profile?tab=settings' }
    );
    expect(screen.getByText('Login target')).toBeInTheDocument();

    localStorage.setItem('accessToken', 'token');
    renderWithRouter(
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<div>Private profile</div>} />
        </Route>
      </Routes>,
      { route: '/profile' }
    );
    expect(screen.getByText('Private profile')).toBeInTheDocument();
  });

  it('handles the new post modal actions and keyboard close', () => {
    const onClose = vi.fn();
    const onChooseSetup = vi.fn();
    const onChooseArticle = vi.fn();
    const { rerender } = render(
      <NewPostModal
        isOpen={false}
        onClose={onClose}
        onChooseSetup={onChooseSetup}
        onChooseArticle={onChooseArticle}
      />
    );
    expect(screen.queryByText('What would you like to create?')).not.toBeInTheDocument();

    rerender(
      <NewPostModal
        isOpen
        darkMode
        onClose={onClose}
        onChooseSetup={onChooseSetup}
        onChooseArticle={onChooseArticle}
      />
    );

    fireEvent.click(screen.getByText('New Setup'));
    fireEvent.click(screen.getByText('New Article'));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onChooseSetup).toHaveBeenCalledTimes(1);
    expect(onChooseArticle).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders product cards in grid and list modes', () => {
  const device = {
    name: 'Smart Lamp',
    imageUrl: '/lamp.png',
    bestPrice: 129,
    bestStoreName: 'Casa Tech',
    specifications: { overallPick: true, roomTag: 'Living Room' },
  };

  const { rerender } = render(
    <MemoryRouter>
      <ProductCard device={device} />
    </MemoryRouter>
  );
  
  expect(screen.getByText('Smart Lamp')).toBeInTheDocument();
  expect(screen.getByText('Living Room')).toBeInTheDocument();
  expect(screen.getByText('Casa Tech')).toBeInTheDocument();

  rerender(
    <MemoryRouter>
      <ProductCard device={device} viewMode="list" />
    </MemoryRouter>
  );
  
  expect(screen.getByText(/129/i)).toBeInTheDocument();
  expect(screen.getByText('Overall pick')).toBeInTheDocument();
});

  it('updates and resets catalog filters from the sidebar', () => {
    const setFilters = vi.fn();
    const filters = {
      minPrice: 100,
      maxPrice: 9000,
      categories: [],
      protocols: [],
      brand: '',
    };
    renderWithRouter(<Sidebar filters={filters} setFilters={setFilters} />);

    fireEvent.click(screen.getByText('Price'));
    fireEvent.change(screen.getAllByRole('slider')[0], { target: { value: '250' } });
    expect(setFilters).toHaveBeenCalledWith(expect.objectContaining({ minPrice: 250 }));

    fireEvent.click(screen.getByText('Category'));
    fireEvent.click(screen.getByLabelText('Smart Cameras'));
    expect(setFilters).toHaveBeenCalledWith(expect.objectContaining({ categories: ['Smart Cameras'] }));

    fireEvent.click(screen.getByText('+ 7 more categories'));
    expect(screen.getByLabelText('Smart Routers')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Protocol'));
    fireEvent.click(screen.getByLabelText('WiFi'));
    expect(setFilters).toHaveBeenCalledWith(expect.objectContaining({ protocols: ['WiFi'] }));

    fireEvent.click(screen.getByText('Reset Filters'));
    expect(setFilters).toHaveBeenCalledWith({
      minPrice: 0,
      maxPrice: 10000,
      categories: [],
      protocols: [],
      brand: '',
    });
  });

  it('copies setups through the copy modal', async () => {
    localStorage.setItem('accessToken', 'abc');
    const onSuccess = vi.fn();
    const onClose = vi.fn();
    global.fetch = vi.fn().mockResolvedValue({
      status: 201,
      json: async () => ({ id: 9, name: 'Copy of Kitchen' }),
    });

    render(
      <ErrorProvider>
        <CopySetupModal
          isOpen
          originalSetup={{ id: 3, name: 'Kitchen' }}
          onSuccess={onSuccess}
          onClose={onClose}
        />
      </ErrorProvider>
    );

    const input = screen.getByPlaceholderText('Enter setup name');
    expect(input).toHaveValue('Copy of Kitchen');
    fireEvent.change(input, { target: { value: 'My copy' } });
    fireEvent.click(screen.getByText('Create Draft'));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith({ id: 9, name: 'Copy of Kitchen' }));
    expect(fetch).toHaveBeenCalledWith(
      `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:20025'}/api/v1/setups/3/copy`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'My copy' }),
      })
    );
    expect(onClose).toHaveBeenCalled();
  });
});
