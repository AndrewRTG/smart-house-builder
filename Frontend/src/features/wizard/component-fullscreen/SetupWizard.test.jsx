/**
 * SetupWizard.test.jsx
 *
 * Vitest + React Testing Library
 * Coverage target: 100% branch & statement
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─────────────────────────────────────────────────────────────────────────────
// 1. ENV STUB (must happen before any module import that reads it)
// ─────────────────────────────────────────────────────────────────────────────
vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:20025');

// ─────────────────────────────────────────────────────────────────────────────
// 2. ROUTER MOCK
// ─────────────────────────────────────────────────────────────────────────────
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal();
    return { ...actual, useNavigate: () => mockNavigate };
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. authFetch MOCK
// ─────────────────────────────────────────────────────────────────────────────
vi.mock('../../../utils/authFetch', () => ({
    authFetch: vi.fn(),
}));
import { authFetch } from '../../../utils/authFetch';

// ─────────────────────────────────────────────────────────────────────────────
// 4. STABLE ZUSTAND STORE MOCK
//    The store object is created ONCE outside describe() so its reference never
//    changes across renders — prevents useEffect infinite loops.
// ─────────────────────────────────────────────────────────────────────────────
const storeState = {
    step: 1,
    darkMode: false,
    priceRange: [0, 1000],
    ecosystem: '',
    techLevel: '',
    categories: [],
    protocols: [],
    setStep: vi.fn((n) => { storeState.step = n; }),
    nextStep: vi.fn(() => { storeState.step += 1; }),
    prevStep: vi.fn(() => { storeState.step -= 1; }),
    setPrice: vi.fn((v) => { storeState.priceRange = [0, v]; }),
    setEcosystem: vi.fn((e) => { storeState.ecosystem = e; }),
    setTechLevel: vi.fn((l) => { storeState.techLevel = l; }),
    toggleCategory: vi.fn((c) => {
        storeState.categories = storeState.categories.includes(c)
            ? storeState.categories.filter(x => x !== c)
            : [...storeState.categories, c];
    }),
    toggleProtocol: vi.fn((p) => {
        storeState.protocols = storeState.protocols.includes(p)
            ? storeState.protocols.filter(x => x !== p)
            : [...storeState.protocols, p];
    }),
};

const resetStore = () => {
    storeState.step = 1;
    storeState.darkMode = false;
    storeState.priceRange = [0, 1000];
    storeState.ecosystem = '';
    storeState.techLevel = '';
    storeState.categories = [];
    storeState.protocols = [];
    Object.values(storeState)
        .filter(v => typeof v === 'function' && v.mockClear)
        .forEach(fn => fn.mockClear());
};

vi.mock('../../../store/wizardStore.js', () => ({
    default: () => storeState,
}));

// ─────────────────────────────────────────────────────────────────────────────
// 5. GLOBAL fetch MOCK
// ─────────────────────────────────────────────────────────────────────────────
const mockAlgoDevices = [
    { id: 1, name: 'Smart Cam Pro', brand: 'Ring', bestPrice: 129.99, categoryId: 1, communicationProtocol: 'WiFi' },
    { id: 2, name: 'Smart Plug X', brand: 'TP-Link', price: 19.99, categoryId: 7, communicationProtocol: 'Zigbee' },
];

const mockAIDevices = [
    { id: 3, name: 'Robot Vac AI', brand: 'iRobot', bestPrice: 299.99, categoryId: 11, communicationProtocol: 'WiFi' },
];

const mockSetups = [
    { id: 'setup-1', name: 'Living Room', status: 'Draft' },
    { id: 'setup-2', name: 'Bedroom', status: 'Draft' },
];

// ─────────────────────────────────────────────────────────────────────────────
// 6. COMPONENT IMPORT  (after all mocks are in place)
// ─────────────────────────────────────────────────────────────────────────────
import SetupWizard from '../SetupWizard.jsx';

// ─────────────────────────────────────────────────────────────────────────────
// 7. RENDER HELPER
// ─────────────────────────────────────────────────────────────────────────────
const renderWizard = (props = {}) =>
    render(
        <MemoryRouter>
            <SetupWizard {...props} />
        </MemoryRouter>
    );

// ─────────────────────────────────────────────────────────────────────────────
// TESTS
// ─────────────────────────────────────────────────────────────────────────────
describe('SetupWizard', () => {
    beforeEach(() => {
        resetStore();
        mockNavigate.mockClear();
        vi.clearAllMocks();

        // Default: authFetch returns setups list
        authFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ content: mockSetups }),
        });

        // Default: global fetch returns algo devices
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            json: async () => mockAlgoDevices,
        }));
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    // ── Step 1: Setup selection ───────────────────────────────────────────
    describe('Step 1 — Select Your Project', () => {
        it('renders heading and loads setups from API', async () => {
            renderWizard();
            expect(screen.getByText('Select Your Project')).toBeInTheDocument();
            await screen.findByText('Living Room');
            expect(screen.getByText('Bedroom')).toBeInTheDocument();
        });

        it('shows loading state while fetching', () => {
            // Never resolves during this check
            authFetch.mockReturnValue(new Promise(() => {}));
            renderWizard();
            expect(screen.getByText('Loading your projects...')).toBeInTheDocument();
        });

        it('shows empty state when no setups returned', async () => {
            authFetch.mockResolvedValue({ ok: true, json: async () => [] });
            renderWizard();
            await screen.findByText("You don't have any setups yet.");
        });

        it('handles plain array response (non-paginated)', async () => {
            authFetch.mockResolvedValue({ ok: true, json: async () => mockSetups });
            renderWizard();
            await screen.findByText('Living Room');
        });

        it('handles authFetch network error gracefully', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            authFetch.mockRejectedValue(new Error('Network error'));
            renderWizard();
            // Wizard should still render without crashing
            await waitFor(() => expect(consoleSpy).toHaveBeenCalled());
            expect(screen.getByText('Select Your Project')).toBeInTheDocument();
            consoleSpy.mockRestore();
        });

        it('handles authFetch returning ok=false gracefully', async () => {
            authFetch.mockResolvedValue({ ok: false });
            renderWizard();
            // Should not crash; empty list state after fetch
            await waitFor(() => {
                expect(screen.queryByText('Loading your projects...')).not.toBeInTheDocument();
            });
        });

        it('selects a setup when clicked and shows checkmark badge', async () => {
            renderWizard();
            const card = await screen.findByText('Living Room');
            fireEvent.click(card.closest('div[style]'));
            // Checkmark badge appears
            await waitFor(() => {
                expect(screen.getByText('✓')).toBeInTheDocument();
            });
        });

        it('does not allow navigation past step 1 until a setup is selected', async () => {
            renderWizard();
            await screen.findByText('Living Room');
            const nextBtn = screen.getByText('Next 〉');
            expect(nextBtn).toBeDisabled();
        });

        it('enables Next button after selecting a setup', async () => {
            renderWizard();
            const card = await screen.findByText('Living Room');
            fireEvent.click(card.closest('div[style]'));
            await waitFor(() => {
                expect(screen.getByText('Next 〉')).not.toBeDisabled();
            });
        });

        it('does not re-fetch setups when step is not 1', () => {
            storeState.step = 2;
            renderWizard();
            expect(authFetch).not.toHaveBeenCalled();
        });
    });

    // ── Progress tracker ──────────────────────────────────────────────────
    describe('Progress Tracker', () => {
        it('renders all 4 step circles', () => {
            renderWizard();
            ['1', '2', '3', '4'].forEach(n => {
                expect(screen.getByText(n)).toBeInTheDocument();
            });
        });

        it('marks completed steps with ✓', async () => {
            storeState.step = 3;
            renderWizard();
            // Steps 1 and 2 are completed
            const checkmarks = screen.getAllByText('✓');
            expect(checkmarks.length).toBeGreaterThanOrEqual(2);
        });

        it('calls setStep when clicking a step circle', async () => {
            renderWizard();
            fireEvent.click(screen.getByText('3'));
            expect(storeState.setStep).toHaveBeenCalledWith(3);
        });
    });

    // ── Step 2: Budget ────────────────────────────────────────────────────
    describe('Step 2 — Budget', () => {
        beforeEach(() => { storeState.step = 2; });

        it('renders budget heading and price display', () => {
            renderWizard();
            expect(screen.getByText('What is your total budget?')).toBeInTheDocument();
            expect(screen.getByText('1000€')).toBeInTheDocument();
        });

        it('calls setPrice when preset pill is clicked', () => {
            renderWizard();
            fireEvent.click(screen.getByText('500€'));
            expect(storeState.setPrice).toHaveBeenCalledWith(500);
        });

        it('calls setPrice when range slider is changed', () => {
            renderWizard();
            const slider = screen.getByRole('slider');
            fireEvent.change(slider, { target: { value: '2000' } });
            expect(storeState.setPrice).toHaveBeenCalledWith(2000);
        });

        it('applies active class to currently selected preset', () => {
            storeState.priceRange = [0, 1000];
            renderWizard();
            const pill1000 = screen.getByText('1000€');
            expect(pill1000.className).toContain('active');
        });
    });

    // ── Step 3: Priorities ────────────────────────────────────────────────
    describe('Step 3 — Priorities', () => {
        beforeEach(() => { storeState.step = 3; });

        it('renders ecosystem pills', () => {
            renderWizard();
            expect(screen.getByText('Apple Home')).toBeInTheDocument();
            expect(screen.getByText('Alexa')).toBeInTheDocument();
            expect(screen.getByText('Google Home')).toBeInTheDocument();
        });

        it('calls setEcosystem when a pill is clicked', () => {
            renderWizard();
            fireEvent.click(screen.getByText('Alexa'));
            expect(storeState.setEcosystem).toHaveBeenCalledWith('Alexa');
        });

        it('renders all 4 category option cards', () => {
            renderWizard();
            ['Security', 'Comfort', 'Energy', 'Entertainment'].forEach(cat => {
                expect(screen.getByText(cat)).toBeInTheDocument();
            });
        });

        it('calls toggleCategory when a category card is clicked', () => {
            renderWizard();
            fireEvent.click(screen.getByText('Security').closest('.option-card'));
            expect(storeState.toggleCategory).toHaveBeenCalledWith('Security');
        });

        it('shows checkmark for selected categories', () => {
            storeState.categories = ['Comfort'];
            renderWizard();
            // The ✔️ emoji should appear next to Comfort
            expect(screen.getByText('✔️')).toBeInTheDocument();
        });

        it('applies active class to selected ecosystem pill', () => {
            storeState.ecosystem = 'Alexa';
            renderWizard();
            expect(screen.getByText('Alexa').className).toContain('active');
        });
    });

    // ── Step 4: Technical Level ───────────────────────────────────────────
    describe('Step 4 — Technical Level', () => {
        beforeEach(() => { storeState.step = 4; });

        it('renders protocol pills and level cards', () => {
            renderWizard();
            expect(screen.getByText('Wi-Fi')).toBeInTheDocument();
            expect(screen.getByText('Plug & Play')).toBeInTheDocument();
            expect(screen.getByText('Intermediate')).toBeInTheDocument();
            expect(screen.getByText('DIY / Custom')).toBeInTheDocument();
        });

        it('calls toggleProtocol on pill click', () => {
            renderWizard();
            fireEvent.click(screen.getByText('Zigbee'));
            expect(storeState.toggleProtocol).toHaveBeenCalledWith('Zigbee');
        });

        it('calls setTechLevel when a level card is clicked', () => {
            renderWizard();
            fireEvent.click(screen.getByText('Intermediate').closest('.option-card'));
            expect(storeState.setTechLevel).toHaveBeenCalledWith('Intermediate');
        });

        it('shows checkmark for selected tech level', () => {
            storeState.techLevel = 'DIY / Custom';
            renderWizard();
            expect(screen.getByText('✔️')).toBeInTheDocument();
        });

        it('applies active class to selected protocol pill', () => {
            storeState.protocols = ['Matter'];
            renderWizard();
            expect(screen.getByText('Matter').className).toContain('active');
        });

        it('changes button label to "Get Suggestions 〉" on last step', () => {
            renderWizard();
            expect(screen.getByText('Get Suggestions 〉')).toBeInTheDocument();
        });
    });

    // ── Navigation ────────────────────────────────────────────────────────
    describe('Navigation buttons', () => {
        it('Previous button is disabled on step 1', () => {
            renderWizard();
            expect(screen.getByText('〈 Previous')).toBeDisabled();
        });

        it('calls prevStep when Previous is clicked on step > 1', () => {
            storeState.step = 2;
            renderWizard();
            fireEvent.click(screen.getByText('〈 Previous'));
            expect(storeState.prevStep).toHaveBeenCalled();
        });

        it('calls nextStep when Next is clicked on steps 2-3', () => {
            storeState.step = 2;
            renderWizard();
            fireEvent.click(screen.getByText('Next 〉'));
            expect(storeState.nextStep).toHaveBeenCalled();
        });
    });

    // ── Results / SuggestedProductsView ──────────────────────────────────
    describe('SuggestedProductsView', () => {
        const goToResults = async () => {
            storeState.step = 4;
            // Select a setup so we have context
            authFetch.mockResolvedValue({ ok: true, json: async () => ({ content: mockSetups }) });
            renderWizard();
            fireEvent.click(screen.getByText('Get Suggestions 〉'));
        };

        it('renders recommended devices heading', async () => {
            await goToResults();
            await screen.findByText('Recommended Devices');
        });

        it('fetches and displays algorithm products', async () => {
            await goToResults();
            await screen.findByText('Smart Cam Pro');
            expect(screen.getByText('Smart Plug X')).toBeInTheDocument();
        });

        it('handles fetch error for algorithm products', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('API down')));

            storeState.step = 4;
            renderWizard();
            fireEvent.click(screen.getByText('Get Suggestions 〉'));

            await waitFor(() => expect(consoleSpy).toHaveBeenCalled());
            await screen.findByText('Algorithm found no matches.');
            consoleSpy.mockRestore();
        });

        it('renders the AI prompt area', async () => {
            await goToResults();
            await screen.findByText(/Not finding what you need/);
        });

        it('AI panel is NOT visible before asking', async () => {
            await goToResults();
            await screen.findByText('Recommended Devices');
            expect(screen.queryByText('AI Recommendations')).not.toBeInTheDocument();
        });

        it('shows AI panel after submitting a prompt', async () => {
            // Second fetch call returns AI devices
            let callCount = 0;
            vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
                callCount++;
                if (callCount === 1) return Promise.resolve({ json: async () => mockAlgoDevices });
                return Promise.resolve({ json: async () => mockAIDevices });
            }));

            await goToResults();
            await screen.findByText('Smart Cam Pro');

            const input = screen.getByPlaceholderText(/robot vacuum/i);
            fireEvent.change(input, { target: { value: 'robot vacuum under 300' } });

            const askBtn = screen.getByText('Ask AI ✦');
            fireEvent.click(askBtn);

            await screen.findByText('AI Recommendations');
            await screen.findByText('Robot Vac AI');
        });

        it('handles Enter key in AI prompt input', async () => {
            let callCount = 0;
            vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
                callCount++;
                if (callCount === 1) return Promise.resolve({ json: async () => mockAlgoDevices });
                return Promise.resolve({ json: async () => mockAIDevices });
            }));

            await goToResults();
            await screen.findByText('Smart Cam Pro');

            const input = screen.getByPlaceholderText(/robot vacuum/i);
            fireEvent.change(input, { target: { value: 'smart speaker' } });
            fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });

            await screen.findByText('AI Recommendations');
        });

        it('Shift+Enter does NOT submit the AI prompt', async () => {
            await goToResults();
            await screen.findByText('Smart Cam Pro');

            const input = screen.getByPlaceholderText(/robot vacuum/i);
            fireEvent.change(input, { target: { value: 'something' } });
            fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });

            // AI panel should not appear
            await waitFor(() => {
                expect(screen.queryByText('AI Recommendations')).not.toBeInTheDocument();
            });
        });

        it('does not submit AI prompt when input is empty', async () => {
            await goToResults();
            await screen.findByText('Smart Cam Pro');

            const askBtn = screen.getByText('Ask AI ✦');
            expect(askBtn).toBeDisabled();
        });

        it('handles AI fetch error and shows empty message', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            let callCount = 0;
            vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
                callCount++;
                if (callCount === 1) return Promise.resolve({ json: async () => mockAlgoDevices });
                return Promise.reject(new Error('AI service down'));
            }));

            await goToResults();
            await screen.findByText('Smart Cam Pro');

            const input = screen.getByPlaceholderText(/robot vacuum/i);
            fireEvent.change(input, { target: { value: 'anything' } });
            fireEvent.click(screen.getByText('Ask AI ✦'));

            await screen.findByText('AI found no matches. Try rephrasing your request!');
            consoleSpy.mockRestore();
        });

        it('selects and deselects a product card', async () => {
            await goToResults();
            const card = await screen.findByText('Smart Cam Pro');
            const cardEl = card.closest('.option-card');

            fireEvent.click(cardEl);
            await waitFor(() => expect(cardEl.classList.contains('selected')).toBe(true));

            fireEvent.click(cardEl);
            await waitFor(() => expect(cardEl.classList.contains('selected')).toBe(false));
        });

        it('updates total price when products are selected', async () => {
            await goToResults();
            await screen.findByText('Smart Cam Pro');

            // Total starts at 0
            expect(screen.getByText(/0\.00€/)).toBeInTheDocument();

            fireEvent.click(screen.getByText('Smart Cam Pro').closest('.option-card'));
            await screen.findByText(/129\.99€/);
        });

        it('navigates to /builder/:id on "Start Project" with a selected setup', async () => {
            // Step 1: select a setup first
            authFetch.mockResolvedValue({ ok: true, json: async () => ({ content: mockSetups }) });
            storeState.step = 1;
            renderWizard();

            const card = await screen.findByText('Living Room');
            fireEvent.click(card.closest('div[style]'));

            // Navigate to results screen by directly triggering showResults
            // (simulate clicking through steps to Get Suggestions on step 4)
            storeState.step = 4;
            fireEvent.click(screen.getByText('Get Suggestions 〉'));

            await screen.findByText('Recommended Devices');
            fireEvent.click(screen.getByText('Start Project 〉'));

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/builder/setup-1');
            });
        });

        it('navigates to /builder without id when no setup is selected', async () => {
            storeState.step = 4;
            authFetch.mockResolvedValue({ ok: true, json: async () => [] });
            renderWizard();
            fireEvent.click(screen.getByText('Get Suggestions 〉'));

            await screen.findByText('Recommended Devices');
            fireEvent.click(screen.getByText('Start Project 〉'));

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/builder');
            });
        });

        it('calls onFinish prop when Start Project is clicked', async () => {
            const onFinish = vi.fn();
            storeState.step = 4;
            renderWizard({ onFinish });
            fireEvent.click(screen.getByText('Get Suggestions 〉'));

            await screen.findByText('Recommended Devices');
            fireEvent.click(screen.getByText('Start Project 〉'));

            await waitFor(() => expect(onFinish).toHaveBeenCalled());
        });

        it('navigating Back from results returns to wizard', async () => {
            await goToResults();
            await screen.findByText('Recommended Devices');

            fireEvent.click(screen.getByText('Back'));
            await waitFor(() => {
                expect(screen.queryByText('Recommended Devices')).not.toBeInTheDocument();
            });
        });

        it('shows "Searching..." loading state in algorithm panel', async () => {
            // Keep fetch hanging
            vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})));

            storeState.step = 4;
            renderWizard();
            fireEvent.click(screen.getByText('Get Suggestions 〉'));

            await screen.findByText('Searching...');
        });

        it('shows "Searching…" button label while AI is loading', async () => {
            let resolveAI;
            let callCount = 0;
            vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
                callCount++;
                if (callCount === 1) return Promise.resolve({ json: async () => mockAlgoDevices });
                return new Promise(r => { resolveAI = r; });
            }));

            await goToResults();
            await screen.findByText('Smart Cam Pro');

            const input = screen.getByPlaceholderText(/robot vacuum/i);
            fireEvent.change(input, { target: { value: 'speaker' } });
            fireEvent.click(screen.getByText('Ask AI ✦'));

            await screen.findByText('Searching…');

            // Resolve and verify it disappears
            resolveAI({ json: async () => mockAIDevices });
            await screen.findByText('Robot Vac AI');
        });

        it('renders dark-mode class when darkMode is true', async () => {
            storeState.darkMode = true;
            storeState.step = 4;
            renderWizard();
            fireEvent.click(screen.getByText('Get Suggestions 〉'));

            await screen.findByText('Recommended Devices');
            expect(document.querySelector('.dark-mode')).toBeInTheDocument();
        });

        it('displays price as Unavailable when price is 0', async () => {
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
                json: async () => [{ id: 5, name: 'Free Device', brand: 'ACME', price: 0, categoryId: 8, communicationProtocol: 'WiFi' }],
            }));

            storeState.step = 4;
            renderWizard();
            fireEvent.click(screen.getByText('Get Suggestions 〉'));

            await screen.findByText('Unavailable');
        });

        it('getCategoryIcon returns 📦 for unknown categoryId', async () => {
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
                json: async () => [{ id: 99, name: 'Mystery Device', brand: 'X', bestPrice: 50, categoryId: 99, communicationProtocol: 'BLE' }],
            }));

            storeState.step = 4;
            renderWizard();
            fireEvent.click(screen.getByText('Get Suggestions 〉'));

            // 📦 should appear as the icon
            await screen.findByText('📦');
        });
    });
});