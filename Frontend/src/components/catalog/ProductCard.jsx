import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ProductCard({ device, viewMode = 'grid' }) {
    const navigate = useNavigate();

    const cardBaseStyle = {
        backgroundColor: 'var(--card-bg)',
        padding: '12px',
        boxShadow: '0px 5px 20px rgba(0, 0, 0, 0.40)',
        border: '0',
        borderRadius: '1.2rem',
        transition: 'all 0.3s ease',
        cursor: 'pointer'
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
                            src={device.imageUrl}
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
                                 €{device.bestPrice}
                            </span>
                        </div>
                    </div>

                    <div className="d-flex flex-column align-items-end gap-2" style={{ minWidth: '100px' }} onClick={(e) => e.stopPropagation()}>
                        <button className="btn btn-sm rounded-3 fw-bold d-flex align-items-center justify-content-center p-0" style={{ width: '60px', height: '60px', backgroundColor: 'var(--section-bg)' }}>
                            <svg color="var(--text-main)" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                    src={device.imageUrl}
                    alt={device.name}
                    style={{ maxHeight: '180px', objectFit: 'contain' }}
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
                        €{device.bestPrice}
                    </span>
                    <span className="text-muted small">
                        {device.bestStoreName}
                    </span>
                </div>

                <div onClick={(e) => e.stopPropagation()}>
                    <button className="btn w-100 rounded-pill fw-bold shadow-sm" style={{ backgroundColor: 'var(--section-bg)', color: 'var(--text-main)' }}>
                        Add to Wishlist
                    </button>
                </div>
            </div>
        </div>
    );
}