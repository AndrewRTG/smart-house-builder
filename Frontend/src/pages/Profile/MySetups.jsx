import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Tag, Heart, MessageCircle, Plus, X, Trash2 } from "lucide-react";
import { useError } from "../../context/ErrorContext";
import { fuzzyFilter } from "../../utils/fuzzySearch";
import "./MySetups.css";

const API_BASE = 'http://localhost:20025/api/v1';

export default function MySetups({ isDark }) {
  const navigate = useNavigate();
  const { showError, showSuccess } = useError();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("drafts");
  const [drafts, setDrafts] = useState([]);
  const [published, setPublished] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [titleError, setTitleError] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchSetups();
  }, []);

  const fetchSetups = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setDrafts([]);
        setPublished([]);
        setLoading(false);
        return;
      }

      const [draftsRes, publishedRes] = await Promise.all([
        fetch(`${API_BASE}/setups/user/drafts?page=0&size=20`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE}/setups/user/published?page=0&size=20`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (draftsRes.ok) {
        const draftsData = await draftsRes.json();
        setDrafts(draftsData.content || []);
      }
      if (publishedRes.ok) {
        const publishedData = await publishedRes.json();
        setPublished(publishedData.content || []);
      }
    } catch (error) {
      console.error('Failed to fetch setups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSetup = async () => {
    if (!newTitle.trim()) {
      setTitleError(true);
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        showError('Please login');
        return;
      }

      const response = await fetch(`${API_BASE}/setups`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newTitle.trim() })
      });

      if (response.ok) {
        setNewTitle("");
        setTitleError(false);
        setShowModal(false);
        fetchSetups();
        showSuccess('Setup created');
      } else {
        const data = await response.json().catch(() => null);
        const msg = data?.error || data?.message || response.statusText || 'Failed to create setup';
        showError(msg);
      }
    } catch (error) {
      console.error('Failed to create setup:', error);
      showError('Something went wrong. Please try again.');
    }
  };

  const handlePublish = async (setupId) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch(`${API_BASE}/setups/${setupId}/publish`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchSetups();
        showSuccess('Setup published');
      } else {
        const data = await response.json().catch(() => null);
        const msg = data?.error || data?.message || response.statusText || 'Failed to publish setup';
        showError(msg);
        fetchSetups();
      }
    } catch (error) {
      console.error('Failed to publish setup:', error);
      showError('Something went wrong. Please try again.');
      fetchSetups();
    }
  };

  const handleDelete = async (setupId, isDraft = true) => {
    // Slightly different wording for published setups so the user knows this
    // is a destructive move that also removes the setup from the community
    // feed (and deletes comments/likes attached to it — see SetupService).
    const confirmMsg = isDraft
      ? 'Are you sure you want to delete this draft?'
      : 'This will remove your published setup from the community feed and delete all its comments and likes. Continue?';
    if (!window.confirm(confirmMsg)) return;

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch(`${API_BASE}/setups/${setupId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchSetups();
        showSuccess(isDraft ? 'Draft deleted' : 'Published setup deleted');
      } else {
        const data = await response.json().catch(() => null);
        const msg = data?.error || data?.message || response.statusText || 'Failed to delete setup';
        showError(msg);
        fetchSetups();
      }
    } catch (error) {
      console.error('Failed to delete setup:', error);
      showError('Something went wrong. Please try again.');
      fetchSetups();
    }
  };

  const handleOpenModal = () => {
    setNewTitle("");
    setTitleError(false);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setNewTitle("");
    setTitleError(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleCreateSetup();
    if (e.key === "Escape") handleCloseModal();
  };

  // Fuzzy filter — same matcher Community uses, so "smrtsec" matches
  // "Smart Security Suite" the same way in both places.
  const filteredDrafts = fuzzyFilter(drafts, search, (s) => [s.name, s.description]);
  const filteredPublished = fuzzyFilter(published, search, (s) => [s.name, s.description]);

  const renderSetupCard = (setup, isDraft = false) => (
    <div className="setup-card" key={setup.id}>
      <div className="card-image">
        <span className={`status-badge ${isDraft ? 'draft' : 'published'}`}>
          {isDraft ? 'Draft' : 'Published'}
        </span>
      </div>
      <div className="card-body">
        <h3 className="card-title">{setup.name}</h3>
        <div className="card-meta">
          <span className="meta-item"><Home size={14} /> {setup.deviceCount || 0} devices</span>
          <span className="price">{setup.price || '—'}</span>
        </div>
        <div className="card-tags">
          {setup.tags?.map((tag) => <span key={tag} className="tag">{tag}</span>)}
        </div>
        <div className="card-actions">
          <span className="action-item"><Heart size={14} /> {setup.likes || 0}</span>
          <span className="action-item"><MessageCircle size={14} /> {setup.comments || 0}</span>
        </div>
        {isDraft && (
          <div className="card-buttons">
            {/* The dedicated draft-edit page (/builder?draft=:id) doesn't
                exist yet — until it does, "Edit" sends users to the same
                detail page View uses, where they can preview and publish. */}
            <button className="btn-edit" onClick={() => navigate(`/setups/${setup.id}`)}>
              Edit
            </button>
            <button className="btn-publish" onClick={() => handlePublish(setup.id)}>
              Publish
            </button>
            <button className="btn-delete" onClick={() => handleDelete(setup.id, true)}>
              <Trash2 size={14} />
            </button>
          </div>
        )}
        {!isDraft && (
          <div className="card-buttons">
            <button className="btn-view" onClick={() => navigate(`/setups/${setup.id}`)}>
              View
            </button>
            <button
              className="btn-delete"
              onClick={() => handleDelete(setup.id, false)}
              title="Delete this published setup"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="mysetups-container">
      <div className="search-bar">
        <Tag size={18} className="search-icon" />
        <input
          type="text"
          placeholder="Search for a setup"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* TABS */}
      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === 'drafts' ? 'active' : ''}`}
          onClick={() => setActiveTab('drafts')}
        >
          Drafts
        </button>
        <button
          className={`tab-btn ${activeTab === 'published' ? 'active' : ''}`}
          onClick={() => setActiveTab('published')}
        >
          Published
        </button>
      </div>

      {loading ? (
        <div className="loading-state">Loading setups...</div>
      ) : (
        <>
          {activeTab === 'drafts' && (
            <div className="cards-grid">
              {filteredDrafts.length > 0 ? (
                filteredDrafts.map((setup) => renderSetupCard(setup, true))
              ) : (
                <div className="empty-state">No drafts found</div>
              )}

              <div className="setup-card add-card" onClick={handleOpenModal}>
                <div className="add-content">
                  <Plus size={32} className="add-icon" />
                  <span>Adaugă setup nou</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'published' && (
            <div className="cards-grid">
              {filteredPublished.length > 0 ? (
                filteredPublished.map((setup) => renderSetupCard(setup, false))
              ) : (
                <div className="empty-state">No published setups found</div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Setup nou</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>
            <p className="modal-subtitle">
              Introdu un titlu pentru noul tău setup. Îl vei putea completa mai târziu.
            </p>
            <div className="modal-field">
              <label className="modal-label">Titlu setup</label>
              <input
                className={`modal-input ${titleError ? "input-error" : ""}`}
                type="text"
                placeholder="ex: Dormitor Automatizat"
                value={newTitle}
                onChange={(e) => { setNewTitle(e.target.value); if (titleError) setTitleError(false); }}
                onKeyDown={handleKeyDown}
                autoFocus
              />
              {titleError && <span className="error-msg">⚠ Te rog introdu un titlu.</span>}
            </div>
            <div className="modal-info">
              <span className="modal-badge draft">Ciornă</span>
              <span className="modal-info-text">Setup-ul va fi salvat ca ciornă</span>
            </div>
            <div className="modal-actions">
              <button className="modal-btn-cancel" onClick={handleCloseModal}>Anulează</button>
              <button className="modal-btn-create" onClick={handleCreateSetup}>Creează setup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}