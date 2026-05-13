import { vi, describe, test, expect, beforeEach } from 'vitest';
import {
  drawWindow,
  drawDoor,
  getFurnitureDimensions,
  getFurnitureImage,
  windowImgLight,
  windowImgDark,
  doorImgLight,
  doorImgDark,
} from './CanvasUtils';

const makeCtx = () => ({
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  drawImage: vi.fn(),
  globalAlpha: 1,
  imageSmoothingEnabled: true,
});

describe('CanvasUtils - Full Coverage Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('drawWindow', () => {
    test('draws window light mode when image complete', () => {
      const ctx = makeCtx();
      Object.defineProperty(windowImgLight, 'complete', { value: true, configurable: true });
      drawWindow(ctx as any, 0, 0, 100, 0, false, false);
      expect(ctx.save).toHaveBeenCalled();
      expect(ctx.drawImage).toHaveBeenCalled();
      expect(ctx.restore).toHaveBeenCalled();
    });

    test('draws window dark mode when image complete', () => {
      const ctx = makeCtx();
      Object.defineProperty(windowImgDark, 'complete', { value: true, configurable: true });
      drawWindow(ctx as any, 0, 0, 100, 0, false, true);
      expect(ctx.drawImage).toHaveBeenCalled();
    });

    test('draws window in preview mode (half alpha)', () => {
      const ctx = makeCtx();
      Object.defineProperty(windowImgLight, 'complete', { value: true, configurable: true });
      drawWindow(ctx as any, 0, 0, 0, 100, true, false);
      expect(ctx.globalAlpha).toBe(0.5);
    });

    test('returns early when image not complete', () => {
      const ctx = makeCtx();
      Object.defineProperty(windowImgLight, 'complete', { value: false, configurable: true });
      drawWindow(ctx as any, 0, 0, 100, 100, false, false);
      expect(ctx.drawImage).not.toHaveBeenCalled();
    });

    test('handles diagonal line (dx and dy both nonzero)', () => {
      const ctx = makeCtx();
      Object.defineProperty(windowImgLight, 'complete', { value: true, configurable: true });
      drawWindow(ctx as any, 0, 0, 50, 50, false, false);
      expect(ctx.save).toHaveBeenCalled();
    });
  });

  describe('drawDoor', () => {
    test('draws door light mode when image complete', () => {
      const ctx = makeCtx();
      Object.defineProperty(doorImgLight, 'complete', { value: true, configurable: true });
      drawDoor(ctx as any, 0, 0, 100, 0, false, false);
      expect(ctx.save).toHaveBeenCalled();
      expect(ctx.drawImage).toHaveBeenCalled();
      expect(ctx.restore).toHaveBeenCalled();
    });

    test('draws door dark mode', () => {
      const ctx = makeCtx();
      Object.defineProperty(doorImgDark, 'complete', { value: true, configurable: true });
      drawDoor(ctx as any, 0, 0, 100, 0, false, true);
      expect(ctx.drawImage).toHaveBeenCalled();
    });

    test('draws door in preview mode', () => {
      const ctx = makeCtx();
      Object.defineProperty(doorImgLight, 'complete', { value: true, configurable: true });
      drawDoor(ctx as any, 0, 0, 0, 100, true, false);
      expect(ctx.globalAlpha).toBe(0.5);
    });

    test('returns early when door image not complete', () => {
      const ctx = makeCtx();
      Object.defineProperty(doorImgLight, 'complete', { value: false, configurable: true });
      drawDoor(ctx as any, 0, 0, 100, 100, false, false);
      expect(ctx.drawImage).not.toHaveBeenCalled();
    });

    test('handles vertical door line', () => {
      const ctx = makeCtx();
      Object.defineProperty(doorImgLight, 'complete', { value: true, configurable: true });
      drawDoor(ctx as any, 50, 0, 50, 100, false, false);
      expect(ctx.save).toHaveBeenCalled();
    });
  });

  describe('getFurnitureDimensions', () => {
    test('returns bed dimensions at scale 1, rotation 0', () => {
      const result = getFurnitureDimensions('bed', 1, 0);
      expect(result).toEqual({ w: 4, h: 3 });
    });

    test('returns bed dimensions at scale 2, rotation 0', () => {
      const result = getFurnitureDimensions('bed', 2, 0);
      expect(result).toEqual({ w: 8, h: 6 });
    });

    test('swaps w and h for bed at rotation 90', () => {
      const result = getFurnitureDimensions('bed', 1, 90);
      expect(result).toEqual({ w: 3, h: 4 });
    });

    test('swaps w and h for bed at rotation 270', () => {
      const result = getFurnitureDimensions('bed', 1, 270);
      expect(result).toEqual({ w: 3, h: 4 });
    });

    test('does not swap at rotation 180', () => {
      const result = getFurnitureDimensions('bed', 1, 180);
      expect(result).toEqual({ w: 4, h: 3 });
    });

    test('returns table dimensions', () => {
      const result = getFurnitureDimensions('table', 1, 0);
      expect(result).toEqual({ w: 3, h: 3 });
    });

    test('returns couch dimensions', () => {
      const result = getFurnitureDimensions('couch', 1, 0);
      expect(result).toEqual({ w: 2, h: 4 });
    });

    test('handles furniture_ prefix', () => {
      const result = getFurnitureDimensions('furniture_bed', 1, 0);
      expect(result).toEqual({ w: 4, h: 3 });
    });

    test('returns default 2x2 for unknown type', () => {
      const result = getFurnitureDimensions('unknown_xyz', 1, 0);
      expect(result).toEqual({ w: 2, h: 2 });
    });

    test('handles scale 3 with table', () => {
      const result = getFurnitureDimensions('table', 3, 0);
      expect(result).toEqual({ w: 9, h: 9 });
    });

    test('couch at rotation 90 swaps dims', () => {
      const result = getFurnitureDimensions('couch', 1, 90);
      expect(result).toEqual({ w: 4, h: 2 });
    });
  });

  describe('getFurnitureImage', () => {
    test('returns image for bed light mode', () => {
      const img = getFurnitureImage('bed', false);
      expect(img).toBeInstanceOf(HTMLImageElement);
    });

    test('returns image for bed dark mode', () => {
      const img = getFurnitureImage('bed', true);
      expect(img).toBeInstanceOf(HTMLImageElement);
    });

    test('returns image for table', () => {
      const img = getFurnitureImage('table', false);
      expect(img).toBeInstanceOf(HTMLImageElement);
    });

    test('returns image for couch', () => {
      const img = getFurnitureImage('couch', false);
      expect(img).toBeInstanceOf(HTMLImageElement);
    });

    test('returns image with shouldFill=true', () => {
      const img = getFurnitureImage('bed', false, true);
      expect(img).toBeInstanceOf(HTMLImageElement);
    });

    test('returns image with shouldFill=true dark mode', () => {
      const img = getFurnitureImage('bed', true, true);
      expect(img).toBeInstanceOf(HTMLImageElement);
    });

    test('returns same cached image on second call', () => {
      const img1 = getFurnitureImage('table', false, false);
      const img2 = getFurnitureImage('table', false, false);
      expect(img1).toBe(img2);
    });

    test('handles furniture_ prefix', () => {
      const img = getFurnitureImage('furniture_bed', false);
      expect(img).toBeInstanceOf(HTMLImageElement);
    });

    test('returns empty Image for unknown type', () => {
      const img = getFurnitureImage('unknown_thing', false);
      expect(img).toBeInstanceOf(HTMLImageElement);
    });
  });

  describe('Exported images', () => {
    test('windowImgLight is an HTMLImageElement', () => {
      expect(windowImgLight).toBeInstanceOf(HTMLImageElement);
    });

    test('windowImgDark is an HTMLImageElement', () => {
      expect(windowImgDark).toBeInstanceOf(HTMLImageElement);
    });

    test('doorImgLight is an HTMLImageElement', () => {
      expect(doorImgLight).toBeInstanceOf(HTMLImageElement);
    });

    test('doorImgDark is an HTMLImageElement', () => {
      expect(doorImgDark).toBeInstanceOf(HTMLImageElement);
    });

    test('windowImgLight has a src', () => {
      expect(windowImgLight.src).toBeTruthy();
    });

    test('doorImgLight has a src', () => {
      expect(doorImgLight.src).toBeTruthy();
    });
  });
});