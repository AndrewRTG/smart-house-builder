import { beforeEach, describe, expect, it, vi } from 'vitest';

const authFetchMock = vi.fn();

vi.mock('./authFetch', () => ({
  authFetch: authFetchMock,
}));

import { getCurrentUser, invalidateCurrentUser } from './currentUser';

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
});
