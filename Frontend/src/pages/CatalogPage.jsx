import React, { useState, useEffect } from 'react';
import Sidebar from '../components/catalog/SideBar';
import ProductCard from '../components/catalog/ProductCard.jsx'

export default function CatalogPage({ darkMode }) {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("Price");
    const [sortOrder, setSortOrder] = useState('asc');
    const [selectedSortLabel, setSelectedSortLabel] = useState("Price");
    const [wishlistDeviceIds, setWishlistDeviceIds] = useState([]);
    const [filters, setFilters] = useState({
        minPrice: 0,
        maxPrice: 10000,
        protocols: [],
        categories: [],
        brand: ""
    });
    const [viewMode, setViewMode] = useState('grid');

    useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        fetch(`http://localhost:20025/api/v1/wishlists/devices?size=100`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.ok ? res.json() : null)
        .then(pageData => {
            if (pageData && pageData.content) {
                const ids = pageData.content.map(item => item.deviceId);
                setWishlistDeviceIds(ids);
            }
        })
        .catch(err => console.error("Eroare la preluarea wishlist-ului:", err));
    } else {
        setWishlistDeviceIds([]);
    }
}, [searchTerm, filters]);

    useEffect(() => {
        let isMounted = true;

        const fetchDevices = () => {
            let url = new URL(`${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:20025'}/api/devices`);

            url.searchParams.append('minPrice', filters.minPrice);
            url.searchParams.append('maxPrice', filters.maxPrice);
            if (searchTerm) url.searchParams.append('brand', searchTerm);

            if (filters.categories.length > 0) {
                const categoryMapping = {
                    "Smart Cameras": 1, "Smart Power Strips": 2, "Gaming Consoles": 3,
                    "Smart Appliances": 4, "Smart Hubs": 5, "Smart Monitors": 6,
                    "Smart Outlets": 7, "Smart Sensors": 8, "Smart Audio": 9,
                    "Smart TVs": 10, "Robot Vacuums": 11, "Smart Routers": 12
                };
                filters.categories.forEach(catName => {
                    const id = categoryMapping[catName];
                    if (id) url.searchParams.append('categoryIds', id);
                });
            }

            if (filters.protocols.length > 0) {
                filters.protocols.forEach(prot => {
                    const protocolMapping = {
                        "WiFi": ["WiFi", "WIFI", "wifi", "Wi-Fi"],
                        "Zigbee": ["Zigbee", "ZIGBEE"],
                        "Z-Wave": ["Z-Wave", "Z-WAVE", "ZWave", "ZWAVE"],
                        "Bluetooth": ["Bluetooth", "BLUETOOTH", "bluetooth"],
                        "Matter": ["Matter", "MATTER"]
                    };

                    const variants = protocolMapping[prot] || [prot];

                    variants.forEach(variant => {
                        url.searchParams.append('protocols', variant);
                    });
                });
            }

            fetch(url)
                .then(response => response.json())
                .then(data => {
                    if (isMounted) {
                        setDevices(data);
                        setLoading(false);
                    }
                })
                .catch(error => {
                    console.error("Eroare la preluarea dispozitivelor:", error);
                    if (isMounted) setLoading(false);
                });
        };

        setLoading(true);
        const debounceTimer = setTimeout(() => {
            fetchDevices();
        }, 200);

        return () => {
            isMounted = false;
            clearTimeout(debounceTimer);
        };
    }, [filters, searchTerm]);

    const getSortedDevices = () => {
        return [...devices].sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case 'Price':
                    comparison  =  a.bestPrice - b.bestPrice;
                    break;
                case 'Name':
                    comparison = (a.name || "").localeCompare(b.name || "");
                    break;
                case 'Brand':
                    comparison = (a.brand || "").localeCompare(b.brand || "");
                    break;
                case 'Date added':
                    comparison = new Date(a.createdAt || a.id) - new Date(b.createdAt || b.id);
                    break;
                default:
                    comparison = 0;
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });
    };

    const sortedDevices = getSortedDevices();

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
                            <div className="dropdown">
                                <button
                                    className="btn bg-white border shadow-sm d-flex align-items-center justify-content-between rounded-3 fw-bold"
                                    type="button"
                                    data-bs-toggle="dropdown"
                                    style={{ width: '180px', height: '42px', color: 'black', fontSize: '0.9rem' }}
                                >
                                    <div className="d-flex align-items-center">
                                        <span className="text-muted fw-normal me-2">Sort:</span>
                                        <span>{selectedSortLabel}</span>
                                    </div>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                                </button>

                                <ul className="dropdown-menu dropdown-menu-end shadow border-0 rounded-3 mt-2"
                                    style={{
                                        minWidth: '100%',
                                        width: '100%',
                                        maxWidth: '100%'
                                    }}>
                                    <li>
                                        <button className="dropdown-item py-2 fw-semibold" type="button" style={{ fontSize: '0.85rem' }} onClick={() => {setSelectedSortLabel("Price"); setSortBy("Price");} }>
                                            <i className="bi bi-sort-numeric-down me-2"></i>Price
                                        </button>
                                    </li>
                                    <li>
                                        <button className="dropdown-item py-2 fw-semibold" type="button" style={{ fontSize: '0.8rem' }} onClick={() => {setSelectedSortLabel("Name"); setSortBy("Name"); }}>
                                            <span className="text-muted me-2">A-Z</span> Name
                                        </button>
                                    </li>
                                    <li>
                                        <button className="dropdown-item py-2 fw-semibold" type="button" style={{ fontSize: '0.8rem' }} onClick={() => {setSelectedSortLabel("Brand"); setSortBy("Brand");}}>
                                            <span className="text-muted me-2">★</span> Brand
                                        </button>
                                    </li>
                                    <li>
                                        <button className="dropdown-item py-2 fw-semibold" type="button" style={{ fontSize: '0.8rem' }} onClick={() => {setSelectedSortLabel("Date added"); setSortBy("Date added");}}>
                                            <span className="text-muted me-2">🕒</span> Date added
                                        </button>
                                    </li>
                                </ul>
                            </div>
                            <button
                                className="btn bg-white border shadow-sm d-flex align-items-center justify-content-center rounded-3"
                                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                title={sortOrder === 'asc' ? "Sort Ascending" : "Sort Descending"}
                                style={{ height: '42px', width: '42px' }}
                            >
                                {sortOrder === 'asc' ? (
                                    /* Iconiță pentru Ascending (A-Z / 1-9) */
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5092CE" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M11 5h10M11 9h7M11 13h4M3 17l3 3 3-3M6 18V4"/>
                                    </svg>
                                ) : (
                                    /* Iconiță pentru Descending (Z-A / 9-1) */
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5092CE" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M11 5h10M11 9h7M11 13h4M3 7l3-3 3 3M6 6v14"/>
                                    </svg>
                                )}
                            </button>


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
                    <div
                        className={`row ${viewMode === 'grid' ? 'row-cols-1 row-cols-md-2 row-cols-lg-3' : 'row-cols-1'} g-4`}
                        style={{
                            opacity: loading ? 0.5 : 1,
                            transition: 'opacity 0.15s ease-in-out'
                        }}
                    >
                        {devices.length === 0 && loading ? (
                            <div className="col-12 text-center py-5 fw-bold" style={{ color: 'var(--text-main)' }}>
                                Searching products...
                            </div>
                        ) : devices.length === 0 ? (
                            <div className="col-12 text-center py-5 fw-bold" style={{ color: 'var(--text-main)' }}>
                                No products found.
                            </div>
                        ) : (
                            sortedDevices.map((device) => {
                                const isSaved = wishlistDeviceIds.includes(device.id);

                                return (
                                    <div className="col" key={device.id}>
                                        <ProductCard 
                                            device={device} 
                                            viewMode={viewMode} 
                                            initialIsWishlisted={isSaved} 
                                        />
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}