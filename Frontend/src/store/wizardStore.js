import { create } from 'zustand';

const useWizardStore = create((set, get) => ({
    // Datele colectate anterior
    ecosystem: null,
    priceRange: [0, 1500],
    categories: [],
    protocols: [],
    brands: [],
    brandInput: '',

    // Date noi din chestionar
    step: 1,
    techLevel: 'Intermediar', // Default din imagine
    rooms: [],
    darkMode: false,

    // Acțiuni Navigare
    nextStep: () => set((s) => ({ step: Math.min(s.step + 1, 4) })),
    prevStep: () => set((s) => ({ step: Math.max(s.step - 1, 1) })),
    setStep: (s) => set({ step: s }),

    // Acțiuni Date
    setEcosystem: (v) => set((s) => ({ ecosystem: s.ecosystem === v ? null : v })),
    setPrice: (v) => set({ priceRange: [0, v] }),
    setTechLevel: (v) => set({ techLevel: v }),
    toggleCategory: (c) => set((s) => ({
        categories: s.categories.includes(c) ? s.categories.filter(x => x !== c) : [...s.categories, c]
    })),
    toggleProtocol: (p) => set((s) => ({
        protocols: s.protocols.includes(p) ? s.protocols.filter(x => x !== p) : [...s.protocols, p]
    })),
    toggleRoom: (r) => set((s) => ({
        rooms: s.rooms.includes(r) ? s.rooms.filter(x => x !== r) : [...s.rooms, r]
    })),
    setBrandInput: (v) => set({ brandInput: v }),
    setDarkMode: (v) => set({ darkMode: v }),
    addBrand: (b) => {
        if (!b.trim()) return;
        set((s) => ({ brands: [...new Set([...s.brands, b.trim()])], brandInput: '' }));
    },
    removeBrand: (b) => set((s) => ({ brands: s.brands.filter(x => x !== b) })),
    toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
    reset: () => set({ step: 1, ecosystem: null, priceRange: [0, 1500], categories: [], protocols: [], brands: [], rooms: [] })
}));

export default useWizardStore;
