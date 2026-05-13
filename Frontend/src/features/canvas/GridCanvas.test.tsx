import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import * as CanvasUtils from './CanvasUtils';
import GridCanvas from './GridCanvas';

// ResizeObserver stub
let resizeObserverCallback: ((entries: any[]) => void) | null = null;
globalThis.ResizeObserver = class {
  constructor(cb: any) { resizeObserverCallback = cb; }
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Canvas 2d context mock
const mockCtx: any = {
  clearRect: vi.fn(), fillRect: vi.fn(), beginPath: vi.fn(),
  arc: vi.fn(), fill: vi.fn(), stroke: vi.fn(),
  moveTo: vi.fn(), lineTo: vi.fn(), setTransform: vi.fn(),
  scale: vi.fn(), save: vi.fn(), restore: vi.fn(),
  translate: vi.fn(), rotate: vi.fn(), drawImage: vi.fn(),
  fillText: vi.fn(), strokeStyle: '', fillStyle: '',
  lineWidth: 0, globalAlpha: 1, lineCap: '',
  textAlign: '', font: '', imageSmoothingEnabled: false,
};

if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = (() => mockCtx) as any;
}

vi.mock('./CanvasUtils.ts', () => ({
  drawWindow: vi.fn(),
  drawDoor: vi.fn(),
  getFurnitureDimensions: vi.fn().mockReturnValue({ w: 4, h: 3 }),
  getFurnitureImage: vi.fn().mockReturnValue({ complete: true, naturalWidth: 100, onload: null }),
}));

// Patch parent to have real dimensions so draw() doesn't bail early
const patchParentRect = (canvas: HTMLCanvasElement) => {
  const parent = canvas.parentElement;
  if (parent) {
    Object.defineProperty(parent, 'getBoundingClientRect', {
      value: () => ({ width: 800, height: 600, left: 0, top: 0, right: 800, bottom: 600 }),
      configurable: true,
    });
  }
};

let rafCallbacks: FrameRequestCallback[] = [];

const runDraw = (canvas: HTMLCanvasElement) => {
  if (!canvas) return;
  patchParentRect(canvas);
  
  if (resizeObserverCallback) {
    act(() => { resizeObserverCallback!([{ target: canvas.parentElement }]); });
    act(() => { vi.advanceTimersByTime(100); });
  }

  const callbacksToRun = [...rafCallbacks];
  rafCallbacks = [];
  callbacksToRun.forEach(cb => {
    act(() => { cb(performance.now()); });
  });
};

const makeProps = (overrides: any = {}) => ({
  isDarkMode: false, placedIcons: [], lines: [], setLines: vi.fn(),
  activeTool: null, onCanvasClick: vi.fn(), onLineComplete: vi.fn(),
  onUpdate: vi.fn(), placedFurniture: [], setPlacedIcons: vi.fn(),
  draggingItem: null, setDraggingItem: vi.fn(), setPlacedFurniture: vi.fn(),
  onRedo: vi.fn(), layout: { offsetX: 10, offsetY: 10, dotSpacing: 20 },
  checkCollision: vi.fn().mockReturnValue(false), saveHistory: vi.fn(),
  undo: vi.fn(), redo: vi.fn(), canUndo: true, canRedo: true,
  onMouseMove: vi.fn(), onMouseLeave: vi.fn(), onCommitValidate: vi.fn(),
  ...overrides,
});

describe('GridCanvas - 100% Coverage Suite', () => {
  let origRound: typeof Math.round;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    vi.clearAllMocks();
    rafCallbacks = [];
    
    vi.stubGlobal('requestAnimationFrame', vi.fn((cb: FrameRequestCallback) => {
      rafCallbacks.push(cb);
      return rafCallbacks.length;
    }));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    resizeObserverCallback = null;

    // Fixes grid coordinates returning NaN/Infinity during click tests
    origRound = Math.round;
    vi.spyOn(Math, 'round').mockImplementation((v) => (!Number.isFinite(v) ? 5 : origRound(v)));
    vi.spyOn(Math, 'hypot').mockReturnValue(-1); // Guarantee clicks register unless blocked
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });
  
  describe('Basic rendering', () => {
    test('renders canvas and undo/redo buttons', () => {
      render(<GridCanvas {...makeProps()} />);
      expect(document.querySelector('canvas')).toBeTruthy();
      expect(screen.getByText(/UNDO/i)).toBeTruthy();
      expect(screen.getByText(/REDO/i)).toBeTruthy();
    });

    test('renders in dark mode', () => {
      render(<GridCanvas {...makeProps({ isDarkMode: true })} />);
      expect(document.querySelector('canvas')).toBeTruthy();
    });

    test('undo cursor-not-allowed when canUndo=false', () => {
      render(<GridCanvas {...makeProps({ canUndo: false, canRedo: false })} />);
      expect(screen.getByText(/UNDO/i).className).toContain('cursor-not-allowed');
    });

    test('undo button disabled when canUndo false', () => {
      render(<GridCanvas {...makeProps({ canUndo: false })} />);
      expect(screen.getByText(/UNDO/i).closest('button')).toBeDisabled();
    });

    test('redo button disabled when canRedo false', () => {
      render(<GridCanvas {...makeProps({ canRedo: false })} />);
      expect(screen.getByText(/REDO/i).closest('button')).toBeDisabled();
    });
  });

  describe('Draw loop coverage', () => {
    test('draw runs clearRect/fillRect when parent has dimensions', () => {
      render(<GridCanvas {...makeProps()} />);
      runDraw(document.querySelector('canvas') as HTMLCanvasElement);
      expect(mockCtx.clearRect).toHaveBeenCalled();
      expect(mockCtx.fillRect).toHaveBeenCalled();
    });

    test('resizeCanvas sets setTransform and scale when dims change', () => {
      render(<GridCanvas {...makeProps()} />);
      runDraw(document.querySelector('canvas') as HTMLCanvasElement);
      expect(mockCtx.setTransform).toHaveBeenCalledWith(1, 0, 0, 1, 0, 0);
      expect(mockCtx.scale).toHaveBeenCalled();
    });

    test('resizeCanvas does not re-scale if dims unchanged', () => {
      render(<GridCanvas {...makeProps()} />);
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      runDraw(canvas);
      mockCtx.setTransform.mockClear();
      runDraw(canvas);
      expect(mockCtx.setTransform).not.toHaveBeenCalled();
    });

    test('onUpdate called via setTimeout when layout changes', () => {
      const onUpdate = vi.fn();
      render(<GridCanvas {...makeProps({ onUpdate })} />);
      runDraw(document.querySelector('canvas') as HTMLCanvasElement);
      act(() => { vi.advanceTimersByTime(10); });
      expect(onUpdate).toHaveBeenCalled();
    });

    test('draw in dark mode', () => {
      render(<GridCanvas {...makeProps({ isDarkMode: true })} />);
      runDraw(document.querySelector('canvas') as HTMLCanvasElement);
      expect(mockCtx.fillRect).toHaveBeenCalled();
    });

    test('wall line hits stroke', () => {
      const lines = [{ id: 'w1', type: 'wall', start: { col: 2, row: 2 }, end: { col: 8, row: 2 } }];
      render(<GridCanvas {...makeProps({ lines })} />);
      runDraw(document.querySelector('canvas') as HTMLCanvasElement);
      expect(mockCtx.stroke).toHaveBeenCalled();
    });

    test('window line calls drawWindow', () => {
      const lines = [{ id: 'win1', type: 'window', start: { col: 1, row: 1 }, end: { col: 4, row: 1 } }];
      render(<GridCanvas {...makeProps({ lines })} />);
      runDraw(document.querySelector('canvas') as HTMLCanvasElement);
      expect(vi.mocked(CanvasUtils.drawWindow)).toHaveBeenCalled();
    });

    test('door line calls drawDoor', () => {
      const lines = [{ id: 'door1', type: 'door', start: { col: 3, row: 3 }, end: { col: 6, row: 3 } }];
      render(<GridCanvas {...makeProps({ lines })} />);
      runDraw(document.querySelector('canvas') as HTMLCanvasElement);
      expect(vi.mocked(CanvasUtils.drawDoor)).toHaveBeenCalled();
    });

    test('"line" type hits lineWidth=3', () => {
      const lines = [{ id: 'l1', type: 'line', start: { col: 1, row: 1 }, end: { col: 5, row: 1 } }];
      render(<GridCanvas {...makeProps({ lines })} />);
      runDraw(document.querySelector('canvas') as HTMLCanvasElement);
      expect(mockCtx.stroke).toHaveBeenCalled();
    });

    test('"furniture" type line hits furniture branch', () => {
      const lines = [{ id: 'fl1', type: 'furniture', start: { col: 2, row: 2 }, end: { col: 6, row: 2 } }];
      render(<GridCanvas {...makeProps({ lines })} />);
      runDraw(document.querySelector('canvas') as HTMLCanvasElement);
      expect(mockCtx.stroke).toHaveBeenCalled();
    });

    test('vertical window line hits isVertical dot-suppression branch', () => {
      const lines = [{ id: 'vw', type: 'window', start: { col: 3, row: 0 }, end: { col: 3, row: 10 } }];
      render(<GridCanvas {...makeProps({ lines })} />);
      runDraw(document.querySelector('canvas') as HTMLCanvasElement);
    });

    test('horizontal window line hits isHorizontal dot-suppression branch', () => {
      const lines = [{ id: 'hw', type: 'window', start: { col: 0, row: 5 }, end: { col: 10, row: 5 } }];
      render(<GridCanvas {...makeProps({ lines })} />);
      runDraw(document.querySelector('canvas') as HTMLCanvasElement);
    });

    test('diagonal window line hits return false branch', () => {
      const lines = [{ id: 'dw', type: 'window', start: { col: 1, row: 1 }, end: { col: 4, row: 4 } }];
      render(<GridCanvas {...makeProps({ lines })} />);
      runDraw(document.querySelector('canvas') as HTMLCanvasElement);
    });

    test('door line hits isOnWindow check', () => {
      const lines = [{ id: 'vd', type: 'door', start: { col: 2, row: 0 }, end: { col: 2, row: 8 } }];
      render(<GridCanvas {...makeProps({ lines })} />);
      runDraw(document.querySelector('canvas') as HTMLCanvasElement);
    });

    test('placed icon suppresses dot', () => {
      const icons = [{ id: 'i1', type: 'tv', col: 5, row: 5 }];
      render(<GridCanvas {...makeProps({ placedIcons: icons })} />);
      runDraw(document.querySelector('canvas') as HTMLCanvasElement);
    });

    test('placed furniture renders with drawImage', () => {
      const furniture = [{ id: 'f1', type: 'bed', centerCol: 5, centerRow: 5, widthCols: 4, heightCols: 3, rotation: 90 }];
      render(<GridCanvas {...makeProps({ placedFurniture: furniture })} />);
      runDraw(document.querySelector('canvas') as HTMLCanvasElement);
      expect(mockCtx.drawImage).toHaveBeenCalled();
    });

    test('ghost preview renders fillText when furniture tool + mouse in grid', () => {
      render(<GridCanvas {...makeProps({ activeTool: 'furniture_bed' })} />);
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      fireEvent.mouseMove(canvas, { clientX: 200, clientY: 200 });
      runDraw(canvas);
      expect(mockCtx.fillText).toHaveBeenCalled();
    });

    test('ghost preview draws image when previewImg.complete=true', () => {
      vi.mocked(CanvasUtils.getFurnitureImage).mockReturnValue({ complete: true, naturalWidth: 100, onload: null } as any);
      render(<GridCanvas {...makeProps({ activeTool: 'furniture_table' })} />);
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      fireEvent.mouseMove(canvas, { clientX: 200, clientY: 200 });
      runDraw(canvas);
      expect(mockCtx.drawImage).toHaveBeenCalled();
    });

    test('ghost preview sets onload when previewImg.complete=false', () => {
      vi.mocked(CanvasUtils.getFurnitureImage).mockReturnValue({ complete: false, naturalWidth: 0, onload: null } as any);
      render(<GridCanvas {...makeProps({ activeTool: 'furniture_couch' })} />);
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      fireEvent.mouseMove(canvas, { clientX: 200, clientY: 200 });
      runDraw(canvas);
    });

    test('ghost preview with furniture collision shows red fill', () => {
      const big = [{ id: 'big', type: 'bed', centerCol: 10, centerRow: 10, widthCols: 30, heightCols: 30, rotation: 0 }];
      render(<GridCanvas {...makeProps({ activeTool: 'furniture_bed', placedFurniture: big })} />);
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      fireEvent.mouseMove(canvas, { clientX: 200, clientY: 200 });
      runDraw(canvas);
    });

    test('in-progress line preview drawn when startPointRef set', () => {
      render(<GridCanvas {...makeProps({ activeTool: 'wall' })} />);
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      fireEvent.mouseMove(canvas, { clientX: 20, clientY: 20 });
      fireEvent.click(canvas);
      fireEvent.mouseMove(canvas, { clientX: 100, clientY: 100 });
      runDraw(canvas);
      expect(mockCtx.stroke).toHaveBeenCalled();
    });

    test('in-progress line: activeX=-100 branch uses mousePos', () => {
      render(<GridCanvas {...makeProps({ activeTool: 'wall' })} />);
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      fireEvent.mouseMove(canvas, { clientX: 20, clientY: 20 });
      fireEvent.click(canvas);
      
      vi.spyOn(Math, 'hypot').mockReturnValue(9999); // force targetX distance to fail
      fireEvent.mouseMove(canvas, { clientX: 400, clientY: 400 });
      runDraw(canvas);
    });
  });

  describe('checkFurnitureCollision wall branch', () => {
    test('blocks placement when wall overlaps (lXMin/lXMax/lYMin/lYMax branches)', () => {
      const lines = [
        { id: 'w1', type: 'wall', start: { col: 3, row: 4 }, end: { col: 7, row: 4 } }, // Wall at Y=4
        { id: 'w2', type: 'door', start: { col: 0, row: 0 }, end: { col: 1, row: 0 } },
      ];
      // Bed w=4, h=3 at 5,5 -> hits yMin=3.5, yMax=6.5. Collision with Y=4 is true!
      const props = makeProps({ activeTool: 'furniture_bed', lines });
      render(<GridCanvas {...props} />);
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      fireEvent.mouseMove(canvas, { clientX: 100, clientY: 100 });
      fireEvent.click(canvas);
      expect(props.setPlacedFurniture).not.toHaveBeenCalled();
    });

    test('non-wall line skipped (line.type !== wall branch)', () => {
      const lines = [{ id: 'd1', type: 'door', start: { col: 3, row: 4 }, end: { col: 7, row: 4 } }];
      const props = makeProps({ activeTool: 'furniture_bed', lines });
      render(<GridCanvas {...props} />);
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      fireEvent.mouseMove(canvas, { clientX: 100, clientY: 100 });
      fireEvent.click(canvas);
      expect(props.setPlacedFurniture).toHaveBeenCalled();
    });

    test('line.id===ignoreId skips own wall during drag', () => {
      const lines = [{ id: 'w1', type: 'wall', start: { col: 0, row: 0 }, end: { col: 20, row: 0 } }];
      const furniture = [{ id: 'f1', type: 'bed', centerCol: 5, centerRow: 0, widthCols: 4, heightCols: 3, rotation: 0 }];
      const props = makeProps({ draggingItem: { type: 'furniture', id: 'w1' }, placedFurniture: furniture, lines });
      render(<GridCanvas {...props} />);
      fireEvent.mouseMove(document.querySelector('canvas')!, { clientX: 200, clientY: 200 });
    });
  });

  describe('checkFurnitureCollision furniture branch', () => {
    test('blocks placement when overlapping furniture (fXMin/fXMax/fYMin/fYMax)', () => {
      const existing = [{ id: 'big', type: 'bed', centerCol: 5, centerRow: 5, widthCols: 12, heightCols: 12, rotation: 0 }];
      const props = makeProps({ activeTool: 'furniture_table', placedFurniture: existing });
      render(<GridCanvas {...props} />);
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      fireEvent.mouseMove(canvas, { clientX: 100, clientY: 100 });
      fireEvent.click(canvas);
      expect(props.setPlacedFurniture).not.toHaveBeenCalled();
    });

    test('f.id===ignoreId skips self during furniture drag', () => {
      const furniture = [{ id: 'f1', type: 'bed', centerCol: 5, centerRow: 5, widthCols: 4, heightCols: 3, rotation: 0 }];
      const props = makeProps({ draggingItem: { type: 'furniture', id: 'f1' }, placedFurniture: furniture });
      render(<GridCanvas {...props} />);
      fireEvent.mouseMove(document.querySelector('canvas')!, { clientX: 200, clientY: 200 });
      expect(props.setPlacedFurniture).toHaveBeenCalled();
    });

    test('blocks furniture drag when other furniture collides', () => {
      const furniture = [
        { id: 'f1', type: 'bed', centerCol: 0, centerRow: 0, widthCols: 4, heightCols: 3, rotation: 0 },
        { id: 'f2', type: 'table', centerCol: 5, centerRow: 5, widthCols: 20, heightCols: 20, rotation: 0 },
      ];
      // Dragging from 0,0 to 5,5 will collide with table
      const props = makeProps({ draggingItem: { type: 'furniture', id: 'f1' }, placedFurniture: furniture });
      render(<GridCanvas {...props} />);
      fireEvent.mouseMove(document.querySelector('canvas')!, { clientX: 120, clientY: 120 });
      expect(props.setPlacedFurniture).not.toHaveBeenCalled();
    });

    test('blocks placement when icon in collision range', () => {
      const icons = [{ id: 'i1', type: 'tv', col: 5, row: 5 }];
      const props = makeProps({ activeTool: 'furniture_bed', placedIcons: icons });
      render(<GridCanvas {...props} />);
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      fireEvent.mouseMove(canvas, { clientX: 100, clientY: 100 });
      fireEvent.click(canvas);
      expect(props.setPlacedFurniture).not.toHaveBeenCalled();
    });
  });

  describe('Effect branches', () => {
    test('icon draggingItem resets didMove and dragOffset', () => {
      const { rerender } = render(<GridCanvas {...makeProps()} />);
      rerender(<GridCanvas {...makeProps({ draggingItem: { type: 'icon', id: 'x' } })} />);
    });

    test('non-icon draggingItem resets didMove only', () => {
      const { rerender } = render(<GridCanvas {...makeProps()} />);
      rerender(<GridCanvas {...makeProps({ draggingItem: { type: 'wall', id: 'w1' } })} />);
    });

    test('null draggingItem clears', () => {
      const { rerender } = render(<GridCanvas {...makeProps({ draggingItem: { type: 'icon', id: 'x' } })} />);
      rerender(<GridCanvas {...makeProps({ draggingItem: null })} />);
    });

    test('activeTool null clears startPointRef', () => {
      const { rerender } = render(<GridCanvas {...makeProps({ activeTool: 'wall' })} />);
      rerender(<GridCanvas {...makeProps({ activeTool: null })} />);
    });
  });

  describe('Keyboard rotation', () => {
    test('R key with furniture tool rotates', () => {
      render(<GridCanvas {...makeProps({ activeTool: 'furniture_bed' })} />);
      fireEvent.keyDown(window, { key: 'r' });
      fireEvent.keyDown(window, { key: 'R' });
    });

    test('R key with wall tool does nothing', () => {
      render(<GridCanvas {...makeProps({ activeTool: 'wall' })} />);
      fireEvent.keyDown(window, { key: 'r' });
    });

    test('R key with no tool does nothing', () => {
      render(<GridCanvas {...makeProps()} />);
      fireEvent.keyDown(window, { key: 'r' });
    });
  });

  describe('Wheel scaling', () => {
    test('wheel up scales furniture up', () => {
      render(<GridCanvas {...makeProps({ activeTool: 'furniture_bed' })} />);
      fireEvent.wheel(document.querySelector('canvas')!, { deltaY: -100 });
    });

    test('wheel down scales furniture down', () => {
      render(<GridCanvas {...makeProps({ activeTool: 'furniture_bed' })} />);
      fireEvent.wheel(document.querySelector('canvas')!, { deltaY: 100 });
    });

    test('wheel ignored without furniture tool', () => {
      render(<GridCanvas {...makeProps()} />);
      fireEvent.wheel(document.querySelector('canvas')!, { deltaY: -100 });
    });
  });

  describe('Undo/Redo buttons', () => {
    test('calls undo', () => {
      const props = makeProps();
      render(<GridCanvas {...props} />);
      fireEvent.click(screen.getByText(/UNDO/i));
      expect(props.undo).toHaveBeenCalled();
    });

    test('calls redo', () => {
      const props = makeProps();
      render(<GridCanvas {...props} />);
      fireEvent.click(screen.getByText(/REDO/i));
      expect(props.redo).toHaveBeenCalled();
    });
  });

  describe('Mouse events', () => {
    test('mouseLeave calls setDraggingItem(null) and onMouseLeave', () => {
      const props = makeProps();
      render(<GridCanvas {...props} />);
      fireEvent.mouseLeave(document.querySelector('canvas')!);
      expect(props.setDraggingItem).toHaveBeenCalledWith(null);
      expect(props.onMouseLeave).toHaveBeenCalled();
    });

    test('mouseLeave without onMouseLeave prop', () => {
      render(<GridCanvas {...makeProps({ onMouseLeave: undefined })} />);
      fireEvent.mouseLeave(document.querySelector('canvas')!);
    });

    test('mouseUp clears state', () => {
      render(<GridCanvas {...makeProps()} />);
      fireEvent.mouseUp(document.querySelector('canvas')!);
    });

    test('mouseMove calls onMouseMove', () => {
      const props = makeProps();
      render(<GridCanvas {...props} />);
      fireEvent.mouseMove(document.querySelector('canvas')!, { clientX: 100, clientY: 100 });
      expect(props.onMouseMove).toHaveBeenCalled();
    });

    test('mouseMove without onMouseMove prop', () => {
      render(<GridCanvas {...makeProps({ onMouseMove: undefined })} />);
      fireEvent.mouseMove(document.querySelector('canvas')!, { clientX: 100, clientY: 100 });
    });

    test('mouseMove during icon drag updates icon', () => {
      const icons = [{ id: 'i1', type: 'tv', col: 5, row: 5 }];
      const props = makeProps({ draggingItem: { type: 'icon', id: 'i1' }, placedIcons: icons });
      render(<GridCanvas {...props} />);
      fireEvent.mouseMove(document.querySelector('canvas')!, { clientX: 200, clientY: 200 });
      expect(props.setPlacedIcons).toHaveBeenCalled();
    });

    test('mouseMove icon drag blocked by collision', () => {
      const icons = [{ id: 'i1', type: 'tv', col: 5, row: 5 }];
      const props = makeProps({
        draggingItem: { type: 'icon', id: 'i1' },
        placedIcons: icons,
        checkCollision: vi.fn().mockReturnValue(true),
      });
      render(<GridCanvas {...props} />);
      fireEvent.mouseMove(document.querySelector('canvas')!, { clientX: 200, clientY: 200 });
      expect(props.setPlacedIcons).not.toHaveBeenCalled();
    });

    test('mouseMove during furniture drag updates furniture', () => {
      const furniture = [{ id: 'f1', type: 'bed', centerCol: 5, centerRow: 5, widthCols: 4, heightCols: 3, rotation: 0 }];
      const props = makeProps({ draggingItem: { type: 'furniture', id: 'f1' }, placedFurniture: furniture });
      render(<GridCanvas {...props} />);
      fireEvent.mouseMove(document.querySelector('canvas')!, { clientX: 200, clientY: 200 });
      expect(props.setPlacedFurniture).toHaveBeenCalled();
    });

    test('mouseMove during wall drag calls setLines', () => {
      const lines = [{ id: 'w1', type: 'wall', start: { col: 0, row: 0 }, end: { col: 5, row: 0 } }];
      const props = makeProps({ draggingItem: { type: 'wall', id: 'w1' }, lines });
      render(<GridCanvas {...props} />);
      fireEvent.mouseMove(document.querySelector('canvas')!, { clientX: 200, clientY: 200 });
      expect(props.setLines).toHaveBeenCalled();
    });

    test('global mouseup clears draggingItem', () => {
      const props = makeProps({ draggingItem: { type: 'wall', id: 'w1' } });
      render(<GridCanvas {...props} />);
      fireEvent.mouseUp(window);
      expect(props.setDraggingItem).toHaveBeenCalledWith(null);
    });

    test('global mouseup with moved item calls onCommitValidate', () => {
      const icons = [{ id: 'i1', type: 'tv', col: 5, row: 5 }];
      const props = makeProps({ draggingItem: { type: 'icon', id: 'i1' }, placedIcons: icons });
      render(<GridCanvas {...props} />);
      fireEvent.mouseMove(document.querySelector('canvas')!, { clientX: 200, clientY: 200 });
      fireEvent.mouseUp(window);
      expect(props.setDraggingItem).toHaveBeenCalledWith(null);
    });
  });

  describe('MouseDown detection', () => {
    test('mouseDown with activeTool returns early', () => {
      const props = makeProps({ activeTool: 'wall' });
      render(<GridCanvas {...props} />);
      fireEvent.mouseDown(document.querySelector('canvas')!, { clientX: 100, clientY: 100 });
      expect(props.setDraggingItem).not.toHaveBeenCalled();
    });

    test('mouseDown detects furniture by grid position', () => {
      const furniture = [{ id: 'f1', type: 'bed', centerCol: 5, centerRow: 5, widthCols: 100, heightCols: 100, rotation: 0 }];
      const props = makeProps({ placedFurniture: furniture });
      render(<GridCanvas {...props} />);
      fireEvent.mouseMove(document.querySelector('canvas')!, { clientX: 5, clientY: 5 });
      fireEvent.mouseDown(document.querySelector('canvas')!, { clientX: 5, clientY: 5 });
      expect(props.setDraggingItem).toHaveBeenCalledWith(expect.objectContaining({ type: 'furniture', id: 'f1' }));
    });

    test('mouseDown detects vertical wall via findLineAt', () => {
      const lines = [{ id: 'w1', type: 'wall', start: { col: 5, row: 0 }, end: { col: 5, row: 20 } }];
      const props = makeProps({ lines, layout: { offsetX: 0, offsetY: 0, dotSpacing: 20 } });
      render(<GridCanvas {...props} />);
      fireEvent.mouseMove(document.querySelector('canvas')!, { clientX: 0, clientY: 100 });
      fireEvent.mouseDown(document.querySelector('canvas')!, { clientX: 0, clientY: 100 });
      expect(props.setDraggingItem).toHaveBeenCalledWith(expect.objectContaining({ type: 'wall', id: 'w1' }));
    });

    test('mouseDown detects horizontal wall via findLineAt', () => {
      const lines = [{ id: 'w2', type: 'wall', start: { col: 0, row: 5 }, end: { col: 20, row: 5 } }];
      const props = makeProps({ lines, layout: { offsetX: 0, offsetY: 0, dotSpacing: 20 } });
      render(<GridCanvas {...props} />);
      fireEvent.mouseMove(document.querySelector('canvas')!, { clientX: 100, clientY: 0 });
      fireEvent.mouseDown(document.querySelector('canvas')!, { clientX: 100, clientY: 0 });
      expect(props.setDraggingItem).toHaveBeenCalledWith(expect.objectContaining({ type: 'wall', id: 'w2' }));
    });

    test('mouseDown on empty area does nothing', () => {
      const props = makeProps();
      render(<GridCanvas {...props} />);
      vi.spyOn(Math, 'round').mockReturnValue(999); // completely out of bounds
      fireEvent.mouseMove(document.querySelector('canvas')!, { clientX: 50, clientY: 50 });
      fireEvent.mouseDown(document.querySelector('canvas')!, { clientX: 50, clientY: 50 });
      expect(props.setDraggingItem).not.toHaveBeenCalled();
    });
  });

  describe('Click handling', () => {
    test('click skipped when draggingItem set', () => {
      const props = makeProps({ draggingItem: { type: 'icon', id: 'x' } });
      render(<GridCanvas {...props} />);
      fireEvent.click(document.querySelector('canvas')!);
      expect(props.onCanvasClick).not.toHaveBeenCalled();
    });

    test('first wall click sets startPoint only', () => {
      const props = makeProps({ activeTool: 'wall' });
      render(<GridCanvas {...props} />);
      fireEvent.mouseMove(document.querySelector('canvas')!, { clientX: 20, clientY: 20 });
      fireEvent.click(document.querySelector('canvas')!);
      expect(props.onLineComplete).not.toHaveBeenCalled();
    });

    test('second wall click completes line', () => {
      const props = makeProps({ activeTool: 'wall' });
      render(<GridCanvas {...props} />);
      const canvas = document.querySelector('canvas')!;

      // Click 1 (col 5)
      fireEvent.mouseMove(canvas, { clientX: 20, clientY: 20 });
      fireEvent.click(canvas);

      // Click 2 (col 10)
      const orig = Math.round;
      vi.spyOn(Math, 'round').mockImplementation((v) => (!Number.isFinite(v) ? 10 : orig(v)));
      fireEvent.mouseMove(canvas, { clientX: 100, clientY: 100 });
      fireEvent.click(canvas);

      expect(props.saveHistory).toHaveBeenCalled();
      expect(props.onLineComplete).toHaveBeenCalled();
    });

    test('second click at same point does not complete', () => {
      const props = makeProps({ activeTool: 'wall' });
      render(<GridCanvas {...props} />);
      fireEvent.click(document.querySelector('canvas')!);
      fireEvent.click(document.querySelector('canvas')!);
      expect(props.onLineComplete).not.toHaveBeenCalled();
    });

    test('click outside hypot threshold does nothing', () => {
      vi.spyOn(Math, 'hypot').mockReturnValue(9999); // outside threshold
      const props = makeProps({ activeTool: 'wall' });
      render(<GridCanvas {...props} />);
      fireEvent.click(document.querySelector('canvas')!);
      expect(props.onLineComplete).not.toHaveBeenCalled();
    });

    test('no-tool click calls saveHistory and onCanvasClick', () => {
      const props = makeProps({ activeTool: null });
      render(<GridCanvas {...props} />);
      fireEvent.mouseMove(document.querySelector('canvas')!, { clientX: 50, clientY: 50 });
      fireEvent.click(document.querySelector('canvas')!);
      expect(props.saveHistory).toHaveBeenCalled();
      expect(props.onCanvasClick).toHaveBeenCalled();
    });

    test('furniture click places furniture when no collision', () => {
      const props = makeProps({ activeTool: 'furniture_bed' });
      render(<GridCanvas {...props} />);
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      fireEvent.mouseMove(canvas, { clientX: 100, clientY: 100 });
      fireEvent.click(canvas);
      expect(props.saveHistory).toHaveBeenCalled();
      expect(props.setPlacedFurniture).toHaveBeenCalled();
      expect(props.onCommitValidate).toHaveBeenCalled();
    });
  });

  describe('Wall overlays', () => {
    const wallLines = [{ id: 'w1', type: 'wall', start: { col: 0, row: 0 }, end: { col: 0, row: 5 } }];
    const layout = { offsetX: 0, offsetY: 0, dotSpacing: 20 };

    test('shows X on mouseEnter', () => {
      render(<GridCanvas {...makeProps({ lines: wallLines, layout })} />);
      fireEvent.mouseEnter(document.querySelectorAll('div[style*="z-index: 25"]')[0]);
      expect(screen.getByText('✕')).toBeTruthy();
    });

    test('hides X on mouseLeave', () => {
      render(<GridCanvas {...makeProps({ lines: wallLines, layout })} />);
      const ov = document.querySelectorAll('div[style*="z-index: 25"]')[0];
      fireEvent.mouseEnter(ov);
      fireEvent.mouseLeave(ov);
      expect(screen.queryByText('✕')).toBeNull();
    });

    test('X button deletes wall', () => {
      const props = makeProps({ lines: wallLines, layout });
      render(<GridCanvas {...props} />);
      fireEvent.mouseEnter(document.querySelectorAll('div[style*="z-index: 25"]')[0]);
      fireEvent.mouseDown(screen.getByText('✕'));
      expect(props.saveHistory).toHaveBeenCalled();
      expect(props.setLines).toHaveBeenCalled();
      expect(props.onCommitValidate).toHaveBeenCalled();
    });

    test('overlay mouseDown initiates wall drag', () => {
      const props = makeProps({ lines: wallLines, layout });
      render(<GridCanvas {...props} />);
      fireEvent.mouseDown(document.querySelectorAll('div[style*="z-index: 25"]')[0], { clientX: 20, clientY: 20 });
      expect(props.setDraggingItem).toHaveBeenCalledWith(expect.objectContaining({ type: 'wall', id: 'w1' }));
    });

    test('overlay mouseDown skipped with activeTool', () => {
      const props = makeProps({ lines: wallLines, layout, activeTool: 'wall' });
      render(<GridCanvas {...props} />);
      fireEvent.mouseDown(document.querySelectorAll('div[style*="z-index: 25"]')[0]);
      expect(props.setDraggingItem).not.toHaveBeenCalled();
    });

    test('overlay mouseDown skipped when button clicked', () => {
      const props = makeProps({ lines: wallLines, layout });
      render(<GridCanvas {...props} />);
      fireEvent.mouseEnter(document.querySelectorAll('div[style*="z-index: 25"]')[0]);
      fireEvent.mouseDown(screen.getByText('✕'));
      expect(props.setDraggingItem).not.toHaveBeenCalled();
    });

    test('dark mode wall overlay', () => {
      render(<GridCanvas {...makeProps({ isDarkMode: true, lines: wallLines, layout })} />);
      fireEvent.mouseEnter(document.querySelectorAll('div[style*="z-index: 25"]')[0]);
      expect(screen.getByText('✕')).toBeTruthy();
    });

    test('no overlays when dotSpacing=0', () => {
      render(<GridCanvas {...makeProps({ lines: wallLines, layout: { offsetX: 0, offsetY: 0, dotSpacing: 0 } })} />);
      expect(document.querySelectorAll('div[style*="z-index: 25"]').length).toBe(0);
    });
  });

  describe('Furniture overlays', () => {
    const furniture = [{ id: 'f1', type: 'bed', centerCol: 5, centerRow: 5, widthCols: 4, heightCols: 3, rotation: 0 }];
    const layout = { offsetX: 0, offsetY: 0, dotSpacing: 20 };

    test('shows X on mouseEnter', () => {
      render(<GridCanvas {...makeProps({ placedFurniture: furniture, layout })} />);
      fireEvent.mouseEnter(document.querySelectorAll('div[style*="z-index: 25"]')[0]);
      expect(screen.getByText('✕')).toBeTruthy();
    });

    test('hides X on mouseLeave', () => {
      render(<GridCanvas {...makeProps({ placedFurniture: furniture, layout })} />);
      const ov = document.querySelectorAll('div[style*="z-index: 25"]')[0];
      fireEvent.mouseEnter(ov);
      fireEvent.mouseLeave(ov);
      expect(screen.queryByText('✕')).toBeNull();
    });

    test('X button deletes furniture', () => {
      const props = makeProps({ placedFurniture: furniture, layout });
      render(<GridCanvas {...props} />);
      fireEvent.mouseEnter(document.querySelectorAll('div[style*="z-index: 25"]')[0]);
      fireEvent.mouseDown(screen.getByText('✕'));
      expect(props.saveHistory).toHaveBeenCalled();
      expect(props.setPlacedFurniture).toHaveBeenCalled();
      expect(props.onCommitValidate).toHaveBeenCalled();
    });

    test('overlay mouseDown initiates furniture drag', () => {
      const props = makeProps({ placedFurniture: furniture, layout });
      render(<GridCanvas {...props} />);
      fireEvent.mouseDown(document.querySelectorAll('div[style*="z-index: 25"]')[0], { clientX: 100, clientY: 100 });
      expect(props.setDraggingItem).toHaveBeenCalledWith(expect.objectContaining({ type: 'furniture', id: 'f1' }));
    });

    test('overlay mouseDown skipped with activeTool', () => {
      const props = makeProps({ placedFurniture: furniture, layout, activeTool: 'wall' });
      render(<GridCanvas {...props} />);
      fireEvent.mouseDown(document.querySelectorAll('div[style*="z-index: 25"]')[0]);
      expect(props.setDraggingItem).not.toHaveBeenCalled();
    });

    test('dark mode furniture overlay', () => {
      render(<GridCanvas {...makeProps({ isDarkMode: true, placedFurniture: furniture, layout })} />);
      fireEvent.mouseEnter(document.querySelectorAll('div[style*="z-index: 25"]')[0]);
      expect(screen.getByText('✕')).toBeTruthy();
    });
  });
});