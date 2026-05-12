import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import ForgotPasswordPage from './ForgotPasswordPage';
import ResetPasswordPage from './ResetPasswordPage';
import VerifyEmailPage from './VerifyEmailPage';
import MfaVerifyPage from './MfaVerifyPage';
import OAuthCallbackPage from './OAuthCallbackPage';
import NotFoundPage from './NotFoundPage';
import { renderWithRouter } from '../test/renderWithRouter';

describe('authentication pages', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    global.fetch = vi.fn();
  });

  it('logs in and stores tokens when MFA is not required', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ accessToken: 'access', refreshToken: 'refresh' }),
    });

    renderWithRouter(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/profile" element={<div>Profile loaded</div>} />
      </Routes>,
      { route: '/login' }
    );

    fireEvent.change(screen.getByPlaceholderText('Username or Email'), { target: { value: 'ana' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => expect(screen.getByText('Profile loaded')).toBeInTheDocument());
    expect(localStorage.getItem('accessToken')).toBe('access');
    expect(localStorage.getItem('refreshToken')).toBe('refresh');
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:20025/api/v1/auth/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ identifier: 'ana', password: 'secret' }),
      })
    );
  });

  it('routes MFA logins to verification and reports login failures', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ mfaRequired: true, mfaToken: 'mfa-token' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });

    const { unmount } = renderWithRouter(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/mfa/verify" element={<div>MFA screen</div>} />
      </Routes>,
      { route: '/login' }
    );
    fireEvent.change(screen.getByPlaceholderText('Username or Email'), { target: { value: 'ana' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByText('Submit'));
    await waitFor(() => expect(screen.getByText('MFA screen')).toBeInTheDocument());
    expect(sessionStorage.getItem('mfaToken')).toBe('mfa-token');
    unmount();

    renderWithRouter(<LoginPage />, { route: '/login' });
    fireEvent.change(screen.getByPlaceholderText('Username or Email'), { target: { value: 'ana' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByText('Submit'));
    expect(await screen.findByText('Invalid username or password.')).toBeInTheDocument();
  });

  it('validates and submits registration forms', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    renderWithRouter(<RegisterPage />, { route: '/register' });

    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'ana' } });
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'ana@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'secret123' } });
    fireEvent.change(screen.getByPlaceholderText('Verify Password'), { target: { value: 'different' } });
    fireEvent.click(screen.getByText('Submit'));
    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Verify Password'), { target: { value: 'secret123' } });
    fireEvent.click(screen.getByText('Submit'));
    expect(screen.getByText('You must accept the Terms of Service.')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('I have read and consent to the Terms of Service'));
    fireEvent.click(screen.getByText('Submit'));
    expect(await screen.findByText('Account created successfully. Please check your email to verify your account.')).toBeInTheDocument();
  });

  it('surfaces server field errors during registration', async () => {
    fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ fields: { username: 'Username exists', email: 'Email exists' } }),
    });
    renderWithRouter(<RegisterPage />, { route: '/register' });

    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'ana' } });
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'ana@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'secret123' } });
    fireEvent.change(screen.getByPlaceholderText('Verify Password'), { target: { value: 'secret123' } });
    fireEvent.click(screen.getByLabelText('I have read and consent to the Terms of Service'));
    fireEvent.click(screen.getByText('Submit'));

    expect(await screen.findByText('Username exists')).toBeInTheDocument();
    expect(screen.getByText('Email exists')).toBeInTheDocument();
  });

  it('handles forgot and reset password flows', async () => {
    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    const { unmount } = renderWithRouter(<ForgotPasswordPage />, { route: '/forgot-password' });
    fireEvent.change(screen.getByPlaceholderText('Email address'), { target: { value: 'ana@example.com' } });
    fireEvent.click(screen.getByText('Send Reset Link'));
    expect(await screen.findByText('If an account exists with this email, a reset link has been sent. Check your inbox.')).toBeInTheDocument();
    unmount();

    renderWithRouter(
      <Routes>
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/login" element={<div>Password reset target</div>} />
      </Routes>,
      { route: '/reset-password?token=abc' }
    );
    fireEvent.change(screen.getByPlaceholderText('New password'), { target: { value: 'newpass' } });
    fireEvent.change(screen.getByPlaceholderText('Confirm new password'), { target: { value: 'other' } });
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Confirm new password'), { target: { value: 'newpass' } });
    fireEvent.click(screen.getByText('Reset Password'));
    await waitFor(() => expect(screen.getByText('Password reset target')).toBeInTheDocument());
  });

  it('shows reset token and email verification states', async () => {
    const { unmount } = renderWithRouter(<ResetPasswordPage />, { route: '/reset-password' });
    expect(screen.getByText('Invalid or missing reset token.')).toBeInTheDocument();
    unmount();

    fetch.mockResolvedValue({ ok: true, json: async () => ({}) });
    renderWithRouter(<VerifyEmailPage />, { route: '/verify-email?token=abc' });
    expect(screen.getByText(/Verifying your email/)).toBeInTheDocument();
    expect(await screen.findByText('Your email is verified. You can now sign in.')).toBeInTheDocument();
  });

  it('handles MFA verification success and missing token redirect', async () => {
    const { unmount } = renderWithRouter(
      <Routes>
        <Route path="/mfa/verify" element={<MfaVerifyPage />} />
        <Route path="/login" element={<div>Login fallback</div>} />
      </Routes>,
      { route: '/mfa/verify' }
    );
    await waitFor(() => expect(screen.getByText('Login fallback')).toBeInTheDocument());
    unmount();

    sessionStorage.setItem('mfaToken', 'mfa-token');
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ accessToken: 'access', refreshToken: 'refresh' }),
    });
    renderWithRouter(
      <Routes>
        <Route path="/mfa/verify" element={<MfaVerifyPage />} />
        <Route path="/profile" element={<div>MFA profile</div>} />
      </Routes>,
      { route: '/mfa/verify' }
    );
    fireEvent.change(screen.getByPlaceholderText('123456'), { target: { value: '12a3456' } });
    expect(screen.getByPlaceholderText('123456')).toHaveValue('123456');
    fireEvent.click(screen.getByText('Verify'));
    await waitFor(() => expect(screen.getByText('MFA profile')).toBeInTheDocument());
    expect(sessionStorage.getItem('mfaToken')).toBeNull();
  });

  it('stores OAuth callback tokens or returns to login when missing', async () => {
    const { unmount } = renderWithRouter(
      <Routes>
        <Route path="/oauth2/callback" element={<OAuthCallbackPage />} />
        <Route path="/profile" element={<div>OAuth profile</div>} />
      </Routes>,
      { route: '/oauth2/callback?token=access&refreshToken=refresh' }
    );
    await waitFor(() => expect(screen.getByText('OAuth profile')).toBeInTheDocument());
    expect(localStorage.getItem('accessToken')).toBe('access');
    expect(localStorage.getItem('refreshToken')).toBe('refresh');
    unmount();

    renderWithRouter(
      <Routes>
        <Route path="/oauth2/callback" element={<OAuthCallbackPage />} />
        <Route path="/login" element={<div>OAuth login fallback</div>} />
      </Routes>,
      { route: '/oauth2/callback' }
    );
    await waitFor(() => expect(screen.getByText('OAuth login fallback')).toBeInTheDocument());
  });

  it('renders the not found page', () => {
    renderWithRouter(<NotFoundPage />, { route: '/missing' });
    expect(screen.getByText(/404.*Page not found/)).toBeInTheDocument();
    expect(screen.getByText('Back to home')).toBeInTheDocument();
  });
});
