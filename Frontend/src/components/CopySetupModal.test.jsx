import React from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CopySetupModal from './CopySetupModal';
import ErrorBanner from './ErrorBanner';
import { ErrorProvider } from '../context/ErrorContext';
import { renderWithRouter } from '../test/renderWithRouter';

function jsonResponse(body, status = 200) {
  return {
    status,
    statusText: status === 500 ? 'Server error' : 'OK',
    json: async () => body,
  };
}

function renderModal(props = {}) {
  return renderWithRouter(
    <ErrorProvider>
      <ErrorBanner />
      <CopySetupModal
        isOpen
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        originalSetup={{ id: 10, name: 'Living Setup' }}
        {...props}
      />
    </ErrorProvider>
  );
}

describe('CopySetupModal', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    localStorage.setItem('accessToken', 'token');
    delete window.location;
    window.location = { href: '' };
    global.fetch = vi.fn(() => Promise.resolve(jsonResponse({ id: 99, name: 'Copy' }, 201)));
  });

  it('does not render when closed and focuses/prefills when open', () => {
    renderModal({ isOpen: false });
    expect(screen.queryByText('Copy Setup')).not.toBeInTheDocument();

    vi.useFakeTimers();
    renderModal();
    expect(screen.getByDisplayValue('Copy of Living Setup')).toBeInTheDocument();
    act(() => {
      vi.runAllTimers();
    });
    expect(screen.getByDisplayValue('Copy of Living Setup')).toHaveFocus();
    vi.useRealTimers();
  });

  it('copies a setup successfully and supports Enter/Escape shortcuts', async () => {
    const onSuccess = vi.fn();
    const onClose = vi.fn();
    renderModal({ onSuccess, onClose });

    fireEvent.change(screen.getByPlaceholderText('Enter setup name'), { target: { value: ' My copy ' } });
    fireEvent.keyDown(screen.getByPlaceholderText('Enter setup name'), { key: 'Enter' });

    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      'http://localhost:20025/api/v1/setups/10/copy',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'My copy' }),
      })
    ));
    expect(onSuccess).toHaveBeenCalledWith({ id: 99, name: 'Copy' });
    expect(await screen.findByText('Copied to My Setups as DRAFT: My copy')).toBeInTheDocument();
    expect(onClose).toHaveBeenCalled();

    fireEvent.keyDown(screen.getByRole('button', { name: 'Close modal' }), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('handles missing token, unauthorized responses and backend errors', async () => {
    localStorage.removeItem('accessToken');
    const { unmount } = renderModal();

    fireEvent.click(screen.getByText('Create Draft'));
    expect(await screen.findByText('Please login')).toBeInTheDocument();
    expect(window.location.href).toBe('/login');
    unmount();

    localStorage.setItem('accessToken', 'token');
    fetch.mockResolvedValueOnce(jsonResponse({}, 401));
    const second = renderModal();
    fireEvent.click(screen.getByText('Create Draft'));
    expect(await screen.findByText('Please login')).toBeInTheDocument();
    second.unmount();

    fetch.mockResolvedValueOnce(jsonResponse({ message: 'Cannot copy own setup' }, 400));
    renderModal();
    fireEvent.click(screen.getByText('Create Draft'));
    expect(await screen.findByText('Cannot copy own setup')).toBeInTheDocument();
  });

  it('ignores blank names, catches network failures and closes on overlay click', async () => {
    const onClose = vi.fn();
    renderModal({ onClose });

    fireEvent.change(screen.getByPlaceholderText('Enter setup name'), { target: { value: '   ' } });
    fireEvent.click(screen.getByText('Create Draft'));
    expect(fetch).not.toHaveBeenCalled();

    fireEvent.change(screen.getByPlaceholderText('Enter setup name'), { target: { value: 'Copy' } });
    fetch.mockRejectedValueOnce(new Error('offline'));
    fireEvent.click(screen.getByText('Create Draft'));
    expect(await screen.findByText('Failed to copy setup')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Close modal' }));
    expect(onClose).toHaveBeenCalled();
  });
});
