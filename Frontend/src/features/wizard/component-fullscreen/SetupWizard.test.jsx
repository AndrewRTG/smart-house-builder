import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTANT: mockStore este un obiect STABIL (aceeași referință mereu).
// Dacă am folosi vi.fn(() => ({ ...mockStore })) am crea obiecte noi la fiecare
// render, ceea ce face ca dependency array-ul din useEffect să vadă mereu
// valori "noi" → infinite re-render loop.
// ─────────────────────────────────────────────────────────────────────────────
const mockStore = {
    step: 1,
    rooms: [],
    priceRange: [0, 1000],
    ecosystem: '',
    categories: [],
    protocols: [],
    techLevel: 'Plug & Play',
    darkMode: false,
    toggleRoom: vi.fn(),
    setPrice: vi.fn(),
    setEcosystem: vi.fn(),
    toggleCategory: vi.fn(),
    toggleProtocol: vi.fn(),
    setTechLevel: vi.fn(),
    nextStep: vi.fn(),
    prevStep: vi.fn(),
    setStep: vi.fn(),
};

vi.mock('../../../store/wizardStore.js', () => ({
    default: vi.fn(() => mockStore),
}));

vi.mock('./wizard.css', () => ({}));

// Mock stabil pentru import.meta.env
vi.stubGlobal('import', { meta: { env: { VITE_API_BASE_URL: 'http://localhost:20025' } } });

import SetupWizard from './SetupWizard';
import useWizardStore from '../../../store/wizardStore.js';

// Helper: resetează câmpurile mockStore în loc să creeze obiect nou
const resetStore = (overrides = {}) => {
    mockStore.step = 1;
    mockStore.rooms = [];
    mockStore.priceRange = [0, 1000];
    mockStore.ecosystem = '';
    mockStore.categories = [];
    mockStore.protocols = [];
    mockStore.techLevel = 'Plug & Play';
    mockStore.darkMode = false;
    Object.assign(mockStore, overrides);
    // Resetăm și funcțiile
    vi.clearAllMocks();
    // Re-atașăm funcțiile după clearAllMocks (clearAllMocks șterge implementările)
    mockStore.toggleRoom = vi.fn();
    mockStore.setPrice = vi.fn();
    mockStore.setEcosystem = vi.fn();
    mockStore.toggleCategory = vi.fn();
    mockStore.toggleProtocol = vi.fn();
    mockStore.setTechLevel = vi.fn();
    mockStore.nextStep = vi.fn();
    mockStore.prevStep = vi.fn();
    mockStore.setStep = vi.fn();
};

beforeEach(() => {
    resetStore();
    global.fetch = vi.fn().mockResolvedValue({ json: async () => [] });
});

afterEach(() => {
    vi.restoreAllMocks();
});

// ─── Utility: navighează la SuggestedProductsView ────────────────────────────
const goToSuggestions = async (fetchImpl) => {
    if (fetchImpl) global.fetch = vi.fn().mockImplementation(fetchImpl);
    resetStore({ step: 4, priceRange: [0, 1500], ecosystem: 'Alexa', techLevel: 'Intermediate', categories: ['Security'], protocols: ['Wi-Fi'] });
    render(<SetupWizard onFinish={vi.fn()} />);
    fireEvent.click(screen.getByText(/Get Suggestions/i));
    await waitFor(() => screen.getByText(/Recommended Devices/i), { timeout: 5000 });
};

// ═══════════════════════════════════════════════════════════════════════════
// SetupWizard — randare inițială
// ═══════════════════════════════════════════════════════════════════════════
describe('SetupWizard — randare inițială', () => {
    test('randează progress tracker cu 4 pași', () => {
        render(<SetupWizard onFinish={vi.fn()} />);
        expect(screen.getByText('Rooms')).toBeInTheDocument();
        expect(screen.getByText('Budget')).toBeInTheDocument();
        expect(screen.getByText('Priorities')).toBeInTheDocument();
        expect(screen.getByText('Level')).toBeInTheDocument();
    });

    test('randează butoanele de navigare', () => {
        render(<SetupWizard onFinish={vi.fn()} />);
        expect(screen.getByText(/Previous/i)).toBeInTheDocument();
        expect(screen.getByText(/Next/i)).toBeInTheDocument();
    });

    test('butonul Previous este dezactivat pe step 1', () => {
        render(<SetupWizard onFinish={vi.fn()} />);
        expect(screen.getByText(/Previous/i)).toBeDisabled();
    });

    test('aplică clasa dark-mode când darkMode=true', () => {
        resetStore({ darkMode: true });
        const { container } = render(<SetupWizard onFinish={vi.fn()} />);
        expect(container.firstChild).toHaveClass('dark-mode');
    });

    test('nu aplică dark-mode când darkMode=false', () => {
        const { container } = render(<SetupWizard onFinish={vi.fn()} />);
        expect(container.firstChild).not.toHaveClass('dark-mode');
    });
});

// ─── Step 1: Rooms ───────────────────────────────────────────────────────────
describe('SetupWizard — Step 1: Rooms', () => {
    test('afișează titlul și cele 4 placeholder-uri de cameră', () => {
        render(<SetupWizard onFinish={vi.fn()} />);
        expect(screen.getByText(/Which rooms are you equipping/i)).toBeInTheDocument();
        // RoomImageCard nu randează name-ul, doar placeholder-uri
        expect(screen.getAllByText('Image Placeholder')).toHaveLength(4);
    });

    test('click pe prima cameră apelează toggleRoom cu "living"', () => {
        render(<SetupWizard onFinish={vi.fn()} />);
        // Primul card din grilă = Living Room
        const cards = document.querySelectorAll('.room-image-card');
        fireEvent.click(cards[0]);
        expect(mockStore.toggleRoom).toHaveBeenCalledWith('living');
    });

    test('click pe a doua cameră apelează toggleRoom cu "kitchen"', () => {
        render(<SetupWizard onFinish={vi.fn()} />);
        const cards = document.querySelectorAll('.room-image-card');
        fireEvent.click(cards[1]);
        expect(mockStore.toggleRoom).toHaveBeenCalledWith('kitchen');
    });

    test('camera selectată (bedroom = index 2) primește clasa selected', () => {
        resetStore({ rooms: ['bedroom'] });
        render(<SetupWizard onFinish={vi.fn()} />);
        const cards = document.querySelectorAll('.room-image-card');
        expect(cards[2]).toHaveClass('selected');   // bedroom = al 3-lea
        expect(cards[0]).not.toHaveClass('selected'); // living = primul
    });

    test('placeholder-uri de imagine sunt afișate', () => {
        render(<SetupWizard onFinish={vi.fn()} />);
        expect(screen.getAllByText('Image Placeholder')).toHaveLength(4);
    });

    test('click pe step în progress tracker apelează setStep', () => {
        render(<SetupWizard onFinish={vi.fn()} />);
        const progressSteps = document.querySelectorAll('.progress-step');
        fireEvent.click(progressSteps[2]); // step 3
        expect(mockStore.setStep).toHaveBeenCalledWith(3);
    });
});

// ─── Step 2: Budget ──────────────────────────────────────────────────────────
describe('SetupWizard — Step 2: Budget', () => {
    beforeEach(() => resetStore({ step: 2 }));

    test('afișează titlul și valoarea bugetului curent', () => {
        render(<SetupWizard onFinish={vi.fn()} />);
        expect(screen.getByText(/What is your total budget/i)).toBeInTheDocument();
        // '1000€' apare de 2 ori: în <h1> și în butonul rapid → folosim getAllByText
        expect(screen.getAllByText('1000€').length).toBeGreaterThanOrEqual(1);
    });

    test('slider apelează setPrice la schimbare', () => {
        render(<SetupWizard onFinish={vi.fn()} />);
        fireEvent.change(screen.getByRole('slider'), { target: { value: '2000' } });
        expect(mockStore.setPrice).toHaveBeenCalledWith(2000);
    });

    test('butonul rapid 500€ apelează setPrice(500)', () => {
        render(<SetupWizard onFinish={vi.fn()} />);
        fireEvent.click(screen.getByText('500€'));
        expect(mockStore.setPrice).toHaveBeenCalledWith(500);
    });

    test('butonul rapid 3000€ apelează setPrice(3000)', () => {
        render(<SetupWizard onFinish={vi.fn()} />);
        fireEvent.click(screen.getByText('3000€'));
        expect(mockStore.setPrice).toHaveBeenCalledWith(3000);
    });

    test('butonul corespunzător valorii curente are clasa active', () => {
        resetStore({ step: 2, priceRange: [0, 1000] });
        render(<SetupWizard onFinish={vi.fn()} />);
        // Căutăm specific butonul (nu <h1>)
        const btn1000 = screen.getByRole('button', { name: '1000€' });
        expect(btn1000).toHaveClass('active');
        const btn500 = screen.getByRole('button', { name: '500€' });
        expect(btn500).not.toHaveClass('active');
    });
});

// ─── Step 3: Priorities ───────────────────────────────────────────────────────
describe('SetupWizard — Step 3: Priorities', () => {
    beforeEach(() => resetStore({ step: 3 }));

    test('afișează cele 3 ecosisteme', () => {
        render(<SetupWizard onFinish={vi.fn()} />);
        expect(screen.getByText('Apple Home')).toBeInTheDocument();
        expect(screen.getByText('Alexa')).toBeInTheDocument();
        expect(screen.getByText('Google Home')).toBeInTheDocument();
    });

    test('click pe ecosistem apelează setEcosystem', () => {
        render(<SetupWizard onFinish={vi.fn()} />);
        fireEvent.click(screen.getByText('Alexa'));
        expect(mockStore.setEcosystem).toHaveBeenCalledWith('Alexa');
    });

    test('ecosistem activ are clasa active', () => {
        resetStore({ step: 3, ecosystem: 'Google Home' });
        render(<SetupWizard onFinish={vi.fn()} />);
        expect(screen.getByText('Google Home')).toHaveClass('active');
        expect(screen.getByText('Alexa')).not.toHaveClass('active');
    });

    test('afișează toate cele 4 categorii', () => {
        render(<SetupWizard onFinish={vi.fn()} />);
        expect(screen.getByText('Security')).toBeInTheDocument();
        expect(screen.getByText('Comfort')).toBeInTheDocument();
        expect(screen.getByText('Energy')).toBeInTheDocument();
        expect(screen.getByText('Entertainment')).toBeInTheDocument();
    });

    test('click pe categorie apelează toggleCategory', () => {
        render(<SetupWizard onFinish={vi.fn()} />);
        fireEvent.click(screen.getByText('Security').closest('.option-card'));
        expect(mockStore.toggleCategory).toHaveBeenCalledWith('Security');
    });

    test('categoria selectată are clasa selected', () => {
        resetStore({ step: 3, categories: ['Energy'] });
        render(<SetupWizard onFinish={vi.fn()} />);
        expect(screen.getByText('Energy').closest('.option-card')).toHaveClass('selected');
        expect(screen.getByText('Security').closest('.option-card')).not.toHaveClass('selected');
    });
});

// ─── Step 4: Technical Level ──────────────────────────────────────────────────
describe('SetupWizard — Step 4: Technical Level', () => {
    beforeEach(() => resetStore({ step: 4 }));

    test('afișează cele 3 protocoale', () => {
        render(<SetupWizard onFinish={vi.fn()} />);
        expect(screen.getByText('Wi-Fi')).toBeInTheDocument();
        expect(screen.getByText('Zigbee')).toBeInTheDocument();
        expect(screen.getByText('Matter')).toBeInTheDocument();
    });

    test('click pe protocol apelează toggleProtocol', () => {
        render(<SetupWizard onFinish={vi.fn()} />);
        fireEvent.click(screen.getByText('Zigbee'));
        expect(mockStore.toggleProtocol).toHaveBeenCalledWith('Zigbee');
    });

    test('protocol activ are clasa active', () => {
        resetStore({ step: 4, protocols: ['Matter'] });
        render(<SetupWizard onFinish={vi.fn()} />);
        expect(screen.getByText('Matter')).toHaveClass('active');
        expect(screen.getByText('Wi-Fi')).not.toHaveClass('active');
    });

    test('afișează cele 3 niveluri tehnice', () => {
        render(<SetupWizard onFinish={vi.fn()} />);
        expect(screen.getByText('Plug & Play')).toBeInTheDocument();
        expect(screen.getByText('Intermediate')).toBeInTheDocument();
        expect(screen.getByText('DIY / Custom')).toBeInTheDocument();
    });

    test('click pe nivel tehnic apelează setTechLevel', () => {
        render(<SetupWizard onFinish={vi.fn()} />);
        fireEvent.click(screen.getByText('Intermediate').closest('.option-card'));
        expect(mockStore.setTechLevel).toHaveBeenCalledWith('Intermediate');
    });

    test('nivelul activ are clasa selected', () => {
        resetStore({ step: 4, techLevel: 'DIY / Custom' });
        render(<SetupWizard onFinish={vi.fn()} />);
        expect(screen.getByText('DIY / Custom').closest('.option-card')).toHaveClass('selected');
        expect(screen.getByText('Plug & Play').closest('.option-card')).not.toHaveClass('selected');
    });

    test('butonul Next pe step 4 devine "Get Suggestions"', () => {
        render(<SetupWizard onFinish={vi.fn()} />);
        expect(screen.getByText(/Get Suggestions/i)).toBeInTheDocument();
    });

    test('click pe "Get Suggestions" afișează SuggestedProductsView', async () => {
        render(<SetupWizard onFinish={vi.fn()} />);
        fireEvent.click(screen.getByText(/Get Suggestions/i));
        await waitFor(() => expect(screen.getByText(/Recommended Devices/i)).toBeInTheDocument(), { timeout: 5000 });
    });
});

// ─── Navigare ──────────────────────────────────────────────────────────────
describe('SetupWizard — navigare', () => {
    test('click Next apelează nextStep', () => {
        render(<SetupWizard onFinish={vi.fn()} />);
        fireEvent.click(screen.getByText(/Next/i));
        expect(mockStore.nextStep).toHaveBeenCalled();
    });

    test('click Previous apelează prevStep', () => {
        resetStore({ step: 2 });
        render(<SetupWizard onFinish={vi.fn()} />);
        fireEvent.click(screen.getByText(/Previous/i));
        expect(mockStore.prevStep).toHaveBeenCalled();
    });

    test('step > index afișează ✓ în cercurile completate', () => {
        resetStore({ step: 3 });
        render(<SetupWizard onFinish={vi.fn()} />);
        const checkmarks = screen.getAllByText('✓');
        expect(checkmarks.length).toBeGreaterThanOrEqual(2);
    });

    test('step activ are clasa active pe cercul de progress', () => {
        resetStore({ step: 2 });
        render(<SetupWizard onFinish={vi.fn()} />);
        expect(document.querySelectorAll('.step-circle.active')).toHaveLength(1);
    });

    test('step invalid (99) nu randează conținut de step', () => {
        resetStore({ step: 99 });
        render(<SetupWizard onFinish={vi.fn()} />);
        // Verificăm că titlurile de conținut ale pașilor nu apar
        // (progress tracker conține "Budget" ca label, deci nu căutăm simplu "budget")
        expect(screen.queryByText(/Which rooms are you equipping/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/What is your total budget/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/What are your priorities/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Technical Level/i)).not.toBeInTheDocument();
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// SuggestedProductsView
// ═══════════════════════════════════════════════════════════════════════════
describe('SuggestedProductsView — structură', () => {
    test('afișează titlul și subtitlul', async () => {
        await goToSuggestions();
        expect(screen.getByText(/Recommended Devices/i)).toBeInTheDocument();
        expect(screen.getByText(/Two recommendation engines/i)).toBeInTheDocument();
    });

    test('afișează ambele panouri', async () => {
        await goToSuggestions();
        expect(screen.getByText('AI Recommendations')).toBeInTheDocument();
        expect(screen.getByText('Algorithm Pick')).toBeInTheDocument();
    });

    test('butonul Back reîntoarce la wizard', async () => {
        await goToSuggestions();
        fireEvent.click(screen.getByText('Back'));
        await waitFor(() => expect(screen.queryByText(/Recommended Devices/i)).not.toBeInTheDocument());
    });
});

describe('SuggestedProductsView — fetch', () => {
    test('ambele endpoint-uri sunt apelate', async () => {
        await goToSuggestions();
        const urls = global.fetch.mock.calls.map(c => c[0]);
        expect(urls.some(u => u.includes('/api/devices/suggestions'))).toBe(true);
        expect(urls.some(u => u.includes('/api/devices/algorithmSuggestions'))).toBe(true);
    });

    test('URL-ul conține criteriile din store', async () => {
        await goToSuggestions();
        const url = global.fetch.mock.calls[0][0];
        expect(url).toContain('1500');
        expect(url).toContain('Alexa');
    });

    test('afișează empty message când nu sunt produse AI', async () => {
        await goToSuggestions();
        await waitFor(() => expect(screen.getByText("AI found no matches. Try a higher budget!")).toBeInTheDocument());
    });

    test('afișează empty message când nu sunt produse Algorithm', async () => {
        await goToSuggestions();
        await waitFor(() => expect(screen.getByText("Algorithm found no matches.")).toBeInTheDocument());
    });

    test('caz eroare fetch AI → empty state + console.error', async () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        await goToSuggestions((url) => {
            if (!url.includes('algorithm')) return Promise.reject(new Error('fail'));
            return Promise.resolve({ json: async () => [] });
        });
        await waitFor(() => expect(screen.getByText("AI found no matches. Try a higher budget!")).toBeInTheDocument());
        expect(spy).toHaveBeenCalled();
    });

    test('caz eroare fetch Algorithm → empty state + console.error', async () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        await goToSuggestions((url) => {
            if (url.includes('algorithm')) return Promise.reject(new Error('fail'));
            return Promise.resolve({ json: async () => [] });
        });
        await waitFor(() => expect(screen.getByText("Algorithm found no matches.")).toBeInTheDocument());
        expect(spy).toHaveBeenCalled();
    });
});

describe('SuggestedProductsView — produse AI afișate', () => {
    const aiProduct = { id: 1, name: 'Smart Camera X', brand: 'Arlo', bestPrice: 199.99, communicationProtocol: 'Wi-Fi', categoryId: 1 };

    test('numele și brandul produsului sunt afișate', async () => {
        await goToSuggestions((url) => {
            if (url.includes('algorithm')) return Promise.resolve({ json: async () => [] });
            return Promise.resolve({ json: async () => [aiProduct] });
        });
        await waitFor(() => expect(screen.getByText('Smart Camera X')).toBeInTheDocument());
        expect(screen.getByText(/Arlo/)).toBeInTheDocument();
    });

    test('prețul produsului este afișat corect', async () => {
        await goToSuggestions((url) => {
            if (url.includes('algorithm')) return Promise.resolve({ json: async () => [] });
            return Promise.resolve({ json: async () => [aiProduct] });
        });
        // Componenta afișează `${p.price}€` direct — 199.99€
        await waitFor(() => expect(screen.getByText('199.99€')).toBeInTheDocument());
    });

    test('bestPrice are prioritate față de price', async () => {
        const p = { id: 2, name: 'Priority Test', brand: 'B', bestPrice: 55, price: 100, communicationProtocol: 'Wi-Fi', categoryId: 1 };
        await goToSuggestions((url) => {
            if (url.includes('algorithm')) return Promise.resolve({ json: async () => [] });
            return Promise.resolve({ json: async () => [p] });
        });
        await waitFor(() => screen.getByText('Priority Test'));
        // Componenta afișează `${p.price}€` fără toFixed — deci "55€" nu "55.00€"
        expect(screen.getByText('55€')).toBeInTheDocument();
        // Și verificăm că prețul greșit (100€) nu apare în card
        expect(screen.queryByText('100€')).not.toBeInTheDocument();
    });

    test('price=0 afișează "Unavailable"', async () => {
        const p = { id: 3, name: 'No Stock', brand: 'B', bestPrice: 0, communicationProtocol: 'Wi-Fi', categoryId: 2 };
        await goToSuggestions((url) => {
            if (url.includes('algorithm')) return Promise.resolve({ json: async () => [] });
            return Promise.resolve({ json: async () => [p] });
        });
        await waitFor(() => expect(screen.getAllByText('Unavailable').length).toBeGreaterThan(0));
    });

    test('protocol lipsă → "Unknown"', async () => {
        const p = { id: 4, name: 'No Proto', brand: 'B', bestPrice: 30, categoryId: 2 };
        await goToSuggestions((url) => {
            if (url.includes('algorithm')) return Promise.resolve({ json: async () => [] });
            return Promise.resolve({ json: async () => [p] });
        });
        await waitFor(() => expect(screen.getByText(/Unknown/)).toBeInTheDocument());
    });
});

describe('SuggestedProductsView — selecție produse', () => {
    const mkProduct = (id, name, price = 100) => ({
        id, name, brand: 'Brand', bestPrice: price, communicationProtocol: 'Wi-Fi', categoryId: 1
    });

    test('click pe produs îl marchează ca selected', async () => {
        await goToSuggestions((url) => {
            if (url.includes('algorithm')) return Promise.resolve({ json: async () => [] });
            return Promise.resolve({ json: async () => [mkProduct(10, 'Device Alpha')] });
        });
        await waitFor(() => screen.getByText('Device Alpha'));
        const card = screen.getByText('Device Alpha').closest('.option-card');
        expect(card).not.toHaveClass('selected');
        fireEvent.click(card);
        expect(card).toHaveClass('selected');
    });

    test('click din nou deselectează produsul', async () => {
        await goToSuggestions((url) => {
            if (url.includes('algorithm')) return Promise.resolve({ json: async () => [] });
            return Promise.resolve({ json: async () => [mkProduct(11, 'Device Beta')] });
        });
        await waitFor(() => screen.getByText('Device Beta'));
        const card = screen.getByText('Device Beta').closest('.option-card');
        fireEvent.click(card);
        expect(card).toHaveClass('selected');
        fireEvent.click(card);
        expect(card).not.toHaveClass('selected');
    });

    test('totalul global se actualizează după selecție', async () => {
        await goToSuggestions((url) => {
            if (url.includes('algorithm')) return Promise.resolve({ json: async () => [] });
            return Promise.resolve({ json: async () => [mkProduct(12, 'Device Gamma', 29.99)] });
        });
        await waitFor(() => screen.getByText('Device Gamma'));
        expect(screen.getByText(/0 items/i)).toBeInTheDocument();
        fireEvent.click(screen.getByText('Device Gamma').closest('.option-card'));
        expect(screen.getByText(/1 items/i)).toBeInTheDocument();
    });

    test('"Start Project" apelează onFinish cu produsele selectate', async () => {
        const onFinish = vi.fn();
        const p = mkProduct(13, 'Finish Device', 89);
        global.fetch = vi.fn().mockImplementation((url) => {
            if (url.includes('algorithm')) return Promise.resolve({ json: async () => [] });
            return Promise.resolve({ json: async () => [p] });
        });
        resetStore({ step: 4 });
        render(<SetupWizard onFinish={onFinish} />);
        fireEvent.click(screen.getByText(/Get Suggestions/i));
        await waitFor(() => screen.getByText('Finish Device'));
        fireEvent.click(screen.getByText('Finish Device').closest('.option-card'));
        fireEvent.click(screen.getByText(/Start Project/i));
        expect(onFinish).toHaveBeenCalledWith(
            expect.arrayContaining([expect.objectContaining({ name: 'Finish Device' })])
        );
    });

    test('"Start Project" cu nimic selectat apelează onFinish cu []', async () => {
        const onFinish = vi.fn();
        global.fetch = vi.fn().mockResolvedValue({ json: async () => [] });
        resetStore({ step: 4 });
        render(<SetupWizard onFinish={onFinish} />);
        fireEvent.click(screen.getByText(/Get Suggestions/i));
        await waitFor(() => screen.getByText(/Recommended Devices/i));
        fireEvent.click(screen.getByText(/Start Project/i));
        expect(onFinish).toHaveBeenCalledWith([]);
    });

    test('produsele duplicate (AI + Algo) sunt deduplicate la onFinish', async () => {
        const onFinish = vi.fn();
        const shared = { id: 99, name: 'Shared Device', brand: 'X', bestPrice: 100, communicationProtocol: 'Wi-Fi', categoryId: 1 };
        global.fetch = vi.fn().mockResolvedValue({ json: async () => [shared] });
        resetStore({ step: 4 });
        render(<SetupWizard onFinish={onFinish} />);
        fireEvent.click(screen.getByText(/Get Suggestions/i));
        await waitFor(() => screen.getAllByText('Shared Device'));
        // Selectăm din primul panou
        fireEvent.click(screen.getAllByText('Shared Device')[0].closest('.option-card'));
        fireEvent.click(screen.getByText(/Start Project/i));
        const result = onFinish.mock.calls[0][0];
        const uniqueIds = [...new Set(result.map(p => p.id))];
        expect(uniqueIds.length).toBe(result.length); // nu sunt duplicate
    });
});

describe('SuggestedProductsView — footer total panou', () => {
    test('suma din footer panoului reflectă produsele selectate', async () => {
        const p = { id: 20, name: 'Panel Device', brand: 'B', bestPrice: 150, communicationProtocol: 'Wi-Fi', categoryId: 1 };
        await goToSuggestions((url) => {
            if (url.includes('algorithm')) return Promise.resolve({ json: async () => [] });
            return Promise.resolve({ json: async () => [p] });
        });
        await waitFor(() => screen.getByText('Panel Device'));
        // Înainte de selecție: 0.00€ în footer panou
        const footersBefore = screen.getAllByText('0.00€');
        expect(footersBefore.length).toBeGreaterThan(0);
        // După selecție
        fireEvent.click(screen.getByText('Panel Device').closest('.option-card'));
        await waitFor(() => expect(screen.queryAllByText('150.00€').length).toBeGreaterThan(0));
    });
});