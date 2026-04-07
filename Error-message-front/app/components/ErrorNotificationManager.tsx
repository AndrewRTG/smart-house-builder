"use client";

import { useState } from 'react';

export interface AppError {
    id: string;
    message: string;
    time: string;
}

const MOCK_ERRORS: AppError[] = [
    { id: '1', message: 'API connection lost. Try refreshing.', time: '10:35' },
    { id: '2', message: 'Database sync failure. Data may be delayed.', time: '10:36' },
    { id: '3', message: 'Device communication time-out.', time: '10:37' },
    { id: '4', message: 'Smart lock unresponsive.', time: '10:40' },
];

export default function ErrorNotificationManager() {
    const [errors, setErrors] = useState<AppError[]>(MOCK_ERRORS);
    const [isVisible, setIsVisible] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);

    const removeError = (idToRemove: string) => {
        setErrors((prev) => prev.filter((error) => error.id !== idToRemove));
    };

    const toggleVisibility = () => {
        setIsVisible((prevVisible) => {
            if (prevVisible) setIsExpanded(false);
            return !prevVisible;
        });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: '16px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

            <button
                onClick={toggleVisibility}
                style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    fontSize: '22px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
                    flexShrink: 0,
                    zIndex: 50,
                }}
                title={isVisible ? "Hide Errors" : "Show Errors"}
            >
                !
            </button>

            {isVisible && errors.length > 0 && (
                <div style={{ position: 'relative', width: '320px' }}>

                    {isExpanded || errors.length === 1 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {errors.map((error) => (
                                <div
                                    key={error.id}
                                    style={{
                                        ...iosCardStyle,
                                        animation: 'slideDown 0.3s ease-out forwards'
                                    }}
                                >
                                    <div style={{ flexGrow: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <strong style={{ fontSize: '14px', color: '#111827' }}>Error</strong>
                                            <span style={{ fontSize: '12px', color: '#6b7280' }}>{error.time}</span>
                                        </div>
                                        <div style={{ fontSize: '14px', color: '#374151' }}>{error.message}</div>
                                    </div>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeError(error.id);
                                        }}
                                        style={closeButtonStyle}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div
                            onClick={() => setIsExpanded(true)}
                            style={{
                                position: 'relative',
                                height: '90px',
                                cursor: 'pointer',
                                WebkitTapHighlightColor: 'transparent'
                            }}
                            role="button"
                            tabIndex={0}
                        >
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 99 }} />

                            {errors.slice(0, 3).map((error, index) => {
                                const scale = 1 - index * 0.05;
                                const translateY = index * 12;

                                return (
                                    <div
                                        key={error.id}
                                        style={{
                                            ...iosCardStyle,
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            zIndex: 10 - index,
                                            transform: `translateY(${translateY}px) scale(${scale}) translateZ(0)`,
                                            opacity: 1 - index * 0.1,
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        }}
                                    >
                                        {index === 0 && (
                                            <>
                                                {errors.length > 1 && (
                                                    <div style={bubbleBadgeStyle}>
                                                        {errors.length}
                                                    </div>
                                                )}
                                                <div style={{ flexGrow: 1 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                        <strong style={{ fontSize: '14px', color: '#111827' }}>Multiple Errors</strong>
                                                        <span style={{ fontSize: '12px', color: '#6b7280' }}>Now</span>
                                                    </div>
                                                    <div style={{ fontSize: '14px', color: '#374151' }}>
                                                        Tap to expand and view details.
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// STILUL

const iosCardStyle: React.CSSProperties = {
    backgroundColor: 'rgba(234,113,113,0.85)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: '1px solid rgba(0, 0, 0, 0.05)',
    borderRadius: '16px',
    padding: '16px',
    display: 'flex',
    alignItems: 'flex-start',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    boxSizing: 'border-box',
};

const closeButtonStyle: React.CSSProperties = {
    background: '#e5e7eb',
    border: 'none',
    color: '#4b5563',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: '12px',
};

const bubbleBadgeStyle: React.CSSProperties = {
    position: 'absolute',
    top: '-6px',
    left: '-6px',
    backgroundColor: '#ef4444',
    color: 'white',
    borderRadius: '50%',
    width: '22px',
    height: '22px',
    fontSize: '12px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    zIndex: 20,
};