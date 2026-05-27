import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import VerifyEmailPage from './VerifyEmailPage';
import { renderWithRouter } from '../test/renderWithRouter';

describe('VerifyEmailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('afiseaza eroare cand lipseste tokenul', () => {
    renderWithRouter(<VerifyEmailPage />, { route: '/verify-email' });

    expect(screen.getByText('Missing verification token in the link.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Back to Login/i })).toHaveAttribute('href', '/login');
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  test('apeleaza endpoint-ul de verificare si confirma emailul', async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: true });

    renderWithRouter(<VerifyEmailPage />, { route: '/verify-email?token=a b+c' });

    expect(screen.getByText(/Verifying your email/i)).toBeInTheDocument();
    expect(await screen.findByText('Your email is verified. You can now sign in.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Go to Login/i })).toHaveAttribute('href', '/login');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:20025'}/api/v1/auth/verify-email?token=a%20b%20c`,
      { method: 'GET' }
    );
  });

  test('afiseaza mesajul trimis de backend pentru link invalid', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ message: 'Token expired' }),
    });

    renderWithRouter(<VerifyEmailPage />, { route: '/verify-email?token=expired' });

    expect(await screen.findByText('Token expired')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Back to Login/i })).toHaveAttribute('href', '/login');
  });

  test('foloseste mesaj fallback pentru raspunsuri invalide si erori de retea', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.reject(new Error('bad json')),
    });

    const { unmount } = renderWithRouter(<VerifyEmailPage />, { route: '/verify-email?token=broken' });
    expect(await screen.findByText('The link is invalid or has expired.')).toBeInTheDocument();

    unmount();
    globalThis.fetch.mockRejectedValueOnce(new Error('offline'));
    renderWithRouter(<VerifyEmailPage />, { route: '/verify-email?token=offline' });

    expect(await screen.findByText("Couldn't reach the server. Please try again later.")).toBeInTheDocument();
  });
});
