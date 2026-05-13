import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SetupWizard from './SetupWizard';
import useWizardStore from '../../../store/wizardStore';
import { renderWithRouter } from '../../../test/renderWithRouter';

function resetWizardStore() {
  useWizardStore.setState({
    ecosystem: null,
    priceRange: [0, 1500],
    categories: [],
    protocols: [],
    brands: [],
    brandInput: '',
    step: 1,
    techLevel: 'Intermediar',
    rooms: [],
    darkMode: false,
  });
}

function response(body) {
  return Promise.resolve({ json: async () => body });
}

describe('SetupWizard', () => {
  const onFinish = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    resetWizardStore();
    global.fetch = vi.fn((url) => {
      const target = String(url);
      if (target.includes('algorithmSuggestions')) {
        return response([
          { id: 2, name: 'Algorithm Sensor', brand: 'Aqara', bestPrice: 80, categoryId: 8, communicationProtocol: 'Zigbee' },
        ]);
      }
      return response([
        { id: 1, name: 'AI Camera', brand: 'Ring', bestPrice: 120, categoryId: 1, communicationProtocol: 'WiFi' },
      ]);
    });
  });

  afterEach(() => {
    resetWizardStore();
  });

  it('walks through rooms, budget, priorities and technical level', () => {
    renderWithRouter(<SetupWizard onFinish={onFinish} />);

    fireEvent.click(screen.getByText('Rooms'));
    fireEvent.click(screen.getByText(/Next/));
    expect(screen.getByText('What is your total budget?')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('slider'), { target: { value: '3000' } });
    expect(useWizardStore.getState().priceRange).toEqual([0, 3000]);
    fireEvent.click(screen.getByText(/1000/));
    expect(useWizardStore.getState().priceRange).toEqual([0, 1000]);

    fireEvent.click(screen.getByText(/Next/));
    fireEvent.click(screen.getByText('Apple Home'));
    fireEvent.click(screen.getByText('Security'));
    expect(useWizardStore.getState().ecosystem).toBe('Apple Home');
    expect(useWizardStore.getState().categories).toContain('Security');

    fireEvent.click(screen.getByText(/Next/));
    fireEvent.click(screen.getByText('Matter'));
    fireEvent.click(screen.getByText('DIY / Custom'));
    expect(useWizardStore.getState().protocols).toContain('Matter');
    expect(useWizardStore.getState().techLevel).toBe('DIY / Custom');

    fireEvent.click(screen.getByText(/Previous/));
    expect(screen.getByText('What are your priorities?')).toBeInTheDocument();
  });

  it('loads recommendations, toggles products and finishes with selected devices', async () => {
    useWizardStore.setState({
      step: 4,
      categories: ['Security'],
      protocols: ['Matter'],
      ecosystem: 'Apple Home',
      techLevel: 'Plug & Play',
      priceRange: [0, 1000],
    });

    renderWithRouter(<SetupWizard onFinish={onFinish} />);
    fireEvent.click(screen.getByText(/Get Suggestions/));

    expect(await screen.findByText('AI Camera')).toBeInTheDocument();
    expect(await screen.findByText('Algorithm Sensor')).toBeInTheDocument();

    fireEvent.click(screen.getByText('AI Camera'));
    fireEvent.click(screen.getByText('Algorithm Sensor'));
    fireEvent.click(screen.getByText(/Start Project/));

    expect(onFinish).toHaveBeenCalledWith([
      expect.objectContaining({ id: '1', name: 'AI Camera', price: 120 }),
      expect.objectContaining({ id: '2', name: 'Algorithm Sensor', price: 80 }),
    ]);
  });

  it('shows empty recommendation states and can go back from results', async () => {
    global.fetch = vi.fn(() => response([]));
    useWizardStore.setState({ step: 4 });

    renderWithRouter(<SetupWizard onFinish={onFinish} />);
    fireEvent.click(screen.getByText(/Get Suggestions/));

    expect(await screen.findByText('AI found no matches. Try a higher budget!')).toBeInTheDocument();
    expect(screen.getByText('Algorithm found no matches.')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Back'));
    expect(screen.getByText('Technical Level')).toBeInTheDocument();
  });
});
