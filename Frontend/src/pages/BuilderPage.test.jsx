import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import BuilderPage from './BuilderPage';
import { renderWithRouter } from '../test/renderWithRouter';

vi.mock('../features/wizard/component-fullscreen/SetupWizard', () => ({
  default: ({ onFinish }) => (
    <>
      <button onClick={onFinish}>Finish wizard</button>
      <button onClick={() => onFinish([], { id: 42 })}>Finish selected setup</button>
    </>
  ),
}));

vi.mock('../features/canvas/LayoutCanvas', () => ({
  default: ({ isDarkMode, onBack, setupId, layoutId }) => (
    <div>
      <span>Canvas {isDarkMode ? 'dark' : 'light'}</span>
      <span>Setup {setupId ?? 'none'}</span>
      <span>Layout {layoutId ?? 'none'}</span>
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

  it('passes setup and layout query params to the canvas', () => {
    renderWithRouter(<BuilderPage darkMode={false} />, { route: '/builder?setupId=7&layoutId=15' });

    expect(screen.getByText('Setup 7')).toBeInTheDocument();
    expect(screen.getByText('Layout 15')).toBeInTheDocument();
  });

  it('keeps the selected setup id when finishing the wizard', () => {
    renderWithRouter(
      <Routes>
        <Route path="/builder" element={<BuilderPage darkMode={false} />} />
      </Routes>,
      { route: '/builder?mode=wizard' }
    );

    fireEvent.click(screen.getByText('Finish selected setup'));

    expect(screen.getByText('Setup 42')).toBeInTheDocument();
  });
});
