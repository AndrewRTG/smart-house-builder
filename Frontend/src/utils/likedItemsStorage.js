const STORAGE_KEY = 'smarthouse:liked-items';

function getUserScope(user) {
  if (!user) return null;
  return String(user.id ?? user.email ?? user.username ?? '').trim() || null;
}

function readStore() {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStore(store) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function getStoredLikedItems(user) {
  const userScope = getUserScope(user);
  if (!userScope) return {};

  const store = readStore();
  return store[userScope] ?? {};
}

export function getStoredLike(targetType, targetId, user) {
  const key = `${targetType.toLowerCase()}-${targetId}`;
  return Boolean(getStoredLikedItems(user)[key]);
}

export function setStoredLike(targetType, targetId, isLiked, user) {
  const userScope = getUserScope(user);
  if (!userScope) return;

  const store = readStore();
  const nextUserLikes = {
    ...(store[userScope] ?? {}),
    [`${targetType.toLowerCase()}-${targetId}`]: Boolean(isLiked),
  };

  writeStore({
    ...store,
    [userScope]: nextUserLikes,
  });
}
