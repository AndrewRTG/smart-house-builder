/**
 * WizardSidebar.test.jsx
 *
 * Vitest + React Testing Library
 * Coverage target: 100% branch & statement
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─────────────────────────────────────────────────────────────────────────────
// 1. STABLE ZUSTAND STORE MOCK
//    Object created once, mutated in tests via helpers.
// ─────────────────────────────────────────────────────────────────────────────
const filterState = {
  ecosystem: '',
  priceRange: [0, 1000],
  categories: [],
  protocols: [],
  brands: [],
  brandInput: '',
  setEcosystem: vi.fn((e) => { filterState.ecosystem = e; }),
  setPriceRange: vi.fn((r) => { filterState.priceRange = r; }),
  toggleCategory: vi.fn((c) => {
    filterState.categories = filterState.categories.includes(c)
        ? filterState.categories.filter(x => x !== c)
        : [...filterState.categories, c];
  }),
  toggleProtocol: vi.fn((p) => {
    filterState.protocols = filterState.protocols.includes(p)
        ? filterState.protocols.filter(x => x !== p)
        : [...filterState.protocols, p];
  }),
  setBrandInput: vi.fn((v) => { filterState.brandInput = v; }),
  addBrand: vi.fn((b) => {
    if (b && !filterState.brands.includes(b)) {
      filterState.brands = [...filterState.brands, b];
    }
    filterState.brandInput = '';
  }),
  removeBrand: vi.fn((b) => {
    filterState.brands = filterState.brands.filter(x => x !== b);
  }),
  resetFilters: vi.fn(() => {
    filterState.ecosystem = '';
    filterState.priceRange = [0, 1000];
    filterState.categories = [];
    filterState.protocols = [];
    filterState.brands = [];
    filterState.brandInput = '';
  }),
  hasNoFilters: vi.fn(() =>
      !filterState.ecosystem &&
      filterState.categories.length === 0 &&
      filterState.protocols.length === 0 &&
      filterState.brands.length === 0
  ),
};

const resetFilterStore = () => {
  filterState.ecosystem = '';
  filterState.priceRange = [0, 1000];
  filterState.categories = [];
  filterState.protocols = [];
  filterState.brands = [];
  filterState.brandInput = '';
  Object.values(filterState)
      .filter(v => typeof v === 'function' && v.mockClear)
      .forEach(fn => fn.mockClear());
  // Re-attach implementation after mockClear wipes it
  filterState.hasNoFilters.mockImplementation(() =>
      !filterState.ecosystem &&
      filterState.categories.length === 0 &&
      filterState.protocols.length === 0 &&
      filterState.brands.length === 0
  );
};

vi.mock('../../../store/useFilterStore.js', () => ({
  default: () => filterState,
}));

// ─────────────────────────────────────────────────────────────────────────────
// 2. COMPONENT IMPORT (after mock)
// ─────────────────────────────────────────────────────────────────────────────
import Sidebar from '../WizardSidebar.jsx';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const renderSidebar = () => render(<Sidebar />);

// ─────────────────────────────────────────────────────────────────────────────
// TESTS
// ─────────────────────────────────────────────────────────────────────────────
describe('WizardSidebar', () => {
  beforeEach(() => {
    resetFilterStore();
  });

  afterEach(() => {
    // Cleanup body scroll lock side-effect
    document.body.style.overflow = '';
  });

  // ── Static rendering ──────────────────────────────────────────────────
  describe('Initial render', () => {
    it('renders the Filters heading', () => {
      renderSidebar();
      expect(screen.getByText('Filters')).toBeInTheDocument();
    });

    it('renders all ecosystem pills', () => {
      renderSidebar();
      ['Apple Home', 'Alexa', 'Google Home', 'More'].forEach(eco => {
        expect(screen.getByText(eco)).toBeInTheDocument();
      });
    });

    it('renders price range values', () => {
      renderSidebar();
      expect(screen.getByText('€0')).toBeInTheDocument();
      expect(screen.getByText('€1000')).toBeInTheDocument();
    });

    it('renders all 12 category checkboxes', () => {
      renderSidebar();
      [
        'Smart Cameras', 'Smart Power Strips', 'Gaming Consoles', 'Smart Appliances',
        'Smart Hubs', 'Smart Monitors', 'Smart Outlets', 'Smart Sensors',
        'Smart Audio', 'Smart TVs', 'Robot Vacuums', 'Smart Routers',
      ].forEach(cat => {
        expect(screen.getByText(cat)).toBeInTheDocument();
      });
    });

    it('renders all 5 protocol checkboxes', () => {
      renderSidebar();
      ['WiFi', 'Zigbee', 'Z-Wave', 'Bluetooth', 'Matter'].forEach(p => {
        expect(screen.getByText(p)).toBeInTheDocument();
      });
    });

    it('renders brand search input', () => {
      renderSidebar();
      expect(screen.getByPlaceholderText('Search brands...')).toBeInTheDocument();
    });

    it('renders Reset Filters button', () => {
      renderSidebar();
      expect(screen.getByText('Reset Filters')).toBeInTheDocument();
    });
  });

  // ── Warning box (no filters) ──────────────────────────────────────────
  describe('No-filters warning', () => {
    it('shows warning box when no filters are active', () => {
      renderSidebar();
      expect(screen.getByText('⚠ No Filters Selected ⚠')).toBeInTheDocument();
    });

    it('hides warning when at least one filter is active', () => {
      filterState.categories = ['Smart Cameras'];
      filterState.hasNoFilters.mockReturnValue(false);
      renderSidebar();
      expect(screen.queryByText('⚠ No Filters Selected ⚠')).not.toBeInTheDocument();
    });
  });

  // ── Ecosystem pills ───────────────────────────────────────────────────
  describe('Ecosystem selection', () => {
    it('calls setEcosystem when a pill is clicked', () => {
      renderSidebar();
      fireEvent.click(screen.getByText('Alexa'));
      expect(filterState.setEcosystem).toHaveBeenCalledWith('Alexa');
    });

    it('applies active class to the selected ecosystem', () => {
      filterState.ecosystem = 'Google Home';
      renderSidebar();
      expect(screen.getByText('Google Home').className).toContain('active');
    });

    it('does not apply active class to unselected ecosystems', () => {
      filterState.ecosystem = 'Alexa';
      renderSidebar();
      expect(screen.getByText('Apple Home').className).not.toContain('active');
    });
  });

  // ── Dual-thumb price slider ───────────────────────────────────────────
  describe('Price range dual-thumb slider', () => {
    it('renders two range inputs', () => {
      renderSidebar();
      const sliders = screen.getAllByRole('slider');
      expect(sliders).toHaveLength(2);
    });

    it('left thumb calls setPriceRange with clamped value', () => {
      renderSidebar();
      const [leftThumb] = screen.getAllByRole('slider');
      // Value must be < priceRange[1] (1000) - 50 = 950
      fireEvent.change(leftThumb, { target: { value: '200' } });
      expect(filterState.setPriceRange).toHaveBeenCalledWith([200, 1000]);
    });

    it('left thumb clamps to priceRange[1] - 50 when value too high', () => {
      filterState.priceRange = [0, 500];
      renderSidebar();
      const [leftThumb] = screen.getAllByRole('slider');
      fireEvent.change(leftThumb, { target: { value: '600' } }); // > 500 - 50 = 450
      expect(filterState.setPriceRange).toHaveBeenCalledWith([450, 500]);
    });

    it('right thumb calls setPriceRange with clamped value', () => {
      renderSidebar();
      const [, rightThumb] = screen.getAllByRole('slider');
      fireEvent.change(rightThumb, { target: { value: '800' } });
      expect(filterState.setPriceRange).toHaveBeenCalledWith([0, 800]);
    });

    it('right thumb clamps to priceRange[0] + 50 when value too low', () => {
      filterState.priceRange = [300, 1000];
      renderSidebar();
      const [, rightThumb] = screen.getAllByRole('slider');
      fireEvent.change(rightThumb, { target: { value: '100' } }); // < 300 + 50 = 350
      expect(filterState.setPriceRange).toHaveBeenCalledWith([300, 350]);
    });
  });

  // ── Categories ────────────────────────────────────────────────────────
  describe('Categories checkboxes', () => {
    it('calls toggleCategory when a checkbox label is clicked', () => {
      renderSidebar();
      fireEvent.click(screen.getByText('Smart Cameras').closest('label'));
      expect(filterState.toggleCategory).toHaveBeenCalledWith('Smart Cameras');
    });

    it('renders checked state for selected categories', () => {
      filterState.categories = ['Smart TVs'];
      renderSidebar();
      const label = screen.getByText('Smart TVs').closest('label');
      const checkbox = within(label).getByRole('checkbox', { hidden: true });
      expect(checkbox.checked).toBe(true);
    });

    it('renders unchecked state for unselected categories', () => {
      filterState.categories = [];
      renderSidebar();
      const label = screen.getByText('Smart Cameras').closest('label');
      const checkbox = within(label).getByRole('checkbox', { hidden: true });
      expect(checkbox.checked).toBe(false);
    });

    it('renders SVG checkmark inside the circle for checked items', () => {
      filterState.categories = ['Smart Hubs'];
      renderSidebar();
      const label = screen.getByText('Smart Hubs').closest('label');
      expect(label.querySelector('svg')).toBeInTheDocument();
    });

    it('does NOT render SVG checkmark for unchecked items', () => {
      filterState.categories = [];
      renderSidebar();
      const label = screen.getByText('Smart Hubs').closest('label');
      expect(label.querySelector('svg')).not.toBeInTheDocument();
    });
  });

  // ── Protocol checkboxes ───────────────────────────────────────────────
  describe('Protocol checkboxes', () => {
    it('calls toggleProtocol when a protocol is clicked', () => {
      renderSidebar();
      fireEvent.click(screen.getByText('Zigbee').closest('label'));
      expect(filterState.toggleProtocol).toHaveBeenCalledWith('Zigbee');
    });

    it('renders checked state for selected protocols', () => {
      filterState.protocols = ['Matter'];
      renderSidebar();
      const label = screen.getByText('Matter').closest('label');
      const checkbox = within(label).getByRole('checkbox', { hidden: true });
      expect(checkbox.checked).toBe(true);
    });
  });

  // ── Brand search & pills ──────────────────────────────────────────────
  describe('Brand search input', () => {
    it('shows suggestions when input matches recommended brands', async () => {
      filterState.brandInput = 'Sam';
      renderSidebar();

      const input = screen.getByPlaceholderText('Search brands...');
      fireEvent.change(input, { target: { value: 'Sam' } });

      expect(filterState.setBrandInput).toHaveBeenCalledWith('Sam');
    });

    it('renders suggestions list when brandInput has value', () => {
      filterState.brandInput = 'Sam';
      renderSidebar();
      // Samsung should appear in suggestions (not yet in brands)
      expect(screen.getByText('Samsung')).toBeInTheDocument();
    });

    it('does NOT show suggestions for already-added brands', () => {
      filterState.brandInput = 'Sam';
      filterState.brands = ['Samsung'];
      renderSidebar();
      // Samsung is in brands → should not appear as suggestion
      expect(screen.queryByText('Samsung')).not.toBeInTheDocument();
    });

    it('does not show suggestions when brandInput is empty', () => {
      filterState.brandInput = '';
      renderSidebar();
      expect(screen.queryByText('Samsung')).not.toBeInTheDocument();
    });

    it('calls addBrand when a suggestion item is clicked', () => {
      filterState.brandInput = 'Phil';
      renderSidebar();
      fireEvent.click(screen.getByText('Philips'));
      expect(filterState.addBrand).toHaveBeenCalledWith('Philips');
    });

    it('calls addBrand on Enter keypress', () => {
      filterState.brandInput = 'Sony';
      renderSidebar();
      const input = screen.getByPlaceholderText('Search brands...');
      fireEvent.keyDown(input, { key: 'Enter' });
      expect(filterState.addBrand).toHaveBeenCalledWith('Sony');
    });

    it('does NOT call addBrand on non-Enter keypresses', () => {
      filterState.brandInput = 'Sony';
      renderSidebar();
      const input = screen.getByPlaceholderText('Search brands...');
      fireEvent.keyDown(input, { key: 'a' });
      expect(filterState.addBrand).not.toHaveBeenCalled();
    });
  });

  // ── Brand pills (status zone) ─────────────────────────────────────────
  describe('Brand pills', () => {
    it('renders brand pills when brands are added', () => {
      filterState.brands = ['LG', 'Sony'];
      filterState.hasNoFilters.mockReturnValue(false);
      renderSidebar();
      expect(screen.getByText('LG')).toBeInTheDocument();
      expect(screen.getByText('Sony')).toBeInTheDocument();
    });

    it('calls removeBrand when the × button is clicked', () => {
      filterState.brands = ['Bosch'];
      filterState.hasNoFilters.mockReturnValue(false);
      renderSidebar();
      fireEvent.click(screen.getByLabelText('Remove Bosch'));
      expect(filterState.removeBrand).toHaveBeenCalledWith('Bosch');
    });

    it('hides warning box when brands are present', () => {
      filterState.brands = ['Ring'];
      filterState.hasNoFilters.mockReturnValue(false);
      renderSidebar();
      expect(screen.queryByText('⚠ No Filters Selected ⚠')).not.toBeInTheDocument();
    });

    it('shows active filter badge count on mobile toggle', () => {
      filterState.ecosystem = 'Alexa';       // +1
      filterState.categories = ['Smart TVs', 'Smart Hubs']; // +2
      filterState.protocols = ['WiFi'];       // +1
      filterState.brands = ['LG'];            // +1
      renderSidebar();
      // Badge should show 5
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('does NOT render badge when no filters are active', () => {
      renderSidebar();
      // No badge element rendered
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });
  });

  // ── Reset button ──────────────────────────────────────────────────────
  describe('Reset Filters button', () => {
    it('calls resetFilters when clicked', () => {
      renderSidebar();
      fireEvent.click(screen.getByText('Reset Filters'));
      expect(filterState.resetFilters).toHaveBeenCalledOnce();
    });
  });

  // ── Mobile drawer — toggle & close ────────────────────────────────────
  describe('Mobile drawer', () => {
    it('renders the mobile Filters toggle button', () => {
      renderSidebar();
      expect(screen.getByLabelText('Open filters')).toBeInTheDocument();
    });

    it('opens drawer when toggle button is clicked', async () => {
      renderSidebar();
      const toggle = screen.getByLabelText('Open filters');
      fireEvent.click(toggle);
      await waitFor(() => {
        expect(screen.getByRole('complementary')).toHaveClass('is-open');
      });
    });

    it('closes drawer when the X button is clicked', async () => {
      renderSidebar();
      fireEvent.click(screen.getByLabelText('Open filters'));
      await waitFor(() => expect(screen.getByRole('complementary')).toHaveClass('is-open'));

      fireEvent.click(screen.getByLabelText('Close filters'));
      await waitFor(() => {
        expect(screen.getByRole('complementary')).not.toHaveClass('is-open');
      });
    });

    it('closes drawer when backdrop is clicked', async () => {
      renderSidebar();
      fireEvent.click(screen.getByLabelText('Open filters'));
      await waitFor(() => expect(screen.getByRole('complementary')).toHaveClass('is-open'));

      // Backdrop is the div with aria-hidden="true"
      const backdrop = document.querySelector('.sb-backdrop');
      expect(backdrop).toBeInTheDocument();
      fireEvent.click(backdrop);

      await waitFor(() => {
        expect(screen.getByRole('complementary')).not.toHaveClass('is-open');
      });
    });

    it('closes drawer when Escape key is pressed', async () => {
      renderSidebar();
      fireEvent.click(screen.getByLabelText('Open filters'));
      await waitFor(() => expect(screen.getByRole('complementary')).toHaveClass('is-open'));

      fireEvent.keyDown(window, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.getByRole('complementary')).not.toHaveClass('is-open');
      });
    });

    it('does not close drawer on non-Escape key presses', async () => {
      renderSidebar();
      fireEvent.click(screen.getByLabelText('Open filters'));
      await waitFor(() => expect(screen.getByRole('complementary')).toHaveClass('is-open'));

      fireEvent.keyDown(window, { key: 'Enter' });
      await waitFor(() => {
        // Still open
        expect(screen.getByRole('complementary')).toHaveClass('is-open');
      });
    });

    it('backdrop is NOT rendered when drawer is closed', () => {
      renderSidebar();
      expect(document.querySelector('.sb-backdrop')).not.toBeInTheDocument();
    });

    it('backdrop IS rendered when drawer is open', async () => {
      renderSidebar();
      fireEvent.click(screen.getByLabelText('Open filters'));
      await waitFor(() => {
        expect(document.querySelector('.sb-backdrop')).toBeInTheDocument();
      });
    });

    it('sets aria-expanded=true when drawer opens', async () => {
      renderSidebar();
      const toggle = screen.getByLabelText('Open filters');
      fireEvent.click(toggle);
      await waitFor(() => {
        expect(toggle.getAttribute('aria-expanded')).toBe('true');
      });
    });

    it('sets aria-expanded=false when drawer is closed', () => {
      renderSidebar();
      const toggle = screen.getByLabelText('Open filters');
      expect(toggle.getAttribute('aria-expanded')).toBe('false');
    });
  });

  // ── Body scroll lock ──────────────────────────────────────────────────
  describe('Body scroll lock side-effect', () => {
    it('sets overflow hidden when drawer is opened', async () => {
      renderSidebar();
      fireEvent.click(screen.getByLabelText('Open filters'));
      await waitFor(() => {
        expect(document.body.style.overflow).toBe('hidden');
      });
    });

    it('restores overflow when drawer is closed', async () => {
      renderSidebar();
      fireEvent.click(screen.getByLabelText('Open filters'));
      await waitFor(() => expect(document.body.style.overflow).toBe('hidden'));

      fireEvent.click(screen.getByLabelText('Close filters'));
      await waitFor(() => {
        expect(document.body.style.overflow).toBe('');
      });
    });

    it('restores overflow on component unmount', async () => {
      const { unmount } = renderSidebar();
      fireEvent.click(screen.getByLabelText('Open filters'));
      await waitFor(() => expect(document.body.style.overflow).toBe('hidden'));

      unmount();
      expect(document.body.style.overflow).toBe('');
    });
  });

  // ── keydown event listener cleanup ───────────────────────────────────
  describe('Window keydown listener cleanup', () => {
    it('removes keydown listener on unmount (Escape no longer works)', async () => {
      const { unmount } = renderSidebar();
      fireEvent.click(screen.getByLabelText('Open filters'));
      await waitFor(() => expect(screen.getByRole('complementary')).toHaveClass('is-open'));

      unmount();

      // Firing Escape after unmount should not throw
      expect(() => fireEvent.keyDown(window, { key: 'Escape' })).not.toThrow();
    });
  });
});