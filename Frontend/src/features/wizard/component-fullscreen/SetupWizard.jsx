import React, { useState, useEffect } from 'react';
import useWizardStore from '../../../store/wizardStore.js';
import { authFetch } from '../../../utils/authFetch';
import { fetchAgentSuggestions } from '../../../utils/aiApi';
import './wizard.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:20025';

// ── HELPER: map categoryId → icon ───────────────────────────────────────────
const getCategoryIcon = (categoryId) => {
    switch (categoryId) {
        case 1:  return '📷'; // SMART CAMERAS
        case 2:  return '🔌'; // SMART POWER STRIPS
        case 3:  return '🎮'; // GAMING CONSOLES
        case 4:  return '🍳'; // SMART APPLIANCES
        case 5:  return '🎛️'; // SMART HUBS
        case 6:  return '🖥️'; // SMART MONITORS
        case 7:  return '🔋'; // SMART OUTLETS
        case 8:  return '📡'; // SMART SENSORS
        case 9:  return '🎵'; // SMART AUDIO
        case 10: return '📺'; // SMART TVs
        case 11: return '🤖'; // ROBOT VACUUMS
        case 12: return '🌐'; // SMART ROUTERS
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
        <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{p.name}</div>
            <div style={{ fontSize: '0.73rem', opacity: 0.7 }}>{p.brand} · {p.protocol}</div>
        </div>
        <div style={{ fontWeight: 800, color: 'var(--wz-accent)', whiteSpace: 'nowrap' }}>
            {p.price > 0 ? `${p.price}€` : 'Unavailable'}
        </div>
    </div>
);

// ── SUBCOMPONENT: Recommendation Panel ──────────────────────────────────────
const RecommendationPanel = ({ title, subtitle, icon, accentColor, products, selectedIds, onToggle, loading, emptyMessage }) => (
    <div style={{
        flex: 1,
        border: `2px solid ${accentColor}30`,
        borderRadius: '20px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: `${accentColor}06`,
        minWidth: 0,
    }}>
        {/* Panel Header */}
        <div style={{
            padding: '16px 20px 14px',
            borderBottom: `1px solid ${accentColor}20`,
            background: `${accentColor}0e`,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
        }}>
            <span style={{ fontSize: '1.3rem' }}>{icon}</span>
            <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--wz-text)' }}>{title}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--wz-muted)', marginTop: '1px' }}>{subtitle}</div>
            </div>
        </div>

        {/* Panel Body */}
        <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '14px', maxHeight: '320px' }}>
            {loading ? (
                <div style={{ padding: '30px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                    <div style={{
                        width: '26px', height: '26px',
                        border: `3px solid ${accentColor}30`,
                        borderTop: `3px solid ${accentColor}`,
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }} />
                    <span style={{ fontSize: '0.78rem', color: 'var(--wz-muted)' }}>Searching...</span>
                </div>
            ) : products.length === 0 ? (
                <div style={{ padding: '30px 0', textAlign: 'center', color: '#ff6b6b', fontSize: '0.8rem' }}>
                    {emptyMessage}
                </div>
            ) : (
                products.map(p => (
                    <ProductCard
                        key={p.id}
                        p={p}
                        isSelected={selectedIds.includes(p.id)}
                        onToggle={onToggle}
                    />
                ))
            )}
        </div>

        {/* Panel Footer - total */}
        <div style={{
            padding: '10px 20px',
            borderTop: `1px solid ${accentColor}20`,
            background: `${accentColor}0e`,
            fontSize: '0.78rem',
            fontWeight: 700,
            textAlign: 'right',
            color: 'var(--wz-muted)'
        }}>
            Selected: <span style={{ color: accentColor }}>
                {products
                    .filter(p => selectedIds.includes(p.id))
                    .reduce((sum, p) => sum + p.price, 0)
                    .toFixed(2)}€
            </span>
        </div>
    </div>
);

// ── COMPONENT: Suggested Products View ──────────────────────────────────────
const SuggestedProductsView = ({ onConfirm, onBack }) => {
    const s = useWizardStore();

    // Loading states for each panel independently
    const [loadingAI, setLoadingAI]       = useState(true);
    const [loadingAlgo, setLoadingAlgo]   = useState(true);

    // Produse filtrate per panou
    const [aiProducts, setAiProducts]     = useState([]);
    const [algoProducts, setAlgoProducts] = useState([]);

    // Selectii unificate — userul poate selecta din ambele panouri
    const [selectedIds, setSelectedIds]   = useState([]);

    useEffect(() => {
        const fetchSuggestions = () => {
            setLoadingAI(true);
            setLoadingAlgo(true);

            // 1. Construim string-ul cu criterii
            const criterii = `Buget: ${s.priceRange[1]} EUR. Ecosistem: ${s.ecosystem || 'Oricare'}. Nivel: ${s.techLevel}. Categorii dorite: ${s.categories.join(', ')}. Protocoale preferate: ${s.protocols.length > 0 ? s.protocols.join(', ') : 'Oricare'}`;
            const encodedCriteria = encodeURIComponent(criterii);

            // 2. Fetch catre backend (AI Gemini)
            fetch(`${API_BASE}/api/devices/suggestions?criteria=${encodedCriteria}`)
                .then(res => res.json())
                .then(data => {
                    setAiProducts(data.map(item => ({
                        id: item.id.toString(),
                        name: item.name,
                        brand: item.brand,
                        price: item.bestPrice ?? item.price ?? 0,
                        icon: getCategoryIcon(item.categoryId),
                        protocol: item.communicationProtocol || item.protocol || 'Unknown',
                        categoryId: item.categoryId,
                    })));
                })
                .catch(err => {
                    console.error("Failed to fetch AI products:", err);
                    setAiProducts([]);
                })
                .finally(() => setLoadingAI(false));

            // 3. Fetch catre backend (Local Algorithm)
            fetch(`${API_BASE}/api/devices/algorithmSuggestions?criteria=${encodedCriteria}`)
                .then(res => res.json())
                .then(data => {
                    setAlgoProducts(data.map(item => ({
                        id: item.id.toString(),
                        name: item.name,
                        brand: item.brand,
                        price: item.bestPrice ?? item.price ?? 0,
                        icon: getCategoryIcon(item.categoryId),
                        protocol: item.communicationProtocol || item.protocol || 'Unknown',
                        categoryId: item.categoryId,
                    })));
                })
                .catch(err => {
                    console.error("Failed to fetch Algorithm products:", err);
                    setAlgoProducts([]);
                })
                .finally(() => setLoadingAlgo(false));
        };

        fetchSuggestions();
    }, [s.priceRange, s.ecosystem, s.techLevel, s.categories, s.protocols]);

    const toggleProduct = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    // Toate produsele unice selectate (din oricare panou)
    const allUnique = [...new Map([...aiProducts, ...algoProducts].map(p => [p.id, p])).values()];
    const selectedProducts = allUnique.filter(p => selectedIds.includes(p.id));
    const totalPrice = selectedProducts.reduce((sum, p) => sum + p.price, 0);

    return (
        <div className="step-content">
            <h2>Recommended Devices</h2>
            <p>
                Two recommendation engines analyzed your preferences.
                Pick the ones you like from either list!
            </p>

            {/* ── Cele 2 panouri side-by-side ── */}
            <div style={{
                display: 'flex',
                gap: '16px',
                alignItems: 'stretch',
                flexWrap: 'wrap',
            }}>
                {/* Panoul 1: AI */}
                <RecommendationPanel
                    title="AI Recommendations"
                    subtitle="Powered by Gemini"
                    icon="🤖"
                    accentColor="#00b4d8"
                    products={aiProducts}
                    selectedIds={selectedIds}
                    onToggle={toggleProduct}
                    loading={loadingAI}
                    emptyMessage="AI found no matches. Try a higher budget!"
                />

                {/* Panoul 2: Algorithm */}
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
            </div>

            {/* ── Footer ── */}
            <div className="nav-footer">
                <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                    Total selected ({selectedProducts.length} items):{' '}
                    <span style={{ color: 'var(--wz-accent)' }}>{totalPrice.toFixed(2)}€</span>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn-wizard btn-prev" onClick={onBack}>Back</button>
                    <button
                        className="btn-wizard btn-next"
                        onClick={() => onConfirm(selectedProducts)}
                    >
                        Start Project 〉
                    </button>
                </div>
            </div>

            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

// ── COMPONENT: Room Image Card (WITH PLACEHOLDERS FOR TEAM) ────────────────
const RoomImageCard = ({ name, icon, isSelected, onClick }) => (
    <div
        className={`room-image-card ${isSelected ? 'selected' : ''}`}
        onClick={onClick}
        style={{
            cursor: 'pointer',
            padding: '10px',
            borderRadius: '16px',
            border: isSelected ? '2px solid var(--wz-accent)' : '2px solid transparent',
            backgroundColor: isSelected ? 'var(--wz-accent)' : 'var(--wz-bg)',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
        }}
    >
        <div className="room-image-placeholder" style={{
            width: '100%',
            height: '110px',
            border: '2px dashed var(--wz-border)',
            borderRadius: '10px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : 'var(--wz-card)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <span style={{ fontSize: '2.5rem', opacity: 0.5, marginBottom: '5px' }}>{icon}</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--wz-muted)', fontWeight: '600' }}>Image Placeholder</span>

            {isSelected && (
                <div style={{
                    position: 'absolute', top: '8px', right: '8px',
                    backgroundColor: 'var(--wz-accent)', color: 'white',
                    width: '24px', height: '24px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 'bold', fontSize: '12px'
                }}>
                    ✓
                </div>
            )}
        </div>
    </div>
);

// ── MAIN COMPONENT: SetupWizard ────────────────────────────────────────────
const SetupWizard = ({ onFinish }) => {
    const s = useWizardStore();
    const [showResults, setShowResults] = useState(false);

    // State-uri noi pentru AI Agent
    const [agentPrompt, setAgentPrompt] = useState("");
    const [aiProducts, setAiProducts] = useState([]);
    const [isAgentLoading, setIsAgentLoading] = useState(false);

    const ROOM_OPTIONS = [
        { id: 'living',   name: 'Living Room', icon: '🛋️' },
        { id: 'kitchen',  name: 'Kitchen',     icon: '🍳' },
        { id: 'bedroom',  name: 'Bedroom',     icon: '🛏️' },
        { id: 'bathroom', name: 'Bathroom',    icon: '🛁' },
    ];

    // Funcția care apelează noul endpoint de AI
    const handleAgentSearch = async () => {
        if (!agentPrompt.trim()) return;
        setIsAgentLoading(true);

        // Aici trimitem ISTORICUL dorit de tine!
        const userContext = `
            Buget rămas/setat: ${s.priceRange[1]} Euro.
            Nivel tehnic: ${s.techLevel}.
            Ecosistem dorit: ${s.ecosystem}.
            Categorii de interes: ${s.categories.join(', ')}.
            Algoritmul standard deja a returnat produse pe aceste criterii. Dacă utilizatorul cere altceva, oferă opțiuni diferite.
        `;

        try {
            const res = await authFetch('/api/ai/agent-search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: agentPrompt, context: userContext })
            });

            if (res.ok) {
                const data = await res.json();
                // Salvăm produsele în state
                setAiProducts(data.devices || []);
            } else {
                console.error("Eroare server");
            }
        } catch (error) {
            console.error("Eroare AI Agent:", error);
        } finally {
            setIsAgentLoading(false);
        }
    };
    if (showResults) {
        return (
            <div className={`wizard-container w-full max-w-3xl ${s.darkMode ? 'dark-mode' : ''}`}>
                <div className="wizard-card">
                    {/* Algoritmul vostru original */}
                    <SuggestedProductsView
                        onBack={() => setShowResults(false)}
                        onConfirm={(selectedProducts) => onFinish(selectedProducts)}
                    />

                    {/* Secțiunea nouă "Domnul Simi" (AI Agent) */}
                    <div className="ai-agent-section" style={{ marginTop: '30px', padding: '20px', borderTop: '2px solid #eee', textAlign: 'center' }}>
                        <h4>🤖 Asistent Smart Home AI</h4>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <input
                                type="text"
                                value={agentPrompt}
                                onChange={(e) => setAgentPrompt(e.target.value)}
                                placeholder="Ex: Vreau un televizor diferit..."
                                style={{ padding: '10px', width: '60%', borderRadius: '5px', border: '1px solid #ccc' }}
                            />
                            <button onClick={handleAgentSearch} disabled={isAgentLoading} className="btn-wizard">
                                {isAgentLoading ? "Caută în DB..." : "Trimite"}
                            </button>
                        </div>

                        {/* Aici randăm produsele găsite exact cum arată ele în site */}
                        {aiProducts.length > 0 && (
                            <div style={{ marginTop: '20px', textAlign: 'left' }}>
                                <h5>Rezultatele găsite de AI:</h5>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                    gap: '15px'
                                }}>
                                    {aiProducts.map(device => (
                                        <div key={device.id} style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '8px' }}>
                                            {/* Afișăm imaginea, numele și prețul, din baza de date */}
                                            {device.imageUrl && <img src={device.imageUrl} alt={device.name} style={{width: '100%', height: '150px', objectFit: 'contain'}}/>}
                                            <h6 style={{ margin: '10px 0 5px 0' }}>{device.name}</h6>
                                            <p style={{ color: 'gray', fontSize: '0.8rem', margin: 0 }}>{device.brand}</p>
                                            <p style={{ fontWeight: 'bold', margin: '5px 0' }}>{device.price} RON</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {aiProducts.length === 0 && agentPrompt && !isAgentLoading && (
                            <p style={{marginTop: '15px', color: 'gray'}}>Niciun produs găsit pentru această cerință.</p>
                        )}
                    </div>
                </div>
            </div>
        );
    }
    const renderStep = () => {
        switch (s.step) {
            case 1: return (
                <div className="step-content">
                    <h2>Which rooms are you equipping?</h2>
                    <p>Select the spaces you want to configure. (Images will be integrated by the design team via API)</p>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                        gap: '15px',
                        marginTop: '20px'
                    }}>
                        {ROOM_OPTIONS.map(room => (
                            <RoomImageCard
                                key={room.id}
                                name={room.name}
                                icon={room.icon}
                                isSelected={s.rooms.includes(room.id)}
                                onClick={() => s.toggleRoom(room.id)}
                            />
                        ))}
                    </div>
                </div>
            );
            case 2: return (
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
            case 3: return (
                <div className="step-content">
                    <h2>What are your priorities?</h2>
                    <p>Select your preferred ecosystem and categories of interest.</p>
                    <div style={{ marginBottom: 25, display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
                        {["Apple Home", "Alexa", "Google Home"].map(eco => (
                            <button key={eco} onClick={() => s.setEcosystem(eco)} className={`eco-pill ${s.ecosystem === eco ? 'active' : ''}`}>{eco}</button>
                        ))}
                    </div>
                    <div className="options-list custom-scrollbar" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                        {[
                            { id: "Security",      icon: "🛡️", desc: "Cameras, sensors, alarms" },
                            { id: "Comfort",       icon: "🏠", desc: "Lighting, climate, automation" },
                            { id: "Energy",        icon: "⚡", desc: "Smart plugs, energy monitoring" },
                            { id: "Entertainment", icon: "🎵", desc: "Audio, TV, smart streaming" }
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
            case 4: return (
                <div className="step-content">
                    <h2>Technical Level</h2>
                    <p>Choose the complexity level suitable for your experience.</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 25 }}>
                        {["Wi-Fi", "Zigbee", "Matter"].map(p => (
                            <button key={p} onClick={() => s.toggleProtocol(p)} className={`eco-pill ${s.protocols.includes(p) ? 'active' : ''}`}>{p}</button>
                        ))}
                    </div>
                    {["Plug & Play", "Intermediate", "DIY / Custom"].map(level => (
                        <div key={level} className={`option-card ${s.techLevel === level ? 'selected' : ''}`} onClick={() => s.setTechLevel(level)}>
                            <div className="option-icon">{level === 'Plug & Play' ? '🔌' : level === 'Intermediate' ? '🔧' : '💻'}</div>
                            <div style={{ fontWeight: 700 }}>{level}</div>
                            {s.techLevel === level && <span style={{ color: 'var(--wz-accent)' }}>✔️</span>}
                        </div>
                    ))}
                </div>
            );
            default: return null;
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
                        <span className="step-label">{["Rooms", "Budget", "Priorities", "Level"][idx - 1]}</span>
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
                    >
                        {s.step === 4 ? 'Get Suggestions 〉' : 'Next 〉'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SetupWizard;
