import React from 'react';

export default function Navbar() {
    return (
        <nav className="navbar navbar-expand-lg border-bottom py-2 px-4" style={{ backgroundColor: '#b9d6e6' }}>
            <div className="container-fluid d-flex justify-content-between align-items-center">

                {/* Partea stângă: Logo și Link-uri principale */}
                <div className="d-flex align-items-center">
                    <a className="navbar-brand fw-bold text-dark me-5" href="#">logo</a>

                    <div className="d-flex align-items-center small">
                        <a className="text-decoration-none text-dark" href="#">Builder</a>
                        <span className="mx-3 text-muted">|</span>

                        {/* Link-ul activ pentru pagina curentă */}
                        <a className="text-decoration-none text-dark fw-bold border-bottom border-primary pb-1" href="#">
                            Products ▾
                        </a>

                        <span className="mx-3 text-muted">|</span>
                        <a className="text-decoration-none text-dark" href="#">Community</a>
                    </div>
                </div>

                {/* Partea dreaptă: Autentificare și Setări */}
                <div className="d-flex align-items-center small">
                    <a href="#" className="text-decoration-none text-dark">Register</a>
                    <span className="mx-3 text-muted">|</span>
                    <a href="#" className="text-decoration-none text-dark">Log In</a>
                    <span className="mx-3 text-muted">|</span>
                    <span className="text-dark me-3">English</span>

                    {/* Toggle Dark Mode */}
                    <div className="form-check form-switch m-0 d-flex align-items-center">
                        <input className="form-check-input fs-5" type="checkbox" role="switch" id="darkModeSwitch" style={{ cursor: 'pointer' }}/>
                    </div>
                </div>

            </div>
        </nav>
    );
}