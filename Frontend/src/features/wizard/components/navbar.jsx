import React, { useState } from 'react';
import './navbar.css';

// ── COMPONENT: Navbar ──────────────────────────────────────────────────────
const Navbar = ({ onOpenWizard, isLoggedIn = false, userAvatar = null, darkMode = false, onToggleDarkMode }) => {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <nav className={`navbar ${darkMode ? 'dark-mode' : ''}`}>
            {/* ── Logo ── */}
            <div className="navbar-logo">
                <div className="navbar-logo-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
                        <polyline points="9 21 9 12 15 12 15 21"/>
                    </svg>
                </div>
                <span className="navbar-logo-text">
                    Smart <span className="navbar-logo-accent">House</span> Builder
                </span>
            </div>

            {/* ── Nav Links ── */}
            <div className="navbar-links">
                <a href="#" className="navbar-link">Builder</a>
                <div className="navbar-divider" />
                <a href="#" className="navbar-link">Products</a>
                <div className="navbar-divider" />
                <a href="#" className="navbar-link">Community</a>
            </div>

            {/* ── Right Actions ── */}
            <div className="navbar-actions">
                <button className="navbar-wizard-btn" onClick={onOpenWizard}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                        <path d="M2 17l10 5 10-5"/>
                        <path d="M2 12l10 5 10-5"/>
                    </svg>
                    Setup Wizard
                </button>

                <div className="navbar-divider" />

                {isLoggedIn ? (
                    <button className="navbar-avatar-btn">
                        {userAvatar ? (
                            <img src={userAvatar} alt="Profile" className="navbar-avatar-img" />
                        ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                <circle cx="12" cy="7" r="4"/>
                            </svg>
                        )}
                    </button>
                ) : (
                    <>
                        <a href="#" className="navbar-link">Register</a>
                        <div className="navbar-divider" />
                        <a href="#" className="navbar-link">Log In</a>
                        <div className="navbar-divider" />
                    </>
                )}

                {/* ── Dark Mode Toggle ── */}
                <button
                    className={`navbar-theme-toggle ${darkMode ? 'active' : ''}`}
                    onClick={onToggleDarkMode}
                    aria-label="Toggle dark mode"
                >
                    <div className="toggle-track">
                        <div className="toggle-thumb">
                            {darkMode ? (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                                </svg>
                            ) : (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                    <circle cx="12" cy="12" r="5"/>
                                    <line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                    <line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                    <line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                    <line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                            )}
                        </div>
                    </div>
                </button>
            </div>
        </nav>
    );
};

export default Navbar;