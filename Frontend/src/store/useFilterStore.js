import { create } from 'zustand';

/**
 * Store centralizat pentru filtre.
 * Orice componentă din proiect poate importa acest hook pentru a citi sau modifica starea.
 */
const useFilterStore = create((set, get) => ({
    // --- Stare ---
    ecosystem:  null,
    priceRange: [0, 500],
    categories: [],
    protocols:  [],
    brands:     [],
    brandInput: '',
    darkMode: false,

    // --- Logica de Verificare ---
    hasNoFilters: () => {
        const s = get();
        return (
            s.ecosystem   === null     &&
            s.priceRange[0] === 0      &&
            s.priceRange[1] === 500    &&
            s.categories.length === 0  &&
            s.protocols.length  === 0  &&
            s.brands.length     === 0
        );
    },

    // --- Acțiuni ---
    setEcosystem: (value) =>
        set((s) => ({ ecosystem: s.ecosystem === value ? null : value })),

    setPriceRange: (range) => set({ priceRange: range }),

    toggleCategory: (cat) =>
        set((s) => ({
            categories: s.categories.includes(cat)
                ? s.categories.filter((c) => c !== cat)
                : [...s.categories, cat],
        })),

    toggleProtocol: (proto) =>
        set((s) => ({
            protocols: s.protocols.includes(proto)
                ? s.protocols.filter((p) => p !== proto)
                : [...s.protocols, proto],
        })),

    setBrandInput: (val) => set({ brandInput: val }),

    addBrand: (brand) => {
        const trimmed = brand.trim();
        if (!trimmed) return;
        set((s) => ({
            brands: s.brands.includes(trimmed) ? s.brands : [...s.brands, trimmed],
            brandInput: '',
        }));
    },

    removeBrand: (brand) =>
        set((s) => ({ brands: s.brands.filter((b) => b !== brand) })),

    toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),

    resetFilters: () =>
        set({
            ecosystem:  null,
            priceRange: [0, 500],
            categories: [],
            protocols:  [],
            brands:     [],
            brandInput: '',
        }),
}));

export default useFilterStore;