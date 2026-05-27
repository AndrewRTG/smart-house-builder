import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Navbar from './Navbar';
import { getCurrentUser, invalidateCurrentUser } from '../utils/currentUser';
import { renderWithRouter } from '../test/renderWithRouter';

vi.mock('../utils/currentUser', () => ({
  getCurrentUser: vi.fn(),
  invalidateCurrentUser: vi.fn(),
}));

function makeToken(expSeconds) {
  const payload = btoa(JSON.stringify({ exp: expSeconds })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `header.${payload}.signature`;
}

describe('Navbar', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    global.fetch = vi.fn();
  });

  it('renders guest links and toggles theme', () => {
    const setDarkMode = vi.fn();
    renderWithRouter(<Navbar darkMode={false} setDarkMode={setDarkMode} />);

    expect(screen.getAllByText('Builder').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Register').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Log In').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByLabelText('Toggle dark mode'));
    expect(setDarkMode).toHaveBeenCalledWith(true);
  });

  it('loads authenticated user data and navigates from navbar actions', async () => {
    localStorage.setItem('accessToken', makeToken(Math.floor(Date.now() / 1000) + 600));
    getCurrentUser.mockResolvedValue({ username: 'andrei', avatarUrl: '/avatar.png' });

    const setDarkMode = vi.fn();
    renderWithRouter(
      <Routes>
        <Route path="/" element={<Navbar darkMode setDarkMode={setDarkMode} />} />
        <Route path="/profile" element={<div>Profile route</div>} />
        <Route path="/builder" element={<div>Builder route</div>} />
      </Routes>
    );

    expect(await screen.findByAltText('Profile')).toBeInTheDocument();
    fireEvent.error(screen.getByAltText('Profile'));
    expect(screen.getByText('A')).toBeInTheDocument();

    fireEvent.click(screen.getAllByText('Setup Wizard')[0]);
    expect(screen.getByText('Builder route')).toBeInTheDocument();
  });

  it('logs out locally even when backend logout fails', async () => {
    localStorage.setItem('accessToken', makeToken(Math.floor(Date.now() / 1000) + 600));
    localStorage.setItem('refreshToken', 'refresh');
    getCurrentUser.mockResolvedValue({ username: 'ana' });
    fetch.mockRejectedValue(new Error('offline'));

    renderWithRouter(
      <Routes>
        <Route path="/" element={<Navbar darkMode={false} setDarkMode={vi.fn()} />} />
        <Route path="/login" element={<div>Login route</div>} />
      </Routes>
    );

    expect(await screen.findAllByText('Logout')).toHaveLength(2);
    fireEvent.click(screen.getAllByText('Logout')[0]);

    await waitFor(() => expect(screen.getByText('Login route')).toBeInTheDocument());
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(invalidateCurrentUser).toHaveBeenCalled();
  });

  it('shows guest navigation when the stored token is expired', () => {
    localStorage.setItem('accessToken', makeToken(Math.floor(Date.now() / 1000) - 60));
    localStorage.setItem('refreshToken', 'refresh');

    renderWithRouter(<Navbar darkMode={false} setDarkMode={vi.fn()} />);

    expect(screen.getAllByText('Log In').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Register').length).toBeGreaterThan(0);
  });

  it('treats malformed and non-expiring tokens as valid states', async () => {
    localStorage.setItem('accessToken', 'malformed-token');
    getCurrentUser.mockResolvedValue({ username: 'fallback', profileImageUrl: '/profile.png' });

    const { unmount } = renderWithRouter(<Navbar darkMode={false} setDarkMode={vi.fn()} />);
    expect(await screen.findByAltText('Profile')).toHaveAttribute('src', '/profile.png');
    unmount();

    const noExpiryPayload = btoa(JSON.stringify({ sub: 'user-1' })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    localStorage.setItem('accessToken', `header.${noExpiryPayload}.signature`);
    getCurrentUser.mockResolvedValue({ username: 'image', imageUrl: '/image.png' });
    renderWithRouter(<Navbar darkMode={false} setDarkMode={vi.fn()} />);

    expect(await screen.findByAltText('Profile')).toHaveAttribute('src', '/image.png');
  });

  it('refreshes auth state from auth, storage, visibility and interval events', async () => {
    localStorage.setItem('accessToken', makeToken(Math.floor(Date.now() / 1000) + 600));
    getCurrentUser
      .mockResolvedValueOnce({ username: 'ana', avatarUrl: '/old.png' })
      .mockResolvedValueOnce({ username: 'ana', avatarUrl: '/fresh.png' });

    renderWithRouter(<Navbar darkMode={false} setDarkMode={vi.fn()} />);
    expect(await screen.findByAltText('Profile')).toHaveAttribute('src', '/old.png');

    window.dispatchEvent(new CustomEvent('auth-change', { detail: { avatarUrl: '/optimistic.png' } }));
    await waitFor(() => expect(getCurrentUser).toHaveBeenCalledWith({ force: true }));
    expect(await screen.findByAltText('Profile')).toHaveAttribute('src', '/fresh.png');

    localStorage.removeItem('accessToken');
    window.dispatchEvent(new StorageEvent('storage', { key: 'accessToken' }));
    await waitFor(() => expect(screen.getAllByText('Log In').length).toBeGreaterThan(0));

    localStorage.setItem('accessToken', makeToken(Math.floor(Date.now() / 1000) + 600));
    window.dispatchEvent(new StorageEvent('storage', { key: null }));
    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
});
