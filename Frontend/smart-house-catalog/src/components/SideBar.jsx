import React, { useState } from 'react';

export default function Sidebar({ filters, setFilters }) {

    const [isPriceOpen, setIsPriceOpen] = useState(false);
    const [isProtocolOpen, setIsProtocolOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const handleCheckboxChange = (type, value) => {
        const currentList = filters[type];
        const newList = currentList.includes(value)
            ? currentList.filter(item => item !== value)
            : [...currentList, value];

        setFilters({ ...filters, [type]: newList });
    };
    const [showAll, setShowAll] = useState(false);
    const allCategories = ['Lighting', 'Sensors', 'Smart Plugs & Switches', 'Hubs & Controllers', 'Security'];
    const displayLimit = 3;
    const categoriesToShow = showAll ? allCategories : allCategories.slice(0, displayLimit);

    return (
      <div className="p-3 rounded-4" style={{backgroundColor: '#5b9bd5', minHeight:'80vh'}}>
          <div className="rounded-3 p-3 mb-3 d-flex justify-content-center align-items-center shadow-sm" style={{ backgroundColor: '#cde0f5', cursor: 'pointer' }}>
                <span className="fw-bold d-flex align-items-center gap-2" style={{ color: '#1a365d' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                    New Setup
                </span>
          </div>
          <div className="rounded-3 p-3 mb-3 text-dark" style={{ backgroundColor: '#cde0f5' }}>
              <h6 className="fw-bold text-center mb-3">Summary</h6>
              <div className="d-flex justify-content-around small">
                  <div className="text-center">
                      <div className="text-muted mb-1">Devices</div>
                      <div className="fw-bold fs-5" style={{ color: '#1a365d' }}>4</div>
                  </div>
                  <div className="text-center">
                      <div className="text-muted mb-1">Total</div>
                      <div className="fw-bold fs-5" style={{ color: '#1a365d' }}>40.73RON</div>
                  </div>
              </div>
          </div>
          <div className="rounded-3 p-3 mb-3 text-dark" style={{ backgroundColor: '#cde0f5' }}>
              <div
                  className="d-flex justify-content-between align-items-center"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setIsPriceOpen(!isPriceOpen)}
              >
                  <h6 className="fw-bold mb-0">Price</h6>
                  <span className="fw-bold fs-5">{isPriceOpen ? '-' : '+'}</span>
              </div>

              {isPriceOpen && (
                  <div className="mt-3 px-1">
                      <div className="d-flex justify-content-between mb-2">
                          <span className="price-label-text">{filters.minPrice} RON</span>
                          <span className="price-label-text">{filters.maxPrice} RON</span>
                      </div>

                      <div className="price-slider-wrapper">
                          <div className="slider-track"></div>
                          <input
                              type="range"
                              min="0"
                              max="1000"
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
                              value={filters.maxPrice}
                              onChange={(e) => {
                                  const value = Math.max(Number(e.target.value), filters.minPrice + 50);
                                  setFilters({...filters, maxPrice: value});
                              }}
                          />
                      </div>

                      <div className="input-group input-group-sm mb-3 shadow-sm">
                          <span className="input-group-text bg-white border-end-0"></span>
                          <input type="text" className="form-control border-start-0" placeholder="Product category" />
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
                              <label className="form-check-label" htmlFor={`cat-${cat}`} style={{ cursor: 'pointer' }}>
                                  {cat}
                              </label>
                          </div>
                      ))}

                      {allCategories.length > displayLimit && (
                          <div
                              className="small fw-bold mt-2"
                              style={{ cursor: 'pointer', color: '#1a365d', textDecoration: 'underline' }}
                              onClick={() => setShowAll(!showAll)}
                          >
                              {showAll ? 'View less' : `+ ${allCategories.length - displayLimit} more categories`}
                          </div>
                      )}
                  </div>
              )}
          </div>

          <div className="rounded-3 p-3 mb-3 text-dark" style={{ backgroundColor: '#cde0f5' }}>
              <div
                  className="d-flex justify-content-between align-items-center"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setIsProtocolOpen(!isProtocolOpen)}
              >
                  <h6 className="fw-bold mb-0">Protocol</h6>
                  <span className="fw-bold fs-5">{isProtocolOpen ? '-' : '+'}</span>
              </div>

              {isProtocolOpen && (
                  <div className="mt-3">
                      {['Zigbee', 'Z-Wave', 'Wi-Fi', 'Matter'].map(p => (
                          <div key={p} className="form-check small mb-2">
                              <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id={`prot-${p}`}
                                  checked={filters.protocols.includes(p)}
                                  onChange={() => handleCheckboxChange('protocols', p)}
                              />
                              <label className="form-check-label" htmlFor={`prot-${p}`}>{p}</label>
                          </div>
                      ))}
                  </div>
              )}
          </div>

      </div>
    );
}