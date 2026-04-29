import React, { useState, useEffect } from 'react';
import useWizardStore from '../../../store/wizardStore.js';
import './wizard.css';

// ── COMPONENTA ACTUALIZATĂ: Vizualizare Sugestii Produse (Fără filtrare) ──────────
const SuggestedProductsView = ({ onConfirm, onBack }) => {
    const s = useWizardStore();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState([]);

    useEffect(() => {
        const fetchSuggestions = async () => {
            setLoading(true);
            try {
                // 1. Apelăm API-ul
                const res = await fetch('http://localhost:20025/api/devices/suggestions');
                const data = await res.json();

                // 2. Mapăm JSON-ul primit
                const mappedData = data.map(item => {
                    let icon = '🔌';
                    if (item.categoryId === 1) icon = '🛡️';
                    else if (item.categoryId === 6) icon = '🖥️';
                    else if (item.categoryId === 9) icon = '🎵';

                    return {
                        id: item.id.toString(),
                        name: item.name,
                        brand: item.brand,
                        price: item.price || 0,
                        icon: icon,
                        protocol: item.communicationProtocol || 'Unknown'
                    };
                });

                // 3. Setăm direct TOATE produsele (fără nicio filtrare)
                setProducts(mappedData);
            } catch (error) {
                console.error("Eroare la conectarea cu backend-ul:", error);
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchSuggestions();
    }, []); // <-- Am scos bugetul de aici pentru că nu mai filtram după el

    const toggleProduct = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const totalPrice = products
        .filter(p => selectedIds.includes(p.id))
        .reduce((sum, p) => sum + p.price, 0);

    return (
        <div className="step-content">
            <h2>Dispozitive recomandate</h2>
            <p>Am găsit {products.length} produse disponibile în catalog.</p>

            <div className="custom-scrollbar" style={{ maxHeight: '380px', overflowY: 'auto', padding: '10px' }}>
                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center' }}>Se caută cele mai bune oferte...</div>
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
                                <div style={{ fontWeight: 800, color: 'var(--wz-accent)' }}>
                                    {p.price > 0 ? `${p.price}€` : 'Indisponibil'}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="nav-footer">
                <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                    Total selectat: <span style={{ color: 'var(--wz-accent)' }}>{totalPrice.toFixed(2)}€</span>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn-wizard btn-prev" onClick={onBack}>Înapoi</button>
                    <button
                        className="btn-wizard btn-next"
                        onClick={() => onConfirm(products.filter(p => selectedIds.includes(p.id)))}
                    >
                        Începe proiectul 〉
                    </button>
                </div>
            </div>
        </div>
    );
};
// ── COMPONENTA: Card Imagine Cameră ───────────────────────────────────────
const RoomImageCard = ({ name, icon, isSelected, onClick }) => (
    <div className={`room-image-card ${isSelected ? 'selected' : ''}`} onClick={onClick}>
        <div className="room-image-frame">
            <span style={{ fontSize: '2rem' }}>{icon}</span>
            {isSelected && <div className="room-check-badge">✓</div>}
        </div>
        <div className="room-label">{name}</div>
    </div>
);

// ── COMPONENTA PRINCIPALĂ: SetupWizard ─────────────────────────────────────
const SetupWizard = ({ onFinish }) => {
    const s = useWizardStore();
    const [showResults, setShowResults] = useState(false);

    const ROOM_OPTIONS = [
        { id: 'living', name: 'Spatiu dedicat imaginilor', icon: '🛋️' }
    ];

    // Dacă am apăsat "Obține sugestii", randăm ecranul final de produse
    if (showResults) {
        return (
            <div className="wizard-card">
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
                    <h2>Care este bugetul tău total?</h2>
                    <p>Estimează suma pe care ești dispus să o investești.</p>
                    <div style={{ padding: '40px 0' }}>
                        <h1 style={{ color: 'var(--wz-accent)', fontSize: '3.5rem', fontWeight: 800 }}>{s.priceRange[1]}€</h1>
                        <input
                            type="range" min="100" max="5000" step="100" value={s.priceRange[1]}
                            onChange={(e) => s.setPrice(Number(e.target.value))}
                            className="wz-range-slider"
                            style={{ '--range-pct': `${(s.priceRange[1] - 100) / 4900 * 100}%` }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 25 }}>
                            {[500, 1000, 1500, 3000].map(v => (
                                <button key={v} onClick={() => s.setPrice(v)} className={`eco-pill ${s.priceRange[1] === v ? 'active' : ''}`}>{v}€</button>
                            ))}
                        </div>
                    </div>
                </div>
            );
            case 2: return (
                <div className="step-content">
                    <h2>Ce priorități ai?</h2>
                    <p>Selectează ecosistemul și categoriile de interes.</p>
                    <div style={{ marginBottom: 25, display: 'flex', gap: 10, justifyContent: 'center' }}>
                        {["Apple Home", "Alexa", "Google Home"].map(eco => (
                            <button key={eco} onClick={() => s.setEcosystem(eco)} className={`eco-pill ${s.ecosystem === eco ? 'active' : ''}`}>{eco}</button>
                        ))}
                    </div>
                    <div className="options-list custom-scrollbar" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                        {[
                            { id: "Securitate", icon: "🛡️", desc: "Camere, senzori, alarme" },
                            { id: "Confort", icon: "🏠", desc: "Iluminat, climă, automatizări" },
                            { id: "Energie", icon: "⚡", desc: "Pluguri smart, monitoring" },
                            { id: "Divertisment", icon: "🎵", desc: "Audio, TV, streaming" }
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
                    <h2>Nivel tehnic</h2>
                    <p>Alegem dispozitive potrivite experienței tale.</p>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 25 }}>
                        {["Wi-Fi", "Zigbee", "Matter"].map(p => (
                            <button key={p} onClick={() => s.toggleProtocol(p)} className={`eco-pill ${s.protocols.includes(p) ? 'active' : ''}`}>{p}</button>
                        ))}
                    </div>
                    {["Plug & Play", "Intermediar", "DIY / Custom"].map(level => (
                        <div key={level} className={`option-card ${s.techLevel === level ? 'selected' : ''}`} onClick={() => s.setTechLevel(level)}>
                            <div className="option-icon">{level === 'Plug & Play' ? '🔌' : level === 'Intermediar' ? '🔧' : '💻'}</div>
                            <div style={{ fontWeight: 700 }}>{level}</div>
                            {s.techLevel === level && <span style={{ color: 'var(--wz-accent)' }}>✔️</span>}
                        </div>
                    ))}
                </div>
            );
            case 4: return (
                <div className="step-content">
                    <h2>Ce camere dotezi?</h2>
                    <p>Alege spațiile pe care vrei să le configurezi (imaginile vin din API).</p>
                    <div className="rooms-image-grid">
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
        <div className={`wizard-container ${s.darkMode ? 'dark-mode' : ''}`}>
            <div className="progress-tracker">
                {[1, 2, 3, 4].map(idx => (
                    <div key={idx} className="progress-step" onClick={() => s.setStep(idx)}>
                        <div className={`step-circle ${s.step === idx ? 'active' : ''} ${s.step > idx ? 'completed' : ''}`}>
                            {s.step > idx ? '✓' : idx}
                        </div>
                        <span className="step-label">{["Buget", "Priorități", "Nivel", "Camere"][idx-1]}</span>
                    </div>
                ))}
            </div>

            <div className="wizard-card">
                {renderStep()}
                <div className="nav-footer">
                    <button className="btn-wizard btn-prev" onClick={s.prevStep} disabled={s.step === 1}>
                        〈 Anterior
                    </button>
                    <button
                        className="btn-wizard btn-next"
                        onClick={s.step === 4 ? () => setShowResults(true) : s.nextStep}
                    >
                        {s.step === 4 ? 'Obține sugestii 〉' : 'Următor 〉'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SetupWizard;