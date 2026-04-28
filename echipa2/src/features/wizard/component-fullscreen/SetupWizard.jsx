import React from 'react';
import useWizardStore from '../../../store/wizardStore.js';
import './wizard.css';

const SetupWizard = ({ onFinish }) => {
    const s = useWizardStore();

    // Filtrare sugestii de brand (opțional, folosind datele hardcodate anterior)
    const RECOMMENDED_BRANDS = ["Samsung", "Philips", "LG", "Bosch", "Sony", "Xiaomi", "Dyson", "Ring", "Nest"];
    const suggestions = RECOMMENDED_BRANDS.filter(b =>
        b.toLowerCase().includes(s.brandInput.toLowerCase()) && s.brandInput.length > 0 && !s.brands.includes(b)
    );

    const renderStep = () => {
        switch (s.step) {
            case 1: return (
                <div className="step-content">
                    <h2>Care este bugetul tău total?</h2>
                    <p>Estimează suma pe care ești dispus să o investești în dispozitive smart.</p>
                    <div style={{ padding: '40px 0' }}>
                        <h1 style={{ color: 'var(--wz-accent)', fontSize: '3rem', fontWeight: 800 }}>{s.priceRange[1]}€</h1>
                        <input
                            type="range" min="100" max="5000" step="100" value={s.priceRange[1]}
                            onChange={(e) => {
                                s.setPrice(Number(e.target.value));
                                e.target.style.setProperty('--range-pct', `${(Number(e.target.value) - 100) / 4900 * 100}%`);
                            }}
                            style={{
                                width: '100%',
                                cursor: 'pointer',
                                '--range-pct': `${(s.priceRange[1] - 100) / 4900 * 100}%`
                            }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 20 }}>
                            {[500, 1000, 1500, 3000].map(v => (
                                <button key={v} onClick={() => s.setPrice(v)} className={`eco-pill ${s.priceRange[1] === v ? 'active' : ''}`}>
                                    {v}€
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            );
            case 2: return (
                <div className="step-content">
                    <h2>Ce priorități ai?</h2>
                    <p>Selectează ecosistemul preferat și categoriile de interes.</p>
                    <div style={{ marginBottom: 25, display: 'flex', gap: 10, justifyContent: 'center' }}>
                        {["Apple Home", "Alexa", "Google Home"].map(eco => (
                            <button key={eco} onClick={() => s.setEcosystem(eco)}
                                    className={`eco-pill ${s.ecosystem === eco ? 'active' : ''}`}>{eco}</button>
                        ))}
                    </div>
                    <div style={{ maxHeight: '280px', overflowY: 'auto', paddingRight: 10 }} className="custom-scrollbar">
                        {[
                            { id: "Securitate", desc: "Camere, senzori, alarme", icon: "🛡️" },
                            { id: "Confort", desc: "Iluminat, climă, automatizări", icon: "🏠" },
                            { id: "Energie", desc: "Pluguri smart, monitoring", icon: "⚡" },
                            { id: "Divertisment", desc: "Audio, TV, streaming", icon: "🎵" }
                        ].map(opt => (
                            <div key={opt.id} className={`option-card ${s.categories.includes(opt.id) ? 'selected' : ''}`}
                                 onClick={() => s.toggleCategory(opt.id)}>
                                <div className="option-icon">{opt.icon}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700 }}>{opt.id}</div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{opt.desc}</div>
                                </div>
                                {s.categories.includes(opt.id) && <span style={{ color: 'var(--wz-accent)', fontWeight: 800 }}>✔️</span>}
                            </div>
                        ))}
                    </div>
                </div>
            );
            case 3: return (
                <div className="step-content">
                    <h2>Care este nivelul tău tehnic?</h2>
                    <p>Alegem dispozitive potrivite experienței tale și protocoalele dorite.</p>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 25 }}>
                        {["Wi-Fi", "Zigbee", "Z-Wave", "Matter"].map(p => (
                            <button key={p} onClick={() => s.toggleProtocol(p)}
                                    className={`eco-pill ${s.protocols.includes(p) ? 'active' : ''}`}>{p}</button>
                        ))}
                    </div>
                    {[
                        { id: "Plug & Play", desc: "Dispozitive care funcționează imediat din cutie.", icon: "🔌" },
                        { id: "Intermediar", desc: "Configurare simplă din aplicație.", icon: "🔧" },
                        { id: "DIY / Custom", desc: "Configurări avansate, Home Assistant.", icon: "💻" }
                    ].map(opt => (
                        <div key={opt.id} className={`option-card ${s.techLevel === opt.id ? 'selected' : ''}`}
                             onClick={() => s.setTechLevel(opt.id)}>
                            <div className="option-icon">{opt.icon}</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700 }}>{opt.id}</div>
                                <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{opt.desc}</div>
                            </div>
                            {s.techLevel === opt.id && <span style={{ color: 'var(--wz-accent)', fontWeight: 800 }}>✔️</span>}
                        </div>
                    ))}
                </div>
            );
            case 4: return (
                <div className="step-content">
                    <h2>Ce camere vrei să dotezi?</h2>
                    <p>Sugestiile vor fi adaptate pentru spațiile selectate.</p>
                    <button className={`option-card ${s.rooms.length === 6 ? 'selected' : ''}`}
                            style={{ width: '100%', justifyContent: 'center', fontWeight: 700 }}
                            onClick={() => ["Living", "Dormitor", "Bucătărie", "Baie", "Birou", "Exterior"].forEach(r => !s.rooms.includes(r) && s.toggleRoom(r))}>
                        🏠 Întreaga casă
                    </button>
                    <div className="rooms-grid">
                        {["Living", "Dormitor", "Bucătărie", "Baie", "Birou", "Exterior"].map(room => (
                            <div key={room} className={`option-card ${s.rooms.includes(room) ? 'selected' : ''}`}
                                 onClick={() => s.toggleRoom(room)} style={{ marginBottom: 0 }}>
                                <span>{room}</span>
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: 25, position: 'relative' }}>
                        <input type="text" placeholder="Adaugă branduri preferate (Enter)..." className="brand-input-field"
                               value={s.brandInput} onChange={(e) => s.setBrandInput(e.target.value)}
                               onKeyDown={(e) => e.key === 'Enter' && s.addBrand(s.brandInput)} />

                        {suggestions.length > 0 && (
                            <div className="brand-suggestions" style={{ position: 'absolute', width: '100%', zIndex: 10 }}>
                                {suggestions.map(sg => (
                                    <div key={sg} className="suggestion-item" onClick={() => s.addBrand(sg)}>{sg}</div>
                                ))}
                            </div>
                        )}

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
                            {s.brands.map(b => (
                                <span key={b} className="brand-pill" style={{ fontSize: '0.7rem' }}>
                                    {b} <button onClick={() => s.removeBrand(b)} style={{ border:'none', background:'none', color:'red', cursor:'pointer' }}>×</button>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            );
            default: return null;
        }
    };

    return (
        <div className={`wizard-container ${s.darkMode ? 'dark-mode' : ''}`}>
            {/* Header Wizard cu butoane de progres */}
            <div className="progress-tracker">
                <div style={{ position: 'absolute', top: '17px', left: '50px', right: '50px', height: '2px', background: 'var(--wz-border)', zIndex: 1 }} />
                {[1, 2, 3, 4].map(stepIndex => (
                    <div key={stepIndex} className="progress-step" onClick={() => s.setStep(stepIndex)} style={{ cursor: 'pointer' }}>
                        <div className={`step-circle ${s.step === stepIndex ? 'active' : ''} ${s.step > stepIndex ? 'completed' : ''}`}>
                            {s.step > stepIndex ? '✓' : stepIndex}
                        </div>
                        <span className={`step-label ${s.step === stepIndex ? 'active' : ''}`}>
                            {["Buget", "Priorități", "Nivel", "Camere"][stepIndex - 1]}
                        </span>
                    </div>
                ))}
            </div>

            <div className="wizard-card">
                {renderStep()}

                {/* Footer Navigație */}
                <div className="nav-footer">
                    <button className="btn-wizard btn-prev" onClick={s.prevStep} disabled={s.step === 1}>
                        〈 Anterior
                    </button>
                    <button className="btn-wizard btn-next"
                            onClick={s.step === 4 ? onFinish : s.nextStep}>
                        {s.step === 4 ? 'Obține sugestii 〉' : 'Următor 〉'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SetupWizard;