import React, { useState, useEffect, useRef } from 'react';
import useWizardStore from '../../../store/wizardStore.js';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../../../utils/authFetch';
import './wizard.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:20025'}`;

// ── HELPER: map categoryId → icon ───────────────────────────────────────────
const getCategoryIcon = (categoryId) => {
    switch (categoryId) {
        case 1:  return '📷';
        case 2:  return '🔌';
        case 3:  return '🎮';
        case 4:  return '🍳';
        case 5:  return '🎛️';
        case 6:  return '🖥️';
        case 7:  return '🔋';
        case 8:  return '📡';
        case 9:  return '🎵';
        case 10: return '📺';
        case 11: return '🤖';
        case 12: return '🌐';
        case 13: return '💡';
        default: return '📦';
    }
};

// ── SUBCOMPONENT: Product Card ───────────────────────────────────────────────
const ProductCard = ({ p, isSelected, onToggle }) => (
    <div
        className={`option-card ${isSelected ? 'selected' : ''}`}
        onClick={() => onToggle(p.id)}
        style={{ marginBottom: '10px' }}
    >
        <div className="option-icon">{p.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
            <div style={{ fontSize: '0.73rem', opacity: 0.7 }}>{p.brand} · {p.protocol}</div>
        </div>
        <div style={{ fontWeight: 800, color: 'var(--wz-accent)', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {p.price > 0 ? `${p.price}€` : 'Unavailable'}
        </div>
    </div>
);

// ── SUBCOMPONENT: Recommendation Panel ──────────────────────────────────────
const RecommendationPanel = ({ title, subtitle, icon, accentColor, products, selectedIds, onToggle, loading, emptyMessage }) => (
    <div className="recommendation-panel" style={{ '--panel-accent': accentColor }}>
        <div className="recommendation-panel__header">
            <span style={{ fontSize: '1.3rem' }}>{icon}</span>
            <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--wz-text)' }}>{title}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--wz-muted)', marginTop: '1px' }}>{subtitle}</div>
            </div>
        </div>

        <div className="custom-scrollbar recommendation-panel__body">
            {loading ? (
                <div className="panel-loading">
                    <div className="panel-spinner" style={{ borderTopColor: accentColor, borderColor: `${accentColor}30` }} />
                    <span style={{ fontSize: '0.78rem', color: 'var(--wz-muted)' }}>Searching...</span>
                </div>
            ) : products.length === 0 ? (
                <div className="panel-empty">{emptyMessage}</div>
            ) : (
                products.map(p => (
                    <ProductCard key={p.id} p={p} isSelected={selectedIds.includes(p.id)} onToggle={onToggle} />
                ))
            )}
        </div>

        <div className="recommendation-panel__footer">
            Selected: <span style={{ color: accentColor }}>
                {products.filter(p => selectedIds.includes(p.id)).reduce((sum, p) => sum + p.price, 0).toFixed(2)}€
            </span>
        </div>
    </div>
);

// ── SUBCOMPONENT: AI Prompt Area ─────────────────────────────────────────────
const AIPromptArea = ({ onAsk, loading }) => {
    const [prompt, setPrompt] = useState('');
    const inputRef = useRef(null);

    const handleSubmit = () => {
        if (!prompt.trim() || loading) return;
        onAsk(prompt.trim());
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="ai-prompt-area">
            <div className="ai-prompt-area__label">
                <span className="ai-prompt-area__badge">✨ AI</span>
                <span>Not finding what you need? Describe it and let AI search for you.</span>
            </div>
            <div className="ai-prompt-area__row">
                <input
                    ref={inputRef}
                    type="text"
                    className="ai-prompt-input"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="e.g. A robot vacuum compatible with Apple Home under 400€…"
                    disabled={loading}
                />
                <button
                    className={`ai-prompt-btn ${loading ? 'loading' : ''}`}
                    onClick={handleSubmit}
                    disabled={loading || !prompt.trim()}
                >
                    {loading ? (
                        <>
                            <span className="btn-spinner" />
                            Searching…
                        </>
                    ) : (
                        <>Ask AI ✦</>
                    )}
                </button>
            </div>
        </div>
    );
};

// ── COMPONENT: Suggested Products View ──────────────────────────────────────
const SuggestedProductsView = ({ selectedSetup, onConfirm, onBack }) => {
    const s = useWizardStore();

    // ── State ──────────────────────────────────────────────────────────────
    const [loadingAI, setLoadingAI]         = useState(false);
    const [loadingAlgo, setLoadingAlgo]     = useState(true);

    const [aiProducts, setAiProducts]       = useState([]);
    const [algoProducts, setAlgoProducts]   = useState([]);
    const [selectedIds, setSelectedIds]     = useState([]);

    // NEW: controls whether the AI panel is rendered at all
    const [hasRequestedAI, setHasRequestedAI] = useState(false);

    // ── On mount: ONLY fetch algorithm suggestions ─────────────────────────
    useEffect(() => {
        setLoadingAlgo(true);
        const criterii = buildCriteria(selectedSetup, s);
        const encodedCriteria = encodeURIComponent(criterii);

        fetch(`${API_BASE}/api/devices/algorithmSuggestions?criteria=${encodedCriteria}`)
            .then(res => res.json())
            .then(data => setAlgoProducts(mapDevices(data)))
            .catch(err => {
                console.error("Failed to fetch Algorithm products:", err);
                setAlgoProducts([]);
            })
            .finally(() => setLoadingAlgo(false));
    }, [s.priceRange, s.ecosystem, s.techLevel, s.categories, s.protocols, selectedSetup]);

    // ── Handler: Ask AI with user's custom prompt ──────────────────────────
    const handleAskAI = async (userPrompt) => {
        setHasRequestedAI(true);
        setLoadingAI(true);

        const userContext = buildCriteria(selectedSetup, s); // Algoritmul și filtrele setate de user

        try {
            const res = await authFetch('/api/ai/agent-search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: userPrompt,
                    context: userContext
                }),
            });

            if (res.ok) {
                const data = await res.json();
                // mapDevices se așteaptă la un array, așa că luăm data.devices (sau un array gol dacă pică ceva)
                setAiProducts(mapDevices(data.devices || []));
            } else {
                console.error("Eroare de la server la fetch AI");
                setAiProducts([]);
            }
        } catch (err) {
            console.error("Failed to fetch AI products:", err);
            setAiProducts([]);
        } finally {
            setLoadingAI(false);
        }
    };

    // ── Derived values ─────────────────────────────────────────────────────
    const toggleProduct = (id) =>
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    const allUnique = [...new Map([...aiProducts, ...algoProducts].map(p => [p.id, p])).values()];
    const selectedProducts = allUnique.filter(p => selectedIds.includes(p.id));
    const totalPrice = selectedProducts.reduce((sum, p) => sum + p.price, 0);

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <div className="step-content">
            <h2>Recommended Devices</h2>
            <p>
                Smart picks for <strong>{selectedSetup ? selectedSetup.name : 'your project'}</strong>.
                Select what you like, then ask AI for more ideas below.
            </p>

            {/* Panels container — stacks vertically on mobile, side-by-side when both visible on desktop */}
            <div className={`panels-container ${hasRequestedAI ? 'panels-container--two-col' : 'panels-container--one-col'}`}>
                <RecommendationPanel
                    title="Algorithm Pick"
                    subtitle="Smart filter by our engine"
                    icon="⚙️"
                    accentColor="#7c3aed"
                    products={algoProducts}
                    selectedIds={selectedIds}
                    onToggle={toggleProduct}
                    loading={loadingAlgo}
                    emptyMessage="Algorithm found no matches."
                />

                {/* AI panel: only rendered after user submits a prompt */}
                {hasRequestedAI && (
                    <RecommendationPanel
                        title="AI Recommendations"
                        subtitle="Powered by Gemini"
                        icon="🤖"
                        accentColor="#00b4d8"
                        products={aiProducts}
                        selectedIds={selectedIds}
                        onToggle={toggleProduct}
                        loading={loadingAI}
                        emptyMessage="AI found no matches. Try rephrasing your request!"
                    />
                )}
            </div>

            {/* AI Prompt Input Area — always visible below panels */}
            <AIPromptArea onAsk={handleAskAI} loading={loadingAI} />

            {/* Navigation Footer */}
            <div className="nav-footer">
                <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                    Total ({selectedProducts.length} items):&nbsp;
                    <span style={{ color: 'var(--wz-accent)' }}>{totalPrice.toFixed(2)}€</span>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn-wizard btn-prev" onClick={onBack}>Back</button>
                    <button className="btn-wizard btn-next" onClick={() => onConfirm(selectedProducts)}>
                        Start Project 〉
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const parseJsonValue = (value, fallback) => {
    if (!value) return fallback;
    if (typeof value !== 'string') return value;

    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
};

const getSetupDevices = (setup) => {
    if (!setup) return [];

    const canvasState = parseJsonValue(setup.canvasState, {});
    const placedIcons = Array.isArray(canvasState.placedIcons) ? canvasState.placedIcons : [];
    const deviceSnapshots = parseJsonValue(setup.deviceSnapshots, []);

    if (placedIcons.length > 0) {
        return placedIcons.map((icon) => ({
            id: icon.deviceId || icon.id,
            name: icon.name || '',
            type: icon.type || '',
            brand: icon.brand || '',
            categoryId: icon.categoryId ?? null,
            categoryName: icon.categoryName || '',
            protocol: icon.communicationProtocol || '',
            priceEUR: icon.priceEUR ?? null,
            col: icon.col ?? null,
            row: icon.row ?? null,
            scale: icon.scale ?? null,
            rotation: icon.rotation ?? null,
        }));
    }

    if (Array.isArray(deviceSnapshots) && deviceSnapshots.length > 0) {
        return deviceSnapshots.map((device) => ({
            id: device.id,
            name: device.name || '',
            type: device.type || '',
            brand: device.brand || '',
            categoryId: device.categoryId ?? null,
            categoryName: device.categoryName || '',
            protocol: device.communicationProtocol || '',
            priceEUR: device.priceEUR ?? null,
        }));
    }

    return (setup.deviceIds || []).map((id) => ({ id }));
};

const getSetupFurniture = (setup) => {
    if (!setup) return [];

    const canvasState = parseJsonValue(setup.canvasState, {});
    const placedFurniture = Array.isArray(canvasState.placedFurniture) ? canvasState.placedFurniture : [];

    return placedFurniture.map((item) => ({
        id: item.id || '',
        name: item.name || '',
        type: item.type || '',
        centerCol: item.centerCol ?? null,
        centerRow: item.centerRow ?? null,
        widthCols: item.widthCols ?? null,
        heightCols: item.heightCols ?? null,
        rotation: item.rotation ?? null,
    }));
};

const getSetupLines = (setup) => {
    if (!setup) return [];

    const canvasState = parseJsonValue(setup.canvasState, {});
    const lines = Array.isArray(canvasState.lines) ? canvasState.lines : [];

    return lines.map((line) => ({
        id: line.id || '',
        type: line.type || '',
        start: line.start || null,
        end: line.end || null,
    }));
};

const buildRoomContext = (setup) => JSON.stringify({
    roomId: setup?.id || null,
    roomName: setup?.name || '',
    roomStatus: setup?.status || '',
    devices: getSetupDevices(setup),
    furniture: getSetupFurniture(setup),
    lines: getSetupLines(setup),
});

const buildCriteria = (setup, s) =>
    `Proiect/Cameră: ${setup?.name || 'Nespecificat'}. CameraData: ${buildRoomContext(setup)}. Buget: ${s.priceRange[1]} EUR. Ecosistem: ${s.ecosystem || 'Oricare'}. Nivel: ${s.techLevel || 'Nespecificat'}. Categorii: ${s.categories.length > 0 ? s.categories.join(', ') : 'Oricare'}. Protocoale: ${s.protocols.length > 0 ? s.protocols.join(', ') : 'Oricare'}`;

const mapDevices = (data) =>
    data.map(item => ({
        id: item.id.toString(),
        name: item.name,
        brand: item.brand,
        price: item.bestPrice ?? item.price ?? 0,
        icon: getCategoryIcon(item.categoryId),
        protocol: item.communicationProtocol || item.protocol || 'Unknown',
        categoryId: item.categoryId,
    }));

// ── MAIN COMPONENT: SetupWizard ────────────────────────────────────────────
const SetupWizard = ({ onFinish }) => {
    const navigate = useNavigate();
    const s = useWizardStore();
    const [showResults, setShowResults] = useState(false);

    const [savedLayouts, setSavedLayouts]   = useState([]);
    const [loadingLayouts, setLoadingLayouts] = useState(false);
    const [selectedSetup, setSelectedSetup] = useState(null);

    // Legacy AI Agent state (kept for the bottom search bar on results screen)
    const [agentPrompt, setAgentPrompt]     = useState('');
    const [aiProducts, setAiProducts]       = useState([]);
    const [isAgentLoading, setIsAgentLoading] = useState(false);

    const handleStartProject = (selectedProducts) => {
        const deviceIds = selectedProducts.map(p => Number(p.id));
        sessionStorage.setItem('wizard_selected_devices', JSON.stringify(deviceIds));
        if (selectedSetup?.id) {
            navigate(`/builder/${selectedSetup.id}`);
        } else {
            navigate('/builder');
        }
        if (onFinish) onFinish(selectedProducts);
    };

    useEffect(() => {
        if (s.step !== 1) return;

        const normalizeSetupsResponse = async (response) => {
            if (!response?.ok) return [];
            const data = await response.json();
            return data.content ? data.content : (Array.isArray(data) ? data : []);
        };

        const fetchSetups = async () => {
            setLoadingLayouts(true);
            try {
                const [draftsRes, publishedRes] = await Promise.all([
                    authFetch('/api/v1/setups/user/drafts?page=0&size=20'),
                    authFetch('/api/v1/setups/user/published?page=0&size=20'),
                ]);

                const [drafts, published] = await Promise.all([
                    normalizeSetupsResponse(draftsRes),
                    normalizeSetupsResponse(publishedRes),
                ]);

                setSavedLayouts([
                    ...drafts.map((setup) => ({
                        ...setup,
                        status: setup.status || 'DRAFT',
                    })),
                    ...published.map((setup) => ({
                        ...setup,
                        status: setup.status || 'PUBLISHED',
                    })),
                ]);
            } catch (error) {
                console.error('Eroare la încărcarea Setups în wizard:', error);
            } finally {
                setLoadingLayouts(false);
            }
        };

        fetchSetups();
    }, [s.step]);

    const handleAgentSearch = async () => {
        if (!agentPrompt.trim()) return;
        setIsAgentLoading(true);

        const setupName = selectedSetup ? selectedSetup.name : 'Nespecificat';

        // Extragem doar numele și brandul produselor găsite de algoritm
        const algoProductNames = algoProducts.length > 0
            ? algoProducts.map(p => `${p.name} (${p.brand})`).join(', ')
            : 'Niciun produs găsit de algoritm';

        // Construim noul context "suprem"
        const userContext = `
            Proiect/Cameră vizată: ${setupName}.
            Buget maxim setat: ${s.priceRange[1]} Euro.
            Nivel tehnic: ${s.techLevel}.
            Ecosistem dorit: ${s.ecosystem}.
            Categorii de interes: ${s.categories.join(', ')}.
            
            ATENȚIE - Produse DEJA sugerate de algoritmul nostru local: 
            [ ${algoProductNames} ]
            
            REGULĂ PENTRU AI: 
            1. NU recomanda aceleași produse din lista de mai sus.
            2. Recomandă alternative mai bune SAU produse complementare (accesorii) care se potrivesc perfect cu ce a sugerat deja algoritmul.
        `;
        try {
            const res = await authFetch('/api/ai/agent-search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: agentPrompt, context: userContext }),
            });
            if (res.ok) {
                const data = await res.json();
                setAiProducts(data.devices || []);
            }
        } catch (error) {
            console.error('Eroare AI Agent:', error);
        } finally {
            setIsAgentLoading(false);
        }
    };

    if (showResults) {
        return (
            <div className={`wizard-container w-full max-w-3xl ${s.darkMode ? 'dark-mode' : ''}`}>
                <div className="wizard-card">
                    <SuggestedProductsView
                        selectedSetup={selectedSetup}
                        onBack={() => setShowResults(false)}
                        onConfirm={handleStartProject}
                    />
                </div>
            </div>
        );
    }

    const renderStep = () => {
        switch (s.step) {
            case 1:
                return (
                    <div className="step-content animate-fade-in">
                        <h2>Select Your Project</h2>
                        <p>Choose one of your existing setups to start configuring.</p>
                        <div className="mb-8" style={{ textAlign: 'left' }}>
                            <h3 style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '15px', color: 'var(--wz-text)' }}>Your Saved Setups</h3>
                            {loadingLayouts ? (
                                <p style={{ fontSize: '0.8rem', color: 'var(--wz-muted)' }}>Loading your projects...</p>
                            ) : savedLayouts.length === 0 ? (
                                <div style={{ padding: '40px 20px', backgroundColor: 'var(--wz-accent-soft)', borderRadius: '16px', border: '2px dashed var(--wz-border)', textAlign: 'center', fontSize: '0.9rem', color: 'var(--wz-muted)' }}>
                                    You don't have any setups yet.
                                </div>
                            ) : (
                                <div className="custom-scrollbar" style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '20px' }}>
                                    {savedLayouts.map((setup) => {
                                        const isSelected = selectedSetup?.id === setup.id;
                                        return (
                                            <div
                                                key={setup.id}
                                                onClick={() => setSelectedSetup(setup)}
                                                style={{
                                                    position: 'relative',
                                                    flexShrink: 0,
                                                    width: '200px',
                                                    cursor: 'pointer',
                                                    borderRadius: '20px',
                                                    border: isSelected ? '2px solid var(--wz-accent)' : '2px solid var(--wz-border)',
                                                    backgroundColor: 'var(--wz-bg)',
                                                    transition: 'all 0.2s ease',
                                                    overflow: 'hidden',
                                                    boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.15)' : '0 4px 12px rgba(0,0,0,0.05)',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    transform: isSelected ? 'translateY(-3px)' : 'none',
                                                }}
                                            >
                                                {isSelected && (
                                                    <div style={{ position: 'absolute', top: 10, right: 10, backgroundColor: 'var(--wz-accent)', color: 'white', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', zIndex: 2 }}>
                                                        ✓
                                                    </div>
                                                )}
                                                <div
                                                    style={{
                                                        height: '90px',
                                                        backgroundColor: setup.thumbnailUrl ? '#1a1a1e' : (isSelected ? '#cce0f5' : '#a8c2d8'),
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        transition: 'background-color 0.2s ease',
                                                        padding: setup.thumbnailUrl ? 6 : 0,
                                                    }}
                                                >
                                                    {setup.thumbnailUrl ? (
                                                        <img
                                                            src={setup.thumbnailUrl}
                                                            alt={setup.name || 'Setup preview'}
                                                            style={{
                                                                maxWidth: '100%',
                                                                maxHeight: '100%',
                                                                width: 'auto',
                                                                height: 'auto',
                                                                objectFit: 'contain',
                                                                display: 'block',
                                                                borderRadius: 6,
                                                            }}
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                            }}
                                                        />
                                                    ) : (
                                                        <span style={{ fontSize: '2rem' }}>🏠</span>
                                                    )}
                                                </div>
                                                <div style={{ padding: '12px', textAlign: 'left' }}>
                                                    <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--wz-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {setup.name || 'Untitled Setup'}
                                                    </div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--wz-muted)', marginTop: '4px' }}>
                                                        Status: {String(setup.status || 'DRAFT').toUpperCase() === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT'}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="step-content">
                        <h2>What is your total budget?</h2>
                        <p>Estimate the maximum amount you are willing to invest.</p>
                        <div style={{ padding: '40px 0' }}>
                            <h1 style={{ color: 'var(--wz-accent)', fontSize: '3.5rem', fontWeight: 800 }}>{s.priceRange[1]}€</h1>
                            <input
                                type="range" min="100" max="5000" step="100" value={s.priceRange[1]}
                                onChange={(e) => s.setPrice(Number(e.target.value))}
                                className="wz-range-slider"
                                style={{ '--range-pct': `${(s.priceRange[1] - 100) / 4900 * 100}%` }}
                            />
                            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 25 }}>
                                {[500, 1000, 1500, 3000].map(v => (
                                    <button key={v} onClick={() => s.setPrice(v)} className={`eco-pill ${s.priceRange[1] === v ? 'active' : ''}`}>{v}€</button>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="step-content">
                        <h2>What are your priorities?</h2>
                        <p>Select your preferred ecosystem and categories of interest.</p>
                        <div style={{ marginBottom: 25, display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
                            {['Apple Home', 'Alexa', 'Google Home'].map(eco => (
                                <button key={eco} onClick={() => s.setEcosystem(eco)} className={`eco-pill ${s.ecosystem === eco ? 'active' : ''}`}>{eco}</button>
                            ))}
                        </div>
                        <div className="options-list custom-scrollbar" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                            {[
                                { id: 'Security',      icon: '🛡️', desc: 'Cameras, sensors, alarms' },
                                { id: 'Comfort',       icon: '🏠', desc: 'Lighting, climate, automation' },
                                { id: 'Energy',        icon: '⚡', desc: 'Smart plugs, energy monitoring' },
                                { id: 'Entertainment', icon: '🎵', desc: 'Audio, TV, smart streaming' },
                            ].map(opt => (
                                <div key={opt.id} className={`option-card ${s.categories.includes(opt.id) ? 'selected' : ''}`} onClick={() => s.toggleCategory(opt.id)}>
                                    <div className="option-icon">{opt.icon}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700 }}>{opt.id}</div>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{opt.desc}</div>
                                    </div>
                                    {s.categories.includes(opt.id) && <span style={{ color: 'var(--wz-accent)' }}>✔️</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="step-content">
                        <h2>Technical Level</h2>
                        <p>Choose the complexity level suitable for your experience.</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 25 }}>
                            {['Wi-Fi', 'Zigbee', 'Matter'].map(p => (
                                <button key={p} onClick={() => s.toggleProtocol(p)} className={`eco-pill ${s.protocols.includes(p) ? 'active' : ''}`}>{p}</button>
                            ))}
                        </div>
                        {['Plug & Play', 'Intermediate', 'DIY / Custom'].map(level => (
                            <div key={level} className={`option-card ${s.techLevel === level ? 'selected' : ''}`} onClick={() => s.setTechLevel(level)}>
                                <div className="option-icon">{level === 'Plug & Play' ? '🔌' : level === 'Intermediate' ? '🔧' : '💻'}</div>
                                <div style={{ fontWeight: 700 }}>{level}</div>
                                {s.techLevel === level && <span style={{ color: 'var(--wz-accent)' }}>✔️</span>}
                            </div>
                        ))}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className={`wizard-container w-full max-w-3xl ${s.darkMode ? 'dark-mode' : ''}`}>
            <div className="progress-tracker">
                {[1, 2, 3, 4].map(idx => (
                    <div key={idx} className="progress-step" onClick={() => s.setStep(idx)}>
                        <div className={`step-circle ${s.step === idx ? 'active' : ''} ${s.step > idx ? 'completed' : ''}`}>
                            {s.step > idx ? '✓' : idx}
                        </div>
                        <span className="step-label">{['Rooms', 'Budget', 'Priorities', 'Level'][idx - 1]}</span>
                    </div>
                ))}
            </div>

            <div className="wizard-card">
                {renderStep()}
                <div className="nav-footer">
                    <button className="btn-wizard btn-prev" onClick={s.prevStep} disabled={s.step === 1}>
                        〈 Previous
                    </button>
                    <button
                        className="btn-wizard btn-next"
                        onClick={s.step === 4 ? () => setShowResults(true) : s.nextStep}
                        disabled={s.step === 1 && selectedSetup === null}
                    >
                        {s.step === 4 ? 'Get Suggestions 〉' : 'Next 〉'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SetupWizard;