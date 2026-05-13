import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CreateArticlePage from './CreateArticlePage';
import { authFetch } from '../utils/authFetch';
import { renderWithRouter } from '../test/renderWithRouter';

vi.mock('../utils/authFetch', () => ({ authFetch: vi.fn() }));

function jsonResponse(body, ok = true, status = ok ? 200 : 500) {
  return {
    ok,
    status,
    json: async () => body,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  };
}

function renderPage(route = '/articles/create') {
  return renderWithRouter(
    <Routes>
      <Route path="/articles/create" element={<CreateArticlePage darkMode={false} />} />
      <Route path="/articles/:articleId" element={<div>Article destination</div>} />
      <Route path="/profile" element={<div>Profile destination</div>} />
    </Routes>,
    { route }
  );
}

describe('CreateArticlePage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    authFetch.mockResolvedValue(jsonResponse({ id: 44 }));
    global.URL.createObjectURL = vi.fn(() => 'blob:preview');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('publishes a new article with tags and navigates to the created article', async () => {
    renderPage();

    fireEvent.change(screen.getByPlaceholderText('Title'), {
      target: { value: 'Smart lighting guide' },
    });
    fireEvent.change(screen.getByPlaceholderText('Write your article here...'), {
      target: { value: 'This article explains useful smart lighting automations.' },
    });
    fireEvent.click(screen.getByText('+ Confort'));

    fireEvent.click(screen.getByRole('button', { name: 'Publish' }));

    await waitFor(() => expect(authFetch).toHaveBeenCalledWith(
      '/api/v1/articles',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          title: 'Smart lighting guide',
          content: 'This article explains useful smart lighting automations.',
          imageUrl: '',
          deviceIds: [],
          tags: ['Confort'],
          status: 'PUBLISHED',
        }),
      })
    ));
    expect(await screen.findByText('Article destination')).toBeInTheDocument();
  });

  it('saves drafts and handles cancel choices', async () => {
    renderPage();

    expect(screen.getByRole('button', { name: 'Save as Draft' })).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText('Title'), { target: { value: 'Draft title' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Keep Editing' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Save as Draft' }).at(-1));

    await waitFor(() => expect(authFetch).toHaveBeenCalledWith(
      '/api/v1/articles',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"status":"DRAFT"'),
      })
    ));
    expect(await screen.findByText('Profile destination')).toBeInTheDocument();
  });

  it('uploads, removes and rejects cover images', async () => {
    authFetch.mockResolvedValueOnce(jsonResponse({ url: '/uploaded.png' }));
    const { container } = renderPage();
    const fileInput = container.querySelector('input[type="file"]');

    fireEvent.change(fileInput, {
      target: { files: [new File(['pdf'], 'guide.pdf', { type: 'application/pdf' })] },
    });
    expect(await screen.findByText('Please select an image file (PNG, JPG, GIF).')).toBeInTheDocument();

    fireEvent.change(fileInput, {
      target: { files: [new File(['image'], 'cover.png', { type: 'image/png' })] },
    });

    expect(await screen.findByAltText('Article cover preview')).toHaveAttribute('src', '/uploaded.png');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview');

    fireEvent.click(screen.getByLabelText('Remove image'));
    expect(screen.queryByAltText('Article cover preview')).not.toBeInTheDocument();
  });

  it('handles failed uploads, drag/drop and keyboard upload entry', async () => {
    authFetch.mockResolvedValueOnce(jsonResponse('Too large on server', false, 413));
    const { container } = renderPage();
    const file = new File(['image'], 'cover.png', { type: 'image/png' });
    const uploadBox = screen.getByRole('button', { name: /Click to upload/i });
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});

    fireEvent.keyDown(uploadBox, { key: 'Enter' });
    expect(clickSpy).toHaveBeenCalled();

    fireEvent.dragOver(uploadBox);
    expect(uploadBox).toHaveClass('drag-active');
    fireEvent.drop(uploadBox, { dataTransfer: { files: [file] } });

    expect(await screen.findByText('Upload imagine eșuat: Too large on server')).toBeInTheDocument();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview');

    fireEvent.change(container.querySelector('input[type="file"]'), {
      target: { files: [new File(['x'.repeat(6 * 1024 * 1024)], 'huge.png', { type: 'image/png' })] },
    });
    expect(await screen.findByText('Image must be smaller than 5MB.')).toBeInTheDocument();
  });

  it('edits tags with enter, comma, blur, backspace and remove controls', () => {
    renderPage();
    const tagInput = screen.getByPlaceholderText('Add a tag and press Enter...');

    fireEvent.change(tagInput, { target: { value: 'Kitchen' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });
    expect(screen.getByText('Kitchen')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Add another tag...'), { target: { value: 'Kitchen' } });
    fireEvent.keyDown(screen.getByPlaceholderText('Add another tag...'), { key: ',' });
    expect(screen.getAllByText('Kitchen')).toHaveLength(1);

    fireEvent.change(screen.getByPlaceholderText('Add another tag...'), { target: { value: 'Security' } });
    fireEvent.blur(screen.getByPlaceholderText('Add another tag...'));
    expect(screen.getByText('Security')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Add another tag...'), { target: { value: 'Energy' } });
    fireEvent.keyDown(screen.getByPlaceholderText('Add another tag...'), { key: 'Enter' });
    fireEvent.change(screen.getByPlaceholderText('Add another tag...'), { target: { value: 'Audio' } });
    fireEvent.keyDown(screen.getByPlaceholderText('Add another tag...'), { key: 'Enter' });
    fireEvent.change(screen.getByPlaceholderText('Add another tag...'), { target: { value: 'Gaming' } });
    fireEvent.keyDown(screen.getByPlaceholderText('Add another tag...'), { key: 'Enter' });

    expect(screen.queryByPlaceholderText('Add another tag...')).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Remove tag Kitchen'));
    expect(screen.queryByText('Kitchen')).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Add another tag...'), { target: { value: 'This tag name is too long' } });
    fireEvent.keyDown(screen.getByPlaceholderText('Add another tag...'), { key: 'Enter' });
    expect(screen.getByText('Tags must be 20 characters or fewer.')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Add another tag...'), { target: { value: '' } });
    fireEvent.keyDown(screen.getByPlaceholderText('Add another tag...'), { key: 'Backspace' });
    expect(screen.queryByText('Gaming')).not.toBeInTheDocument();
  });

  it('loads and updates an existing published article without showing draft actions', async () => {
    authFetch
      .mockResolvedValueOnce(jsonResponse({
        id: 12,
        title: 'Existing smart home article',
        content: 'Existing useful content for readers.',
        imageUrl: '/cover.png',
        tags: ['Energy'],
        status: 'PUBLISHED',
      }))
      .mockResolvedValueOnce(jsonResponse({ id: 12 }));

    renderPage('/articles/create?articleId=12');

    expect(await screen.findByDisplayValue('Existing smart home article')).toBeInTheDocument();
    expect(screen.getByText('Energy')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save as Draft' })).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Title'), {
      target: { value: 'Updated smart home article' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => expect(authFetch).toHaveBeenLastCalledWith(
      '/api/v1/articles/12',
      expect.objectContaining({
        method: 'PUT',
        body: expect.stringContaining('"title":"Updated smart home article"'),
      })
    ));
    expect(await screen.findByText('Article destination')).toBeInTheDocument();
  });

  it('shows loading errors for edit mode and keeps draft actions for draft articles', async () => {
    authFetch.mockResolvedValueOnce(jsonResponse({}, false, 404));
    const { unmount } = renderPage('/articles/create?articleId=404');

    expect(await screen.findByText('Failed to load article (404)')).toBeInTheDocument();
    unmount();

    authFetch.mockResolvedValueOnce(jsonResponse({
      id: 18,
      title: 'Draft smart article',
      content: 'Draft content that is still being shaped.',
      tags: [],
      status: 'DRAFT',
    }));
    renderPage('/articles/create?articleId=18');

    expect(await screen.findByDisplayValue('Draft smart article')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save as Draft' })).toBeInTheDocument();
  });
});
