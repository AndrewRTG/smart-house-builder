import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import BuilderPage from './BuilderPage';
import { renderWithRouter } from '../test/renderWithRouter';

vi.mock('../features/wizard/component-fullscreen/SetupWizard', () => ({
  default: ({ onFinish }) => <button onClick={onFinish}>Finish wizard</button>,
}));

vi.mock('../features/canvas/LayoutCanvas', () => ({
  default: ({ isDarkMode, onBack }) => (
    <div>
      <span>Canvas {isDarkMode ? 'dark' : 'light'}</span>
      <button onClick={onBack}>Back to wizard</button>
    </div>
  ),
}));

describe('BuilderPage', () => {
  it('renders canvas by default and switches back to wizard', () => {
    renderWithRouter(<BuilderPage darkMode={false} />, { route: '/builder' });
    expect(screen.getByText('Canvas light')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Back to wizard'));
    expect(screen.getByText('Finish wizard')).toBeInTheDocument();
  });

  it('starts in wizard mode from query string and can skip or finish', () => {
    renderWithRouter(
      <Routes>
        <Route path="/builder" element={<BuilderPage darkMode />} />
      </Routes>,
      { route: '/builder?mode=wizard' }
    );
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    fireEvent.click(screen.getByText(/Skip to Layout Canvas/));
    expect(screen.getByText('Canvas dark')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Back to wizard'));
    fireEvent.click(screen.getByText('Finish wizard'));
    expect(screen.getByText('Canvas dark')).toBeInTheDocument();
  });
});
