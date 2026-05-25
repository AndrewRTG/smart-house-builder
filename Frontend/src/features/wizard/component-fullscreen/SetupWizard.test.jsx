import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';

// ─── Mocks ───────────────────────────────────────────────────────────────────

// Mock pentru react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Mock pentru authFetch
import { authFetch } from '../../../utils/authFetch';
vi.mock('../../../utils/authFetch', () => ({
    authFetch: vi.fn()
}));

// Mock stabil pentru Zustand Store
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
vi.stubGlobal('import', { meta: { env: { VITE_API_BASE_URL: 'http://localhost:20025' } } });

import SetupWizard from './SetupWizard';

// Helper pentru resetarea stării la fiecare test
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

    vi.clearAllMocks();

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
    authFetch.mockResolvedValue({ ok: true, json: async () => ({ content: [] }) });
});

afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
});

// ─── Utility: navighează la SuggestedProductsView ────────────────────────────
const goToSuggestions = async (fetchImpl) => {
    if (fetchImpl) global.fetch = vi.fn().mockImplementation(fetchImpl);
    resetStore({ step: 4, priceRange: [0, 1500], ecosystem: 'Alexa', techLevel: 'Intermediate', categories: ['Security'], protocols: ['Wi-Fi'] });

    render(
        <MemoryRouter>
            <SetupWizard onFinish={vi.fn()} />
        </MemoryRouter>
    );
    fireEvent.click(screen.getByText(/Get Suggestions/i));
    await screen.findByText(/Recommended Devices/i);
};

// ═══════════════════════════════════════════════════════════════════════════
// SetupWizard — Randare & Pasul 1 (Setups)
// ═══════════════════════════════════════════════════════════════════════════
describe('SetupWizard — Pasul 1 (Setups)', () => {
    test('Apelează API-ul pentru setups la montare pe pasul 1', async () => {
        authFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ content: [{ id: 99, name: 'Living Smart', status: 'Draft' }] })
        });

        render(<MemoryRouter><SetupWizard onFinish={vi.fn()} /></MemoryRouter>);

        expect(authFetch).toHaveBeenCalledWith('/api/v1/setups/user/drafts?page=0&size=20');
        expect(await screen.findByText('Living Smart')).toBeInTheDocument();
    });

    test('Arată un mesaj gol dacă nu există setups', async () => {
        authFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ content: [] }) });
        render(<MemoryRouter><SetupWizard onFinish={vi.fn()} /></MemoryRouter>);
        expect(await screen.findByText(/You don't have any setups yet/i)).toBeInTheDocument();
    });

    test('Tratează eroarea de la fetchSetups fără să crape', async () => {
        const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});
        authFetch.mockRejectedValueOnce(new Error('Network error'));
        render(<MemoryRouter><SetupWizard onFinish={vi.fn()} /></MemoryRouter>);
        await waitFor(() => expect(spyConsole).toHaveBeenCalledWith('Eroare la încărcarea Setups în wizard:', expect.any(Error)));
    });

    test('Permite selecția unui setup', async () => {
        authFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ content: [{ id: 1, name: 'Setup A' }] })
        });
        render(<MemoryRouter><SetupWizard onFinish={vi.fn()} /></MemoryRouter>);

        const setupCard = await screen.findByText('Setup A');
        fireEvent.click(setupCard.closest('div[style*="cursor: pointer"]'));

        // Căutăm bifa de selecție
        expect(await screen.findByText('✓')).toBeInTheDocument();
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// SetupWizard — Pașii 2, 3 și 4
// ═══════════════════════════════════════════════════════════════════════════
describe('SetupWizard — Restul Pașilor', () => {
    test('Pasul 2: Modificarea slider-ului apelează setPrice', () => {
        resetStore({ step: 2 });
        render(<MemoryRouter><SetupWizard onFinish={vi.fn()} /></MemoryRouter>);
        fireEvent.change(screen.getByRole('slider'), { target: { value: '2000' } });
        expect(mockStore.setPrice).toHaveBeenCalledWith(2000);
    });

    test('Pasul 3: Selecția unui ecosistem și a categoriilor', () => {
        resetStore({ step: 3 });
        render(<MemoryRouter><SetupWizard onFinish={vi.fn()} /></MemoryRouter>);
        fireEvent.click(screen.getByText('Google Home'));
        expect(mockStore.setEcosystem).toHaveBeenCalledWith('Google Home');

        fireEvent.click(screen.getByText('Security').closest('.option-card'));
        expect(mockStore.toggleCategory).toHaveBeenCalledWith('Security');
    });

    test('Pasul 4: Selecția nivelului tehnic și protocoalelor', () => {
        resetStore({ step: 4 });
        render(<MemoryRouter><SetupWizard onFinish={vi.fn()} /></MemoryRouter>);
        fireEvent.click(screen.getByText('Intermediate').closest('.option-card'));
        expect(mockStore.setTechLevel).toHaveBeenCalledWith('Intermediate');

        fireEvent.click(screen.getByText('Zigbee'));
        expect(mockStore.toggleProtocol).toHaveBeenCalledWith('Zigbee');
    });

    test('Navigarea între pași funcționează', () => {
        resetStore({ step: 2 });
        render(<MemoryRouter><SetupWizard onFinish={vi.fn()} /></MemoryRouter>);
        fireEvent.click(screen.getByText(/Previous/i));
        expect(mockStore.prevStep).toHaveBeenCalled();

        fireEvent.click(screen.getByText(/Next/i));
        expect(mockStore.nextStep).toHaveBeenCalled();
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// SuggestedProductsView (Integrarea AI & Algoritm)
// ═══════════════════════════════════════════════════════════════════════════
describe('SuggestedProductsView — Algoritm & AI Flow', () => {
    const algoProduct = { id: 10, name: 'Algo Device', price: 100, categoryId: 1 };
    const aiProduct = { id: 20, name: 'AI Device', price: 250, categoryId: 2 };

    const mockDualFetch = (url) => {
        if (url.includes('algorithmSuggestions')) return Promise.resolve({ json: async () => [algoProduct] });
        if (url.includes('suggestions')) return Promise.resolve({ json: async () => [aiProduct] });
        return Promise.resolve({ json: async () => [] });
    };

    test('La montare, se încarcă DOAR algoritmul', async () => {
        await goToSuggestions(mockDualFetch);

        expect(await screen.findByText('Algo Device')).toBeInTheDocument();
        // Panoul de AI încă nu trebuie să existe pe ecran
        expect(screen.queryByText('AI Recommendations')).not.toBeInTheDocument();
    });

    test('Eroare la algoritm nu blochează pagina (prinde catch-ul)', async () => {
        const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});
        await goToSuggestions((url) => Promise.reject(new Error('Backend picat')));

        expect(await screen.findByText(/Algorithm found no matches/i)).toBeInTheDocument();
        expect(spyConsole).toHaveBeenCalled();
    });

    test('Trimiterea unui prompt cere sugestii AI și afișează panoul', async () => {
        await goToSuggestions(mockDualFetch);

        const aiInput = screen.getByPlaceholderText(/Not finding what you need/i) || screen.getByRole('textbox');
        fireEvent.change(aiInput, { target: { value: 'Un bec verde' } });

        const askAiBtn = screen.getByText(/Ask AI/i);
        fireEvent.click(askAiBtn);

        // Așteptăm să apară panoul de AI și produsul AI
        expect(await screen.findByText('AI Recommendations')).toBeInTheDocument();
        expect(await screen.findByText('AI Device')).toBeInTheDocument();

        // Verificăm dacă fetch-ul a conținut textul nostru
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('Un%20bec%20verde'));
    });

    test('Tasta Enter în inputul AI trimite cererea', async () => {
        await goToSuggestions(mockDualFetch);
        const aiInput = screen.getByRole('textbox');
        fireEvent.change(aiInput, { target: { value: 'Senzor usa' } });

        fireEvent.keyDown(aiInput, { key: 'Enter', code: 'Enter', shiftKey: false });

        expect(await screen.findByText('AI Recommendations')).toBeInTheDocument();
    });

    test('Selectarea produselor actualizează suma și permite pornirea proiectului', async () => {
        const onFinishMock = vi.fn();
        global.fetch = vi.fn().mockImplementation(mockDualFetch);
        resetStore({ step: 4 });

        render(<MemoryRouter><SetupWizard onFinish={onFinishMock} /></MemoryRouter>);
        fireEvent.click(screen.getByText(/Get Suggestions/i));

        // Selectăm device-ul de la algoritm
        const card = await screen.findByText('Algo Device');
        fireEvent.click(card.closest('.option-card'));

        // Verificăm totalul
        expect(await screen.findByText('100.00€')).toBeInTheDocument();

        // Finalizăm
        fireEvent.click(screen.getByText(/Start Project/i));

        // Verificăm că a adăugat în sessionStorage și a apelat onFinish
        expect(sessionStorage.getItem('wizard_selected_devices')).toBe(JSON.stringify([10]));
        expect(mockNavigate).toHaveBeenCalledWith('/builder');
        expect(onFinishMock).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ id: "10" })]));
    });

    test('Dacă utilizatorul are selectedSetup, Start Project navighează către ID-ul lui', async () => {
        // Simulăm selecția pe pasul 1
        authFetch.mockResolvedValueOnce({
            ok: true, json: async () => ({ content: [{ id: 777, name: 'Casa Noua' }] })
        });
        resetStore({ step: 1 });
        render(<MemoryRouter><SetupWizard onFinish={vi.fn()} /></MemoryRouter>);

        // Selectăm
        fireEvent.click((await screen.findByText('Casa Noua')).closest('div[style*="cursor: pointer"]'));

        // Sărim direct la pasul 4 și forțăm rezultatele
        resetStore({ step: 4 });
        fireEvent.click(screen.getByText(/Get Suggestions/i));

        // Click Start Project
        fireEvent.click(await screen.findByText(/Start Project/i));

        // Trebuie să ne ducă direct în builder pe id-ul ales
        expect(mockNavigate).toHaveBeenCalledWith('/builder/777');
    });
});