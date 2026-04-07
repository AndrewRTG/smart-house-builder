import React from 'react';

export default function ProductCard({device}){
    return(
        <div className="card h-100 border-0 rounded-4" style={{
                                                                        backgroundColor: '#d2d2d2',
                                                                        padding: '10px',
                                                                        boxShadow: '0px 5px 20px rgba(0, 0, 0, 0.40)'}}>
            <div className="bg-white rounded-4 mb-3 d-flex justify-content-center align-items-center" style={{height: '200px'}}>
                <img
                src={device.imageUrl}
                alt={device.name}
                style={{ maxHeight: '200px', objectFit: 'contain'}}
                />
            </div>

            <div className="card-body p-0 d-flex flex-column">
                <h6 className="card-title fw-bold text-truncate mb-2">
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
                    <span className="fs-5 fw-bold" style={{ color: '#1a365d' }}>
                        {device.bestPrice}RON
                    </span>
                    <span className="text-muted small">
                        {device.bestStoreName}
                    </span>
                </div>

                <button className="btn w-100 rounded-pill fw-bold shadow-sm" style={{ backgroundColor: '#ffffff', color: '#1a365d' }}>
                    Add to Cart
                </button>
            </div>
        </div>
    );
}