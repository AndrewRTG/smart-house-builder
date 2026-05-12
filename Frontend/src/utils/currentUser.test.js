import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./authFetch', () => ({
  authFetch: vi.fn(),
}));

import { getCurrentUser, invalidateCurrentUser } from './currentUser';
import { authFetch } from './authFetch';

const authFetchMock = vi.mocked(authFetch);

describe('currentUser cache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    invalidateCurrentUser();
  });

  it('returns null without calling the backend when no token exists', async () => {
    await expect(getCurrentUser()).resolves.toBeNull();
    expect(authFetchMock).not.toHaveBeenCalled();
  });

  it('caches a successful response until invalidated', async () => {
    const user = { id: 7, email: 'test@example.com' };
    authFetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(user),
    });
    localStorage.setItem('accessToken', 'token');

    await expect(getCurrentUser()).resolves.toEqual(user);
    await expect(getCurrentUser()).resolves.toEqual(user);
    expect(authFetchMock).toHaveBeenCalledTimes(1);
  });

  it('drops the cache after an auth-change event', async () => {
    authFetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ id: 1 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ id: 2 }),
      });
    localStorage.setItem('accessToken', 'token');

    await expect(getCurrentUser()).resolves.toEqual({ id: 1 });
    window.dispatchEvent(new Event('auth-change'));
    await expect(getCurrentUser()).resolves.toEqual({ id: 2 });
    expect(authFetchMock).toHaveBeenCalledTimes(2);
  });

  it('returns null and does not cache a user when the response is not ok', async () => {
    authFetchMock.mockResolvedValue({ ok: false });
    localStorage.setItem('accessToken', 'token');

    await expect(getCurrentUser()).resolves.toBeNull();
    await expect(getCurrentUser({ force: true })).resolves.toBeNull();
    expect(authFetchMock).toHaveBeenCalledTimes(2);
  });

  it('returns null when authFetch throws', async () => {
    authFetchMock.mockRejectedValue(new Error('boom'));
    localStorage.setItem('accessToken', 'token');

    await expect(getCurrentUser()).resolves.toBeNull();
  });
});
