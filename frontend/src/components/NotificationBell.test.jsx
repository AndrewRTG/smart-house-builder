import React from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import NotificationBell from './NotificationBell';
import { renderWithRouter } from '../test/renderWithRouter';

function jsonResponse(body, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function renderBell(props = {}) {
  return renderWithRouter(
    <Routes>
      <Route path="*" element={<NotificationBell darkMode={false} {...props} />} />
      <Route path="/profile" element={<div>Profile page</div>} />
    </Routes>
  );
}

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not fetch and shows no badge when unauthenticated', () => {
    renderBell();
    expect(fetch).not.toHaveBeenCalled();
    expect(screen.queryByText(/\d/)).not.toBeInTheDocument();
  });

  it('shows badge with the fetched unread count', async () => {
    localStorage.setItem('accessToken', 'token');
    fetch.mockResolvedValue(jsonResponse(5));

    renderBell();

    await waitFor(() => expect(screen.getByText('5')).toBeInTheDocument());
  });

  it('caps the badge at 99+', async () => {
    localStorage.setItem('accessToken', 'token');
    fetch.mockResolvedValue(jsonResponse(150));

    renderBell();

    await waitFor(() => expect(screen.getByText('99+')).toBeInTheDocument());
  });

  it('hides the badge when count is 0', async () => {
    localStorage.setItem('accessToken', 'token');
    fetch.mockResolvedValue(jsonResponse(0));

    renderBell();

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('sets count to 0 when the server returns a non-ok response', async () => {
    localStorage.setItem('accessToken', 'token');
    fetch.mockResolvedValue(jsonResponse(null, 401));

    renderBell();

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(screen.queryByText(/\d/)).not.toBeInTheDocument();
  });

  it('does not crash on network error', async () => {
    localStorage.setItem('accessToken', 'token');
    fetch.mockRejectedValue(new Error('offline'));

    renderBell();

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('sends PATCH, clears badge, and navigates on click', async () => {
    localStorage.setItem('accessToken', 'token');
    fetch
      .mockResolvedValueOnce(jsonResponse(3))
      .mockResolvedValue(jsonResponse({}, 200));

    renderBell();

    await waitFor(() => expect(screen.getByText('3')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => expect(screen.getByText('Profile page')).toBeInTheDocument());
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:20025/api/v1/notifications/read-all',
      expect.objectContaining({ method: 'PATCH' })
    );
    expect(screen.queryByText('3')).not.toBeInTheDocument();
  });

  it('navigates even when PATCH fails', async () => {
    localStorage.setItem('accessToken', 'token');
    fetch
      .mockResolvedValueOnce(jsonResponse(2))
      .mockRejectedValue(new Error('offline'));

    renderBell();

    await waitFor(() => expect(screen.getByText('2')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => expect(screen.getByText('Profile page')).toBeInTheDocument());
  });

  it('re-fetches when the tab becomes visible', async () => {
    localStorage.setItem('accessToken', 'token');
    fetch.mockResolvedValue(jsonResponse(1));

    renderBell();
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  });

  it('polls every 30 seconds', async () => {
    vi.useFakeTimers();
    localStorage.setItem('accessToken', 'token');
    fetch.mockResolvedValue(jsonResponse(1));

    renderBell();

    await act(async () => { await Promise.resolve(); });
    expect(fetch).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(30_000);
      await Promise.resolve();
    });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('shows a count-specific aria-label when there are unread notifications', async () => {
    localStorage.setItem('accessToken', 'token');
    fetch.mockResolvedValue(jsonResponse(4));

    renderBell();

    await waitFor(() =>
      expect(screen.getByRole('button', { name: '4 unread notifications' })).toBeInTheDocument()
    );
  });

  it('shows a generic aria-label when there are no unread notifications', async () => {
    localStorage.setItem('accessToken', 'token');
    fetch.mockResolvedValue(jsonResponse(0));

    renderBell();

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument();
  });

  it('applies dark-mode class when darkMode prop is true', async () => {
    localStorage.setItem('accessToken', 'token');
    fetch.mockResolvedValue(jsonResponse(0));

    renderBell({ darkMode: true });

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(screen.getByRole('button')).toHaveClass('dark-mode');
  });
});
