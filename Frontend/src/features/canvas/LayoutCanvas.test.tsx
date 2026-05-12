import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import LayoutCanvas from './LayoutCanvas';
import { authFetch } from '../../utils/authFetch';

// --- 1. MOCK-URI PENTRU DEPENDENȚE EXTERNE ---

vi.mock('../../utils/authFetch', () => ({
  authFetch: vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ saved: true, id: 999, errors: [] })
  })
}));

vi.mock('./captureLayoutThumbnail', () => ({
  captureLayoutThumbnailRoot: vi.fn().mockResolvedValue('data:image/png;base64,mocked-image')
}));

vi.mock('../wizard/components/WizardSidebar', () => ({
  default: function MockSidebar() { return <div data-testid="mock-sidebar" />; }
}));

vi.mock('./GridCanvas', () => ({
  default: function MockGridCanvas(props: any) {
    return (
      <div data-testid="mock-grid-canvas">
        <button data-testid="trigger-click" onClick={() => props.onCanvasClick(5, 5)}>Click Canvas</button>
        <button data-testid="trigger-line" onClick={() => props.onLineComplete('wall', {col:0, row:0}, {col:0, row:5})}>Draw Line</button>
        <button data-testid="trigger-undo" onClick={props.undo}>Undo</button>
        <button data-testid="trigger-redo" onClick={props.redo}>Redo</button>
      </div>
    );
  }
}));

describe('LayoutCanvas - Suită de Testare', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('Randează elementele principale (Butoane, Sidebar, Canvas)', () => {
    render(<LayoutCanvas isDarkMode={false} onBack={mockOnBack} />);
    expect(screen.getByText(/Back to Wizard/i)).toBeInTheDocument();
    expect(screen.getByText(/Device Catalog/i)).toBeInTheDocument();
    expect(screen.getByTestId('mock-sidebar')).toBeInTheDocument();
  });

  test('Apelează onBack când se apasă butonul "Back to Wizard"', () => {
    render(<LayoutCanvas isDarkMode={false} onBack={mockOnBack} />);
    fireEvent.click(screen.getByText(/Back to Wizard/i));
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  test('Schimbă uneltele din Floating Menu și deschide submeniul Furniture', () => {
    render(<LayoutCanvas isDarkMode={false} onBack={mockOnBack} />);
    
    const wallBtn = screen.getByText('Wall').closest('button');
    if (wallBtn) fireEvent.click(wallBtn);
    
    const furnitureBtn = screen.getByText('Furniture').closest('button');
    if (furnitureBtn) fireEvent.click(furnitureBtn);
    
    expect(screen.getByText('Bed')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Bed'));
    expect(screen.queryByText('Bed')).not.toBeInTheDocument();
  });

  test('Selectează un dispozitiv din catalog, îl rotește, îi dă zoom și îl plasează', () => {
    render(<LayoutCanvas isDarkMode={true} onBack={mockOnBack} />);
    
    const hueDevice = screen.getByText('Philips Hue E27');
    fireEvent.click(hueDevice);
    
    fireEvent.keyDown(window, { key: 'r' });
    fireEvent.wheel(window, { deltaY: -100 });
    fireEvent.click(screen.getByTestId('trigger-click'));
    
    const hueTexts = screen.getAllByText('Philips Hue E27');
    expect(hueTexts.length).toBeGreaterThan(1);
  });

  test('Desenează o linie și salvează starea în Undo/Redo', () => {
    render(<LayoutCanvas isDarkMode={false} onBack={mockOnBack} />);
    
    fireEvent.click(screen.getByTestId('trigger-line'));
    fireEvent.click(screen.getByTestId('trigger-undo'));
    fireEvent.click(screen.getByTestId('trigger-redo'));
  });

  test('Apasă butoanele de Zoom In și Zoom Out pentru mediul de lucru', () => {
    render(<LayoutCanvas isDarkMode={false} onBack={mockOnBack} />);
    
   const zoomInBtn = screen.getByRole('button', { name: '+' });
    const zoomOutBtn = screen.getByRole('button', { name: '-' });
    
    fireEvent.click(zoomInBtn);
    fireEvent.click(zoomOutBtn);
    
    const rangeInput = screen.getByRole('slider');
    fireEvent.change(rangeInput, { target: { value: '1.5' } });
    
    expect(rangeInput).toHaveValue('1.5');
  });

  test('Apelează salvarea layout-ului când se apasă butonul Save', async () => {
    render(<LayoutCanvas isDarkMode={false} onBack={mockOnBack} />);
    
    fireEvent.click(screen.getByText('Philips Hue E27'));
    fireEvent.click(screen.getByTestId('trigger-click'));
    
    const saveBtn = screen.getByText(/Save/i).closest('button');
    expect(saveBtn).not.toBeDisabled();
    if (saveBtn) fireEvent.click(saveBtn);
    
    await waitFor(() => {
      expect(authFetch).toHaveBeenCalled();
    });
    
    expect(screen.getByText(/Saved \(id: 999\)/i)).toBeInTheDocument();
  });
});