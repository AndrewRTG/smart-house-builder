import React, { useState } from 'react';

export default function Sidebar({ filters, setFilters }) {

    const [isPriceOpen, setIsPriceOpen] = useState(false);
    const [isProtocolOpen, setIsProtocolOpen] = useState(false);
    const [showAll, setShowAll] = useState(false);

    const handleCheckboxChange = (type, value) => {
        const currentList = filters[type];
        const newList = currentList.includes(value)
            ? currentList.filter(item => item !== value)
            : [...currentList, value];
        setFilters({ ...filters, [type]: newList });
    };

    const allCategories = ['Lighting', 'Sensors', 'Smart Plugs & Switches', 'Hubs & Controllers', 'Security'];
    const displayLimit = 3;
    const categoriesToShow = showAll ? allCategories : allCategories.slice(0, displayLimit);

    const cardStyle = {
        backgroundColor: 'var(--card-bg)',
        transition: 'background-color 0.3s ease, color 0.3s ease',
    };

    const wrapperStyle = {
        backgroundColor: 'var(--navbar-bg)',
        minHeight: '80vh',
        transition: 'background-color 0.3s ease',
    };

    return (
        <div className="p-3 rounded-4" style={wrapperStyle}>
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
                        <div className="fw-bold fs-5" style={{ color: 'var(--text-main)' }}>40.73RON</div>
                    </div>
                </div>
            </div>

            <div className="rounded-3 p-3 mb-3" style={cardStyle}>
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
                        <div className="d-flex justify-content-between mb-2">
                            <span style={{ color: 'var(--text-main)' }}>{filters.minPrice} RON</span>
                            <span style={{ color: 'var(--text-main)' }}>{filters.maxPrice} RON</span>
                        </div>

                        <div className="price-slider-wrapper">
                            <div className="slider-track"></div>
                            <input
                                type="range" min="0" max="1000"
                                value={filters.minPrice}
                                onChange={(e) => {
                                    const value = Math.min(Number(e.target.value), filters.maxPrice - 50);
                                    setFilters({ ...filters, minPrice: value });
                                }}
                            />
                            <input
                                type="range" min="0" max="1000"
                                value={filters.maxPrice}
                                onChange={(e) => {
                                    const value = Math.max(Number(e.target.value), filters.minPrice + 50);
                                    setFilters({ ...filters, maxPrice: value });
                                }}
                            />
                        </div>

                        <div className="input-group input-group-sm mb-3 shadow-sm">
                            <span className="input-group-text border-end-0" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--input-text)', borderColor: 'var(--divider-color)' }}></span>
                            <input
                                type="text"
                                className="form-control border-start-0"
                                placeholder="Product category"
                                style={{ backgroundColor: 'var(--input-bg)', color: 'var(--input-text)', borderColor: 'var(--divider-color)' }}
                            />
                        </div>

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
                        {['Zigbee', 'Z-Wave', 'WiFi', 'Matter'].map(p => (
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
        </div>
    );
}