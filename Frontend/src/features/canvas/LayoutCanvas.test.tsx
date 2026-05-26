import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import LayoutCanvas from './LayoutCanvas';
import { authFetch } from '../../utils/authFetch';
import useFilterStore from '../../store/useFilterStore';

globalThis.fetch = vi.fn((url: any) => {
  if (url?.toString().includes('/api/devices')) {
    return Promise.resolve(new Response(JSON.stringify([
      { id: '1', name: 'Philips Hue E27', brand: 'Philips', bestPrice: 49, categoryId: 1, type: 'bec' }
    ]), { status: 200, headers: { 'Content-Type': 'application/json' } }));
  }
  return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }));
}) as any;

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
          <button data-testid="trigger-layout" onClick={() => props.onUpdate({ offsetX: 0, offsetY: 0, dotSpacing: 10 })}>Set Layout</button>
          <button data-testid="trigger-mouse" onClick={() => props.onMouseMove?.(4, 4)}>Move Mouse</button>
          <button data-testid="trigger-click" onClick={() => props.onCanvasClick(5, 5)}>Click Canvas</button>
          <button data-testid="trigger-line" onClick={() => props.onLineComplete('wall', {col:0, row:0}, {col:0, row:5})}>Draw Line</button>
          <button data-testid="trigger-window" onClick={() => props.onLineComplete('window', {col:2, row:2}, {col:6, row:2})}>Draw Window</button>
          <button data-testid="trigger-door" onClick={() => props.onLineComplete('door', {col:3, row:1}, {col:3, row:2})}>Draw Door</button>
          <button data-testid="trigger-validate" onClick={() => props.onCommitValidate?.()}>Validate</button>
          <button data-testid="trigger-undo" onClick={props.undo}>Undo</button>
          <button data-testid="trigger-redo" onClick={props.redo}>Redo</button>
        </div>
    );
  }
}));

describe('LayoutCanvas - Suita de Testare', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (authFetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ saved: true, id: 999, errors: [] })
    });
    useFilterStore.setState({
      ecosystem: null,
      priceRange: [0, 1000],
      categories: [],
      protocols: [],
      brands: [],
      brandInput: '',
      darkMode: false,
    });
  });

  test('Randeaza elementele principale (Butoane, Sidebar, Canvas)', () => {
    render(<LayoutCanvas isDarkMode={false} onBack={mockOnBack} />);
    expect(screen.getByText(/Back to Wizard/i)).toBeInTheDocument();
    expect(screen.getByText(/Device Catalog/i)).toBeInTheDocument();
    expect(screen.getByTestId('mock-sidebar')).toBeInTheDocument();
  });

  test('Apeleaza onBack cand se apasa butonul "Back to Wizard"', () => {
    render(<LayoutCanvas isDarkMode={false} onBack={mockOnBack} />);
    fireEvent.click(screen.getByText(/Back to Wizard/i));
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  test('Schimba uneltele din Floating Menu si deschide submeniul Furniture', () => {
    render(<LayoutCanvas isDarkMode={false} onBack={mockOnBack} />);

    const wallBtn = screen.getByText('Wall').closest('button');
    if (wallBtn) fireEvent.click(wallBtn);

    const furnitureBtn = screen.getByText('Furniture').closest('button');
    if (furnitureBtn) fireEvent.click(furnitureBtn);

    expect(screen.getByText('Bed')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Bed'));
    expect(screen.queryByText('Bed')).not.toBeInTheDocument();
  });

  test('Selecteaza un dispozitiv din catalog, il roteste, ii da zoom si il plaseaza', async () => {
    render(<LayoutCanvas isDarkMode={true} onBack={mockOnBack} />);

    const hueDevice = await screen.findByText('Philips Hue E27');
    fireEvent.click(hueDevice);

    fireEvent.keyDown(window, { key: 'r' });
    fireEvent.wheel(window, { deltaY: -100 });
    fireEvent.click(screen.getByTestId('trigger-click'));

    const hueTexts = await screen.findAllByText('Philips Hue E27');
    expect(hueTexts.length).toBeGreaterThan(1);
  });

  test('Afiseaza preview-ul dispozitivului si permite stergerea lui de pe canvas', async () => {
    render(<LayoutCanvas isDarkMode={false} onBack={mockOnBack} />);

    fireEvent.click(await screen.findByText('Philips Hue E27'));
    fireEvent.click(screen.getByTestId('trigger-layout'));
    fireEvent.click(screen.getByTestId('trigger-mouse'));

    expect(document.querySelector('div[style*="z-index: 100"]')).toBeTruthy();

    fireEvent.click(screen.getByTestId('trigger-click'));
    const placedIcon = document.querySelector('div[style*="z-index: 30"]');
    expect(placedIcon).toBeTruthy();

    if (placedIcon) fireEvent.mouseEnter(placedIcon);
    const deleteButton = Array.from(document.querySelectorAll('button'))
      .find((button) => button.getAttribute('style')?.includes('239, 68, 68')
        || button.getAttribute('style')?.includes('#ef4444'));
    if (deleteButton) fireEvent.click(deleteButton);

    expect(await screen.findByText('No devices active')).toBeInTheDocument();
  });

  test('Initiaza drag pentru un dispozitiv deja plasat', async () => {
    render(<LayoutCanvas isDarkMode={true} onBack={mockOnBack} />);

    fireEvent.click(await screen.findByText('Philips Hue E27'));
    fireEvent.click(screen.getByTestId('trigger-layout'));
    fireEvent.click(screen.getByTestId('trigger-click'));

    const placedIcon = document.querySelector('div[style*="z-index: 30"]');
    expect(placedIcon).toBeTruthy();
    if (placedIcon) fireEvent.mouseDown(placedIcon);

    expect(screen.getByText(/PRESS 'R' TO ROTATE/i)).toBeInTheDocument();
  });

  test('Deseneaza o linie si salveaza starea in Undo/Redo', () => {
    render(<LayoutCanvas isDarkMode={false} onBack={mockOnBack} />);

    fireEvent.click(screen.getByTestId('trigger-line'));
    fireEvent.click(screen.getByTestId('trigger-undo'));
    fireEvent.click(screen.getByTestId('trigger-redo'));
  });

  test('Apasa butoanele de Zoom In si Zoom Out pentru mediul de lucru', () => {
    render(<LayoutCanvas isDarkMode={false} onBack={mockOnBack} />);

    const zoomInBtn = screen.getByRole('button', { name: '+' });
    const zoomOutBtn = screen.getByRole('button', { name: '-' });

    fireEvent.click(zoomInBtn);
    fireEvent.click(zoomOutBtn);

    const rangeInput = screen.getByRole('slider');
    fireEvent.change(rangeInput, { target: { value: '1.5' } });

    expect(rangeInput).toHaveValue('1.5');
  });

  test('Apeleaza salvarea layout-ului cand se apasa butonul Save', async () => {
    localStorage.setItem('accessToken', 'token');
    render(<LayoutCanvas isDarkMode={false} onBack={mockOnBack} />);

    const hueDevice = await screen.findByText('Philips Hue E27');
    fireEvent.click(hueDevice);
    fireEvent.click(screen.getByTestId('trigger-click'));

    const saveBtn = screen.getByText(/Save/i).closest('button');
    expect(saveBtn).not.toBeDisabled();
    if (saveBtn) fireEvent.click(saveBtn);

    fireEvent.change(screen.getByPlaceholderText(/Dormitor Automatizat/i), {
      target: { value: 'Living saved' },
    });
    (globalThis.fetch as any).mockResolvedValueOnce(new Response(JSON.stringify({ id: 999 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));
    fireEvent.click(screen.getByRole('button', { name: /draft/i }));

    await waitFor(() => {
      expect(authFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/team2/layouts/save'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:20025/api/v1/setups',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  test('Construieste URL-ul catalogului din filtre si afiseaza starea goala', async () => {
    useFilterStore.setState({
      priceRange: [100, 700],
      categories: ['Smart Cameras', 'Unknown Category'],
      protocols: ['Z-Wave'],
      brands: ['Aqara'],
      ecosystem: 'Alexa',
    });
    (globalThis.fetch as any).mockResolvedValueOnce(new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));

    render(<LayoutCanvas isDarkMode={false} onBack={mockOnBack} />);

    await waitFor(() => {
      const url = String((globalThis.fetch as any).mock.calls[0][0]);
      expect(url).toContain('minPrice=100');
      expect(url).toContain('maxPrice=700');
      expect(url).toContain('categoryIds=1');
      expect(url).toContain('brand=Aqara');
      expect(url).toContain('protocols=ZWAVE');
      expect(url).toContain('ecosystem=Alexa');
    });
    expect(await screen.findByText(/Niciun produs/)).toBeInTheDocument();
  });

  test('Afiseaza erorile de validare si blocheaza salvarea', async () => {
    (authFetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        errors: [
          { level: 'INFO', message: 'Layout has enough data' },
          { level: 'WARN', message: 'Device is too close to wall' },
        ],
      }),
    });

    render(<LayoutCanvas isDarkMode={false} onBack={mockOnBack} />);
    fireEvent.click(screen.getByTestId('trigger-line'));
    fireEvent.click(screen.getByTestId('trigger-validate'));

    expect(await screen.findByText('Device is too close to wall')).toBeInTheDocument();
    expect(screen.getByText(/Save/i).closest('button')).not.toBeDisabled();
  });

  test('Trateaza validarea si salvarea esuate fara sa crape UI-ul', async () => {
    (authFetch as any)
      .mockRejectedValueOnce(new Error('validation offline'))
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ saved: false }),
      });

    const { unmount } = render(<LayoutCanvas isDarkMode={false} onBack={mockOnBack} />);
    fireEvent.click(screen.getByTestId('trigger-line'));
    fireEvent.click(screen.getByTestId('trigger-validate'));
    expect(await screen.findByText('Eroare la validare')).toBeInTheDocument();

    unmount();
    (authFetch as any).mockReset();
    (authFetch as any).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ saved: false }),
    });
    render(<LayoutCanvas isDarkMode={false} onBack={mockOnBack} />);
    localStorage.setItem('accessToken', 'token');
    const saveBtn = screen.getByText(/Save/i).closest('button');
    if (saveBtn) fireEvent.click(saveBtn);
    const setupNameInput = screen.getByPlaceholderText(/Dormitor Automatizat/i);
    fireEvent.change(setupNameInput, {
      target: { value: 'Broken save' },
    });
    await waitFor(() => expect(setupNameInput).toHaveValue('Broken save'));
    fireEvent.click(screen.getByRole('button', { name: /draft/i }));
    await waitFor(() => expect(authFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/team2/layouts/save'),
      expect.objectContaining({ method: 'POST' })
    ));
    expect(await screen.findByText('Eroare la salvare')).toBeInTheDocument();
  });

  test('Filtrează corect lista de device-uri folosind bara de search', async () => {
    render(<LayoutCanvas isDarkMode={false} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Philips Hue E27')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search devices...');

    fireEvent.change(searchInput, { target: { value: 'Hue' } });
    await waitFor(() => {
      expect(screen.getByText('Philips Hue E27')).toBeInTheDocument();
    });

    fireEvent.change(searchInput, { target: { value: 'Senzor_Inexistent' } });
    await waitFor(() => {
      expect(screen.queryByText('Philips Hue E27')).not.toBeInTheDocument();
    });
  });

  test('Afișează mesajul de empty state când căutarea nu are rezultate', async () => {
    render(<LayoutCanvas isDarkMode={false} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search devices...')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search devices...');

    fireEvent.change(searchInput, { target: { value: 'termen_de_cautare_inexistent_123' } });

    await waitFor(() => {
      expect(screen.getByText('Niciun produs găsit pentru această căutare.')).toBeInTheDocument();
    });
  });
  test('Incarca un setup existent din canvasState si il salveaza cu PUT', async () => {
    localStorage.setItem('accessToken', 'token');
    (globalThis.fetch as any).mockResolvedValueOnce(new Response(JSON.stringify({
      id: 42,
      name: 'Saved layout',
      canvasState: JSON.stringify({
        layoutId: 123,
        lines: [{ id: 'wall-1', type: 'wall', start: { col: 0, row: 0 }, end: { col: 4, row: 0 } }],
        placedIcons: [{
          id: 'placed-1',
          deviceId: '7',
          col: 2,
          row: 2,
          type: 'priza',
          name: 'Existing Plug',
          brand: 'Aqara',
          status: 'online',
          priceEUR: 25,
        }],
        placedFurniture: [],
      }),
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));

    render(<LayoutCanvas isDarkMode={false} onBack={mockOnBack} setupId={42} />);

    expect(await screen.findByText('Existing Plug')).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Save/i).closest('button')!);

    await waitFor(() => {
      expect(authFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/team2/layouts/save'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:20025/api/v1/setups/42',
        expect.objectContaining({ method: 'PUT' })
      );
    });
  });

  test('Publica un setup nou dupa ce creeaza draftul necesar', async () => {
    localStorage.setItem('accessToken', 'token');
    render(<LayoutCanvas isDarkMode={false} onBack={mockOnBack} />);

    fireEvent.click(await screen.findByText('Philips Hue E27'));
    fireEvent.click(screen.getByTestId('trigger-click'));
    fireEvent.click(screen.getByText(/Post/i).closest('button')!);

    fireEvent.change(screen.getByPlaceholderText(/Casa Inteligent/i), {
      target: { value: 'Published layout' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Descrie setup-ul/i), {
      target: { value: 'Automated living room' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Living/i }));

    (globalThis.fetch as any)
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 777 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 777, isPublic: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }));

    fireEvent.click(screen.getByRole('button', { name: /Public/i }));

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:20025/api/v1/setups',
        expect.objectContaining({ method: 'POST' })
      );
    });

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:20025/api/v1/setups/777/publish',
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('Automated living room'),
        })
      );
    });
  });

  test('Afișează butonul Wizard Suggestions și filtrează corect produsele', async () => {
    sessionStorage.setItem('wizard_selected_devices', JSON.stringify([1]));

    (globalThis.fetch as any).mockResolvedValueOnce(new Response(JSON.stringify([
      { id: '1', name: 'Produs din Wizard', brand: 'Philips', bestPrice: 50, categoryId: 1, type: 'bec' },
      { id: '2', name: 'Produs Extra', brand: 'Aqara', bestPrice: 30, categoryId: 8, type: 'senzor' }
    ]), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    render(<LayoutCanvas isDarkMode={false} onBack={mockOnBack} />);

    expect(await screen.findByText('Produs din Wizard')).toBeInTheDocument();
    expect(screen.getByText('Produs Extra')).toBeInTheDocument();

    const wizardBtn = await screen.findByText('Wizard Suggestions');
    expect(wizardBtn).toBeInTheDocument();

    fireEvent.click(wizardBtn);

    await waitFor(() => {
      expect(screen.queryByText('Produs Extra')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Produs din Wizard')).toBeInTheDocument();

    fireEvent.click(wizardBtn);

    await waitFor(() => {
      expect(screen.getByText('Produs Extra')).toBeInTheDocument();
    });
  });

  test('Nu afișează butonul Wizard Suggestions dacă sessionStorage este gol', async () => {
    sessionStorage.removeItem('wizard_selected_devices');

    render(<LayoutCanvas isDarkMode={false} onBack={mockOnBack} />);

    await screen.findByText('Philips Hue E27');

    expect(screen.queryByText('Wizard Suggestions')).not.toBeInTheDocument();
  });
});
