import { afterEach, describe, expect, it } from 'vitest';
import useWizardStore from './wizardStore';

const resetWizardStore = () => {
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
};

afterEach(() => {
  resetWizardStore();
});

describe('wizardStore', () => {
  it('caps the step between 1 and 4', () => {
    const store = useWizardStore.getState();

    store.prevStep();
    expect(useWizardStore.getState().step).toBe(1);

    store.setStep(4);
    store.nextStep();
    expect(useWizardStore.getState().step).toBe(4);
  });

  it('toggles categories, protocols, and rooms', () => {
    const store = useWizardStore.getState();

    store.toggleCategory('lighting');
    store.toggleProtocol('Matter');
    store.toggleRoom('Bedroom');

    expect(useWizardStore.getState().categories).toEqual(['lighting']);
    expect(useWizardStore.getState().protocols).toEqual(['Matter']);
    expect(useWizardStore.getState().rooms).toEqual(['Bedroom']);

    useWizardStore.getState().toggleRoom('Bedroom');
    expect(useWizardStore.getState().rooms).toEqual([]);
  });

  it('adds unique trimmed brands and clears the input', () => {
    const store = useWizardStore.getState();

    store.setBrandInput('  Aqara ');
    store.addBrand('  Aqara ');
    store.addBrand('Aqara');

    expect(useWizardStore.getState().brands).toEqual(['Aqara']);
    expect(useWizardStore.getState().brandInput).toBe('');
  });

  it('resets the wizard state to defaults', () => {
    const store = useWizardStore.getState();

    store.setStep(3);
    store.setPrice(450);
    store.toggleDarkMode();
    store.toggleCategory('security');
    store.reset();

    expect(useWizardStore.getState().step).toBe(1);
    expect(useWizardStore.getState().priceRange).toEqual([0, 1500]);
    expect(useWizardStore.getState().categories).toEqual([]);
    expect(useWizardStore.getState().rooms).toEqual([]);
  });
});
