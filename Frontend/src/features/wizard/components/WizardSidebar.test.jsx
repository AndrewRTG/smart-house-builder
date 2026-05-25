import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import WizardSidebar from './WizardSidebar';
import useFilterStore from '../../../store/useFilterStore';
import { renderWithRouter } from '../../../test/renderWithRouter';

describe('WizardSidebar Component', () => {

  // Asigurăm un mediu curat înainte de FIECARE test
  beforeEach(() => {
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

  // Curățăm style-ul de pe body ca să nu afectăm alte teste (din cauza meniului de mobil)
  afterEach(() => {
    document.body.style.overflow = '';
  });

  // ── 1. Funcționalitățile de bază (Desktop) ──────────────────────────────────
  it('randează filtrele de bază și permite selecția acestora', () => {
    renderWithRouter(<WizardSidebar />);

    // Verificăm afișarea stării goale
    expect(screen.getByText(/No Filters Selected/i)).toBeInTheDocument();

    // Ecosistem
    fireEvent.click(screen.getByText('Alexa'));
    expect(useFilterStore.getState().ecosystem).toBe('Alexa');

    // Categorii și Protocoale (checkbox-uri ascunse via click pe label)
    fireEvent.click(screen.getByText('Smart Cameras'));
    fireEvent.click(screen.getByText('Matter'));
    expect(useFilterStore.getState().categories).toContain('Smart Cameras');
    expect(useFilterStore.getState().protocols).toContain('Matter');
  });

  // ── 2. Limitele Slidere-lor de Preț (Math.min / Math.max) ─────────────────
  it('respectă limitele matematice stricte pentru sliderele de preț', () => {
    renderWithRouter(<WizardSidebar />);
    const [minSlider, maxSlider] = screen.getAllByRole('slider');

    // Forțăm slider-ul de min peste cel de max (limita este max - 50) -> 1000 - 50 = 950
    fireEvent.change(minSlider, { target: { value: '1500' } });
    expect(useFilterStore.getState().priceRange[0]).toBe(950);

    // Forțăm slider-ul de max sub cel de min (limita este min + 50) -> 950 + 50 = 1000
    fireEvent.change(maxSlider, { target: { value: '200' } });
    expect(useFilterStore.getState().priceRange[1]).toBe(1000);
  });

  // ── 3. Funcționalitatea de Căutare Branduri ────────────────────────────────
  it('gestionează search-ul, adăugarea, ștergerea de branduri și resetarea totală', () => {
    renderWithRouter(<WizardSidebar />);
    const searchInput = screen.getByPlaceholderText('Search brands...');

    // Adăugare prin click pe sugestie
    fireEvent.change(searchInput, { target: { value: 'Sam' } });
    fireEvent.click(screen.getByText('Samsung'));
    expect(useFilterStore.getState().brands).toContain('Samsung');

    // Adăugare prin apăsarea tastei Enter
    fireEvent.change(searchInput, { target: { value: 'Philips' } });
    fireEvent.keyDown(searchInput, { key: 'Enter' });
    expect(useFilterStore.getState().brands).toContain('Philips');

    // După filtrare, avertismentul "No Filters" dispare
    expect(screen.queryByText(/No Filters Selected/i)).not.toBeInTheDocument();

    // Ștergerea unui brand (click pe X-ul pill-ului)
    const removeBtns = screen.getAllByText('×');
    fireEvent.click(removeBtns[0]); // Șterge 'Samsung'
    expect(useFilterStore.getState().brands).not.toContain('Samsung');

    // Resetarea tuturor filtrelor
    fireEvent.click(screen.getByText('Reset Filters'));
    expect(useFilterStore.getState().brands.length).toBe(0);
  });

  // ── 4. Logica de Responsive (Mobile Drawer / Meniu Glisant) ───────────────
  it('deschide meniul lateral pe mobil, blochează scroll-ul și randează badge-ul de filtre', () => {
    renderWithRouter(<WizardSidebar />);

    const toggleBtn = screen.getByRole('button', { name: /Open filters/i });
    const sidebar = screen.getByRole('complementary', { name: /Product filters/i });

    // Inițial badge-ul nu există (0 filtre)
    expect(document.querySelector('.sb-filter-badge')).not.toBeInTheDocument();

    // Simulăm adăugarea din exterior a unor filtre ca să testăm Badge-ul
    useFilterStore.setState({ ecosystem: 'Alexa', categories: ['Smart TVs'], protocols: ['WiFi'] });

    // 3 filtre adăugate -> trebuie să apară badge-ul "3"
    expect(screen.getByText('3')).toHaveClass('sb-filter-badge');

    // Meniul pe mobil este inițial închis
    expect(sidebar).not.toHaveClass('is-open');

    // Deschidem meniul (Click pe butonul "Filters")
    fireEvent.click(toggleBtn);
    expect(sidebar).toHaveClass('is-open');
    expect(document.body.style.overflow).toBe('hidden'); // Blochează fundalul

    // Închidem meniul (Click pe "X" de pe mobil)
    const closeBtn = screen.getByRole('button', { name: /Close filters/i });
    fireEvent.click(closeBtn);
    expect(sidebar).not.toHaveClass('is-open');
    expect(document.body.style.overflow).toBe(''); // Deblochează fundalul
  });

  // ── 5. Accesibilitate Meniu Mobil (Backdrop & Escape Key) ──────────────────
  it('închide meniul lateral de pe mobil la click pe backdrop sau la apăsarea tastei Escape', () => {
    renderWithRouter(<WizardSidebar />);
    const toggleBtn = screen.getByRole('button', { name: /Open filters/i });

    // Deschidem meniul ca să generăm Backdrop-ul
    fireEvent.click(toggleBtn);
    let backdrop = document.querySelector('.sb-backdrop');
    expect(backdrop).toBeInTheDocument();

    // Click pe fundalul gri (Backdrop) îl închide
    fireEvent.click(backdrop);
    expect(document.querySelector('.sb-backdrop')).not.toBeInTheDocument();

    // Îl redeschidem pentru a testa tasta Escape
    fireEvent.click(toggleBtn);
    expect(document.querySelector('.sb-backdrop')).toBeInTheDocument();

    // Apăsăm tasta Escape
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(document.querySelector('.sb-backdrop')).not.toBeInTheDocument();
  });

});