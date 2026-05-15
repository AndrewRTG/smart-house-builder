import React, { useState, useEffect } from 'react';
import Sidebar from '../components/catalog/SideBar';
import ProductCard from '../components/catalog/ProductCard.jsx'

export default function CatalogPage({ darkMode }) {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filters, setFilters] = useState({
        minPrice: 0,
        maxPrice: 1000,
        protocols: [],
        categories: [],
        brand: ""
    });
    const [viewMode, setViewMode] = useState('grid');

    useEffect(() => {
        const fetchDevices = () => {
            setLoading(true);

            let url = new URL('http://localhost:20025/api/devices');

            url.searchParams.append('minPrice', filters.minPrice);
            url.searchParams.append('maxPrice', filters.maxPrice);
            if (searchTerm) url.searchParams.append('brand', searchTerm);
            if (filters.categories.length > 0) {
                const categoryMapping = {
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

                filters.categories.forEach(catName => {
                    const id = categoryMapping[catName];
                    if (id) url.searchParams.append('categoryIds', id);
                });
            }

            if (filters.protocols.length > 0) {
                filters.protocols.forEach(prot => {
                    url.searchParams.append('protocols', prot);
                });
            }

            fetch(url)
                .then(response => response.json())
                .then(data => {
                    setDevices(data);
                    setLoading(false);
                })
                .catch(error => {
                    console.error("Eroare la preluarea dispozitivelor:", error);
                    setLoading(false);
                });
        };

        fetchDevices();
    }, [filters, searchTerm]);

    return (
        <div className="min-vh-100" style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', transition: 'background-color 0.3s ease, color 0.3s ease' }}>
            <div className="container-fluid mt-4 px-4 d-flex flex-column d-md-block clearfix">
                <div className="col-12 col-md-3 float-md-start pe-md-4 mb-4 order-2">
                    <Sidebar filters={filters} setFilters={setFilters} />
                </div>

                <div className="col-12 col-md-9 float-md-end mb-4 order-1">
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">

                        <div className="flex-grow-1 w-100" style={{ maxWidth: '900px' }}>
                            <div className="input-group rounded-3 overflow-hidden bg-white" style={{ border: '1px solid #dee2e6' }}>
                              <span className="input-group-text bg-white border-0 ps-3 text-muted">
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                              </span>
                                <input
                                    type="text"
                                    className="form-control border-0 shadow-none py-2"
                                    placeholder="Search by brand (e.g. Philips)"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="d-flex align-items-center gap-2 align-self-end align-self-md-auto">
                            <span className="fw-bold small text-nowrap" style={{ color: 'var(--text-main)' }}>Sort by:</span>

                            <select className="form-select border-0 shadow-sm rounded-2 fw-bold" style={{ color: 'var(--text-main)', backgroundColor: 'var(--section-bg)', width: '160px', cursor: 'pointer'}}>
                                <option>Lowest price</option>
                                <option>Highest price</option>
                            </select>

                            <div className="btn-group shadow-sm rounded-2 overflow-hidden ms-2" style={{ backgroundColor: 'var(--section-bg)', height: '38px'}}>
                                <button
                                    className={`btn btn-sm border-0 px-2 d-flex align-items-center justify-content-center p-0 ${viewMode === 'list' ? 'text-black' : 'text-muted'}`}
                                    style={{ width: '40px', height: '44px', marginTop: '-2px', backgroundColor: viewMode === 'list' ? '#5092CE' : 'transparent', borderRadius: '0', verticalAlign: 'top' }}
                                    onClick={() => setViewMode('list')}
                                >
                                    <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="var(--text-main)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                                </button>

                                <button
                                    className={`btn btn-sm border-0 px-2 d-flex align-items-center justify-content-center p-0 ${viewMode === 'grid' ? 'text-black' : 'text-muted'}`}
                                    style={{ width: '40px', height: '44px',marginTop: '-2px', backgroundColor: viewMode === 'grid' ? '#5092CE' : 'transparent', borderRadius: '0', verticalAlign: 'top' }}
                                    onClick={() => setViewMode('grid')}
                                >
                                    <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="var(--text-main)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-md-9 float-md-end order-3">
                    <div className={`row ${viewMode === 'grid' ? 'row-cols-1 row-cols-md-2 row-cols-lg-3' : 'row-cols-1'} g-4`}>
                        {loading ? (
                            <div className="col-12 text-center">Se caută produsele...</div>
                        ) : devices.length === 0 ? (
                            <div className="col-12 text-center">Nu s-a găsit niciun produs.</div>
                        ) : (
                            devices.map((device) => (
                                <div className="col" key={device.id}>
                                    <ProductCard device={device} viewMode={viewMode} />
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}