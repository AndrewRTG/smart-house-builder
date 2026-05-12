import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authFetch } from './authFetch';

describe('authFetch', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('adds the bearer token to authenticated requests', async () => {
    localStorage.setItem('accessToken', 'abc123');
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    );

    await authFetch('/api/v1/auth/me');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:20025/api/v1/auth/me',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer abc123',
        }),
      })
    );
  });

  it('refreshes tokens and retries once after a 401', async () => {
    localStorage.setItem('accessToken', 'old-token');
    localStorage.setItem('refreshToken', 'refresh-token');

    const authChangeListener = vi.fn();
    window.addEventListener('auth-change', authChangeListener);

    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        accessToken: 'new-token',
        refreshToken: 'new-refresh',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    const response = await authFetch('/api/v1/protected');

    expect(response.status).toBe(200);
    expect(localStorage.getItem('accessToken')).toBe('new-token');
    expect(localStorage.getItem('refreshToken')).toBe('new-refresh');
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(authChangeListener).toHaveBeenCalled();

    window.removeEventListener('auth-change', authChangeListener);
  });

  it('clears tokens when refresh fails', async () => {
    localStorage.setItem('accessToken', 'old-token');
    localStorage.setItem('refreshToken', 'refresh-token');

    const authChangeListener = vi.fn();
    window.addEventListener('auth-change', authChangeListener);

    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 401 }));

    const response = await authFetch('/api/v1/protected');

    expect(response.status).toBe(401);
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(authChangeListener).toHaveBeenCalled();

    window.removeEventListener('auth-change', authChangeListener);
  });

  it('skips auth header and refresh logic when skipAuth is true', async () => {
    localStorage.setItem('accessToken', 'abc123');
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, { status: 401 })
    );

    const response = await authFetch('/api/v1/auth/login', { skipAuth: true });

    expect(response.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:20025/api/v1/auth/login',
      expect.objectContaining({
        skipAuth: true,
        headers: {},
      })
    );
  });
});
