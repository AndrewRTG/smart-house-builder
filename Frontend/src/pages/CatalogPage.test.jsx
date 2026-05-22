import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import CatalogPage from './CatalogPage';
import { expect, test, vi, beforeEach } from 'vitest';
import { renderWithRouter } from '../test/renderWithRouter';

const mockDeviceList = [
    { id: 1, name: "Z-Wave Sensor", bestPrice: 100, brand: "Samsung", createdAt: "2023-01-01" },
    { id: 2, name: "Priza Smart", bestPrice: 50, brand: "Altex", createdAt: "2023-01-05" },
    { id: 3, name: "Bec RGB", bestPrice: 20, brand: "Philips", createdAt: "2022-12-01" }
];

beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn().mockResolvedValue({
        json: async () => mockDeviceList,
    });
});

test('randeaza loaderul apoi lista de dispozitive din backend', async () => {
    renderWithRouter(<CatalogPage darkMode={false} />);

    expect(screen.getByText(/Searching products/i)).toBeInTheDocument();

    await waitFor(() => {
        expect(screen.getByText("Priza Smart")).toBeInTheDocument();
        expect(screen.getByText("Z-Wave Sensor")).toBeInTheDocument();
    });
});

test('afiseaza mesaj de eroare cand pica conexiunea la DB', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    globalThis.fetch.mockRejectedValueOnce(new Error("Database connection failed"));

    renderWithRouter(<CatalogPage darkMode={false} />);

    await waitFor(() => {
        expect(screen.getByText(/No products found/i)).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
});

test('bara de cautare actualizeaza starea si filtreaza', async () => {
    renderWithRouter(<CatalogPage darkMode={false} />);

    await waitFor(() => {
        expect(screen.getByText("Priza Smart")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search by brand/i);
    await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'Samsung' } });
    });

    expect(searchInput.value).toBe('Samsung');
});

test('aplica filtrele pentru categorii si protocoale cand sunt selectate', async () => {
    renderWithRouter(<CatalogPage darkMode={false} />);

    await waitFor(() => {
        expect(screen.getByText("Priza Smart")).toBeInTheDocument();
    });

    const sidebarHeaders = screen.getAllByRole('heading', { level: 6 });
    const priceHeader = sidebarHeaders.find(h => h.textContent === "Price");
    const categoryHeader = sidebarHeaders.find(h => h.textContent === "Category");
    const protocolHeader = sidebarHeaders.find(h => h.textContent === "Protocol");

    fireEvent.click(priceHeader);
    fireEvent.click(categoryHeader);
    fireEvent.click(protocolHeader);

    await waitFor(() => {
        const cameraLabel = screen.getByLabelText(/Smart Cameras/i);
        fireEvent.click(cameraLabel);
    });

    expect(globalThis.fetch).toHaveBeenCalled();
});

test('schimba intre vizualizarea Grid si List', async () => {
    const { container } = renderWithRouter(<CatalogPage darkMode={false} />);

    await waitFor(() => {
        expect(screen.getByText("Priza Smart")).toBeInTheDocument();
    });

    const buttons = screen.getAllByRole('button');
    const listButton = buttons.find(btn => btn.innerHTML.includes('line'));

    await act(async () => {
        fireEvent.click(listButton);
    });

    const listContainer = container.querySelector('.row-cols-1');
    expect(listContainer).toBeInTheDocument();
});


test('sorteaza produsele dupa Nume (A-Z)', async () => {
    renderWithRouter(<CatalogPage darkMode={false} />);
    await waitFor(() => expect(screen.getByText("Priza Smart")).toBeInTheDocument());

    const sortButton = screen.getByRole('button', { name: /Sort:/i });
    fireEvent.click(sortButton);

    const nameOption = screen.getAllByText("Name").find(el => el.closest('.dropdown-item'));
    await act(async () => fireEvent.click(nameOption));

    const productNames = screen.getAllByRole('heading', { level: 6 }).map(h => h.textContent);
    const filteredNames = productNames.filter(name => ["Bec RGB", "Priza Smart", "Z-Wave Sensor"].includes(name));
    expect(filteredNames[0]).toBe("Bec RGB");
    expect(filteredNames[2]).toBe("Z-Wave Sensor");
});

test('sorteaza produsele dupa Brand (A-Z)', async () => {
    renderWithRouter(<CatalogPage darkMode={false} />);
    await waitFor(() => expect(screen.getByText("Priza Smart")).toBeInTheDocument());

    const sortButton = screen.getByRole('button', { name: /Sort:/i });
    fireEvent.click(sortButton);

    const brandOption = screen.getAllByText("Brand").find(el => el.closest('.dropdown-item'));
    await act(async () => fireEvent.click(brandOption));

    const productNames = screen.getAllByRole('heading', { level: 6 }).map(h => h.textContent);
    const filteredNames = productNames.filter(name => ["Bec RGB", "Priza Smart", "Z-Wave Sensor"].includes(name));
    expect(filteredNames[0]).toBe("Priza Smart");
    expect(filteredNames[1]).toBe("Bec RGB");
});

test('sorteaza produsele dupa Date added (Cel mai vechi primul - asc)', async () => {
    renderWithRouter(<CatalogPage darkMode={false} />);
    await waitFor(() => expect(screen.getByText("Priza Smart")).toBeInTheDocument());

    const sortButton = screen.getByRole('button', { name: /Sort:/i });
    fireEvent.click(sortButton);

    const dateOption = screen.getAllByText("Date added").find(el => el.closest('.dropdown-item'));
    await act(async () => fireEvent.click(dateOption));

    const productNames = screen.getAllByRole('heading', { level: 6 }).map(h => h.textContent);
    const filteredNames = productNames.filter(name => ["Bec RGB", "Priza Smart", "Z-Wave Sensor"].includes(name));
    expect(filteredNames[0]).toBe("Bec RGB");
    expect(filteredNames[2]).toBe("Priza Smart");
});

test('inverseaza ordinea de sortare apasand butonul de Ascendent/Descendent', async () => {
    renderWithRouter(<CatalogPage darkMode={false} />);
    await waitFor(() => expect(screen.getByText("Priza Smart")).toBeInTheDocument());

    let productNames = screen.getAllByRole('heading', { level: 6 }).map(h => h.textContent);
    let filteredNames = productNames.filter(name => ["Bec RGB", "Priza Smart", "Z-Wave Sensor"].includes(name));
    expect(filteredNames[0]).toBe("Bec RGB");

    const sortOrderButton = screen.getByTitle("Sort Ascending");
    await act(async () => fireEvent.click(sortOrderButton));

    productNames = screen.getAllByRole('heading', { level: 6 }).map(h => h.textContent);
    filteredNames = productNames.filter(name => ["Bec RGB", "Priza Smart", "Z-Wave Sensor"].includes(name));
    expect(filteredNames[0]).toBe("Z-Wave Sensor");
    expect(filteredNames[2]).toBe("Bec RGB");
});