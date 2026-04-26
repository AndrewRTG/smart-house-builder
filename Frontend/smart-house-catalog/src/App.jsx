/*import React from 'react'
import CatalogPage from "./pages/CatalogPage";

function App() {
    return (
        <div>
            <CatalogPage />
        </div>
    );
}

export default App;
 */
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

import CatalogPage from './pages/CatalogPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Când accesezi direct localhost:3000, te trimite automat la login */}
                <Route path="/" element={<Navigate to="/login" replace />} />

                {/* Rutele publice ale colegului tău */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Ruta pentru pagina ta */}
                <Route path="/catalog" element={<CatalogPage />} />

                {/* Pentru orice alt URL greșit, te întoarce la login */}
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;