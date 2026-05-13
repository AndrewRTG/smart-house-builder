import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import LayoutCanvas from './LayoutCanvas';
import * as authFetchModule from '../../utils/authFetch';

// Hoist variables so they are initialized BEFORE vi.mock() is executed
const { mockNavigate, mockUseFilterStore } = vi.hoisted(() => {
  const mockStoreState = {
    filteredProducts: [
      { id: 'p1', deviceType: 'tv', price: 500, protocol: 'WiFi', name: 'Smart TV', brand: 'Samsung' }
    ],
    priceRange: [0, 2000],
    categories: [],
    protocols: [],
    brands: [],
    ecosystem: ''
  };

  const storeMock = vi.fn((selector) => (selector ? selector(mockStoreState) : mockStoreState));
  Object.assign(storeMock, { getState: () => mockStoreState });

  return {
    mockNavigate: vi.fn(),
    mockUseFilterStore: storeMock
  };
});

// Setup mocks
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}));

vi.mock('../../store/useFilterStore', () => ({
  default: mockUseFilterStore
}));

// Mock GridCanvas to expose buttons that simulate internal state changes
vi.mock('./GridCanvas', () => ({
  default: (props: any) => (
    <div data-testid="mock-grid-canvas">
      <button onClick={() => {
        if (props.setLines) {
          props.setLines([{ id: '1', type: 'wall', start: { col: 0, row: 0 }, end: { col: 1, row: 1 } }]);
        }
      }}>
        Add Line
      </button>
      <button onClick={() => {
        if (props.setPlacedIcons) {
          // Provide exactly the properties LayoutCanvas.tsx expects natively
          props.setPlacedIcons([{ 
            id: 'p1', 
            type: 'tv', 
            col: 5, 
            row: 5,
            priceEUR: 500,
            name: 'Smart TV',
            brand: 'Samsung'
          }]);
        }
      }}>
        Add Device
      </button>
      <button onClick={() => {
        if (props.onCommitValidate) props.onCommitValidate();
      }}>
        Validate
      </button>
    </div>
  )
}));

vi.mock('../wizard/components/WizardSidebar', () => ({
  default: () => <div data-testid="mock-sidebar">Sidebar</div>
}));

vi.mock('../../utils/authFetch', () => ({
  authFetch: vi.fn()
}));

vi.mock('./captureLayoutThumbnail', () => ({
  captureLayoutThumbnailRoot: vi.fn().mockResolvedValue('base64img')
}));

describe('LayoutCanvas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('renders layout and handles back button', () => {
    const onBack = vi.fn();
    render(<LayoutCanvas isDarkMode={false} onBack={onBack} />);
    expect(screen.getByTestId('mock-grid-canvas')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('← Back to Wizard'));
    expect(onBack).toHaveBeenCalled();
  });

  test('calculates devices and total cost correctly', async () => {
    render(<LayoutCanvas isDarkMode={false} onBack={vi.fn()} />);
    
    // Simulate placing a device on the canvas
    await act(async () => {
      fireEvent.click(screen.getByText('Add Device'));
    });

    // The header should update with the matched device stats
    expect(screen.getByText('1')).toBeInTheDocument(); // 1 device
    
    // Checks for properties actively extracted in LayoutCanvas.tsx
    expect(screen.getByText(/500/i)).toBeInTheDocument(); 
    expect(screen.getByText('Smart TV')).toBeInTheDocument(); 
  });

  test('handles zoom controls (+, -, and slider)', () => {
    render(<LayoutCanvas isDarkMode={false} onBack={vi.fn()} />);
    
    // Use getByRole to avoid matching the "-" protocol placeholder
    const zoomInBtn = screen.getByRole('button', { name: '+' });
    const zoomOutBtn = screen.getByRole('button', { name: '-' });
    const zoomSlider = screen.getByRole('slider');

    // Trigger zoom interactions to ensure handlers execute without errors
    fireEvent.click(zoomInBtn);
    fireEvent.click(zoomOutBtn);
    fireEvent.change(zoomSlider, { target: { value: '2' } });
  });

  test('handles panning via Spacebar and mouse', () => {
    render(<LayoutCanvas isDarkMode={false} onBack={vi.fn()} />);
    const container = screen.getByTestId('mock-grid-canvas').parentElement!;

    // 1. Press Spacebar
    fireEvent.keyDown(window, { code: 'Space' });
    
    // 2. Click and drag
    fireEvent.mouseDown(container, { clientX: 100, clientY: 100, button: 0 });
    fireEvent.mouseMove(container, { clientX: 150, clientY: 150 });
    fireEvent.mouseUp(container);
    fireEvent.mouseLeave(container);
    
    // 3. Release Spacebar
    fireEvent.keyUp(window, { code: 'Space' });
  });

  test('handles panning via Middle Mouse Button', () => {
    render(<LayoutCanvas isDarkMode={false} onBack={vi.fn()} />);
    const container = screen.getByTestId('mock-grid-canvas').parentElement!;

    // Middle click (button: 1)
    fireEvent.mouseDown(container, { clientX: 100, clientY: 100, button: 1 });
    fireEvent.mouseMove(container, { clientX: 200, clientY: 200 });
    fireEvent.mouseUp(container);
  });

  test('handles wheel events for zooming and panning', () => {
    render(<LayoutCanvas isDarkMode={false} onBack={vi.fn()} />);
    const container = screen.getByTestId('mock-grid-canvas').parentElement!;

    // Wheel Pan (no Ctrl key)
    fireEvent.wheel(container, { deltaX: 10, deltaY: 20 });

    // Wheel Zoom (with Ctrl key)
    fireEvent.wheel(container, { deltaY: -100, ctrlKey: true });
  });

  test('handles Escape key to clear active tools', () => {
    render(<LayoutCanvas isDarkMode={false} onBack={vi.fn()} />);
    fireEvent.keyDown(window, { key: 'Escape' });
  });

  test('saves layout successfully', async () => {
    vi.mocked(authFetchModule.authFetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ saved: true, id: 999 })
    } as any);

    render(<LayoutCanvas isDarkMode={false} onBack={vi.fn()} />);
    
    // Make layout valid by adding content
    await act(async () => {
      fireEvent.click(screen.getByText('Add Line'));
    });

    await act(async () => {
      fireEvent.click(screen.getByText(/Save/i));
    });
    
    await waitFor(() => {
      expect(screen.getByText(/Saved|id: 999/i)).toBeInTheDocument();
    });
  });

  test('Post layout button renders (currently inactive in component)', async () => {
    render(<LayoutCanvas isDarkMode={false} onBack={vi.fn()} />);
    
    const postBtn = screen.getByText(/Post/i);
    expect(postBtn).toBeInTheDocument();
    
    // Interact to cover branch
    await act(async () => {
      fireEvent.click(postBtn);
    });
  });

  test('triggers validation fetch correctly on commit', async () => {
    vi.useFakeTimers();
    vi.mocked(authFetchModule.authFetch).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ errors: [{ level: 'ERROR', message: 'Eroare test' }] })
    } as any);

    render(<LayoutCanvas isDarkMode={false} onBack={vi.fn()} />);
    
    await act(async () => {
      fireEvent.click(screen.getByText('Add Line'));
    });
    
    await act(async () => {
      fireEvent.click(screen.getByText('Validate'));
      vi.runAllTimers();
    });

    expect(authFetchModule.authFetch).toHaveBeenCalled();
  });
});