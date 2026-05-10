import React, { useState } from 'react';
import './SideBar.css';

export default function Sidebar({ filters, setFilters }) {

    const [isPriceOpen, setIsPriceOpen] = useState(false);
    const [isProtocolOpen, setIsProtocolOpen] = useState(false);
    const [isCategoriesOpen, setisCategoriesOpen] = useState(false);
    const [showAll, setShowAll] = useState(false);
    const handleCheckboxChange = (type, value) => {
        const currentList = filters[type];
        const newList = currentList.includes(value)
            ? currentList.filter(item => item !== value)
            : [...currentList, value];
        setFilters({ ...filters, [type]: newList });
    };
    const allCategories = [
        "Smart Cameras", "Smart Power Strips", "Gaming Consoles", "Smart Appliances",
        "Smart Hubs", "Smart Monitors", "Smart Outlets", "Smart Sensors",
        "Smart Audio", "Smart TVs", "Robot Vacuums", "Smart Routers"
    ];
    const displayLimit = 5;
    const categoriesToShow = showAll ? allCategories : allCategories.slice(0, displayLimit);

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
    const categoryIds = filters.categories.map(name => CAT_MAP[name]);

    const handleReset = () => {
        setFilters({
            minPrice: 0,
            maxPrice: 1000,
            categories: [],
            protocols: [],
            brand: ""
        });
    };

    const cardStyle = {
        backgroundColor: 'var(--section-bg)',
        transition: 'background-color 0.3s ease, color 0.3s ease',
    };

    const wrapperStyle = {
        backgroundColor: 'var(--sidebar-bg)',
        minHeight: '80vh',
        transition: 'background-color 0.3s ease',
    };

    return (
        <div className="catalog-sidebar p-3 rounded-4" style={wrapperStyle}>
            <div className="rounded-3 p-3 mb-3 d-flex justify-content-center align-items-center shadow-sm" style={{ ...cardStyle, cursor: 'pointer' }}>
                <span className="fw-bold d-flex align-items-center gap-2" style={{ color: 'var(--text-main)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    </svg>
                    New Setup
                </span>
            </div>

            <div className="rounded-3 p-3 mb-3" style={cardStyle}>
                <h6 className="fw-bold text-center mb-3" style={{ color: 'var(--text-main)' }}>Summary</h6>
                <div className="d-flex justify-content-around small">
                    <div className="text-center">
                        <div className="mb-1" style={{ color: 'var(--text-main)', opacity: 0.6 }}>Devices</div>
                        <div className="fw-bold fs-5" style={{ color: 'var(--text-main)' }}>4</div>
                    </div>
                    <div className="text-center">
                        <div className="mb-1" style={{ color: 'var(--text-main)', opacity: 0.6 }}>Total</div>
                        <div className="fw-bold fs-5" style={{ color: 'var(--text-main)' }}>€40.73</div>
                    </div>
                </div>
            </div>

            <div className="rounded-3 p-3 mb-3 text-dark" style={cardStyle}>
                <div
                    className="d-flex justify-content-between align-items-center"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setIsPriceOpen(!isPriceOpen)}
                >
                    <h6 className="fw-bold mb-0" style={{ color: 'var(--text-main)' }}>Price</h6>
                    <span className="fw-bold fs-5" style={{ color: 'var(--text-main)' }}>{isPriceOpen ? '-' : '+'}</span>
                </div>

                {isPriceOpen && (
                    <div className="mt-3 px-1">
                        <div className="d-flex justify-content-between mb-2" style={{ color: 'var(--text-main)' }} >
                            <span className="price-label-text">€{filters.minPrice}</span>
                            <span className="price-label-text">€{filters.maxPrice}</span>
                        </div>

                        <div className="price-slider-wrapper">
                            <div className="slider-track-base"></div>

                            <div
                                className="slider-range-highlight"
                                style={{
                                    left: `${(filters.minPrice / 1000) * 100}%`,
                                    width: `${((filters.maxPrice - filters.minPrice) / 1000) * 100}%`
                                }}
                            ></div>

                            <input
                                type="range"
                                min="0"
                                max="1000"
                                className="thumb thumb-left"
                                value={filters.minPrice}
                                onChange={(e) => {
                                    const value = Math.min(Number(e.target.value), filters.maxPrice - 50);
                                    setFilters({...filters, minPrice: value});
                                }}
                            />
                            <input
                                type="range"
                                min="0"
                                max="1000"
                                className="thumb thumb-right"
                                value={filters.maxPrice}
                                onChange={(e) => {
                                    const value = Math.max(Number(e.target.value), filters.minPrice + 50);
                                    setFilters({...filters, maxPrice: value});
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="rounded-3 p-3 mb-3" style={cardStyle}>
                <div
                    className="d-flex justify-content-between align-items-center"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setisCategoriesOpen(!isCategoriesOpen)}
                >
                    <h6 className="fw-bold mb-0" style={{ color: 'var(--text-main)' }}>Category</h6>
                    <span className="fw-bold fs-5" style={{ color: 'var(--text-main)' }}>{isCategoriesOpen ? '-' : '+'}</span>
                </div>

                {isCategoriesOpen && (
                    <div className="mt-3">
                        {categoriesToShow.map(cat => (
                            <div className="form-check small mb-2" key={cat}>
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id={`cat-${cat}`}
                                    checked={filters.categories.includes(cat)}
                                    onChange={() => handleCheckboxChange('categories', cat)}
                                    style={{ cursor: 'pointer' }}
                                />
                                <label className="form-check-label" htmlFor={`cat-${cat}`} style={{ cursor: 'pointer', color: 'var(--text-main)' }}>
                                    {cat}
                                </label>
                            </div>
                        ))}

                        {allCategories.length > displayLimit && (
                            <div
                                className="small fw-bold mt-2"
                                style={{ cursor: 'pointer', color: 'var(--text-main)', textDecoration: 'underline' }}
                                onClick={() => setShowAll(!showAll)}
                            >
                                {showAll ? 'View less' : `+ ${allCategories.length - displayLimit} more categories`}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="rounded-3 p-3 mb-3" style={cardStyle}>
                <div
                    className="d-flex justify-content-between align-items-center"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setIsProtocolOpen(!isProtocolOpen)}
                >
                    <h6 className="fw-bold mb-0" style={{ color: 'var(--text-main)' }}>Protocol</h6>
                    <span className="fw-bold fs-5" style={{ color: 'var(--text-main)' }}>{isProtocolOpen ? '-' : '+'}</span>
                </div>

                {isProtocolOpen && (
                    <div className="mt-3">
                        {["WiFi", "Zigbee", "Z-Wave", "Bluetooth", "Matter"].map(p => (
                            <div key={p} className="form-check small mb-2">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id={`prot-${p}`}
                                    checked={filters.protocols.includes(p)}
                                    onChange={() => handleCheckboxChange('protocols', p)}
                                />
                                <label className="form-check-label" htmlFor={`prot-${p}`} style={{ color: 'var(--text-main)' }}>{p}</label>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="rounded-3 p-3 d-flex justify-content-center align-items-center shadow-sm"
                 style={{ ...cardStyle, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }}
                 onClick={handleReset}>
                <span className="fw-bold d-flex align-items-center gap-2" style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                        <path d="M3 3v5h5"></path>
                    </svg>
                    Reset Filters
                </span>
            </div>

        </div>
    );
}