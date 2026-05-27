import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

const createStorageMock = () => {
  let store = {};

  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
};

if (!globalThis.localStorage || typeof globalThis.localStorage.clear !== 'function') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: createStorageMock(),
    writable: true,
    configurable: true,
  });
}

if (!window.localStorage || typeof window.localStorage.clear !== 'function') {
  Object.defineProperty(window, 'localStorage', {
    value: globalThis.localStorage,
    writable: true,
    configurable: true,
  });
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});

globalThis.fetch = vi.fn();