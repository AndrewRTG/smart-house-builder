import React, { useState, useEffect } from "react";
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
    "Smart Cameras": 1, "Smart Power Strips": 2, "Gaming Consoles": 3,
    "Smart Appliances": 4, "Smart Hubs": 5, "Smart Monitors": 6,
    "Smart Outlets": 7, "Smart Sensors": 8, "Smart Audio": 9,
    "Smart TVs": 10, "Robot Vacuums": 11, "Smart Routers": 12
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
                <svg viewBox="0 0 10 8" fill="none" style={{ width: 8, height: 8 }}>
                    <path d="M1 4L3.8 7L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )}
        </span>
        {label}
    </label>
);

const Sidebar = () => {
    // ── Mobile drawer state ─────────────────────────────────────────────────
    const [isOpen, setIsOpen] = useState(false);

    // Lock body scroll when drawer is open on mobile
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [isOpen]);

    // Close drawer on Escape key
    useEffect(() => {
        const handleKey = (e) => { if (e.key === "Escape") setIsOpen(false); };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, []);

    // ── Zustand filter store ────────────────────────────────────────────────
    const {
        ecosystem, setEcosystem, priceRange, setPriceRange,
        categories, toggleCategory, protocols, toggleProtocol,
        brands, brandInput, setBrandInput, addBrand, removeBrand,
        resetFilters, hasNoFilters,
    } = useFilterStore();

    const noFilters = hasNoFilters();
    const suggestions = RECOMMENDED_BRANDS.filter(b =>
        b.toLowerCase().includes(brandInput.toLowerCase()) &&
        brandInput.length > 0 &&
        !brands.includes(b)
    );

    const handleKeyDown = (e) => {
        if (e.key === "Enter") { e.preventDefault(); addBrand(brandInput); }
    };

    // Count active filters for the mobile badge
    const activeFilterCount =
        (ecosystem ? 1 : 0) +
        categories.length +
        protocols.length +
        brands.length;

    return (
        <>
            {/* ── Mobile: floating Filters toggle button ──────────────────── */}
            <button
                className="sb-mobile-toggle"
                onClick={() => setIsOpen(true)}
                aria-label="Open filters"
                aria-expanded={isOpen}
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="18" height="18">
                    <line x1="4" y1="6"  x2="20" y2="6" />
                    <line x1="4" y1="12" x2="16" y2="12" />
                    <line x1="4" y1="18" x2="12" y2="18" />
                </svg>
                Filters
                {activeFilterCount > 0 && (
                    <span className="sb-filter-badge">{activeFilterCount}</span>
                )}
            </button>

            {/* ── Mobile: dark backdrop ───────────────────────────────────── */}
            {isOpen && (
                <div
                    className="sb-backdrop"
                    onClick={() => setIsOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* ── Sidebar (static on desktop, drawer on mobile) ───────────── */}
            <aside className={`wizard-sidebar ${isOpen ? "is-open" : ""}`} aria-label="Product filters">

                <div className="sb-header">
                    <h2 className="sb-title">Filters</h2>

                    {/* Close button — only visible on mobile via CSS */}
                    <button
                        className="sb-close-btn"
                        onClick={() => setIsOpen(false)}
                        aria-label="Close filters"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
                            <line x1="18" y1="6"  x2="6"  y2="18" />
                            <line x1="6"  y1="6"  x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className="sb-body-scroll">
                    {/* Ecosystem */}
                    <span className="sb-label">Ecosystem</span>
                    <div className="sb-ecosystem-group">
                        {ECOSYSTEMS.map(eco => (
                            <button
                                key={eco}
                                className={`eco-pill ${ecosystem === eco ? "active" : ""}`}
                                onClick={() => setEcosystem(eco)}
                            >
                                {eco}
                            </button>
                        ))}
                    </div>

                    {/* Price Range */}
                    <span className="sb-label">Price Range</span>
                    <div className="mt-3 px-1">
                        <div className="d-flex justify-content-between mb-2" style={{ color: "var(--sh-text)" }}>
                            <span className="sb-price-current">€{priceRange[0]}</span>
                            <span className="sb-price-current">€{priceRange[1]}</span>
                        </div>
                        <div className="price-slider-wrapper">
                            <div className="slider-track-base" />
                            <div
                                className="slider-range-highlight"
                                style={{
                                    left: `${(priceRange[0] / 1000) * 100}%`,
                                    width: `${((priceRange[1] - priceRange[0]) / 1000) * 100}%`,
                                }}
                            />
                            <input
                                type="range" min="0" max="1000"
                                className="thumb thumb-left"
                                value={priceRange[0]}
                                onChange={(e) => {
                                    const value = Math.min(Number(e.target.value), priceRange[1] - 50);
                                    setPriceRange([value, priceRange[1]]);
                                }}
                            />
                            <input
                                type="range" min="0" max="1000"
                                className="thumb thumb-right"
                                value={priceRange[1]}
                                onChange={(e) => {
                                    const value = Math.max(Number(e.target.value), priceRange[0] + 50);
                                    setPriceRange([priceRange[0], value]);
                                }}
                            />
                        </div>
                    </div>

                    {/* Categories */}
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

                    {/* Protocol */}
                    <span className="sb-label">Protocol</span>
                    <div className="sb-proto-list">
                        {PROTOCOLS.map(p => (
                            <CheckboxItem key={p} label={p} checked={protocols.includes(p)} onToggle={() => toggleProtocol(p)} />
                        ))}
                    </div>

                    {/* Brands */}
                    <span className="sb-label">Brands</span>
                    <div style={{ position: "relative" }}>
                        <input
                            type="text"
                            placeholder="Search brands..."
                            value={brandInput}
                            onKeyDown={handleKeyDown}
                            onChange={(e) => setBrandInput(e.target.value)}
                            className="brand-input-field"
                        />
                        {suggestions.length > 0 && (
                            <div className="brand-suggestions">
                                {suggestions.map(s => (
                                    <div key={s} className="suggestion-item" onClick={() => addBrand(s)}>{s}</div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Status zone: brand pills or warning */}
                    <div className="sb-status-zone">
                        {brands.length > 0 ? (
                            <div className="brand-tags-horizontal">
                                {brands.map(b => (
                                    <div key={b} className="brand-pill">
                                        <span>{b}</span>
                                        <button onClick={() => removeBrand(b)} aria-label={`Remove ${b}`}>×</button>
                                    </div>
                                ))}
                            </div>
                        ) : noFilters && (
                            <div className="warning-box">⚠ No Filters Selected ⚠</div>
                        )}
                    </div>
                </div>

                <button className="reset-btn" onClick={resetFilters}>
                    <svg viewBox="0 0 16 16" fill="white" width="14">
                        <path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11.466 1.21A6 6 0 0 1 8 2c1.99 0 3.786.97 4.865 2.47l.853-.606A7 7 0 1 0 15 8.001h-1a6 6 0 0 1-9.585 4.814L3 11.5H.534L.068 8.21z" />
                    </svg>
                    Reset Filters
                </button>
            </aside>
        </>
    );
};

export default Sidebar;