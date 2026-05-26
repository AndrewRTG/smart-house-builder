import { vi, describe, test, expect, afterEach } from 'vitest';
import { captureLayoutThumbnailRoot } from './captureLayoutThumbnail';

const makeCanvas = (width = 100, height = 100): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

const makeContainer = (canvas?: HTMLCanvasElement): HTMLElement => {
  const div = document.createElement('div');
  if (canvas) div.appendChild(canvas);
  return div;
};

const mockOutputCanvas = (dataUrl = 'data:image/jpeg;base64,AAABBBCCC') => {
  const originalCreateElement = document.createElement.bind(document);

  const outputCanvas = originalCreateElement('canvas') as HTMLCanvasElement;
  const mockCtx = {
    drawImage: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    imageSmoothingEnabled: false,
    imageSmoothingQuality: 'low',
    fillStyle: '',
    font: '',
    textAlign: '',
    textBaseline: '',
  };

  outputCanvas.getContext = vi.fn(() => mockCtx) as any;
  outputCanvas.toDataURL = vi.fn(() => dataUrl);

  vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
    if (tagName === 'canvas') return outputCanvas;
    return originalCreateElement(tagName);
  });

  return { outputCanvas, mockCtx };
};

describe('captureLayoutThumbnailRoot', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

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

  test('returns base64 string when canvas fits max width', async () => {
    const canvas = makeCanvas(500, 300);
    const el = makeContainer(canvas);
    const { mockCtx } = mockOutputCanvas('data:image/jpeg;base64,AAABBBCCC');

    const result = await captureLayoutThumbnailRoot(el);

    expect(result).toBe('AAABBBCCC');
    // 500x300 canvas (aspect 5:3) letterboxed into 800x450 (16:9) output:
    // height-limited (drawH=450, drawW=750), centered horizontally (offX=25).
    expect(mockCtx.drawImage).toHaveBeenCalledWith(canvas, 25, 0, 750, 450);
  });

  test('returns base64 string when canvas is exactly max width', async () => {
    const canvas = makeCanvas(1200, 675);
    const el = makeContainer(canvas);
    const { mockCtx } = mockOutputCanvas('data:image/jpeg;base64,AAABBBCCC');

    const result = await captureLayoutThumbnailRoot(el);

    expect(result).toBe('AAABBBCCC');
    // 1200x675 already matches the 16:9 output; no letterbox needed.
    expect(mockCtx.drawImage).toHaveBeenCalledWith(canvas, 0, 0, 1200, 675);
  });

  test('scales down when canvas is wider than max width', async () => {
    const canvas = makeCanvas(1920, 1080);
    const el = makeContainer(canvas);
    const { mockCtx } = mockOutputCanvas('data:image/jpeg;base64,SCALEDDATA');

    const result = await captureLayoutThumbnailRoot(el);

    expect(result).toBe('SCALEDDATA');
    // 1920x1080 source is exactly 16:9 — fits the 1200x675 output without letterbox.
    expect(mockCtx.drawImage).toHaveBeenCalledWith(canvas, 0, 0, 1200, 675);
  });

  test('returns null when output getContext returns null', async () => {
    const canvas = makeCanvas(1920, 1080);
    const el = makeContainer(canvas);

    const originalCreateElement = document.createElement.bind(document);
    const outputCanvas = originalCreateElement('canvas') as HTMLCanvasElement;
    outputCanvas.getContext = vi.fn(() => null) as any;

    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') return outputCanvas;
      return originalCreateElement(tagName);
    });

    const result = await captureLayoutThumbnailRoot(el);

    expect(result).toBeNull();
  });

  test('draws placed device markers when placedIcons and layout are provided', async () => {
    const canvas = makeCanvas(500, 300);
    const el = makeContainer(canvas);
    const { mockCtx } = mockOutputCanvas('data:image/jpeg;base64,WITHMARKERS');

    const result = await captureLayoutThumbnailRoot(
        el,
        [{ col: 2, row: 3, type: 'router', name: 'Router', scale: 1 }],
        { offsetX: 10, offsetY: 20, dotSpacing: 30 }
    );

    expect(result).toBe('WITHMARKERS');
    expect(mockCtx.arc).toHaveBeenCalled();
    // Layout-based fallback (no DOM element with data-placed-icon attribute).
    // 500x300 source → letterboxed at offX=25, offY=0, scale 1.5 css→output.
    // Icon center = offX + offsetX*1.5 + col*(dotSpacing*1.5) = 25 + 15 + 90 = 130.
    // Icon center y = offY + offsetY*1.5 + row*(dotSpacing*1.5) = 0 + 30 + 135 = 165.
    expect(mockCtx.fillText).toHaveBeenCalledWith('R', 130, 165);
  });

  test('returns null when toDataURL throws', async () => {
    const canvas = makeCanvas(500, 300);
    const el = makeContainer(canvas);

    mockOutputCanvas();
    const outputCanvas = document.createElement('canvas');
    outputCanvas.getContext = vi.fn(() => ({
      drawImage: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      fillText: vi.fn(),
    })) as any;
    outputCanvas.toDataURL = vi.fn(() => {
      throw new Error('SecurityError');
    });

    vi.restoreAllMocks();

    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') return outputCanvas;
      return originalCreateElement(tagName);
    });

    const result = await captureLayoutThumbnailRoot(el);

    expect(result).toBeNull();
  });

  test('returns null when toDataURL returns string without comma', async () => {
    const canvas = makeCanvas(500, 300);
    const el = makeContainer(canvas);
    mockOutputCanvas('nodatahere');

    const result = await captureLayoutThumbnailRoot(el);

    expect(result).toBeNull();
  });
});