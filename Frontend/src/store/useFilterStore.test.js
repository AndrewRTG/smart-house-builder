import { afterEach, describe, expect, it } from 'vitest';
import useFilterStore from './useFilterStore';

const resetStore = () => {
  useFilterStore.setState({
    ecosystem: null,
    priceRange: [0, 1000],
    categories: [],
    protocols: [],
    brands: [],
    brandInput: '',
    darkMode: false,
  });
};

afterEach(() => {
  resetStore();
});

describe('useFilterStore', () => {
  it('reports empty filters for the default state', () => {
    expect(useFilterStore.getState().hasNoFilters()).toBe(true);
  });

  it('toggles a category on and off', () => {
    const store = useFilterStore.getState();

    store.toggleCategory('sensors');
    expect(useFilterStore.getState().categories).toEqual(['sensors']);
    expect(useFilterStore.getState().hasNoFilters()).toBe(false);

    useFilterStore.getState().toggleCategory('sensors');
    expect(useFilterStore.getState().categories).toEqual([]);
    expect(useFilterStore.getState().hasNoFilters()).toBe(true);
  });

  it('adds a trimmed brand once and clears the input', () => {
    const store = useFilterStore.getState();

    store.setBrandInput('  Aqara  ');
    store.addBrand('  Aqara  ');
    store.addBrand('Aqara');

    expect(useFilterStore.getState().brands).toEqual(['Aqara']);
    expect(useFilterStore.getState().brandInput).toBe('');
  });

  it('resets filters while keeping dark mode untouched', () => {
    const store = useFilterStore.getState();

    store.setEcosystem('Home Assistant');
    store.toggleProtocol('Zigbee');
    store.setDarkMode(true);
    store.resetFilters();

    expect(useFilterStore.getState().ecosystem).toBeNull();
    expect(useFilterStore.getState().protocols).toEqual([]);
    expect(useFilterStore.getState().darkMode).toBe(true);
    expect(useFilterStore.getState().hasNoFilters()).toBe(true);
  });
});
