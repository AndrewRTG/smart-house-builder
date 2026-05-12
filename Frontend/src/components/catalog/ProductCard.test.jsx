import { render, screen } from '@testing-library/react';
import ProductCard from './ProductCard';
import { expect, test } from 'vitest';

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
    render(<ProductCard device={mockDevice} />);

    expect(screen.getByText("Bec Inteligent Philips Hue")).toBeInTheDocument();
    expect(screen.getByAltText("Bec Inteligent Philips Hue")).toHaveAttribute("src", "https://example.com/bec.jpg");

    expect(screen.getByText("150.99 RON")).toBeInTheDocument();
    expect(screen.getByText("eMAG")).toBeInTheDocument();

    expect(screen.getByText("Overall pick")).toBeInTheDocument();
    expect(screen.getByText("Living")).toBeInTheDocument();
});