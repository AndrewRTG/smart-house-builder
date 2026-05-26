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
// 5. MOCK DATA
// ─────────────────────────────────────────────────────────────────────────────
const mockAlgoDevices = [
    { id: 1, name: 'Smart Cam Pro', brand: 'Ring', bestPrice: 129.99, categoryId: 1, communicationProtocol: 'WiFi' },
    { id: 2, name: 'Smart Plug X', brand: 'TP-Link', price: 19.99, categoryId: 7, communicationProtocol: 'Zigbee' },
];

const mockAIDevices = [
    { id: 3, name: 'Robot Vac AI', brand: 'iRobot', bestPrice: 299.99, categoryId: 11, communicationProtocol: 'WiFi' },
];

const mockSetupsDrafts = [
    {
        id: 'setup-1',
        name: 'Living Room',
        status: 'DRAFT',
        thumbnailUrl: 'http://localhost:20025/api/team2/layouts/10/thumbnail',
        canvasState: JSON.stringify({
            placedIcons: [
                {
                    id: 'icon-1',
                    deviceId: 101,
                    name: 'Smart Bulb',
                    type: 'light',
                    brand: 'Philips',
                    categoryId: 13,
                    categoryName: 'Lighting',
                    communicationProtocol: 'Zigbee',
                    priceEUR: 49,
                    col: 3,
                    row: 4,
                    scale: 1,
                    rotation: 0,
                },
            ],
            placedFurniture: [
                {
                    id: 'furniture-1',
                    name: 'Sofa',
                    type: 'sofa',
                    centerCol: 5,
                    centerRow: 6,
                    widthCols: 3,
                    heightCols: 2,
                    rotation: 0,
                },
            ],
            lines: [
                {
                    id: 'line-1',
                    type: 'wall',
                    start: { col: 0, row: 0 },
                    end: { col: 8, row: 0 },
                },
            ],
        }),
        deviceSnapshots: JSON.stringify([
            {
                id: 101,
                name: 'Smart Bulb',
                brand: 'Philips',
                categoryId: 13,
                categoryName: 'Lighting',
                type: 'light',
                communicationProtocol: 'Zigbee',
                priceEUR: 49,
            },
        ]),
    },
];

const mockSetupsPublished = [
    {
        id: 'setup-2',
        name: 'Bedroom',
        status: 'PUBLISHED',
        thumbnailUrl: 'http://localhost:20025/api/team2/layouts/20/thumbnail',
        deviceIds: [202],
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// 6. COMPONENT IMPORT  (after all mocks are in place)
// ─────────────────────────────────────────────────────────────────────────────
import SetupWizard from './SetupWizard.jsx';

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

        authFetch.mockImplementation(async (url) => {
            if (typeof url === 'string') {
                if (url.includes('/setups/user/drafts')) {
                    return { ok: true, json: async () => ({ content: mockSetupsDrafts }) };
                }

                if (url.includes('/setups/user/published')) {
                    return { ok: true, json: async () => ({ content: mockSetupsPublished }) };
                }

                if (url.includes('/api/ai/agent-search')) {
                    return { ok: true, json: async () => ({ devices: mockAIDevices }) };
                }
            }

            return { ok: true, json: async () => ({ content: [] }) };
        });

        globalThis.fetch = vi.fn().mockResolvedValue({
            json: async () => mockAlgoDevices,
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    // ── Step 1: Setup selection ───────────────────────────────────────────
    describe('Step 1 — Select Your Project', () => {
        it('renders heading and loads draft and published setups from API', async () => {
            renderWizard();

            expect(screen.getByText('Select Your Project')).toBeInTheDocument();

            await screen.findByText('Living Room');
            expect(screen.getByText('Bedroom')).toBeInTheDocument();

            expect(authFetch).toHaveBeenCalledWith('/api/v1/setups/user/drafts?page=0&size=20');
            expect(authFetch).toHaveBeenCalledWith('/api/v1/setups/user/published?page=0&size=20');
        });

        it('renders setup thumbnails when thumbnailUrl exists', async () => {
            renderWizard();

            const thumbnail = await screen.findByAltText('Living Room');
            expect(thumbnail).toHaveAttribute('src', mockSetupsDrafts[0].thumbnailUrl);
        });

        it('shows loading state while fetching', () => {
            authFetch.mockReturnValue(new Promise(() => {}));

            renderWizard();

            expect(screen.getByText('Loading your projects...')).toBeInTheDocument();
        });

        it('shows empty state when no setups returned', async () => {
            authFetch.mockResolvedValue({ ok: true, json: async () => ({ content: [] }) });

            renderWizard();

            await screen.findByText("You don't have any setups yet.");
        });

        it('handles plain array response from both setup endpoints', async () => {
            authFetch.mockImplementation(async (url) => {
                if (typeof url === 'string') {
                    if (url.includes('/setups/user/drafts')) {
                        return { ok: true, json: async () => mockSetupsDrafts };
                    }

                    if (url.includes('/setups/user/published')) {
                        return { ok: true, json: async () => mockSetupsPublished };
                    }
                }

                return { ok: true, json: async () => [] };
            });

            renderWizard();

            await screen.findByText('Living Room');
            expect(screen.getByText('Bedroom')).toBeInTheDocument();
        });

        it('handles authFetch network error gracefully', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            authFetch.mockRejectedValue(new Error('Network error'));

            renderWizard();

            await waitFor(() => expect(consoleSpy).toHaveBeenCalled());
            expect(screen.getByText('Select Your Project')).toBeInTheDocument();

            consoleSpy.mockRestore();
        });

        it('handles authFetch returning ok=false gracefully', async () => {
            authFetch.mockResolvedValue({ ok: false });

            renderWizard();

            await waitFor(() => {
                expect(screen.queryByText('Loading your projects...')).not.toBeInTheDocument();
            });
        });

        it('selects a setup when clicked and shows checkmark badge', async () => {
            renderWizard();

            const card = await screen.findByText('Living Room');
            fireEvent.click(card.closest('div[style]'));

            await waitFor(() => {
                expect(screen.getByText('✓')).toBeInTheDocument();
            });
        });

        it('does not allow navigation past step 1 until a setup is selected', async () => {
            renderWizard();

            await screen.findByText('Living Room');

            expect(screen.getByText('Next 〉')).toBeDisabled();
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

        it('marks completed steps with ✓', () => {
            storeState.step = 3;

            renderWizard();

            const checkmarks = screen.getAllByText('✓');
            expect(checkmarks.length).toBeGreaterThanOrEqual(2);
        });

        it('calls setStep when clicking a step circle', () => {
            renderWizard();

            fireEvent.click(screen.getByText('3'));

            expect(storeState.setStep).toHaveBeenCalledWith(3);
        });
    });

    // ── Step 2: Budget ────────────────────────────────────────────────────
    describe('Step 2 — Budget', () => {
        beforeEach(() => {
            storeState.step = 2;
        });

        it('renders budget heading and price display', () => {
            renderWizard();

            expect(screen.getByText('What is your total budget?')).toBeInTheDocument();
            expect(screen.getAllByText('1000€').length).toBeGreaterThan(0);
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

            const pill1000 = screen.getByRole('button', { name: '1000€' });
            expect(pill1000.className).toContain('active');
        });
    });

    // ── Step 3: Priorities ────────────────────────────────────────────────
    describe('Step 3 — Priorities', () => {
        beforeEach(() => {
            storeState.step = 3;
        });

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

        it('renders all category option cards', () => {
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
        beforeEach(() => {
            storeState.step = 4;
        });

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
            renderWizard();
            fireEvent.click(screen.getByText('Get Suggestions 〉'));
            await screen.findByText('Recommended Devices');
        };

        const selectSetupAndGoToResults = async () => {
            storeState.step = 1;
            const view = renderWizard();

            const card = await screen.findByText('Living Room');
            fireEvent.click(card.closest('div[style]'));

            storeState.step = 4;
            view.rerender(
                <MemoryRouter>
                    <SetupWizard />
                </MemoryRouter>
            );

            fireEvent.click(screen.getByText('Get Suggestions 〉'));
            await screen.findByText('Recommended Devices');

            return view;
        };

        const getAlgorithmCriteria = () => {
            const algorithmCall = globalThis.fetch.mock.calls.find(([url]) =>
                String(url).includes('/api/devices/algorithmSuggestions?criteria=')
            );

            expect(algorithmCall).toBeTruthy();

            const url = new URL(algorithmCall[0], 'http://localhost:20025');
            return url.searchParams.get('criteria');
        };

        it('renders recommended devices heading', async () => {
            await goToResults();

            expect(screen.getByText('Recommended Devices')).toBeInTheDocument();
        });

        it('fetches and displays algorithm products', async () => {
            await goToResults();

            await screen.findByText('Smart Cam Pro');
            expect(screen.getByText('Smart Plug X')).toBeInTheDocument();
        });

        it('sends selected room contents and wizard criteria to algorithm suggestions', async () => {
            storeState.priceRange = [0, 2500];
            storeState.ecosystem = 'Alexa';
            storeState.techLevel = 'Intermediate';
            storeState.categories = ['Comfort', 'Energy'];
            storeState.protocols = ['Zigbee'];

            await selectSetupAndGoToResults();

            await waitFor(() => {
                expect(globalThis.fetch).toHaveBeenCalledWith(
                    expect.stringContaining('/api/devices/algorithmSuggestions?criteria=')
                );
            });

            const criteria = getAlgorithmCriteria();

            expect(criteria).toContain('Proiect/Cameră: Living Room');
            expect(criteria).toContain('Buget: 2500 EUR');
            expect(criteria).toContain('Ecosistem: Alexa');
            expect(criteria).toContain('Nivel: Intermediate');
            expect(criteria).toContain('Categorii: Comfort, Energy');
            expect(criteria).toContain('Protocoale: Zigbee');

            const roomDataMatch = criteria.match(/CameraData: (.*)\. Buget:/);
            expect(roomDataMatch).not.toBeNull();

            const roomData = JSON.parse(roomDataMatch[1]);

            expect(roomData.roomId).toBe('setup-1');
            expect(roomData.roomName).toBe('Living Room');
            expect(roomData.devices).toEqual([
                expect.objectContaining({
                    id: 101,
                    name: 'Smart Bulb',
                    brand: 'Philips',
                    type: 'light',
                    protocol: 'Zigbee',
                    col: 3,
                    row: 4,
                }),
            ]);
            expect(roomData.furniture).toEqual([
                expect.objectContaining({
                    id: 'furniture-1',
                    name: 'Sofa',
                    type: 'sofa',
                }),
            ]);
            expect(roomData.lines).toEqual([
                expect.objectContaining({
                    id: 'line-1',
                    type: 'wall',
                }),
            ]);
        });

        it('handles fetch error for algorithm products', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            globalThis.fetch = vi.fn().mockRejectedValue(new Error('API down'));

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

            expect(screen.queryByText('AI Recommendations')).not.toBeInTheDocument();
        });

        it('shows AI panel after submitting a prompt', async () => {
            await goToResults();
            await screen.findByText('Smart Cam Pro');

            authFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ devices: mockAIDevices }),
            });

            const input = screen.getByPlaceholderText(/robot vacuum/i);
            fireEvent.change(input, { target: { value: 'robot vacuum under 300' } });

            const askBtn = screen.getByText('Ask AI ✦');
            fireEvent.click(askBtn);

            await screen.findByText('AI Recommendations');
            await screen.findByText('Robot Vac AI');
        });

        it('sends selected room contents and wizard criteria to AI context', async () => {
            storeState.priceRange = [0, 1800];
            storeState.ecosystem = 'Apple Home';
            storeState.techLevel = 'Plug & Play';
            storeState.categories = ['Security'];
            storeState.protocols = ['Matter'];

            await selectSetupAndGoToResults();
            await screen.findByText('Smart Cam Pro');

            authFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ devices: mockAIDevices }),
            });

            const input = screen.getByPlaceholderText(/robot vacuum/i);
            fireEvent.change(input, { target: { value: 'recommend sensors' } });
            fireEvent.click(screen.getByText('Ask AI ✦'));

            await waitFor(() => {
                expect(authFetch).toHaveBeenCalledWith(
                    '/api/ai/agent-search',
                    expect.objectContaining({
                        method: 'POST',
                        body: expect.any(String),
                    })
                );
            });

            const aiCall = authFetch.mock.calls.find(([url]) => url === '/api/ai/agent-search');
            const body = JSON.parse(aiCall[1].body);

            expect(body.prompt).toBe('recommend sensors');
            expect(body.context).toContain('Proiect/Cameră: Living Room');
            expect(body.context).toContain('Buget: 1800 EUR');
            expect(body.context).toContain('Ecosistem: Apple Home');
            expect(body.context).toContain('Nivel: Plug & Play');
            expect(body.context).toContain('Categorii: Security');
            expect(body.context).toContain('Protocoale: Matter');
            expect(body.context).toContain('Smart Bulb');
        });

        it('handles Enter key in AI prompt input', async () => {
            await goToResults();
            await screen.findByText('Smart Cam Pro');

            authFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ devices: mockAIDevices }),
            });

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

            await goToResults();
            await screen.findByText('Smart Cam Pro');

            authFetch.mockRejectedValueOnce(new Error('AI service down'));

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

            expect(screen.getAllByText(/0\.00€/).length).toBeGreaterThan(0);

            fireEvent.click(screen.getByText('Smart Cam Pro').closest('.option-card'));

            await waitFor(() => {
                expect(screen.getAllByText(/129\.99€/).length).toBeGreaterThan(0);
            });
        });

        it('navigates to /builder/:id on "Start Project" with a selected setup', async () => {
            await selectSetupAndGoToResults();

            fireEvent.click(screen.getByText('Start Project 〉'));

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/builder/setup-1');
            });
        });

        it('navigates to /builder without id when no setup is selected', async () => {
            storeState.step = 4;

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

            fireEvent.click(screen.getByText('Back'));

            await waitFor(() => {
                expect(screen.queryByText('Recommended Devices')).not.toBeInTheDocument();
            });
        });

        it('shows "Searching..." loading state in algorithm panel', async () => {
            globalThis.fetch = vi.fn().mockReturnValue(new Promise(() => {}));

            storeState.step = 4;
            renderWizard();
            fireEvent.click(screen.getByText('Get Suggestions 〉'));

            await screen.findByText('Searching...');
        });

        it('shows "Searching…" button label while AI is loading', async () => {
            let resolveAI;

            await goToResults();
            await screen.findByText('Smart Cam Pro');

            authFetch.mockReturnValueOnce(new Promise(r => { resolveAI = r; }));

            const input = screen.getByPlaceholderText(/robot vacuum/i);
            fireEvent.change(input, { target: { value: 'speaker' } });
            fireEvent.click(screen.getByText('Ask AI ✦'));

            await screen.findByText('Searching…');

            resolveAI({ ok: true, json: async () => ({ devices: mockAIDevices }) });

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
            globalThis.fetch = vi.fn().mockResolvedValue({
                json: async () => [
                    { id: 5, name: 'Free Device', brand: 'ACME', price: 0, categoryId: 8, communicationProtocol: 'WiFi' },
                ],
            });

            storeState.step = 4;
            renderWizard();
            fireEvent.click(screen.getByText('Get Suggestions 〉'));

            await screen.findByText('Unavailable');
        });

        it('getCategoryIcon returns package icon for unknown categoryId', async () => {
            globalThis.fetch = vi.fn().mockResolvedValue({
                json: async () => [
                    { id: 99, name: 'Mystery Device', brand: 'X', bestPrice: 50, categoryId: 99, communicationProtocol: 'BLE' },
                ],
            });

            storeState.step = 4;
            renderWizard();
            fireEvent.click(screen.getByText('Get Suggestions 〉'));

            await screen.findByText('📦');
        });

        it('getCategoryIcon returns light icon for categoryId 13', async () => {
            globalThis.fetch = vi.fn().mockResolvedValue({
                json: async () => [
                    { id: 13, name: 'Light Device', brand: 'Hue', bestPrice: 40, categoryId: 13, communicationProtocol: 'Zigbee' },
                ],
            });

            storeState.step = 4;
            renderWizard();
            fireEvent.click(screen.getByText('Get Suggestions 〉'));

            await screen.findByText('💡');
        });
    });
});