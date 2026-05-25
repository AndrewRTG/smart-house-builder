import React from "react";
import useFilterStore from "../../../store/useFilterStore.js";
import "./WizardSidebar.css";

const ECOSYSTEMS = ["Apple Home", "Alexa", "Google Home", "More"];
const RECOMMENDED_BRANDS = ["Samsung", "Philips", "LG", "Bosch", "Sony", "Xiaomi", "Dyson", "Ring", "Nest"];
const PROTOCOLS = ["WiFi", "Zigbee", "Z-Wave", "Bluetooth", "Matter"];

const CATEGORIES = [
    "Smart Cameras", "Smart Power Strips", "Gaming Consoles", "Smart Appliances",
    "Smart Hubs", "Smart Monitors", "Smart Outlets", "Smart Sensors",
    "Smart Audio", "Smart TVs", "Robot Vacuums", "Smart Routers"
];
const CAT_MAP = {
    "Smart Cameras": 1,
    "Smart Power Strips": 2,
    "Gaming Consoles": 3,
    "Smart Appliances": 4,
    "Smart Hubs": 5,
    "Smart Monitors": 6,
    "Smart Outlets": 7,
    "Smart Sensors": 8,
    "Smart Audio": 9,
    "Smart TVs": 10,
    "Robot Vacuums": 11,
    "Smart Routers": 12
};

const CATEGORY_PAIRS = CATEGORIES.reduce((result, value, index, array) => {
    if (index % 2 === 0) result.push(array.slice(index, index + 2));
    return result;
}, []);

const CheckboxItem = ({ label, checked, onToggle }) => (
    <label className="checkbox-container">
        <input type="checkbox" checked={checked} onChange={onToggle} hidden />
        <span className="custom-check-circle">
            {checked && (
                <svg viewBox="0 0 10 8" fill="none" style={{width:8, height:8}}>
                    <path d="M1 4L3.8 7L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            )}
        </span>
        {label}
    </label>
);

const Sidebar = () => {
    const {
        ecosystem, setEcosystem, priceRange, setPriceRange,
        categories, toggleCategory, protocols, toggleProtocol,
        brands, brandInput, setBrandInput, addBrand, removeBrand,
        resetFilters, hasNoFilters,
    } = useFilterStore();

    const categoryIds = categories.map(name => CAT_MAP[name]);

    const noFilters = hasNoFilters();
    const suggestions = RECOMMENDED_BRANDS.filter(b =>
        b.toLowerCase().includes(brandInput.toLowerCase()) && brandInput.length > 0 && !brands.includes(b)
    );

    const handleKeyDown = (e) => {
        if (e.key === "Enter") { e.preventDefault(); addBrand(brandInput); }
    };

    return (
        <aside className={"wizard-sidebar"}>
            <div className="sb-header">
                <h2 className="sb-title">Filters</h2>
            </div>

            <div className="sb-body-scroll">
                <span className="sb-label">Ecosystem</span>
                <div className="sb-ecosystem-group">
                    {ECOSYSTEMS.map(eco => (
                        <button key={eco} className={`eco-pill ${ecosystem === eco ? 'active' : ''}`} onClick={() => setEcosystem(eco)}>
                            {eco}
                        </button>
                    ))}
                </div>

                <span className="sb-label">Price Range</span>
                <div className="mt-3 px-1">
                    <div className="d-flex justify-content-between mb-2" style={{ color: 'var(--text-main)' }} >
                        <span className="sb-price-current">€{priceRange[0]}</span>
                        <span className="sb-price-current">€{priceRange[1]}</span>
                    </div>

                    <div className="price-slider-wrapper">
                        <div className="slider-track-base"></div>

                        <div
                            className="slider-range-highlight"
                            style={{
                                left: `${(priceRange[0] / 1000) * 100}%`,
                                width: `${((priceRange[1] - priceRange[0]) / 1000) * 100}%`
                            }}
                        ></div>

                        <input
                            type="range"
                            min="0"
                            max="1000"
                            className="thumb thumb-left"
                            value={priceRange[0]}
                            onChange={(e) => {
                                const value = Math.min(Number(e.target.value), priceRange[1] - 50);
                                setPriceRange([value, priceRange[1]]);
                            }}
                        />
                        <input
                            type="range"
                            min="0"
                            max="1000"
                            className="thumb thumb-right"
                            value={priceRange[1]}
                            onChange={(e) => {
                                const value = Math.max(Number(e.target.value), priceRange[0] + 50);
                                setPriceRange([priceRange[0], value]);
                            }}
                        />
                    </div>
                </div>

                <span className="sb-label">Categories</span>
                <div className="sb-cat-grid">
                    {CATEGORY_PAIRS.map(([left, right], i) => (
                        <React.Fragment key={i}>
                            <CheckboxItem
                                label={left}
                                checked={categories.includes(left)}
                                onToggle={() => toggleCategory(left)}
                            />
                            {right && (
                                <CheckboxItem
                                    label={right}
                                    checked={categories.includes(right)}
                                    onToggle={() => toggleCategory(right)}
                                />
                            )}
                        </React.Fragment>
                    ))}
                </div>

                <span className="sb-label">Protocol</span>
                <div className="sb-proto-list">
                    {PROTOCOLS.map(p => <CheckboxItem key={p} label={p} checked={protocols.includes(p)} onToggle={() => toggleProtocol(p)} />)}
                </div>

                <span className="sb-label">Brands</span>
                <div style={{ position: 'relative' }}>
                    <input type="text" placeholder="Search brands..." value={brandInput} onKeyDown={handleKeyDown}
                           onChange={(e) => setBrandInput(e.target.value)} className="brand-input-field" />
                    {suggestions.length > 0 && (
                        <div className="brand-suggestions">
                            {suggestions.map(s => <div key={s} className="suggestion-item" onClick={() => addBrand(s)}>{s}</div>)}
                        </div>
                    )}
                </div>

                {/* Zona de Status: Branduri (Scroll Orizontal) sau Mesaj Avertizare */}
                <div className="sb-status-zone">
                    {brands.length > 0 ? (
                        <div className="brand-tags-horizontal">
                            {brands.map(b => (
                                <div key={b} className="brand-pill">
                                    <span>{b}</span>
                                    <button onClick={() => removeBrand(b)}>×</button>
                                </div>
                            ))}
                        </div>
                    ) : noFilters && (
                        <div className="warning-box">⚠ No Filters Selected ⚠</div>
                    )}
                </div>
            </div>

            <button className="reset-btn" onClick={resetFilters}>
                <svg viewBox="0 0 16 16" fill="white" width="14"><path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-1.313 1.05a.5.5 0 0 0-.642.056L6.854 10.854a.5.5 0 1 1-.708-.708L8.87 7.42a1.5 1.5 0 0 1 2.122 0l1.242 1.243a.5.5 0 1 1-.708.708l-1.242-1.243zm-4.102.502a.5.5 0 0 0-.642.056L2.854 11.146a.5.5 0 0 1-.708-.708l2.723-2.723a1.5 1.5 0 0 1 2.122 0l1.242 1.243a.5.5 0 1 1-.708.708L6.28 7.42a1.5 1.5 0 0 1 2.122 0l2.723 2.723a.5.5 0 1 1-.708.708l-2.723-2.723a1.5 1.5 0 0 1-2.122 0L6.28 9.123zm-1.63 4.22a.5.5 0 0 1-.708.708L1 11.207l2.854-2.854a.5.5 0 1 1-.708.708L1.707 10.5h3.18a.5.5 0 0 1 0 1h-3.18l1.414 1.414z"/></svg>
                Reset Filters
            </button>
        </aside>
    );
};

export default Sidebar;