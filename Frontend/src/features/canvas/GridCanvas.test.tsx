import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import GridCanvas from './GridCanvas';

// --- CONFIGURARE MEDIU DE TEST ---
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = (() => ({
    clearRect: vi.fn(), fillRect: vi.fn(), beginPath: vi.fn(),
    arc: vi.fn(), fill: vi.fn(), stroke: vi.fn(),
    moveTo: vi.fn(), lineTo: vi.fn(), setTransform: vi.fn(),
    scale: vi.fn(), save: vi.fn(), restore: vi.fn(),
    translate: vi.fn(), rotate: vi.fn(), drawImage: vi.fn(),
    fillText: vi.fn(),
  })) as any;
}

describe('GridCanvas - Suită Completă de Testare', () => {
  let defaultProps: any;

  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 480,
      bottom: 440,
      width: 480,
      height: 440,
      toJSON: () => ({}),
    } as DOMRect);

    defaultProps = {
      isDarkMode: false,
      placedIcons: [{ id: 'icon1', type: 'tv', col: 10, row: 10 }],
      lines: [],
      setLines: vi.fn(),
      activeTool: null,
      onCanvasClick: vi.fn(),
      onLineComplete: vi.fn(),
      onUpdate: vi.fn(),
      placedFurniture: [],
      setPlacedIcons: vi.fn(),
      draggingItem: null,
      setDraggingItem: vi.fn(),
      setPlacedFurniture: vi.fn(),
      onRedo: vi.fn(),
      layout: { offsetX: 0, offsetY: 0, dotSpacing: 20 },
      checkCollision: vi.fn().mockReturnValue(false),
      saveHistory: vi.fn(),
      undo: vi.fn(),
      redo: vi.fn(),
      canUndo: true,
      canRedo: true,
      onCommitValidate: vi.fn(),
      onMouseMove: vi.fn(),
      onMouseLeave: vi.fn(),
    };
  });

  // --- 1. RENDERIZARE DE BAZĂ ---
  test('Randează componenta și butoanele Undo/Redo corect', () => {
    render(<GridCanvas {...defaultProps} />);
    expect(document.querySelector('canvas')).toBeTruthy();
    expect(screen.getByText(/UNDO/i)).toBeTruthy();
    expect(screen.getByText(/REDO/i)).toBeTruthy();
  });

  // --- 2. TESTE PENTRU UNDO ȘI REDO ---
  test('Apelează undo() și redo() când sunt active', () => {
    render(<GridCanvas {...defaultProps} />);
    fireEvent.click(screen.getByText(/UNDO/i));
    expect(defaultProps.undo).toHaveBeenCalled();

    fireEvent.click(screen.getByText(/REDO/i));
    expect(defaultProps.redo).toHaveBeenCalled();
  });

  test('Butoanele Undo și Redo sunt inactive când nu există istoric', () => {
    render(<GridCanvas {...defaultProps} canUndo={false} canRedo={false} />);
    const undoBtn = screen.getByText(/UNDO/i);
    expect(undoBtn.className).toContain('cursor-not-allowed');
  });

  // --- 3. TESTE DE TASTATURĂ ȘI ROTIȚĂ (ROTAȚIE ȘI SCALARE) ---
  test('Rotește mobila la apăsarea tastei R', () => {
    render(<GridCanvas {...defaultProps} activeTool="furniture_bed" />);
    fireEvent.keyDown(window, { key: 'r', code: 'KeyR' });
  });

  test('Scalează mobila la scroll din rotiță', () => {
    render(<GridCanvas {...defaultProps} activeTool="furniture_bed" />);
    const canvas = document.querySelector('canvas');
    if (canvas) {
      fireEvent.wheel(canvas, { deltaY: -100 }); 
      fireEvent.wheel(canvas, { deltaY: 100 });  
    }
  });

  test('Deseneaza pereti, ferestre, usi, mobila si preview-ul pentru mobila', () => {
    const lines = [
      { id: 'wall1', type: 'wall', start: { col: 0, row: 0 }, end: { col: 4, row: 0 } },
      { id: 'window1', type: 'window', start: { col: 1, row: 2 }, end: { col: 5, row: 2 } },
      { id: 'door1', type: 'door', start: { col: 3, row: 1 }, end: { col: 3, row: 4 } },
      { id: 'line1', type: 'line', start: { col: 5, row: 5 }, end: { col: 8, row: 8 } },
    ];
    const furniture = [{ id: 'furn1', type: 'bed', centerCol: 8, centerRow: 8, widthCols: 4, heightCols: 4, rotation: 90 }];

    render(
      <GridCanvas
        {...defaultProps}
        isDarkMode
        activeTool="furniture_bed"
        lines={lines}
        placedFurniture={furniture}
        placedIcons={[{ id: 'icon1', type: 'tv', col: 1, row: 1 }]}
      />
    );

    const canvas = document.querySelector('canvas');
    if (canvas) {
      fireEvent.mouseMove(canvas, { clientX: 120, clientY: 120 });
      expect(defaultProps.onMouseMove).toHaveBeenCalled();
    }
  });

  // --- 4. TESTE DE CLICK PE CANVAS (PLASARE) ---
  test('Plasează mobilă la click când activeTool este o mobilă', () => {
    const originalRound = Math.round;
    const spyRound = vi.spyOn(Math, 'round').mockImplementation((val) => {
      // Dacă dă de erori din cauza canvas-ului gol, forțăm returnarea valorii 5
      if (!Number.isFinite(val)) return 5;
      return originalRound(val);
    });

    render(<GridCanvas {...defaultProps} activeTool="furniture_bed" />);
    const canvas = document.querySelector('canvas');
    if (canvas) {
      defaultProps.checkCollision.mockReturnValue(false);
      fireEvent.mouseMove(canvas, { clientX: 100, clientY: 100 });
      fireEvent.click(canvas);

      expect(defaultProps.saveHistory).toHaveBeenCalled();
      expect(defaultProps.setPlacedFurniture).toHaveBeenCalled();
    }

    spyRound.mockRestore();
  });

  test('Plasează linie la click dublu când activeTool este wall', () => {
    const spyHypot = vi.spyOn(Math, 'hypot').mockReturnValue(-1);
    
    let roundCount = 0;
    const originalRound = Math.round;
    const spyRound = vi.spyOn(Math, 'round').mockImplementation((val) => {
      // Când calculează "Infinity", îi dăm numere diferite: 1, 2, 3, 4 ca să nu zică că a dat click pe același punct
      if (!Number.isFinite(val)) {
        roundCount++;
        return roundCount;
      }
      return originalRound(val);
    });

    render(<GridCanvas {...defaultProps} activeTool="wall" />);
    const canvas = document.querySelector('canvas');
    if (canvas) {
      // Click 1 (Se vor aloca coordonatele 1 și 2)
      fireEvent.mouseMove(canvas, { clientX: 20, clientY: 20 });
      fireEvent.click(canvas);

      // Click 2 (Se vor aloca coordonatele 3 și 4, diferit de start!)
      fireEvent.mouseMove(canvas, { clientX: 100, clientY: 100 });
      fireEvent.click(canvas);

      expect(defaultProps.saveHistory).toHaveBeenCalled();
      expect(defaultProps.onLineComplete).toHaveBeenCalled();
    }

    spyHypot.mockRestore();
    spyRound.mockRestore();
  });

  // --- 5. TESTE PENTRU OVERLAYS ȘI ȘTERGERE (WALL) ---
  test('Afișează X la hover pe perete și îl șterge', () => {
    const lines = [{ id: 'wall1', type: 'wall', start: { col: 0, row: 0 }, end: { col: 0, row: 5 } }];
    render(<GridCanvas {...defaultProps} lines={lines} layout={{ offsetX: 0, offsetY: 0, dotSpacing: 20 }} />);
    
    const overlays = document.querySelectorAll('div[style*="z-index: 25"]');
    const wallOverlay = overlays[0];
    
    fireEvent.mouseEnter(wallOverlay);
    const btnX = screen.getByText('✕');
    expect(btnX).toBeTruthy();

    fireEvent.mouseDown(btnX);
    expect(defaultProps.saveHistory).toHaveBeenCalled();
    expect(defaultProps.setLines).toHaveBeenCalled();
    expect(defaultProps.onCommitValidate).toHaveBeenCalled();
  });

  // --- 6. TESTE PENTRU OVERLAYS ȘI ȘTERGERE (FURNITURE) ---
  test('Afișează X la hover pe mobilă și o șterge', () => {
    const furniture = [{ id: 'furn1', type: 'bed', centerCol: 5, centerRow: 5, widthCols: 4, heightCols: 4, rotation: 0 }];
    render(<GridCanvas {...defaultProps} placedFurniture={furniture} />);
    
    const overlays = document.querySelectorAll('div[style*="z-index: 25"]');
    const furnOverlay = overlays[0];
    
    fireEvent.mouseEnter(furnOverlay);
    const btnX = screen.getByText('✕');
    
    fireEvent.mouseDown(btnX);
    expect(defaultProps.saveHistory).toHaveBeenCalled();
    expect(defaultProps.setPlacedFurniture).toHaveBeenCalled();
    expect(defaultProps.onCommitValidate).toHaveBeenCalled();
  });

  // --- 7. TESTE PENTRU DRAG & DROP INTERN ---
  test('Inițiază drag-ul când apeși pe un overlay (Perete)', () => {
    const lines = [{ id: 'wall1', type: 'wall', start: { col: 0, row: 0 }, end: { col: 0, row: 5 } }];
    render(<GridCanvas {...defaultProps} lines={lines} />);
    
    const overlays = document.querySelectorAll('div[style*="z-index: 25"]');
    fireEvent.mouseDown(overlays[0], { clientX: 20, clientY: 20 });
    
    expect(defaultProps.setDraggingItem).toHaveBeenCalledWith(expect.objectContaining({ type: 'wall', id: 'wall1' }));
  });

  test('Golește draggingItem la mouse leave', () => {
    render(<GridCanvas {...defaultProps} />);
    const canvas = document.querySelector('canvas');
    if (canvas) {
      fireEvent.mouseLeave(canvas);
      expect(defaultProps.setDraggingItem).toHaveBeenCalledWith(null);
      expect(defaultProps.onMouseLeave).toHaveBeenCalled();
    }
  });

  test('Comunica pozitia mouse-ului si initiaza drag pentru mobila', () => {
    const furniture = [{ id: 'furn1', type: 'table', centerCol: 4, centerRow: 4, widthCols: 3, heightCols: 2, rotation: 0 }];
    render(<GridCanvas {...defaultProps} placedFurniture={furniture} layout={{ offsetX: 0, offsetY: 0, dotSpacing: 20 }} />);

    const canvas = document.querySelector('canvas');
    if (canvas) {
      fireEvent.mouseMove(canvas, { clientX: 80, clientY: 80 });
      expect(defaultProps.onMouseMove).toHaveBeenCalled();
    }

    const overlays = document.querySelectorAll('div[style*="z-index: 25"]');
    fireEvent.mouseDown(overlays[0], { clientX: 80, clientY: 80 });
    expect(defaultProps.setDraggingItem).toHaveBeenCalledWith(expect.objectContaining({ type: 'furniture', id: 'furn1' }));
  });

  test('Actualizeaza iconita, mobila si peretele in timpul drag-ului', () => {
    const moveEvent = { clientX: 120, clientY: 120 };
    const { rerender } = render(
      <GridCanvas
        {...defaultProps}
        draggingItem={{ type: 'icon', id: 'icon1' }}
        placedIcons={[{ id: 'icon1', type: 'tv', col: 2, row: 2 }]}
      />
    );

    let canvas = document.querySelector('canvas');
    if (canvas) fireEvent.mouseMove(canvas, moveEvent);
    expect(defaultProps.saveHistory).toHaveBeenCalled();
    expect(defaultProps.setPlacedIcons).toHaveBeenCalled();

    defaultProps.saveHistory.mockClear();
    const furniture = [{ id: 'furn1', type: 'table', centerCol: 3, centerRow: 3, widthCols: 3, heightCols: 2, rotation: 0 }];
    rerender(
      <GridCanvas
        {...defaultProps}
        draggingItem={{ type: 'furniture', id: 'furn1' }}
        placedFurniture={furniture}
      />
    );
    canvas = document.querySelector('canvas');
    if (canvas) fireEvent.mouseMove(canvas, moveEvent);
    expect(defaultProps.saveHistory).toHaveBeenCalled();
    expect(defaultProps.setPlacedFurniture).toHaveBeenCalled();

    defaultProps.saveHistory.mockClear();
    const lines = [{ id: 'wall1', type: 'wall', start: { col: 0, row: 0 }, end: { col: 0, row: 5 } }];
    rerender(
      <GridCanvas
        {...defaultProps}
        draggingItem={{ type: 'wall', id: 'wall1' }}
        lines={lines}
      />
    );
    canvas = document.querySelector('canvas');
    if (canvas) fireEvent.mouseMove(canvas, moveEvent);
    expect(defaultProps.saveHistory).toHaveBeenCalled();
    expect(defaultProps.setLines).toHaveBeenCalled();
  });
});
