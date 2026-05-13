import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import WizardSidebar from './WizardSidebar';
import useFilterStore from '../../../store/useFilterStore';
import { renderWithRouter } from '../../../test/renderWithRouter';

function resetStore() {
  useFilterStore.setState({
    ecosystem: null,
    priceRange: [0, 1000],
    categories: [],
    protocols: [],
    brands: [],
    brandInput: '',
    darkMode: false,
  });
}

afterEach(resetStore);

describe('WizardSidebar', () => {
  it('renders empty filter warning and updates ecosystem, price, category and protocol filters', () => {
    renderWithRouter(<WizardSidebar />);

    expect(screen.getByText(/No Filters Selected/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('Alexa'));
    expect(useFilterStore.getState().ecosystem).toBe('Alexa');

    const [minSlider, maxSlider] = screen.getAllByRole('slider');
    fireEvent.change(minSlider, { target: { value: '300' } });
    fireEvent.change(maxSlider, { target: { value: '700' } });
    expect(useFilterStore.getState().priceRange).toEqual([300, 700]);

    fireEvent.click(screen.getByText('Smart Cameras'));
    fireEvent.click(screen.getByText('Matter'));
    expect(useFilterStore.getState().categories).toEqual(['Smart Cameras']);
    expect(useFilterStore.getState().protocols).toEqual(['Matter']);
  });

  it('adds brands from suggestions, removes them and resets filters', () => {
    renderWithRouter(<WizardSidebar />);

    fireEvent.change(screen.getByPlaceholderText('Search brands...'), { target: { value: 'Sam' } });
    fireEvent.click(screen.getByText('Samsung'));
    expect(useFilterStore.getState().brands).toEqual(['Samsung']);
    expect(screen.queryByText(/No Filters Selected/)).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Search brands...'), { target: { value: 'Philips' } });
    fireEvent.keyDown(screen.getByPlaceholderText('Search brands...'), { key: 'Enter' });
    expect(useFilterStore.getState().brands).toContain('Philips');

    fireEvent.click(screen.getAllByText('×')[0]);
    expect(useFilterStore.getState().brands).not.toContain('Samsung');

    fireEvent.click(screen.getByText('Reset Filters'));
    expect(useFilterStore.getState().hasNoFilters()).toBe(true);
  });
});
