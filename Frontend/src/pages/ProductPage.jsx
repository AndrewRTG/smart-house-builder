import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

export default function ProductPage() {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);

    const parseXMLProduct = (xmlString) => {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlString, "text/xml");

            const item = xmlDoc.querySelector("item") || xmlDoc.querySelector("Device") || xmlDoc.documentElement;
            if (!item || xmlDoc.querySelector("parsererror")) return null;

            const getText = (selector) => {
                const el = item.querySelector(selector);
                return el ? el.textContent.trim() : "";
            };

            return {
                id: getText("id"),
                name: getText("name"),
                brand: getText("brand"),
                description: getText("description"),
                imageUrl: getText("imageUrl"),
                bestPrice: getText("bestPrice") || null,
                bestStoreName: getText("bestStoreName") || getText("brand")
            };
        } catch (e) {
            console.error("Eroare la parsarea structurii XML:", e);
            return null;
        }
    };

    useEffect(() => {
        setLoading(true);

        fetch(`http://localhost:20025/api/devices/${id}`)
        .then(response => {
            if (!response.ok) throw new Error("Serverul a raspuns cu status de eroare: " + response.status);
            return response.text(); // Citim ca text brut mai întâi
        })
        .then(text => {
            if (!text || text.trim() === "") throw new Error("Raspuns gol de la server");

            if (text.trim().startsWith("<")) {
                const parsedProduct = parseXMLProduct(text);
                setProduct(parsedProduct);
            } else {
                const jsonData = JSON.parse(text);
                setProduct(jsonData);
            }
            setLoading(false);
        })
        .catch(error => {
            console.error("Error fetching product details:", error);
            setProduct(null);
            setLoading(false);
        });
    }, [id]);

    if (loading) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}>
                <h3 className="fw-bold">Loading product details...</h3>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}>
                <h3 className="fw-bold">Product not found.</h3>
            </div>
        );
    }

    return (
        <div className="min-vh-100 py-4 px-3 px-md-5" style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', transition: 'all 0.3s' }}>
            <div className="container-fluid max-w-7xl mx-auto mt-4">

                <div className="row g-4 mb-5">
                    <div className="col-12 col-lg-6">
                        <div
                            className="d-flex align-items-center justify-content-center rounded-4 shadow-sm p-4 bg-white"
                            style={{ minHeight: '400px', height: '100%', border: '1px solid rgba(0,0,0,0.05)' }}
                        >
                            {product.imageUrl ? (
                                <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    style={{ maxHeight: '350px', maxWidth: '100%', objectFit: 'contain' }}
                                />
                            ) : (
                                <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                    <circle cx="8.5" cy="8.5" r="1.5" />
                                    <polyline points="21 15 16 10 5 21" />
                                </svg>
                            )}
                        </div>
                    </div>

                    <div className="col-12 col-md-7 col-lg-4 d-flex flex-column justify-content-start ps-lg-4">
                        <h2 className="fw-bold mb-1 lh-sm" style={{ fontSize: '1.65rem' }}>
                            {product.name}
                        </h2>
                        <span className="text-muted mb-3 fw-bold small">Brand: {product.brand}</span>

                        <hr className="my-3" style={{ borderColor: 'var(--text-main)', opacity: 0.2 }} />

                        <div className="mt-2">
                            <h5 className="fw-bold mb-3" style={{ fontSize: '1.1rem' }}>Description</h5>
                            <p className="lh-base" style={{ color: 'var(--text-main)', fontSize: '0.95rem', opacity: 0.85 }}>
                                {product.description || "No description available for this item."}
                            </p>
                        </div>
                    </div>

                    <div className="col-12 col-md-5 col-lg-2">
                        <div
                            className="p-3 rounded-4 shadow-sm border d-flex flex-column gap-3"
                            style={{
                                backgroundColor: 'var(--card-bg)',
                                borderColor: 'rgba(255,255,255,0.1)',
                                minWidth: '180px',
                                color: 'var(--text-main)' // CORECTAT: Schimbat din alb fix în variabilă responsivă
                            }}
                        >
                            <div className="text-center mb-1">
                                <span className="fs-3 fw-bold">
                                    {product.bestPrice ? `€${product.bestPrice}` : "N/A"}
                                </span>
                            </div>

                            <div className="d-flex align-items-center justify-content-between gap-2">
                                <span className="fw-bold small">Quantity:</span>
                                <input
                                    type="number"
                                    min="1"
                                    value={quantity}
                                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                                    className="form-control text-center p-1 fw-bold shadow-none border-0 rounded-2"
                                    style={{ width: '60px', height: '32px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}
                                />
                            </div>

                            <button
                                className="btn w-100 fw-bold rounded-3 border-0 py-2 shadow-sm text-white"
                                style={{ backgroundColor: '#5092CE', fontSize: '0.9rem' }}
                                onClick={() => product.bestPriceUrl && window.open(product.bestPriceUrl, '_blank')}
                            >
                                See in store
                            </button>

                            <button
                                className="btn w-100 fw-bold rounded-3 border-0 py-2 shadow-sm text-white"
                                style={{ backgroundColor: '#5092CE', fontSize: '0.9rem' }}
                            >
                                Add to Wishlist
                            </button>
                        </div>
                    </div>
                </div>

                <div className="row mt-5">
                    <div className="col-12">
                        <h4 className="fw-bold mb-4" style={{ color: '#5092CE' }}>Other offers:</h4>

                        <div className="d-flex flex-column gap-3">
                            <div
                                className="p-3 rounded-4 shadow-sm d-flex align-items-center justify-content-between flex-wrap gap-3"
                                style={{ backgroundColor: 'var(--card-bg)', border: '1px solid rgba(255,255,255,0.05)' }}
                            >
                                <div className="d-flex align-items-center gap-3">
                                    <div className="rounded-3 d-flex align-items-center justify-content-center fw-bold text-muted border bg-light" style={{ width: '65px', height: '45px', fontSize: '0.8rem' }}>
                                        logo
                                    </div>
                                    <span className="fw-bold" style={{ fontSize: '1.05rem' }}>{product.bestStoreName || product.brand}</span>
                                </div>

                                <div className="d-flex align-items-center gap-4 ml-auto">
                                    <span className="fs-5 fw-bold">{product.bestPrice ? `€${product.bestPrice}` : "N/A"}</span>
                                    <button className="btn fw-bold rounded-3 px-4 py-2 border-0 shadow-sm text-white" style={{ backgroundColor: '#5092CE', fontSize: '0.9rem' }}>
                                        Add to Wishlist
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}