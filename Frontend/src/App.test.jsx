import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import App from './App';

vi.mock('./components/Navbar', () => ({
  default: ({ darkMode, setDarkMode }) => (
    <button onClick={() => setDarkMode(!darkMode)}>Navbar {darkMode ? 'dark' : 'light'}</button>
  ),
}));

vi.mock('./components/ErrorBanner', () => ({ default: () => <div>Error banner</div> }));
vi.mock('./components/ProtectedRoute', () => ({ default: () => <div>Protected outlet</div> }));
vi.mock('./pages/LoginPage', () => ({ default: () => <div>Login page</div> }));
vi.mock('./pages/RegisterPage', () => ({ default: () => <div>Register page</div> }));
vi.mock('./pages/MfaSetupPage', () => ({ default: () => <div>MFA setup page</div> }));
vi.mock('./pages/MfaVerifyPage', () => ({ default: () => <div>MFA verify page</div> }));
vi.mock('./pages/MfaSettingsPage', () => ({ default: () => <div>MFA settings page</div> }));
vi.mock('./pages/ForgotPasswordPage', () => ({ default: () => <div>Forgot page</div> }));
vi.mock('./pages/ResetPasswordPage', () => ({ default: () => <div>Reset page</div> }));
vi.mock('./pages/Profile/ProfilePage', () => ({ default: () => <div>Profile page</div> }));
vi.mock('./pages/CommunityPage', () => ({ default: () => <div>Community page</div> }));
vi.mock('./pages/SetupDetailPage', () => ({ default: () => <div>Setup detail page</div> }));
vi.mock('./pages/ArticleDetailPage', () => ({ default: () => <div>Article detail page</div> }));
vi.mock('./pages/CreateArticlePage', () => ({ default: () => <div>Create article page</div> }));
vi.mock('./pages/VerifyEmailPage', () => ({ default: () => <div>Verify email page</div> }));
vi.mock('./pages/NotFoundPage', () => ({ default: () => <div>Not found page</div> }));
vi.mock('./pages/OAuthCallbackPage', () => ({ default: () => <div>OAuth page</div> }));
vi.mock('./pages/CatalogPage', () => ({ default: () => <div>Products page</div> }));
vi.mock('./pages/BuilderPage', () => ({ default: () => <div>Builder page</div> }));

describe('App routing and theme state', () => {
  it('applies saved dark theme and toggles it from navbar', async () => {
    localStorage.setItem('theme', 'dark');
    window.history.pushState({}, '', '/community');
    render(<App />);

    expect(await screen.findByText('Community page')).toBeInTheDocument();
    expect(document.body.classList.contains('dark-mode')).toBe(true);
    fireEvent.click(screen.getByText('Navbar dark'));
    await waitFor(() => expect(document.body.classList.contains('light-mode')).toBe(true));
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('routes regular and fallback pages', async () => {
    window.history.pushState({}, '', '/articles/10');
    const { unmount } = render(<App />);
    expect(await screen.findByText('Article detail page')).toBeInTheDocument();
    unmount();

    window.history.pushState({}, '', '/unknown');
    render(<App />);
    expect(await screen.findByText('Not found page')).toBeInTheDocument();
  });
});
