import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from './SideBar';
import { expect, test, vi } from 'vitest';

test('schimba valorile pentru sliderele de pret', () => {
    const setFiltersMock = vi.fn();
    const initialFilters = { minPrice: 0, maxPrice: 1000, protocols: [], categories: [], brand: "" };

    render(<Sidebar filters={initialFilters} setFilters={setFiltersMock} />);

    fireEvent.click(screen.getByText("Price"));

    const sliders = screen.getAllByRole('slider');
    const minSlider = sliders[0];
    const maxSlider = sliders[1];

    fireEvent.change(minSlider, { target: { value: '200' } });
    expect(setFiltersMock).toHaveBeenCalled();

    fireEvent.change(maxSlider, { target: { value: '800' } });
    expect(setFiltersMock).toHaveBeenCalled();
});

test('extinde si restrange lista de categorii', () => {
    const setFiltersMock = vi.fn();
    const initialFilters = { minPrice: 0, maxPrice: 1000, protocols: [], categories: [], brand: "" };

    render(<Sidebar filters={initialFilters} setFilters={setFiltersMock} />);

    fireEvent.click(screen.getByText("Price"));

    const toggleButton = screen.getByText(/more categories|View less/i);

    fireEvent.click(toggleButton);
    expect(screen.getByText(/View less/i)).toBeInTheDocument();
});