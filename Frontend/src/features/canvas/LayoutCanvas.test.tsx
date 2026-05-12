import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LayoutCanvas from './LayoutCanvas';

// --- 1. MOCK-URI PENTRU DEPENDENȚE EXTERNE ---

// Mock pentru funcția de API (authFetch)
jest.mock('../../utils/authFetch', () => ({
  authFetch: jest.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ saved: true, id: 999, errors: [] })
  })
}));

// Mock pentru funcția de captură (thumbnail)
jest.mock('./captureLayoutThumbnail', () => ({
  captureLayoutThumbnailRoot: jest.fn().mockResolvedValue('data:image/png;base64,mocked-image')
}));

// Mock pentru Sidebar (ca să nu complicăm testul)
jest.mock('../wizard/components/WizardSidebar', () => {
  return function MockSidebar() { return <div data-testid="mock-sidebar" />; };
});

// Mock pentru GridCanvas (simulăm doar acțiunile pe care le-ar trimite înapoi către LayoutCanvas)
jest.mock('./GridCanvas', () => {
  return function MockGridCanvas(props: any) {
    return (
      <div data-testid="mock-grid-canvas">
        <button data-testid="trigger-click" onClick={() => props.onCanvasClick(5, 5)}>Click Canvas</button>
        <button data-testid="trigger-line" onClick={() => props.onLineComplete('wall', {col:0, row:0}, {col:0, row:5})}>Draw Line</button>
        <button data-testid="trigger-undo" onClick={props.undo}>Undo</button>
        <button data-testid="trigger-redo" onClick={props.redo}>Redo</button>
      </div>
    );
  };
});

describe('LayoutCanvas - Suită de Testare', () => {
  const mockOnBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- TESTUL 1: RENDERIZARE DE BAZĂ ---
  test('Randează elementele principale (Butoane, Sidebar, Canvas)', () => {
    render(<LayoutCanvas isDarkMode={false} onBack={mockOnBack} />);
    
    expect(screen.getByText(/Back to Wizard/i)).toBeInTheDocument();
    expect(screen.getByText(/Device Catalog/i)).toBeInTheDocument();
    expect(screen.getByTestId('mock-sidebar')).toBeInTheDocument();
  });

  // --- TESTUL 2: BUTONUL BACK ---
  test('Apelează onBack când se apasă butonul "Back to Wizard"', () => {
    render(<LayoutCanvas isDarkMode={false} onBack={mockOnBack} />);
    fireEvent.click(screen.getByText(/Back to Wizard/i));
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  // --- TESTUL 3: TOOLBAR (SELECȚIE UNELTE) ---
  test('Schimbă uneltele din Floating Menu și deschide submeniul Furniture', () => {
    render(<LayoutCanvas isDarkMode={false} onBack={mockOnBack} />);
    
    // Selectăm "Wall"
    const wallBtn = screen.getByText('Wall').closest('button');
    if (wallBtn) fireEvent.click(wallBtn);
    
    // Selectăm "Furniture" pentru a deschide submeniul
    const furnitureBtn = screen.getByText('Furniture').closest('button');
    if (furnitureBtn) fireEvent.click(furnitureBtn);
    
    // Verificăm dacă apare submeniul cu "Bed", "Couch", "Table"
    expect(screen.getByText('Bed')).toBeInTheDocument();
    
    // Selectăm "Bed"
    fireEvent.click(screen.getByText('Bed'));
    
    // Submeniul ar trebui să se închidă
    expect(screen.queryByText('Bed')).not.toBeInTheDocument();
  });

  // --- TESTUL 4: PLASAREA UNUI DISPOZITIV ---
  test('Selectează un dispozitiv din catalog, îl rotește, îi dă zoom și îl plasează', () => {
    render(<LayoutCanvas isDarkMode={true} onBack={mockOnBack} />);
    
    // 1. Căutăm "Philips Hue E27" în catalog și dăm click pe el
    const hueDevice = screen.getByText('Philips Hue E27');
    fireEvent.click(hueDevice);
    
    // 2. Simulăm tasta 'R' pentru rotație
    fireEvent.keyDown(window, { key: 'r' });
    
    // 3. Simulăm scroll pentru zoom (pe window)
    fireEvent.wheel(window, { deltaY: -100 });
    
    // 4. Simulăm click-ul pe canvas (prin butonul din mock)
    fireEvent.click(screen.getByTestId('trigger-click'));
    
    // 5. Verificăm dacă a apărut în secțiunea "Installed Devices" 
    // (Avem deja Philips Hue E27 în catalog, deci va apărea de 2 ori în pagină acum)
    const hueTexts = screen.getAllByText('Philips Hue E27');
    expect(hueTexts.length).toBeGreaterThan(1);
  });

  // --- TESTUL 5: DESENAREA UNEI LINII ---
  test('Desenează o linie și salvează starea în Undo/Redo', () => {
    render(<LayoutCanvas isDarkMode={false} onBack={mockOnBack} />);
    
    // 1. Apăsăm butonul mock-uit pentru desenarea unei linii
    fireEvent.click(screen.getByTestId('trigger-line'));
    
    // 2. Testăm butoanele de Undo și Redo din Canvas
    fireEvent.click(screen.getByTestId('trigger-undo'));
    fireEvent.click(screen.getByTestId('trigger-redo'));
  });

  // --- TESTUL 6: ZOOM-UL GENERAL AL CANVAS-ULUI ---
  test('Apasă butoanele de Zoom In și Zoom Out pentru mediul de lucru', () => {
    render(<LayoutCanvas isDarkMode={false} onBack={mockOnBack} />);
    
    const zoomInBtn = screen.getByText('+');
    const zoomOutBtn = screen.getByText('-');
    
    fireEvent.click(zoomInBtn);
    fireEvent.click(zoomOutBtn);
    
    // Verificăm dacă există input-ul range de zoom
    const rangeInput = screen.getByRole('slider');
    fireEvent.change(rangeInput, { target: { value: '1.5' } });
    
    expect(rangeInput).toHaveValue('1.5');
  });

  // --- TESTUL 7: SALVAREA ÎN BAZA DE DATE (API) ---
  test('Apelează salvarea layout-ului când se apasă butonul Save', async () => {
    const { authFetch } = await import('../../utils/authFetch');
    
    render(<LayoutCanvas isDarkMode={false} onBack={mockOnBack} />);
    
    // Plasăm un obiect ca să avem ce salva
    fireEvent.click(screen.getByText('Philips Hue E27'));
    fireEvent.click(screen.getByTestId('trigger-click'));
    
    // Căutăm butonul de Save și dăm click
    const saveBtn = screen.getByText(/Save/i).closest('button');
    expect(saveBtn).not.toBeDisabled();
    if (saveBtn) fireEvent.click(saveBtn);
    
    // Așteptăm ca funcția mock-uită de fetch să fie apelată
    await waitFor(() => {
      expect(authFetch).toHaveBeenCalled();
    });
    
    // Verificăm dacă pe ecran a apărut mesajul cu "Saved (id: 999)" pe care l-am setat în mock
    expect(screen.getByText(/Saved \(id: 999\)/i)).toBeInTheDocument();
  });
});