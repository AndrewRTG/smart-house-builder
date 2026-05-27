import { screen } from '@testing-library/react'; 
import ProductCard from './ProductCard';
import { expect, test } from 'vitest';
import { renderWithRouter } from '../../test/renderWithRouter'; 

const mockDevice = {
    id: 1,
    name: "Bec Inteligent Philips Hue",
    brand: "Philips",
    description: "Bec smart RGB",
    imageUrl: "https://example.com/bec.jpg",
    communicationProtocol: "Zigbee",
    bestPrice: 150.99,
    storeUrl: "https://emag.ro/bec-philips",
    bestStoreName: "eMAG",
    specifications: {
        overallPick: true,
        roomTag: "Living"
    }
};

test('randeaza corect informatiile din baza de date in card', () => {
    renderWithRouter(<ProductCard device={mockDevice} />);

    expect(screen.getByText("Bec Inteligent Philips Hue")).toBeInTheDocument();
    expect(screen.getByAltText("Bec Inteligent Philips Hue")).toHaveAttribute("src", "https://example.com/bec.jpg");

    expect(screen.getByText("€150.99")).toBeInTheDocument();
    expect(screen.getByText("eMAG")).toBeInTheDocument();

    expect(screen.getByText("Overall pick")).toBeInTheDocument();
    expect(screen.getByText("Living")).toBeInTheDocument();
});

import { fireEvent, waitFor } from '@testing-library/react';

test('trimite cerere la backend si schimba starea butonului de wishlist la click', async () => {
    localStorage.setItem('accessToken', 'mock-jwt-token');

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ deviceId: 1, isWishlisted: true, wishlistCount: 5 })
    });

    renderWithRouter(<ProductCard device={mockDevice} initialIsWishlisted={false} />);

    const wishlistButton = screen.getByRole('button', { name: /Add to Wishlist/i });
    expect(wishlistButton).toBeInTheDocument();

    fireEvent.click(wishlistButton);

    expect(fetchSpy).toHaveBeenCalledWith(
        'http://localhost:20025/api/v1/devices/1/wishlist',
        expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
                'Authorization': 'Bearer mock-jwt-token'
            })
        })
    );

    await waitFor(() => {
        expect(screen.getByRole('button', { name: /Remove from Wishlist/i })).toBeInTheDocument();
    });

    fetchSpy.mockRestore();
    localStorage.clear();
});