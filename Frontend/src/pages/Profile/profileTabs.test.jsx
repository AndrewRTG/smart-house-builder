import React from 'react';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorProvider } from '../../context/ErrorContext';
import ErrorBanner from '../../components/ErrorBanner';
import ProfilePage from './ProfilePage';
import MyArticles from './MyArticles';
import MySetups from './MySetups';
import Wishlist from './Wishlist';
import Activity from './Activity';
import Settings from './Settings';
import Sidebar from './Sidebar';
import { authFetch } from '../../utils/authFetch';
import { renderWithRouter } from '../../test/renderWithRouter';

vi.mock('../../utils/authFetch', () => ({
  authFetch: vi.fn(),
}));

function jsonResponse(body, ok = true, status = ok ? 200 : 500) {
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    json: async () => body,
  };
}

function renderInShell(ui, route = '/') {
  return renderWithRouter(
    <ErrorProvider>
      <ErrorBanner />
      <Routes>
        <Route path="/" element={ui} />
        <Route path="/login" element={<div>Login route</div>} />
        <Route path="/builder" element={<div>Builder route</div>} />
        <Route path="/articles/create" element={<div>Create article route</div>} />
        <Route path="/article/:id" element={<div>Article detail route</div>} />
        <Route path="/articles/create" element={<div>Edit article route</div>} />
        <Route path="/setups/:id" element={<div>Setup detail route</div>} />
        <Route path="/mfa/setup" element={<div>MFA setup route</div>} />
      </Routes>
    </ErrorProvider>,
    { route }
  );
}

const profile = {
  username: 'ana',
  email: 'ana@example.com',
  avatarUrl: '/avatar.png',
  mfaEnabled: true,
};

describe('Profile area', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('accessToken', 'token');
    authFetch.mockReset();
    global.fetch = vi.fn();
  });

  it('ProfilePage fetches the user, changes tabs, and redirects guests', async () => {
    // MyArticles now hits TWO endpoints (drafts + published) instead of one,
    // so the mock has to stack three authFetch responses: profile, drafts, published.
    authFetch
      .mockResolvedValueOnce(jsonResponse(profile))   // /auth/me on mount
      .mockResolvedValueOnce(jsonResponse({ content: [], totalPages: 1, totalElements: 0 }))   // drafts
      .mockResolvedValueOnce(jsonResponse({ content: [], totalPages: 1, totalElements: 0 })); // published
    fetch.mockResolvedValue(jsonResponse({ content: [] }));
    const { unmount } = renderInShell(<ProfilePage darkMode={false} />);

    expect(await screen.findByText('ana')).toBeInTheDocument();
    expect(screen.getByText('ana@example.com')).toBeInTheDocument();
    fireEvent.click(screen.getByText('My Articles'));
    // The default tab is "Drafts" with the new tabbed UI, so we look for
    // the drafts-specific empty-state copy.
    expect(
      await screen.findByText(/No drafts yet/i)
    ).toBeInTheDocument();
    fireEvent.click(screen.getByText('Settings'));
    expect(screen.getByText('Account Settings')).toBeInTheDocument();
    unmount();

    localStorage.clear();
    renderInShell(<ProfilePage darkMode={false} />);
    await waitFor(() => expect(screen.getByText('Login route')).toBeInTheDocument());
  });

  it('MyArticles lists, routes, and deletes articles', async () => {
    // Drafts list (default tab) is empty; the article we want to test lives
    // in Published so we can exercise the "View" button (drafts have a
    // Publish button instead of View).
    authFetch
      .mockResolvedValueOnce(jsonResponse({ content: [], totalPages: 1, totalElements: 0 }))  // drafts
      .mockResolvedValueOnce(jsonResponse({ content: [                                       // published
        {
          id: 12,
          title: 'Smart lighting tips',
          content: 'Helpful content for rooms and scenes',
          imageUrl: '/article.png',
          tags: ['Lighting'],
          likeCount: 8,
          commentCount: 2,
          createdAt: '2026-05-11T10:00:00',
          status: 'PUBLISHED',
        },
      ], totalPages: 1, totalElements: 1 }))
      .mockResolvedValueOnce(jsonResponse({}));                      // delete response (unused here)
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderInShell(<MyArticles isDark={false} profile={profile} />);
    // Switch to Published tab where the article actually lives.
    fireEvent.click(await screen.findByRole('button', { name: /Published/i }));
    expect(await screen.findByText('Smart lighting tips')).toBeInTheDocument();
    expect(screen.getByText('Lighting')).toBeInTheDocument();

    fireEvent.click(screen.getByTitle('View article'));
    expect(screen.getByText('Article detail route')).toBeInTheDocument();
  });

  it('MyArticles removes an article after delete succeeds', async () => {
    // Article is a draft (default tab), so delete is reachable on the
    // first render without switching tabs.
    authFetch
      .mockResolvedValueOnce(jsonResponse({ content: [                                       // drafts
        { id: 12, title: 'Draft article', content: 'abc', tags: [], status: 'DRAFT' },
      ], totalPages: 1, totalElements: 1 }))
      .mockResolvedValueOnce(jsonResponse({ content: [], totalPages: 1, totalElements: 0 }))  // published
      .mockResolvedValueOnce(jsonResponse({}));                                                // delete response
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderInShell(<MyArticles isDark={false} profile={profile} />);

    expect(await screen.findByText('Draft article')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Delete article'));
    await waitFor(() => expect(screen.queryByText('Draft article')).not.toBeInTheDocument());
  });

  it('Wishlist lists, filters, views, removes, and collapses saved setups', async () => {
    fetch
      .mockResolvedValueOnce(jsonResponse({
        content: [
          { id: 1, setupId: 101, setupName: 'Living setup', createdAt: '2026-05-01T10:00:00' },
          { id: 2, setupId: 102, setupName: 'Kitchen setup', createdAt: '2026-05-02T10:00:00' },
        ],
      }))
      .mockResolvedValueOnce(jsonResponse({}))
      .mockResolvedValueOnce(jsonResponse({ content: [] }));

    renderInShell(<Wishlist isDark={false} />);
    expect(await screen.findByText('Living setup')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Search wishlist'), { target: { value: 'kitchen' } });
    expect(screen.queryByText('Living setup')).not.toBeInTheDocument();
    expect(screen.getByText('Kitchen setup')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Search wishlist'), { target: { value: '' } });
    fireEvent.click(within(screen.getByText('Living setup').closest('.wishlist-card')).getByText('View'));
    expect(screen.getByText('Setup detail route')).toBeInTheDocument();
  });

  it('Wishlist removes items and handles collapsed, missing-token, and failed load states', async () => {
    fetch
      .mockResolvedValueOnce(jsonResponse({
        content: [{ id: 1, setupId: 101, setupName: 'Living setup', createdAt: '2026-05-01T10:00:00' }],
      }))
      .mockResolvedValueOnce(jsonResponse({}))
      .mockResolvedValueOnce(jsonResponse({ content: [] }));

    const { unmount } = renderInShell(<Wishlist isDark />);
    expect(await screen.findByText('Living setup')).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Remove from wishlist'));
    expect(await screen.findByText('Removed from wishlist.')).toBeInTheDocument();
    expect(await screen.findByText('No wishlisted setups yet.')).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Saved setups/));
    expect(screen.queryByText('No wishlisted setups yet.')).not.toBeInTheDocument();
    unmount();

    localStorage.clear();
    renderInShell(<Wishlist isDark={false} />);
    expect(await screen.findByText('No wishlisted setups yet.')).toBeInTheDocument();
    unmount();

    localStorage.setItem('accessToken', 'token');
    fetch.mockResolvedValueOnce(jsonResponse({}, false, 500));
    renderInShell(<Wishlist isDark={false} />);
    expect(await screen.findByText("Couldn't load your wishlist.")).toBeInTheDocument();
  });

  it('Activity shows loading, data, empty, and missing-token states', async () => {
    authFetch.mockResolvedValueOnce(jsonResponse([
      {
        type: 'COMMENT_RECEIVED',
        actorUsername: 'Mara',
        targetType: 'SETUP',
        targetId: 44,
        targetTitle: 'Kitchen',
        commentId: 7,
        excerpt: 'Great setup',
        timestamp: new Date().toISOString(),
      },
    ]));

    const { unmount } = renderInShell(<Activity />);
    expect(await screen.findByText(/Mara commented on/)).toBeInTheDocument();
    expect(screen.getByText('Kitchen')).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Mara commented on/).closest('button'));
    expect(screen.getByText('Setup detail route')).toBeInTheDocument();
    unmount();

    authFetch.mockResolvedValueOnce(jsonResponse([]));
    renderInShell(<Activity />);
    expect(await screen.findByText(/No activity yet/)).toBeInTheDocument();
    unmount();

    localStorage.clear();
    renderInShell(<Activity />);
    expect(await screen.findByText('Please log in to see your activity.')).toBeInTheDocument();
  });

  it('MySetups loads drafts and published setups, creates, publishes, deletes, and routes cards', async () => {
    fetch
      .mockResolvedValueOnce(jsonResponse({ content: [
        { id: 1, name: 'Draft kitchen', description: 'draft', copiedFromId: 55, tags: ['Kitchen'], likes: 1, comments: 2 },
      ]}))
      .mockResolvedValueOnce(jsonResponse({ content: [
        { id: 2, name: 'Published living', description: 'published', tags: ['Living'], likes: 5, comments: 1 },
      ]}))
      .mockResolvedValue(jsonResponse({}));
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderInShell(<MySetups isDark={false} />);
    expect(await screen.findByText('Draft kitchen')).toBeInTheDocument();
    fireEvent.click(screen.getByText('View original'));
    expect(screen.getByText('Setup detail route')).toBeInTheDocument();
  });

  it('MySetups publishes and deletes setup cards', async () => {
    fetch
      .mockResolvedValueOnce(jsonResponse({ content: [
        { id: 1, name: 'Draft kitchen', description: 'draft', tags: ['Kitchen'], likes: 1, comments: 2 },
      ]}))
      .mockResolvedValueOnce(jsonResponse({ content: [
        { id: 2, name: 'Published living', description: 'published', tags: ['Living'], likes: 5, comments: 1 },
      ]}))
      .mockResolvedValueOnce(jsonResponse({}))
      .mockResolvedValueOnce(jsonResponse({ content: [] }))
      .mockResolvedValueOnce(jsonResponse({ content: [] }))
      .mockResolvedValueOnce(jsonResponse({}))
      .mockResolvedValueOnce(jsonResponse({ content: [] }))
      .mockResolvedValueOnce(jsonResponse({ content: [] }));
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const { unmount } = renderInShell(<MySetups isDark={false} />);
    expect(await screen.findByText('Draft kitchen')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Publish'));
    fireEvent.click(screen.getByRole('button', { name: /public/i }));
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      'http://localhost:20025/api/v1/setups/1/publish',
      expect.objectContaining({ method: 'PUT' })
    ));

    fireEvent.click(screen.getByText('Published'));
    await screen.findByText('No published setups yet.');
    unmount();

    fetch.mockReset();
    fetch
      .mockResolvedValueOnce(jsonResponse({ content: [] }))
      .mockResolvedValueOnce(jsonResponse({ content: [
        { id: 2, name: 'Published living', description: 'published', tags: ['Living'], likes: 5, comments: 1 },
      ]}))
      .mockResolvedValueOnce(jsonResponse({}))
      .mockResolvedValueOnce(jsonResponse({ content: [] }))
      .mockResolvedValueOnce(jsonResponse({ content: [] }));

    renderInShell(<MySetups isDark={false} />);
    fireEvent.click(await screen.findByText('Published'));
    expect(await screen.findByText('Published living')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Delete published setup'));
    fireEvent.click(screen.getByRole('button', { name: /tot/i }));
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      'http://localhost:20025/api/v1/setups/2',
      expect.objectContaining({ method: 'DELETE' })
    ));
  });

  it('MySetups validates a new setup title and sends create requests', async () => {
    fetch
      .mockResolvedValueOnce(jsonResponse({ content: [] }))
      .mockResolvedValueOnce(jsonResponse({ content: [] }))
      .mockResolvedValueOnce(jsonResponse({}))
      .mockResolvedValueOnce(jsonResponse({ content: [] }))
      .mockResolvedValueOnce(jsonResponse({ content: [] }));

    renderInShell(<MySetups isDark={false} />);
    expect(await screen.findByText('No drafts yet.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /new setup/i }));
    fireEvent.click(screen.getByText(/Creeaz/));
    expect(screen.getByText(/Te rog introdu un titlu/i)).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/Dormitor/), { target: { value: 'New setup' } });
    fireEvent.click(screen.getByText(/Creeaz/));
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      'http://localhost:20025/api/v1/setups',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ name: 'New setup' }) })
    ));
  });

  it('MySetups opens and closes the create modal from keyboard actions', async () => {
    fetch
      .mockResolvedValueOnce(jsonResponse({ content: [] }))
      .mockResolvedValueOnce(jsonResponse({ content: [] }));

    renderInShell(<MySetups isDark={false} />);
    expect(await screen.findByText('No drafts yet.')).toBeInTheDocument();
    // Open via click (native <button> doesn't fire activation on keyDown in
    // jsdom). Close via Escape on the modal overlay — that path uses our own
    // onKeyDown handler so jsdom can exercise it.
    fireEvent.click(screen.getByRole('button', { name: /new setup/i }));
    expect(screen.getByText('Setup nou')).toBeInTheDocument();
    fireEvent.keyDown(screen.getByLabelText('Close modal'), { key: 'Escape' });
    expect(screen.queryByText('Setup nou')).not.toBeInTheDocument();
  });

  it('Settings edits username/email, toggles MFA, validates avatar, and shows delete account info', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    fetch.mockResolvedValue(jsonResponse({ available: true }));
    authFetch.mockResolvedValue(jsonResponse({ url: '/new-avatar.png' }));

    renderInShell(<Settings profile={profile} />);

    fireEvent.click(screen.getAllByText('Edit')[0]);
    fireEvent.change(screen.getByDisplayValue('ana'), { target: { value: 'anca' } });
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      'http://localhost:20025/api/v1/auth/check-username',
      expect.objectContaining({ method: 'POST' })
    ), { timeout: 1500 });
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(authFetch).toHaveBeenCalledWith(
      'http://localhost:20025/api/v1/users/username',
      expect.objectContaining({ method: 'PUT', body: JSON.stringify({ newUsername: 'anca' }) })
    ));

    fireEvent.click(screen.getAllByText('Edit')[1]);
    fireEvent.change(screen.getByDisplayValue('ana@example.com'), { target: { value: 'anca@example.com' } });
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(authFetch).toHaveBeenCalledWith(
      'http://localhost:20025/api/v1/users/email',
      expect.objectContaining({ method: 'PUT', body: JSON.stringify({ newEmail: 'anca@example.com' }) })
    ));

    fireEvent.click(screen.getByRole('checkbox', { name: /two-factor/i }));
    await waitFor(() => expect(authFetch).toHaveBeenCalledWith(
      'http://localhost:20025/api/v1/auth/mfa/disable',
      { method: 'DELETE' }
    ));

    const fileInput = document.querySelector('input[type="file"]');
    fireEvent.change(fileInput, { target: { files: [new File(['x'], 'note.txt', { type: 'text/plain' })] } });
    fireEvent.click(screen.getByText('Delete Account'));
    expect(window.alert).toHaveBeenCalled();
  });

  it('Settings routes MFA setup, handles save validation, avatar upload success, and keyboard cancel', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    authFetch
      .mockResolvedValueOnce(jsonResponse({}))                            // notification-preferences GET on mount
      .mockResolvedValueOnce(jsonResponse({ url: '/uploaded-avatar.png' }))
      .mockResolvedValueOnce(jsonResponse({}));

    renderInShell(<Settings profile={{ ...profile, mfaEnabled: false, avatarUrl: '' }} />);

    fireEvent.click(screen.getByRole('checkbox', { name: /two-factor/i }));
    expect(screen.getByText('MFA setup route')).toBeInTheDocument();
  });

  it('Settings uploads avatars and rejects invalid username/email saves', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    fetch.mockResolvedValue(jsonResponse({ available: false }));
    authFetch
      .mockResolvedValueOnce(jsonResponse({}))                            // notification-preferences GET on mount
      .mockResolvedValueOnce(jsonResponse({ url: '/uploaded-avatar.png' }))
      .mockResolvedValueOnce(jsonResponse({}));

    renderInShell(<Settings profile={{ ...profile, avatarUrl: '' }} />);

    fireEvent.click(screen.getAllByText('Edit')[0]);
    fireEvent.change(screen.getByDisplayValue('ana'), { target: { value: '' } });
    fireEvent.click(screen.getByText('Save'));
    expect(await screen.findByText('Username cannot be empty')).toBeInTheDocument();

    fireEvent.change(document.querySelector('input.setting-input'), { target: { value: 'taken' } });
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    fireEvent.click(screen.getByText('Save'));
    expect(await screen.findByText(/already taken|Please wait/)).toBeInTheDocument();

    fireEvent.click(screen.getAllByText('Cancel')[0]);
    fireEvent.click(screen.getAllByText('Edit')[1]);
    fireEvent.change(screen.getByDisplayValue('ana@example.com'), { target: { value: '' } });
    fireEvent.click(screen.getByText('Save'));
    expect(await screen.findByText('Email cannot be empty')).toBeInTheDocument();

    const fileInput = document.querySelector('input[type="file"]');
    fireEvent.change(fileInput, {
      target: { files: [new File(['avatar'], 'avatar.png', { type: 'image/png' })] },
    });
    await waitFor(() => expect(authFetch).toHaveBeenCalledWith(
      'http://localhost:20025/api/v1/images/avatars',
      expect.objectContaining({ method: 'POST' })
    ));
    expect(await screen.findByText('Profile photo updated.')).toBeInTheDocument();
  });

  it('Settings handles keyboard save and cancel for editable fields', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    fetch.mockResolvedValue(jsonResponse({ available: true }));
    authFetch.mockResolvedValue(jsonResponse({}));

    renderInShell(<Settings profile={profile} />);

    fireEvent.click(screen.getAllByText('Edit')[0]);
    const usernameInput = document.querySelector('input.setting-input');
    fireEvent.change(usernameInput, { target: { value: 'anca' } });
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    fireEvent.keyDown(usernameInput, { key: 'Enter' });
    await waitFor(() => expect(authFetch).toHaveBeenCalledWith(
      'http://localhost:20025/api/v1/users/username',
      expect.objectContaining({ method: 'PUT' })
    ));

    fireEvent.click(screen.getAllByText('Edit')[0]);
    fireEvent.keyDown(document.querySelector('input.setting-input'), { key: 'Escape' });
    expect(screen.getByText('@ana')).toBeInTheDocument();

    fireEvent.click(screen.getAllByText('Edit')[1]);
    const emailInput = document.querySelector('input.setting-input');
    fireEvent.change(emailInput, { target: { value: 'new@example.com' } });
    fireEvent.keyDown(emailInput, { key: 'Escape' });
    expect(screen.getByText('ana@example.com')).toBeInTheDocument();
  });

  it('legacy profile Sidebar computes initials, stats, navigation, and modal action', () => {
    const onNavigate = vi.fn();
    const onOpenModal = vi.fn();
    renderInShell(
      <Sidebar
        profile={{ name: 'Ana Maria', email: 'ana@example.com' }}
        activePage="wishlist"
        onNavigate={onNavigate}
        setupCount={3}
        onOpenModal={onOpenModal}
        setups={[
          { statusColor: 'published', likes: 5 },
          { statusColor: 'draft', likes: 20 },
        ]}
      />
    );

    expect(screen.getByText('AM')).toBeInTheDocument();
    expect(screen.getByText('@ana.maria')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Setup-urile mele/));
    expect(onNavigate).toHaveBeenCalledWith('mysetups');
    fireEvent.click(screen.getByText('+ Create New Setup'));
    expect(onNavigate).toHaveBeenCalledWith('mysetups');
    expect(onOpenModal).toHaveBeenCalled();
  });
});
