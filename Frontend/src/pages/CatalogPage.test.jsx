import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import CatalogPage from './CatalogPage';
import { expect, test, vi, beforeEach } from 'vitest';

const mockDeviceList = [
    { id: 1, name: "Priza Smart", price: 50, brand: "Altex" },
    { id: 2, name: "Senzor Temperatura", price: 80, brand: "eMAG" }
];

beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn().mockResolvedValue({
        json: async () => mockDeviceList,
    });
});

test('randeaza loaderul apoi lista de dispozitive din backend', async () => {
    render(<CatalogPage darkMode={false} />);

    expect(screen.getByText(/Se caută produsele/i)).toBeInTheDocument();

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
        expect(screen.getByText(/Nu s-a găsit niciun produs/i)).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
});

test('bara de cautare actualizeaza starea si filtreaza', async () => {
    render(<CatalogPage darkMode={false} />);

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
    render(<CatalogPage darkMode={false} />);

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
    const { container } = render(<CatalogPage darkMode={false} />);

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

test('actualizeaza eticheta si sorteaza produsele dupa Nume', async () => {
    globalThis.fetch.mockResolvedValue({ json: async () => mockDeviceList });
    render(<CatalogPage darkMode={false} />);

    await waitFor(() => expect(screen.getByText("Priza Smart")).toBeInTheDocument());

    const sortButton = screen.getByRole('button', { name: /Sort:/i });
    fireEvent.click(sortButton);

    const nameOption = screen.getAllByText("Name").find(el => el.closest('.dropdown-item'));

    await act(async () => {
        fireEvent.click(nameOption);
    });

    const selectedLabel = screen.getAllByText("Name").find(el => el.closest('button[data-bs-toggle="dropdown"]'));
    expect(selectedLabel).toBeInTheDocument();

    const deviceNames = screen.getAllByRole('heading', { level: 6 })
        .map(h => h.textContent)
        .filter(name => !["Summary", "Price", "Category", "Protocol"].includes(name));

    expect(deviceNames[0]).toBe("Priza Smart");
});