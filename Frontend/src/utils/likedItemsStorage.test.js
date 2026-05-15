import { beforeEach, describe, expect, it } from 'vitest';
import { getStoredLike, getStoredLikedItems, setStoredLike } from './likedItemsStorage';

describe('likedItemsStorage', () => {
  const user = { id: 42, email: 'user@example.com' };

  beforeEach(() => {
    localStorage.clear();
  });

  it('returns an empty store when no user scope exists', () => {
    expect(getStoredLikedItems(null)).toEqual({});
    expect(getStoredLike('article', 1, null)).toBe(false);
  });

  it('persists likes scoped by user', () => {
    setStoredLike('article', 5, true, user);

    expect(getStoredLike('article', 5, user)).toBe(true);
    expect(getStoredLikedItems(user)).toEqual({ 'article-5': true });
  });

  it('keeps likes isolated between users', () => {
    setStoredLike('setup', 7, true, { id: 1 });
    setStoredLike('setup', 7, false, { id: 2 });

    expect(getStoredLike('setup', 7, { id: 1 })).toBe(true);
    expect(getStoredLike('setup', 7, { id: 2 })).toBe(false);
  });

  it('falls back to an empty object when localStorage is corrupted', () => {
    localStorage.setItem('smarthouse:liked-items', '{not-json');

    expect(getStoredLikedItems(user)).toEqual({});
  });
});
