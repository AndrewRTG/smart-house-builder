import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('authFetch', () => {
  // Two isolation strategies are combined here:
  //
  // 1. vi.resetModules() + dynamic import — gives each test a fresh module
  //    instance so the module-level `let inFlightRefresh = null` truly starts
  //    at null (a static top-level import would share that variable across all
  //    tests in the file).
  //
  // 2. vi.stubGlobal('fetch', vi.fn()) / vi.unstubAllGlobals() — gives each
  //    test a completely independent fetch mock. vi.spyOn(globalThis, 'fetch')
  //    wraps the existing spy on every call, causing call counts to accumulate
  //    across tests (test 2 sees 1+3=4, test 6 sees 1+3+2+1+1+1=9, etc.).
  //    vi.stubGlobal replaces the global outright so the returned vi.fn()
  //    always starts at 0 calls.
  let authFetch;

  beforeEach(async () => {
    vi.resetModules();
    vi.unstubAllGlobals();
    localStorage.clear();
    const mod = await import('./authFetch.js');
    authFetch = mod.authFetch;
  });

  it('adds the bearer token to authenticated requests', async () => {
    localStorage.setItem('accessToken', 'abc123');
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    );
    vi.stubGlobal('fetch', fetchMock);

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

    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        accessToken: 'new-token',
        refreshToken: 'new-refresh',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

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

    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 401 }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await authFetch('/api/v1/protected');

    expect(response.status).toBe(401);
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(authChangeListener).toHaveBeenCalled();

    window.removeEventListener('auth-change', authChangeListener);
  });

  it('skips auth header and refresh logic when skipAuth is true', async () => {
    localStorage.setItem('accessToken', 'abc123');
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(null, { status: 401 })
    );
    vi.stubGlobal('fetch', fetchMock);

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

  it('returns a synthetic response on initial network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    const response = await authFetch('/api/v1/protected');

    expect(response.status).toBe(503);
    expect(response.statusText).toBe('Network error');
  });

  it('does not try to refresh when no refresh token exists', async () => {
    localStorage.setItem('accessToken', 'old-token');
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(null, { status: 401 })
    );
    vi.stubGlobal('fetch', fetchMock);

    const response = await authFetch('/api/v1/protected');

    expect(response.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
