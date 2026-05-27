import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { expect, test, vi, beforeEach } from 'vitest';
import { renderWithRouter } from '../test/renderWithRouter';
import { Routes, Route } from 'react-router-dom';
import ProductPage from './ProductPage';

const mockDevices = [
    { id: 2090, name: "Cartela de acces cu cip", categoryId: 1, bestPrice: 10 },
    { id: 2091, name: "Intrerupator cartela NO/NC", categoryId: 1, bestPrice: 69 },
    { id: 2092, name: "Intrerupator cu cartela de acces", categoryId: 1, bestPrice: 389 },
    { id: 2093, name: "Intrerupator cu cartela v3", categoryId: 1, bestPrice: 120 }, 
    { id: 2094, name: "Intrerupator cu cartela v4", categoryId: 1, bestPrice: 140 }, 
    { id: 3000, name: "Accesoriu detectie incendiu", categoryId: 2, bestPrice: 15 }
];

beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockDevices,
    });
});

test('randeaza corect detaliile si controleaza sliderul de produse similare', async () => {
    const scrollByMock = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollBy', {
        configurable: true,
        value: scrollByMock,
    });

    renderWithRouter(
    <Routes>
        <Route path="/product/:id" element={<ProductPage />} />
    </Routes>,
    { route: '/product/2090' }
);

    expect(screen.getByText(/Loading product details/i)).toBeInTheDocument();

    await waitFor(() => {
        expect(screen.getByText("Intrerupator cartela NO/NC")).toBeInTheDocument();
        expect(screen.queryByText("Accesoriu detectie incendiu")).not.toBeInTheDocument();
    });

    const rightArrow = screen.getByRole('button', { name: ">" });
    expect(rightArrow).toBeInTheDocument();

    fireEvent.click(rightArrow);
    expect(scrollByMock).toHaveBeenCalledWith(
        expect.objectContaining({ left: 320, behavior: 'smooth' })
    );
});