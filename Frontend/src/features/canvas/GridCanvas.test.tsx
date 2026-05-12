import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import GridCanvas from './GridCanvas';

(globalThis as any).ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
    clearRect: jest.fn(),
    fillRect: jest.fn(),
    beginPath: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    stroke: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    setTransform: jest.fn(),
    scale: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    translate: jest.fn(),
    rotate: jest.fn(),
    drawImage: jest.fn(),
    fillText: jest.fn(),
  }) as any;
});

const mockLayout = { offsetX: 10, offsetY: 10, dotSpacing: 20 };

const defaultProps = {
  isDarkMode: false,
  placedIcons: [],
  lines: [],
  setLines: jest.fn(),
  activeTool: null,
  onCanvasClick: jest.fn(),
  onLineComplete: jest.fn(),
  onUpdate: jest.fn(),
  placedFurniture: [],
  setPlacedIcons: jest.fn(),
  draggingItem: null,
  setDraggingItem: jest.fn(),
  setPlacedFurniture: jest.fn(),
  onRedo: jest.fn(),
  layout: mockLayout,
  checkCollision: jest.fn().mockReturnValue(false),
  saveHistory: jest.fn(),
  undo: jest.fn(),
  redo: jest.fn(),
  canUndo: true,
  canRedo: true,
};

describe('Componenta GridCanvas', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('1. Randează canvas-ul corect fără să crape', () => {
    render(<GridCanvas {...defaultProps} />);
    const canvasElements = document.getElementsByTagName('canvas');
    expect(canvasElements.length).toBeGreaterThan(0);
  });

  test('2. Apelează funcția undo când butonul UNDO este activ și apăsat', () => {
    render(<GridCanvas {...defaultProps} canUndo={true} />);
    const undoButton = screen.getByText(/UNDO/i);
    
    expect(undoButton).not.toHaveClass('cursor-not-allowed');
    
    fireEvent.click(undoButton);
    expect(defaultProps.undo).toHaveBeenCalledTimes(1);
  });

  test('3. Nu apelează undo și butonul e dezactivat când canUndo este false', () => {
    render(<GridCanvas {...defaultProps} canUndo={false} />);
    const undoButton = screen.getByText(/UNDO/i);
    
    expect(undoButton).toBeDisabled();
    expect(undoButton).toHaveClass('cursor-not-allowed');
  });

  test('4. Apelează funcția redo când butonul REDO este activ și apăsat', () => {
    render(<GridCanvas {...defaultProps} canRedo={true} />);
    const redoButton = screen.getByText(/REDO/i);
    
    fireEvent.click(redoButton);
    expect(defaultProps.redo).toHaveBeenCalledTimes(1);
  });

  test('5. Simulează click pe canvas și apelează onCanvasClick', () => {
    render(<GridCanvas {...defaultProps} />);
    const canvas = document.querySelector('canvas');
    
    if (canvas) {
      fireEvent.click(canvas, { clientX: 50, clientY: 50 });
    }
    
    expect(defaultProps.saveHistory).toHaveBeenCalled();
    expect(defaultProps.onCanvasClick).toHaveBeenCalled();
  });

  test('6. Curăță starea când mouse-ul părăsește canvas-ul (onMouseLeave)', () => {
    const onMouseLeaveMock = jest.fn();
    render(<GridCanvas {...defaultProps} onMouseLeave={onMouseLeaveMock} />);
    const canvas = document.querySelector('canvas');
    
    if (canvas) {
      fireEvent.mouseLeave(canvas);
    }
    
    expect(defaultProps.setDraggingItem).toHaveBeenCalledWith(null);
    expect(onMouseLeaveMock).toHaveBeenCalledTimes(1);
  });

  test('7. Schimbă rotația mobilei la apăsarea tastei R', () => {
    render(<GridCanvas {...defaultProps} activeTool="furniture_bed" />);
    
    fireEvent.keyDown(window, { key: 'r', code: 'KeyR' });
    
  });

  test('8. Afișează butonul de ștergere (X) când dai hover pe un perete și permite ștergerea', () => {
    const linesProp = [{ id: 'line-1', type: 'wall', start: { col: 0, row: 0 }, end: { col: 0, row: 5 } }];
    
    render(<GridCanvas {...defaultProps} lines={linesProp} />);
    
   
    const overlays = document.querySelectorAll('div[style*="z-index: 25"]');
    expect(overlays.length).toBeGreaterThan(0);
    
    const wallOverlay = overlays[0];
    
    fireEvent.mouseEnter(wallOverlay);
    
    const deleteButton = screen.getByText('✕');
    expect(deleteButton).toBeInTheDocument();
    
    fireEvent.mouseDown(deleteButton);
    
    expect(defaultProps.saveHistory).toHaveBeenCalled();
    expect(defaultProps.setLines).toHaveBeenCalled(); // Se apelează filtrarea
  });

  test('9. Afișează butonul de ștergere (X) când dai hover pe mobilă', () => {
    const furnitureProp = [{ id: 'furn-1', type: 'bed', centerCol: 2, centerRow: 2, widthCols: 4, heightCols: 4, rotation: 0 }];
    
    render(<GridCanvas {...defaultProps} placedFurniture={furnitureProp} />);
    
    const overlays = document.querySelectorAll('div[style*="z-index: 25"]');
    expect(overlays.length).toBeGreaterThan(0);
    
    const furnOverlay = overlays[0];
    
    fireEvent.mouseEnter(furnOverlay);
    
    const deleteButton = screen.getByText('✕');
    expect(deleteButton).toBeInTheDocument();
    
    fireEvent.mouseDown(deleteButton);
    
    expect(defaultProps.saveHistory).toHaveBeenCalled();
    expect(defaultProps.setPlacedFurniture).toHaveBeenCalled();
  });
});