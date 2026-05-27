import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ProductCard({ device, viewMode = 'grid', initialIsWishlisted = false }) {
    const navigate = useNavigate();
    
    const [isWishlisted, setIsWishlisted] = useState(initialIsWishlisted);

    useEffect(() => {
        setIsWishlisted(initialIsWishlisted);
    }, [initialIsWishlisted]);

    const cardBaseStyle = {
        backgroundColor: 'var(--card-bg)',
        padding: '12px',
        boxShadow: '0px 5px 20px rgba(0, 0, 0, 0.40)',
        border: '0',
        borderRadius: '1.2rem',
        transition: 'all 0.3s ease',
        cursor: 'pointer'
    };

    const handleAddToWishlist = (e) => {
        e.stopPropagation();

        const token = localStorage.getItem('accessToken'); 
        const numericDeviceId = parseInt(device.id, 10);

        if (!token) {
            alert("Nu ești autentificat! Conectează-te pentru a folosi wishlist-ul.");
            return;
        }

        console.log(`Se trimite toggle-wishlist din catalog pentru dispozitivul: ${numericDeviceId}`);

        fetch(`http://localhost:20025/api/v1/devices/${numericDeviceId}/wishlist`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (response.status === 401 || response.status === 403) {
                throw new Error("Nu ești autentificat! Conectează-te pentru a folosi wishlist-ul.");
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
            console.error("Wishlist Catalog Error:", error.message);
            alert(error.message);
        });
    };

    const handleNavigation = () => {
        navigate(`/product/${device.id}`);
    };

    if (viewMode === 'list') {
        return (
            <div className="card w-100 mb-2" style={cardBaseStyle} onClick={handleNavigation}>
                <div className="d-flex align-items-center gap-3">
                    <div className="bg-white rounded-3 d-flex justify-content-center align-items-center" style={{ width: '120px', height: '100px', flexShrink: 0 }}>
                        <img
                            src={device.imageUrl || device.image_url}
                            alt={device.name}
                            style={{ maxHeight: '80px', maxWidth: '100%', objectFit: 'contain' }}
                        />
                    </div>

                    <div className="flex-grow-1 min-width-0">
                        <h6 className="fw-bold text-truncate mb-1" style={{ color: 'var(--text-main)' }}>
                            {device.name}
                        </h6>
                        <div className="d-flex gap-2 mb-2">
                            {device.specifications?.overallPick && (
                                <span className="badge rounded-pill text-dark" style={{ backgroundColor: '#d0e1f9', fontSize: '0.6rem' }}>
                                    Overall pick
                                </span>
                            )}
                            <span className="fs-6 fw-bold" style={{ color: 'var(--text-main)' }}>
                                €{device.bestPrice || device.price}
                            </span>
                        </div>
                    </div>

                    <div className="d-flex flex-column align-items-end gap-2" style={{ minWidth: '100px' }} onClick={(e) => e.stopPropagation()}>
                        <button 
                            onClick={handleAddToWishlist}
                            className="btn btn-sm rounded-3 fw-bold d-flex align-items-center justify-content-center p-0" 
                            style={{ 
                                width: '50px', 
                                height: '50px', 
                                backgroundColor: isWishlisted ? 'rgba(220, 53, 69, 0.1)' : 'var(--section-bg)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <svg 
                                width="26" 
                                height="26" 
                                viewBox="0 0 24 24" 
                                fill={isWishlisted ? "#DC3545" : "none"}
                                stroke={isWishlisted ? "#DC3545" : "currentColor"} 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                                style={{ color: isWishlisted ? '#DC3545' : 'var(--text-main)' }}
                            >
                                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    return (
        <div className="card h-100" style={cardBaseStyle} onClick={handleNavigation}>
            <div className="bg-white rounded-4 mb-3 d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
                <img
                    src={device.imageUrl || device.image_url}
                    alt={device.name}
                    style={{ maxHeight: '180px', maxWidth: '100%', objectFit: 'contain' }}
                />
            </div>

            <div className="card-body p-0 d-flex flex-column">
                <h6 className="card-title fw-bold text-truncate mb-2" style={{ color: 'var(--text-main)' }}>
                    {device.name}
                </h6>

                <div className="d-flex gap-2 mb-3">
                    {device.specifications?.overallPick && (
                        <span className="badge rounded-pill text-dark" style={{ backgroundColor: '#d0e1f9', fontSize: '0.7rem' }}>
                            Overall pick
                        </span>
                    )}
                    {device.specifications?.roomTag && (
                        <span className="badge rounded-pill text-dark" style={{ backgroundColor: '#d0e1f9', fontSize: '0.7rem' }}>
                            {device.specifications.roomTag}
                        </span>
                    )}
                </div>

                <div className="mt-auto d-flex justify-content-between align-items-end mb-3">
                    <span className="fs-5 fw-bold" style={{ color: 'var(--text-main)' }}>
                        €{device.bestPrice || device.price}
                    </span>
                    <span className="text-muted small">
                        {device.bestStoreName || "Store"}
                    </span>
                </div>

                <div onClick={(e) => e.stopPropagation()}>
                    <button 
                        onClick={handleAddToWishlist}
                        className="btn w-100 rounded-pill fw-bold shadow-sm text-white" 
                        style={{ 
                            backgroundColor: isWishlisted ? '#DC3545' : '#5092CE',
                            fontSize: '0.85rem',
                            border: '0',
                            transition: 'background-color 0.3s ease'
                        }}
                    >
                        {isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                    </button>
                </div>
            </div>
        </div>
    );
}