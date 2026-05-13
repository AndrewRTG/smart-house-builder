import { vi, describe, test, expect, beforeEach } from 'vitest';
import { captureLayoutThumbnailRoot } from './captureLayoutThumbnail';

const makeCanvas = (width = 100, height = 100): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.toDataURL = vi.fn(() => 'data:image/png;base64,AAABBBCCC');
  return canvas;
};

const makeContainer = (canvas?: HTMLCanvasElement): HTMLElement => {
  const div = document.createElement('div');
  if (canvas) div.appendChild(canvas);
  return div;
};

describe('captureLayoutThumbnailRoot', () => {
  test('returns null when el is null', async () => {
    const result = await captureLayoutThumbnailRoot(null);
    expect(result).toBeNull();
  });

  test('returns null when no canvas in element', async () => {
    const div = document.createElement('div');
    const result = await captureLayoutThumbnailRoot(div);
    expect(result).toBeNull();
  });

  test('returns null when canvas width is 0', async () => {
    const canvas = makeCanvas(0, 100);
    const el = makeContainer(canvas);
    const result = await captureLayoutThumbnailRoot(el);
    expect(result).toBeNull();
  });

  test('returns null when canvas height is 0', async () => {
    const canvas = makeCanvas(100, 0);
    const el = makeContainer(canvas);
    const result = await captureLayoutThumbnailRoot(el);
    expect(result).toBeNull();
  });

  test('returns base64 string when canvas fits in max width', async () => {
    const canvas = makeCanvas(500, 300);
    const el = makeContainer(canvas);
    const result = await captureLayoutThumbnailRoot(el);
    expect(result).toBe('AAABBBCCC');
  });

  test('returns base64 string when canvas is exactly max width', async () => {
    const canvas = makeCanvas(960, 540);
    const el = makeContainer(canvas);
    const result = await captureLayoutThumbnailRoot(el);
    expect(result).toBe('AAABBBCCC');
  });

  test('scales down when canvas wider than max width', async () => {
    const canvas = makeCanvas(1920, 1080);
    const el = makeContainer(canvas);

    const mockOffscreenCanvas = document.createElement('canvas');
    mockOffscreenCanvas.toDataURL = vi.fn(() => 'data:image/png;base64,SCALEDDATA');
    const mockCtx = { drawImage: vi.fn() };
    mockOffscreenCanvas.getContext = vi.fn(() => mockCtx) as any;

    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'canvas') return mockOffscreenCanvas as any;
      return origCreate(tag);
    });

    const result = await captureLayoutThumbnailRoot(el);
    expect(result).toBe('SCALEDDATA');
    expect(mockCtx.drawImage).toHaveBeenCalledWith(canvas, 0, 0, 960, 540);
    vi.restoreAllMocks();
  });

  test('falls back to original canvas when getContext returns null for offscreen', async () => {
    const canvas = makeCanvas(1920, 1080);
    const el = makeContainer(canvas);

    const mockOffscreenCanvas = document.createElement('canvas');
    mockOffscreenCanvas.getContext = vi.fn(() => null) as any;

    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'canvas') return mockOffscreenCanvas as any;
      return origCreate(tag);
    });

    const result = await captureLayoutThumbnailRoot(el);
    expect(result).toBe('AAABBBCCC');
    vi.restoreAllMocks();
  });

  test('returns null when toDataURL throws', async () => {
    const canvas = makeCanvas(500, 300);
    canvas.toDataURL = vi.fn(() => { throw new Error('SecurityError'); });
    const el = makeContainer(canvas);
    const result = await captureLayoutThumbnailRoot(el);
    expect(result).toBeNull();
  });

  test('returns null when toDataURL returns string without comma', async () => {
    const canvas = makeCanvas(500, 300);
    canvas.toDataURL = vi.fn(() => 'nodatahere');
    const el = makeContainer(canvas);
    const result = await captureLayoutThumbnailRoot(el);
    expect(result).toBeNull();
  });
});