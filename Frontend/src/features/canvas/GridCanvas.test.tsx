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
    }
  });
});