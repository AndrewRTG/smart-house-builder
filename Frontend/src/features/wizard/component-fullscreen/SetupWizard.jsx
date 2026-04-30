import React, { useState, useEffect } from 'react';
import useWizardStore from '../../../store/wizardStore.js';
import './wizard.css';

// ── COMPONENT: Suggested Products View ──────────────────────────────────────
const SuggestedProductsView = ({ onConfirm, onBack }) => {
    const s = useWizardStore();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState([]);

    useEffect(() => {
        const fetchSuggestions = async () => {
            setLoading(true);
            try {
                // ====================================================================
                // 🔌 HOW TO CONNECT FRONTEND TO BACKEND 🔌
                // ====================================================================
                // 1. Set your backend URL endpoint.
                // const API_URL = 'http://localhost:8080/api/recommendations'; // Local backend example
                // const API_URL = 'https://api.yourdomain.com/v1/recommendations'; // Production backend
                //
                // 2. Prepare the payload using the data collected in the Wizard Store (s).
                // const requestPayload = {
                //     maxBudget: s.priceRange[1],
                //     ecosystem: s.ecosystem,
                //     categories: s.categories,
                //     protocols: s.protocols,
                //     techLevel: s.techLevel,
                //     rooms: s.rooms
                // };
                //
                // 3. Make the HTTP POST request to your Backend.
                // const response = await fetch(API_URL, {
                //     method: 'POST',
                //     headers: {
                //         'Content-Type': 'application/json',
                //         // 'Authorization': `Bearer ${token}` // Uncomment if API requires authentication
                //     },
                //     body: JSON.stringify(requestPayload)
                // });
                //
                // 4. Handle Backend Errors gracefully.
                // if (!response.ok) {
                //     throw new Error(`Backend error: ${response.status} ${response.statusText}`);
                // }
                //
                // 5. Parse the JSON response and update the React state.
                // const fetchedProducts = await response.json();
                // setProducts(fetchedProducts);
                // ====================================================================

                // MOCK DATA (Simulating the backend response for now until API is ready)
                // Remove this once you uncomment the actual fetch logic above.
                await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
                const mockData = [
                    { id: 'p1', name: 'Philips Hue RGB', brand: 'Philips', price: 89, category: 'Lighting', icon: '💡', protocol: 'Zigbee' },
                    { id: 'p2', name: 'Nest Thermostat', brand: 'Google', price: 249, category: 'Comfort', icon: '🌡️', protocol: 'Wi-Fi' },
                    { id: 'p3', name: 'Smart Lock Pro', brand: 'August', price: 199, category: 'Security', icon: '🔒', protocol: 'Z-Wave' },
                    { id: 'p4', name: 'Ring Doorbell', brand: 'Amazon', price: 159, category: 'Security', icon: '🔔', protocol: 'Wi-Fi' },
                ];

                // Grossly filter by code just to simulate backend logic
                const filtered = mockData.filter(p => p.price <= s.priceRange[1]);
                setProducts(filtered);
            } catch (error) {
                console.error("Failed to fetch products from backend:", error);
                // You can add an error state here to show an error message to the user
            } finally {
                setLoading(false);
            }
        };
        fetchSuggestions();
    }, [s.priceRange]);

    const toggleProduct = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const totalPrice = products
        .filter(p => selectedIds.includes(p.id))
        .reduce((sum, p) => sum + p.price, 0);

    return (
        <div className="step-content">
            <h2>Recommended Devices</h2>
            <p>We found {products.length} products that fit your {s.priceRange[1]}€ budget</p>

            <div className="custom-scrollbar" style={{ maxHeight: '380px', overflowY: 'auto', padding: '10px' }}>
                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
                        <div className="spinner" style={{ width: '30px', height: '30px', border: '3px solid var(--wz-border)', borderTop: '3px solid var(--wz-accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                        Searching the database for the best deals...
                        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                    </div>
                ) : (
                    <div className="suggestions-list">
                        {products.map(p => (
                            <div
                                key={p.id}
                                className={`option-card ${selectedIds.includes(p.id) ? 'selected' : ''}`}
                                onClick={() => toggleProduct(p.id)}
                                style={{ marginBottom: '12px' }}
                            >
                                <div className="option-icon">{p.icon}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{p.name}</div>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{p.brand} · {p.protocol}</div>
                                </div>
                                <div style={{ fontWeight: 800, color: 'var(--wz-accent)' }}>{p.price}€</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="nav-footer">
                <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                    Total selected: <span style={{ color: 'var(--wz-accent)' }}>{totalPrice}€</span>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn-wizard btn-prev" onClick={onBack}>Back</button>
                    <button
                        className="btn-wizard btn-next"
                        onClick={() => onConfirm(products.filter(p => selectedIds.includes(p.id)))}
                    >
                        Start Project 〉
                    </button>
                </div>
            </div>
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
            backgroundColor: isSelected ? 'var(--wz-accent-soft)' : 'var(--wz-bg)',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
        }}
    >
        {/* ========================================================= */}
        {/* FRONTEND/DESIGN TEAM INSTRUCTIONS:                        */}
        {/* Replace the 'div.room-image-placeholder' below with the   */}
        {/* actual <img src="..." /> tag when assets are ready.       */}
        {/* Keep the aspect ratio or fixed height so the grid         */}
        {/* doesn't break responsively.                               */}
        {/* ========================================================= */}
        <div className="room-image-placeholder" style={{
            width: '100%',
            height: '110px',
            border: '2px dashed var(--wz-border)', // Dashed border requested (chenar)
            borderRadius: '10px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--wz-card)',
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
        <div className="room-label" style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--wz-text)' }}>{name}</div>
    </div>
);

// ── MAIN COMPONENT: SetupWizard ────────────────────────────────────────────
const SetupWizard = ({ onFinish }) => {
    const s = useWizardStore();
    const [showResults, setShowResults] = useState(false);

    // Added more rooms to show off the responsive grid
    const ROOM_OPTIONS = [
        { id: 'living', name: 'Living Room', icon: '🛋️' },
        { id: 'kitchen', name: 'Kitchen', icon: '🍳' },
        { id: 'bedroom', name: 'Bedroom', icon: '🛏️' },
        { id: 'bathroom', name: 'Bathroom', icon: '🛁' },
    ];

    // Render the final results screen if 'Get Suggestions' is clicked
    if (showResults) {
        return (
            <div className="wizard-card w-full max-w-3xl mx-auto">
                <SuggestedProductsView
                    onBack={() => setShowResults(false)}
                    onConfirm={(selectedProducts) => onFinish(selectedProducts)}
                />
            </div>
        );
    }

    const renderStep = () => {
        switch (s.step) {
            case 1: return (
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
            case 2: return (
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
                            { id: "Security", icon: "🛡️", desc: "Cameras, sensors, alarms" },
                            { id: "Comfort", icon: "🏠", desc: "Lighting, climate, automation" },
                            { id: "Energy", icon: "⚡", desc: "Smart plugs, energy monitoring" },
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
            case 3: return (
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
            case 4: return (
                <div className="step-content">
                    <h2>Which rooms are you equipping?</h2>
                    <p>Select the spaces you want to configure. (Images will be integrated by the design team via API)</p>

                    {/* Responsive Grid for Rooms */}
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
            default: return null;
        }
    };

    return (
        // The wizard container is standalone, meaning it will sit nicely underneath any navbar
        // added to the App.tsx later.
        <div className={`wizard-container w-full max-w-3xl ${s.darkMode ? 'dark-mode' : ''}`}>
            <div className="progress-tracker">
                {[1, 2, 3, 4].map(idx => (
                    <div key={idx} className="progress-step" onClick={() => s.setStep(idx)}>
                        <div className={`step-circle ${s.step === idx ? 'active' : ''} ${s.step > idx ? 'completed' : ''}`}>
                            {s.step > idx ? '✓' : idx}
                        </div>
                        <span className="step-label">{["Budget", "Priorities", "Level", "Rooms"][idx-1]}</span>
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