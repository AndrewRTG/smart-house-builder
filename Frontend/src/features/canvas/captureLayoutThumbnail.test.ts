import { beforeEach, describe, expect, it, vi } from 'vitest';
import { captureLayoutThumbnailRoot } from './captureLayoutThumbnail';

function makeRoot(canvas?: HTMLCanvasElement) {
  const root = document.createElement('div');
  if (canvas) root.appendChild(canvas);
  return root;
}

function makeCanvas(width: number, height: number, dataUrl = 'data:image/png;base64,abc123') {
  const canvas = document.createElement('canvas');
  Object.defineProperty(canvas, 'width', { value: width, configurable: true, writable: true });
  Object.defineProperty(canvas, 'height', { value: height, configurable: true, writable: true });
  canvas.toDataURL = vi.fn(() => dataUrl);
  return canvas;
}

describe('captureLayoutThumbnailRoot', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null when root or canvas is missing/empty', async () => {
    expect(await captureLayoutThumbnailRoot(null)).toBeNull();
    expect(await captureLayoutThumbnailRoot(makeRoot())).toBeNull();
    expect(await captureLayoutThumbnailRoot(makeRoot(makeCanvas(0, 100)))).toBeNull();
  });

  it('returns the original canvas png payload when it is below max width', async () => {
    const canvas = makeCanvas(320, 240);
    await expect(captureLayoutThumbnailRoot(makeRoot(canvas))).resolves.toBe('abc123');
    expect(canvas.toDataURL).toHaveBeenCalledWith('image/png');
  });

  it('draws a scaled canvas when the source is wider than the max width', async () => {
    const source = makeCanvas(1200, 600);
    const drawImage = vi.fn();
    const scaled = makeCanvas(1, 1, 'data:image/png;base64,scaled');
    scaled.getContext = vi.fn(() => ({ drawImage }));
    const originalCreateElement = document.createElement.bind(document);
    const createElement = vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'canvas') return scaled;
      return originalCreateElement(tag);
    });

    await expect(captureLayoutThumbnailRoot(makeRoot(source))).resolves.toBe('scaled');
    expect(drawImage).toHaveBeenCalledWith(source, 0, 0, 960, 480);
    createElement.mockRestore();
  });

  it('falls back or returns null when canvas APIs fail', async () => {
    const source = makeCanvas(1200, 600, 'data:image/png;base64,fallback');
    const scaled = makeCanvas(1, 1);
    scaled.getContext = vi.fn(() => null);
    const originalCreateElement = document.createElement.bind(document);
    const createElement = vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'canvas') return scaled;
      return originalCreateElement(tag);
    });
    await expect(captureLayoutThumbnailRoot(makeRoot(source))).resolves.toBe('fallback');

    source.toDataURL = vi.fn(() => { throw new Error('tainted'); });
    await expect(captureLayoutThumbnailRoot(makeRoot(source))).resolves.toBeNull();
    createElement.mockRestore();
  });
});
