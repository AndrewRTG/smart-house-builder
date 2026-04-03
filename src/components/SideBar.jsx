import React, { useState } from 'react';

export default function Sidebar() {

    const [isPriceOpen, setIsPriceOpen] = useState(false);
    const[isProtocolOpen, setIsProtocolOpen] = useState(false);
    const [priceValue, setPriceValue] = useState(500);
    const [isDragging, setIsDragging] = useState(false);

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
                      <div className="fw-bold fs-5" style={{ color: '#1a365d' }}>40.73€</div>
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
                  <div className="mt-3">
                      <div className="d-flex justify-content-between small fw-bold mb-1">
                          <span>0</span>
                          <span>1000</span>
                      </div>

                      <div className="position-relative mt-4 mb-4">

                          <div
                              className="position-absolute fw-bold text-white rounded px-2 py-1 small translate-middle-x shadow-sm"
                              style={{
                                  backgroundColor: '#1a365d',
                                  left: `${(priceValue / 1000) * 100}%`,
                                  top: '-32px',
                                  pointerEvents: 'none',
                                  opacity: isDragging ? 1 : 0, // MAGIC: 1 înseamnă vizibil, 0 invizibil
                                  transition: 'opacity 0.2s ease-in-out' // Animație fină de dispariție/apariție
                              }}
                          >
                              {priceValue}€
                          </div>

                          <input
                              type="range"
                              className="form-range"
                              min="0"
                              max="1000"
                              value={priceValue}
                              onChange={(e) => setPriceValue(e.target.value)}
                              onMouseDown={() => setIsDragging(true)}  // Când apeși click
                              onMouseUp={() => setIsDragging(false)}   // Când eliberezi click-ul
                              onTouchStart={() => setIsDragging(true)} // Pentru telefoane mobile (touch)
                              onTouchEnd={() => setIsDragging(false)}  // Pentru telefoane mobile (touch)
                          />

                          <div className="d-flex justify-content-between small text-muted mt-1">
                              <span>0</span>
                              <span>1000</span>
                          </div>
                      </div>

                      <div className="input-group input-group-sm mb-3 shadow-sm">
                          <span className="input-group-text bg-white border-end-0"></span>
                          <input type="text" className="form-control border-start-0" placeholder="Product category" />
                      </div>

                      <div className="form-check small mb-2">
                          <input className="form-check-input border-secondary" type="checkbox" id="cat-bec" />
                          <label className="form-check-label" htmlFor="cat-bec">Bec</label>
                      </div>
                      <div className="form-check small mb-2">
                          <input className="form-check-input border-secondary" type="checkbox" id="cat-masina"/>
                          <label className="form-check-label" htmlFor="cat-masina">Mașină de spălat</label>
                      </div>
                      <div className="form-check small">
                          <input className="form-check-input border-secondary" type="checkbox" id="cat-mixer" />
                          <label className="form-check-label" htmlFor="cat-mixer">Mixer</label>
                      </div>
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
                              <input className="form-check-input border-secondary" type="checkbox" id={`prot-${p}`} />
                              <label className="form-check-label" htmlFor={`prot-${p}`}>{p}</label>
                          </div>
                      ))}
                  </div>
              )}
          </div>

      </div>
    );
}