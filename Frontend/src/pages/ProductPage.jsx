import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';

export default function ProductPage() {
    const { id } = useParams(); 
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [similarProducts, setSimilarProducts] = useState([]);
    const [isWishlisted, setIsWishlisted] = useState(false);
    const navigate = useNavigate();
    const sliderRef = useRef(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);

    useEffect(() => {
    setLoading(true);

    const token = localStorage.getItem('accessToken');

    fetch(`http://localhost:20025/api/devices`)
        .then(response => {
            if (!response.ok) throw new Error("Nu am putut accesa baza de date AWS.");
            return response.json();
        })
        .then(devicesList => {
            const foundDevice = devicesList.find(device => String(device.id) === String(id));

            if (foundDevice) {
                setProduct({
                    id: foundDevice.id,
                    name: foundDevice.name,
                    brand: foundDevice.brand,
                    description: foundDevice.description || foundDevice.specifications?.description || "No description available for this item.",
                    imageUrl: foundDevice.imageUrl || foundDevice.image_url || "",
                    bestPrice: foundDevice.bestPrice || foundDevice.price || "N/A",
                    bestStoreName: foundDevice.bestStoreName || "Store",
                    bestPriceUrl: foundDevice.bestPriceUrl || foundDevice.best_price_url || "",
                    categoryId: foundDevice.categoryId
                });

                const stopWords = ['de', 'cu', 'la', 'in', 'si', 'pentru', 'csc', 'em125', '08+c', '125khz', '-'];
                const currentKeywords = foundDevice.name
                    .toLowerCase()
                    .split(/[\s,/\-]+/) 
                    .filter(word => word.length > 2 && !stopWords.includes(word));

                const filtered = devicesList.filter(device => {
                    if (String(device.id) === String(id)) return false;
                    const deviceNameLower = (device.name || "").toLowerCase();
                    return currentKeywords.some(keyword => {
                        const regex = new RegExp(`\\b${keyword}\\b`, 'i');
                        return regex.test(deviceNameLower);
                    });
                });

                if (filtered.length === 0) {
                    const fallbackCategory = devicesList.filter(device => device.categoryId === foundDevice.categoryId && String(device.id) !== String(id));
                    setSimilarProducts(fallbackCategory);
                } else {
                    setSimilarProducts(filtered);
                }

                if (token) {
                    fetch(`http://localhost:20025/api/v1/wishlists/devices?size=100`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    })
                    .then(res => res.ok ? res.json() : null)
                    .then(pageData => {
                        if (pageData && pageData.content) {
                            const isAlreadySaved = pageData.content.some(item => 
                                String(item.deviceId) === String(id)
                            );
                            setIsWishlisted(isAlreadySaved); 
                        }
                    })
                    .catch(err => console.error("Eroare la citirea inițială a wishlist-ului din AWS:", err));
                } else {
                    setIsWishlisted(false);
                }

            } else {
                setProduct(null);
            }
            setLoading(false);
        })
        .catch(error => {
            console.error("Error fetching product details:", error);
            setProduct(null);
            setLoading(false);
        });
}, [id]);

    const handleSeeInStore = () => {
        if (product && product.bestPriceUrl) {
            window.open(product.bestPriceUrl, '_blank', 'noopener,noreferrer');
        } else {
            alert("Ne pare rău, acest produs nu are un link direct către magazin în baza de date.");
        }
    };

    const handleAddToWishlist = () => {
        const token = localStorage.getItem('accessToken'); 
        const numericDeviceId = parseInt(product.id, 10);

        console.log(`Se trimite toggle-wishlist pentru dispozitivul cu ID: ${product.id}`);

        fetch(`http://localhost:20025/api/v1/devices/${numericDeviceId}/wishlist`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        })
        .then(response => {
            if (response.status === 401 || response.status === 403) {
                throw new Error("Nu ești autentificat! Te rugăm să te loghezi pentru a adăuga la wishlist.");
            }
            if (!response.ok) {
                throw new Error(`Eroare server (Status: ${response.status})`);
            }
            return response.json();
        })
        .then(data => {
            setIsWishlisted(data.isWishlisted);

        })
        .catch(error => {
            console.error("Wishlist Error:", error.message);
            alert(error.message);
        });
    };

    const handleScroll = () => {
        if (sliderRef.current) {
            setShowLeftArrow(sliderRef.current.scrollLeft > 10);
        }
    };

    const scrollLeft = () => {
        if (sliderRef.current) {
            sliderRef.current.scrollBy({ left: -320, behavior: 'smooth' });
        }
    };
    const scrollRight = () => {
        if (sliderRef.current) {
            sliderRef.current.scrollBy({ left: 320, behavior: 'smooth' });
        }
    };

    if (loading) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}>
                <h3 className="fw-bold">Loading product details from AWS...</h3>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}>
                <h3 className="fw-bold">Product with ID {id} not found in database.</h3>
            </div>
        );
    }

    return (
        <div className="min-vh-100 py-4 px-3 px-md-5" style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', transition: 'all 0.3s' }}>
            <div className="container-fluid max-w-7xl mx-auto mt-4">

                <div className="row g-4 mb-5">
                    <div className="col-12 col-lg-6">
                        <div className="d-flex align-items-center justify-content-center rounded-4 shadow-sm p-4 bg-white" style={{ minHeight: '400px', height: '100%', border: '1px solid rgba(0,0,0,0.05)' }}>
                            {product.imageUrl ? (
                                <img src={product.imageUrl} alt={product.name} style={{ maxHeight: '350px', maxWidth: '100%', objectFit: 'contain' }} />
                            ) : (
                                <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                                </svg>
                            )}
                        </div>
                    </div>

                    <div className="col-12 col-md-7 col-lg-4 d-flex flex-column justify-content-start ps-lg-4">
                        <h2 className="fw-bold mb-1 lh-sm" style={{ fontSize: '1.65rem' }}>{product.name}</h2>
                        <span className="text-muted mb-3 fw-bold small">Brand: {product.brand}</span>
                        <hr className="my-3" style={{ borderColor: 'var(--text-main)', opacity: 0.2 }} />
                        <div className="mt-2">
                            <h5 className="fw-bold mb-3" style={{ fontSize: '1.1rem' }}>Description</h5>
                            <p className="lh-base" style={{ color: 'var(--text-main)', fontSize: '0.95rem', opacity: 0.85 }}>{product.description}</p>
                        </div>
                    </div>

                    <div className="col-12 col-md-5 col-lg-2">
                        <div className="p-3 rounded-4 shadow-sm border d-flex flex-column gap-3" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'rgba(255,255,255,0.1)', minWidth: '180px', color: 'var(--text-main)' }}>
                            <div className="text-center mb-1">
                                <span className="fs-3 fw-bold">€{product.bestPrice}</span>
                            </div>

                            <div className="d-flex align-items-center justify-content-between gap-2">
                                <span className="fw-bold small">Quantity:</span>
                                <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))} className="form-control text-center p-1 fw-bold shadow-none border-0 rounded-2" style={{ width: '60px', height: '32px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }} />
                            </div>

                            <button 
                                className="btn w-100 fw-bold rounded-3 border-0 py-2 shadow-sm text-white" 
                                style={{ 
                                    backgroundColor: isWishlisted ? '#DC3545' : '#5092CE',
                                    fontSize: '0.9rem',
                                    transition: 'background-color 0.3s ease'
                                }} 
                                onClick={handleAddToWishlist}
                            >
                                {isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                            </button>

                            <button
                                className="btn w-100 fw-bold rounded-3 border-0 py-2 shadow-sm text-white"
                                style={{ backgroundColor: '#5092CE', fontSize: '0.9rem' }}
                                onClick={handleSeeInStore}
                            >
                                See in store
                            </button>
                        </div>
                    </div>
                </div>

                <div className="row mt-4 position-relative">
                    <div className="col-12">
                        <h4 className="fw-bold mb-4" style={{ color: '#5092CE' }}>Similar products:</h4>
                        
                        {similarProducts.length === 0 ? (
                            <p className="text-muted small">No similar items found.</p>
                        ) : (
                            <div className="position-relative style-slider-container">
                                
                                {showLeftArrow && (
                                    <button 
                                        onClick={scrollLeft}
                                        className="btn position-absolute top-50 start-0 translate-middle-y d-flex align-items-center justify-content-center shadow"
                                        style={{ zIndex: 10, width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--card-bg)', border: '1px solid rgba(255,255,255,0.1)', left: '-15px' }}
                                    >
                                        <span style={{ fontSize: '1.25rem', color: '#5092CE', fontWeight: 'bold' }}>&lt;</span>
                                    </button>
                                )}

                                <div 
                                    ref={sliderRef}
                                    onScroll={handleScroll}
                                    className="d-flex gap-4 overflow-auto pb-3"
                                    style={{ 
                                        scrollbarWidth: 'none', 
                                        msOverflowStyle: 'none', 
                                        WebkitOverflowScrolling: 'touch'
                                    }}
                                >
                                    <style>{`
                                        div::-webkit-scrollbar { display: none; }
                                    `}</style>

                                    {similarProducts.map((device) => (
                                        <div 
                                            key={device.id}
                                            style={{ minWidth: '260px', width: '260px', flexShrink: 0 }}
                                        >
                                            <div 
                                                className="card h-100 p-3 shadow-sm border-0" 
                                                style={{ 
                                                    backgroundColor: 'var(--card-bg)', 
                                                    borderRadius: '1.2rem', 
                                                    cursor: 'pointer',
                                                    transition: 'transform 0.2s'
                                                }}
                                                onClick={() => navigate(`/product/${device.id}`)}
                                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                            >
                                                <div className="bg-white rounded-3 p-2 mb-3 d-flex justify-content-center align-items-center" style={{ height: '140px' }}>
                                                    <img 
                                                        src={device.imageUrl || device.image_url} 
                                                        alt={device.name} 
                                                        style={{ maxHeight: '120px', maxWidth: '100%', objectFit: 'contain' }} 
                                                    />
                                                </div>
                                                <div className="card-body p-0 d-flex flex-column">
                                                    <h6 className="card-title fw-bold text-truncate mb-2" style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>
                                                        {device.name}
                                                    </h6>
                                                    <div className="mt-auto d-flex justify-content-between align-items-center">
                                                        <span className="fw-bold" style={{ color: 'var(--text-main)' }}>
                                                            €{device.bestPrice || device.price}
                                                        </span>
                                                        <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                                                            {device.brand}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {similarProducts.length > 3 && (
                                    <button 
                                        onClick={scrollRight}
                                        className="btn position-absolute top-50 end-0 translate-middle-y d-flex align-items-center justify-content-center shadow"
                                        style={{ zIndex: 10, width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--card-bg)', border: '1px solid rgba(255,255,255,0.1)', right: '-15px' }}
                                    >
                                        <span style={{ fontSize: '1.25rem', color: '#5092CE', fontWeight: 'bold' }}>&gt;</span>
                                    </button>
                                )}

                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}