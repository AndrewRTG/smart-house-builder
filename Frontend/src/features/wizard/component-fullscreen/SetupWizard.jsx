import React, { useState, useEffect } from 'react';
import useWizardStore from '../../../store/wizardStore.js';
import { authFetch } from '../../../utils/authFetch';
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
        <div style={{ padding: '16px 20px 14px', borderBottom: `1px solid ${accentColor}20`, background: `${accentColor}0e`, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.3rem' }}>{icon}</span>
            <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--wz-text)' }}>{title}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--wz-muted)', marginTop: '1px' }}>{subtitle}</div>
            </div>
        </div>

        <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '14px', maxHeight: '320px' }}>
            {loading ? (
                <div style={{ padding: '30px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                    <div style={{ width: '26px', height: '26px', border: `3px solid ${accentColor}30`, borderTop: `3px solid ${accentColor}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    <span style={{ fontSize: '0.78rem', color: 'var(--wz-muted)' }}>Searching...</span>
                </div>
            ) : products.length === 0 ? (
                <div style={{ padding: '30px 0', textAlign: 'center', color: '#ff6b6b', fontSize: '0.8rem' }}>
                    {emptyMessage}
                </div>
            ) : (
                products.map(p => (
                    <ProductCard key={p.id} p={p} isSelected={selectedIds.includes(p.id)} onToggle={onToggle} />
                ))
            )}
        </div>

        <div style={{ padding: '10px 20px', borderTop: `1px solid ${accentColor}20`, background: `${accentColor}0e`, fontSize: '0.78rem', fontWeight: 700, textAlign: 'right', color: 'var(--wz-muted)' }}>
            Selected: <span style={{ color: accentColor }}>
                {products.filter(p => selectedIds.includes(p.id)).reduce((sum, p) => sum + p.price, 0).toFixed(2)}€
            </span>
        </div>
    </div>
);

// ── COMPONENT: Suggested Products View ──────────────────────────────────────
// ATENȚIE: Am adăugat `selectedSetup` ca parametru pentru a-l folosi în algoritm
const SuggestedProductsView = ({ selectedSetup, onConfirm, onBack }) => {
    const s = useWizardStore();

    const [loadingAI, setLoadingAI]       = useState(true);
    const [loadingAlgo, setLoadingAlgo]   = useState(true);

    const [aiProducts, setAiProducts]     = useState([]);
    const [algoProducts, setAlgoProducts] = useState([]);
    const [selectedIds, setSelectedIds]   = useState([]);

    useEffect(() => {
        const fetchSuggestions = () => {
            setLoadingAI(true);
            setLoadingAlgo(true);

            // 1. Includem numele camerei/proiectului în criteriile algoritmului!
            const setupName = selectedSetup ? selectedSetup.name : 'Nespecificat';
            const criterii = `Proiect/Cameră: ${setupName}. Buget: ${s.priceRange[1]} EUR. Ecosistem: ${s.ecosystem || 'Oricare'}. Nivel: ${s.techLevel}. Categorii: ${s.categories.join(', ')}. Protocoale: ${s.protocols.length > 0 ? s.protocols.join(', ') : 'Oricare'}`;
            const encodedCriteria = encodeURIComponent(criterii);

            // Fetch catre backend (Local Algorithm)
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
    }, [s.priceRange, s.ecosystem, s.techLevel, s.categories, s.protocols, selectedSetup]);

    const toggleProduct = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    const allUnique = [...new Map([...aiProducts, ...algoProducts].map(p => [p.id, p])).values()];
    const selectedProducts = allUnique.filter(p => selectedIds.includes(p.id));
    const totalPrice = selectedProducts.reduce((sum, p) => sum + p.price, 0);

    return (
        <div className="step-content">
            <h2>Recommended Devices</h2>
            <p>
                Two recommendation engines analyzed your preferences for <strong>{selectedSetup ? selectedSetup.name : "your project"}</strong>.
                Pick the ones you like!
            </p>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'stretch', flexWrap: 'wrap' }}>
                <RecommendationPanel
                    title="AI Recommendations" subtitle="Powered by Gemini" icon="🤖" accentColor="#00b4d8"
                    products={aiProducts} selectedIds={selectedIds} onToggle={toggleProduct} loading={loadingAI}
                    emptyMessage="AI found no matches. Try a higher budget!"
                />
                <RecommendationPanel
                    title="Algorithm Pick" subtitle="Smart filter by our engine" icon="⚙️" accentColor="#7c3aed"
                    products={algoProducts} selectedIds={selectedIds} onToggle={toggleProduct} loading={loadingAlgo}
                    emptyMessage="Algorithm found no matches."
                />
            </div>

            <div className="nav-footer">
                <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                    Total selected ({selectedProducts.length} items): <span style={{ color: 'var(--wz-accent)' }}>{totalPrice.toFixed(2)}€</span>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn-wizard btn-prev" onClick={onBack}>Back</button>
                    <button className="btn-wizard btn-next" onClick={() => onConfirm(selectedProducts)}>Start Project 〉</button>
                </div>
            </div>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

// ── MAIN COMPONENT: SetupWizard ────────────────────────────────────────────
const SetupWizard = ({ onFinish }) => {
    const s = useWizardStore();
    const [showResults, setShowResults] = useState(false);

    // Stări pentru setarile (proiectele) utilizatorului
    const [savedLayouts, setSavedLayouts] = useState([]);
    const [loadingLayouts, setLoadingLayouts] = useState(false);

    // NOU: Aici stocăm ce Setup a selectat utilizatorul
    const [selectedSetup, setSelectedSetup] = useState(null);

    // Stări pentru AI Agent
    const [agentPrompt, setAgentPrompt] = useState("");
    const [aiProducts, setAiProducts] = useState([]);
    const [isAgentLoading, setIsAgentLoading] = useState(false);

    useEffect(() => {
        if (s.step === 1) {
            const fetchSetups = async () => {
                setLoadingLayouts(true);
                try {
                    const response = await authFetch('/api/v1/setups/user/drafts?page=0&size=20');
                    if (response.ok) {
                        const data = await response.json();
                        const setupsArray = data.content ? data.content : (Array.isArray(data) ? data : []);
                        setSavedLayouts(setupsArray);
                    }
                } catch (error) {
                    console.error("Eroare la încărcarea Setups în wizard:", error);
                } finally {
                    setLoadingLayouts(false);
                }
            };
            fetchSetups();
        }
    }, [s.step]);

    const handleAgentSearch = async () => {
        if (!agentPrompt.trim()) return;
        setIsAgentLoading(true);

        // NOU: Trimitem numele setup-ului catre AI pentru context!
        const setupName = selectedSetup ? selectedSetup.name : 'Nespecificat';
        const userContext = `
            Proiect/Cameră vizată: ${setupName}.
            Buget rămas/setat: ${s.priceRange[1]} Euro.
            Nivel tehnic: ${s.techLevel}.
            Ecosistem dorit: ${s.ecosystem}.
            Categorii de interes: ${s.categories.join(', ')}.
            Oferă opțiuni noi și relevante pentru această cameră.
        `;

        try {
            const res = await authFetch('/api/ai/agent-search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: agentPrompt, context: userContext })
            });

            if (res.ok) {
                const data = await res.json();
                setAiProducts(data.devices || []);
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
                    {/* Trimitem selectedSetup mai departe catre componenta de Sugestii */}
                    <SuggestedProductsView
                        selectedSetup={selectedSetup}
                        onBack={() => setShowResults(false)}
                        onConfirm={(selectedProducts) => onFinish(selectedProducts)}
                    />

                    <div className="ai-agent-section" style={{ marginTop: '30px', padding: '20px', borderTop: '2px solid #eee', textAlign: 'center' }}>
                        <h4>🤖 Asistent Smart Home AI</h4>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <input
                                type="text" value={agentPrompt} onChange={(e) => setAgentPrompt(e.target.value)}
                                placeholder="Ex: Vreau un televizor diferit..."
                                style={{ padding: '10px', width: '60%', borderRadius: '5px', border: '1px solid #ccc' }}
                            />
                            <button onClick={handleAgentSearch} disabled={isAgentLoading} className="btn-wizard">
                                {isAgentLoading ? "Caută..." : "Trimite"}
                            </button>
                        </div>
                        {aiProducts.length > 0 && (
                            <div style={{ marginTop: '20px', textAlign: 'left' }}>
                                <h5>Rezultatele găsite de AI:</h5>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                                    {aiProducts.map(device => (
                                        <div key={device.id} style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '8px' }}>
                                            {device.imageUrl && <img src={device.imageUrl} alt={device.name} style={{width: '100%', height: '150px', objectFit: 'contain'}}/>}
                                            <h6 style={{ margin: '10px 0 5px 0' }}>{device.name}</h6>
                                            <p style={{ color: 'gray', fontSize: '0.8rem', margin: 0 }}>{device.brand}</p>
                                            <p style={{ fontWeight: 'bold', margin: '5px 0' }}>{device.price} RON</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    const renderStep = () => {
        switch (s.step) {
            case 1:
                return (
                    <div className="wizard-step animate-fade-in">
                        <h2 className="text-xl font-bold mb-2">Select Your Project</h2>
                        <p className="text-sm text-gray-500 mb-6">Choose one of your existing setups to start configuring.</p>

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
                                                // La click, setam setup-ul in starea locala
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
                                                    transform: isSelected ? 'translateY(-3px)' : 'none'
                                                }}
                                            >
                                                {/* Badge vizual daca e selectat */}
                                                {isSelected && (
                                                    <div style={{ position: 'absolute', top: 10, right: 10, backgroundColor: 'var(--wz-accent)', color: 'white', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', zIndex: 2 }}>
                                                        ✓
                                                    </div>
                                                )}

                                                <div style={{ height: '90px', backgroundColor: isSelected ? '#cce0f5' : '#a8c2d8', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.2s ease' }}>
                                                    <span style={{ fontSize: '2rem' }}>🏠</span>
                                                </div>
                                                <div style={{ padding: '12px', textAlign: 'left' }}>
                                                    <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--wz-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {setup.name || "Untitled Setup"}
                                                    </div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--wz-muted)', marginTop: '4px' }}>
                                                        Status: {setup.status || "Draft"}
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
                        // NOU: Nu lăsăm utilizatorul să meargă mai departe de pasul 1 dacă nu a ales un proiect
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