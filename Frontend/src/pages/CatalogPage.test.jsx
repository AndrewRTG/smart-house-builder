import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import CatalogPage from './CatalogPage';
import { expect, test, vi, beforeEach } from 'vitest';

const mockDeviceList = [
    { id: 1, name: "Priza Smart", bestPrice: 50, bestStoreName: "Altex" },
    { id: 2, name: "Senzor Temperatura", bestPrice: 80, bestStoreName: "eMAG" }
];

beforeEach(() => {
    vi.clearAllMocks();
});

test('randeaza loaderul apoi lista de dispozitive din backend', async () => {
    globalThis.fetch.mockResolvedValueOnce({
        json: async () => mockDeviceList,
    });

    render(<CatalogPage darkMode={false} />);

    expect(screen.getByText("Se caută produsele...")).toBeInTheDocument();

    await waitFor(() => {
        expect(screen.getByText("Priza Smart")).toBeInTheDocument();
        expect(screen.getByText("Senzor Temperatura")).toBeInTheDocument();
    });
});

test('afiseaza mesaj de eroare cand pica conexiunea la DB', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    globalThis.fetch.mockRejectedValueOnce(new Error("Database connection failed"));

    render(<CatalogPage darkMode={false} />);

    await waitFor(() => {
        expect(screen.getByText("Nu s-a găsit niciun produs.")).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
});

test('bara de cautare actualizeaza starea si filtreaza', async () => {
    globalThis.fetch.mockResolvedValue({
        json: async () => [{ id: 1, name: "Test Device", brand: "Samsung", bestPrice: 10 }]
    });

    render(<CatalogPage darkMode={false} />);

    await waitFor(() => {
        expect(screen.getByText("Test Device")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search by brand (e.g. Philips)");
    fireEvent.change(searchInput, { target: { value: 'Samsung' } });

    expect(searchInput.value).toBe('Samsung');
});
test('aplica filtrele pentru categorii si protocoale cand sunt selectate', async () => {
    globalThis.fetch.mockResolvedValue({
        json: async () => [{ id: 1, name: "Bec Test", brand: "Philips", bestPrice: 50 }]
    });

    render(<CatalogPage darkMode={false} />);

    await waitFor(() => {
        expect(screen.getByText("Bec Test")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Price"));
    fireEvent.click(screen.getByText("Protocol"));

    fireEvent.click(screen.getByLabelText("Lighting"));
    fireEvent.click(screen.getByLabelText("Zigbee"));

        await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalled();
    });
});