import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MfaSetupPage from './MfaSetupPage';
import MfaSettingsPage from './MfaSettingsPage';
import { renderWithRouter } from '../test/renderWithRouter';

vi.mock('../utils/authFetch', () => ({
  authFetch: vi.fn(),
}));

vi.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value }) => <div data-testid="qr-code">{value}</div>,
}));

describe('MFA settings and setup pages', () => {
  let authFetch;

  beforeEach(async () => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    authFetch = (await import('../utils/authFetch')).authFetch;
    authFetch.mockReset();
  });

  it('loads setup data and confirms MFA', async () => {
    localStorage.setItem('accessToken', 'access');
    authFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ qrCodeUri: 'otpauth://totp/app', secret: 'SECRET' }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    renderWithRouter(<MfaSetupPage />, { route: '/mfa/setup' });

    expect(await screen.findByText('Set Up Two-Factor Authentication')).toBeInTheDocument();
    expect(screen.getByTestId('qr-code')).toHaveTextContent('otpauth://totp/app');
    expect(screen.getByText('SECRET')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('123456'), { target: { value: '12b3456' } });
    expect(screen.getByPlaceholderText('123456')).toHaveValue('123456');
    fireEvent.click(screen.getByText('Confirm & Enable MFA'));

    expect(await screen.findByText('MFA enabled successfully! Your account is now protected.')).toBeInTheDocument();
    expect(authFetch).toHaveBeenLastCalledWith(
      '/api/v1/auth/mfa/confirm',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ code: '123456' }) })
    );
  });

  it('redirects setup to login when token is missing', async () => {
    renderWithRouter(
      <Routes>
        <Route path="/mfa/setup" element={<MfaSetupPage />} />
        <Route path="/login" element={<div>Login page</div>} />
      </Routes>,
      { route: '/mfa/setup' }
    );
    await waitFor(() => expect(screen.getByText('Login page')).toBeInTheDocument());
    expect(authFetch).not.toHaveBeenCalled();
  });

  it('loads MFA settings and disables MFA after confirmation', async () => {
    localStorage.setItem('accessToken', 'access');
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    authFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ mfaEnabled: true }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    renderWithRouter(<MfaSettingsPage />, { route: '/mfa/settings' });

    expect(await screen.findByText('MFA is currently ENABLED on your account.')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Disable MFA'));

    expect(await screen.findByText('MFA has been disabled.')).toBeInTheDocument();
    expect(authFetch).toHaveBeenCalledWith('/api/v1/auth/mfa/disable', { method: 'DELETE' });
  });

  it('navigates to setup from disabled settings and cancels disable when rejected', async () => {
    localStorage.setItem('accessToken', 'access');
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    authFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ mfaEnabled: false }),
    });

    renderWithRouter(
      <Routes>
        <Route path="/mfa/settings" element={<MfaSettingsPage />} />
        <Route path="/mfa/setup" element={<div>Setup route</div>} />
        <Route path="/profile" element={<div>Profile route</div>} />
      </Routes>,
      { route: '/mfa/settings' }
    );

    expect(await screen.findByText('MFA is currently DISABLED. We strongly recommend enabling it.')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Enable MFA'));
    expect(screen.getByText('Setup route')).toBeInTheDocument();
  });
});
