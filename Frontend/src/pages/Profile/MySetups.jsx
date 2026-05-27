import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Tag, Heart, MessageCircle, Plus, X, Trash2, Edit3, ExternalLink, Eye, AlertTriangle } from "lucide-react";
import { useError } from "../../context/ErrorContext";
import { fuzzyFilter } from "../../utils/fuzzySearch";
import { SETUP_TAG_GROUPS } from "../../utils/setupTags";
import { MY_SETUPS_PAGE_SIZE } from "../../config/pagination";
import Pagination from "../../components/Pagination";
import "./MyArticles.css";
import "./MySetups.css";

const API_BASE = `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:20025'}/api/v1`;

export default function MySetups({ isDark }) {
  const navigate = useNavigate();
  const { showError, showSuccess } = useError();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("drafts");
  const [drafts, setDrafts] = useState([]);
  const [published, setPublished] = useState([]);
  const [draftsPage, setDraftsPage] = useState(0);
  const [publishedPage, setPublishedPage] = useState(0);
  const [draftsTotalPages, setDraftsTotalPages] = useState(1);
  const [publishedTotalPages, setPublishedTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [titleError, setTitleError] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Delete confirmation modal
  const [deleteTarget, setDeleteTarget] = useState(null); // {id, isDraft, name}

  // Publish modal
  const [publishTarget, setPublishTarget] = useState(null); // {id, name}
  const [publishDescription, setPublishDescription] = useState('');
  const [publishSelectedTags, setPublishSelectedTags] = useState([]);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    fetchSetups();
  }, [draftsPage, publishedPage]);

  const fetchSetups = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) { setDrafts([]); setPublished([]); setLoading(false); return; }

      const [draftsRes, publishedRes] = await Promise.all([
        fetch(`${API_BASE}/setups/user/drafts?page=${draftsPage}&size=${MY_SETUPS_PAGE_SIZE}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/setups/user/published?page=${publishedPage}&size=${MY_SETUPS_PAGE_SIZE}`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (draftsRes.ok) {
        const d = await draftsRes.json();
        setDrafts(d.content || []);
        setDraftsTotalPages(d.totalPages || 1);
      }
      if (publishedRes.ok) {
        const d = await publishedRes.json();
        setPublished(d.content || []);
        setPublishedTotalPages(d.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch setups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSetup = async () => {
    if (!newTitle.trim()) { setTitleError(true); return; }
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) { showError('Please login'); return; }
      const response = await fetch(`${API_BASE}/setups`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTitle.trim() })
      });
      if (response.ok) {
        setNewTitle(""); setTitleError(false); setShowModal(false);
        fetchSetups(); showSuccess('Setup created');
      } else {
        const data = await response.json().catch(() => null);
        showError(data?.error || data?.message || 'Failed to create setup');
      }
    } catch { showError('Something went wrong. Please try again.'); }
  };

  const handlePublishConfirm = async () => {
    if (!publishTarget) return;
    setIsPublishing(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      const response = await fetch(`${API_BASE}/setups/${publishTarget.id}/publish`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: publishDescription, tags: publishSelectedTags })
      });
      if (response.ok) {
        setPublishTarget(null); setPublishDescription(''); setPublishSelectedTags([]);
        fetchSetups(); showSuccess('Setup published!');
      } else {
        const data = await response.json().catch(() => null);
        showError(data?.error || data?.message || 'Failed to publish setup');
        fetchSetups();
      }
    } catch { showError('Something went wrong. Please try again.'); }
    finally { setIsPublishing(false); }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const { id, isDraft } = deleteTarget;
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      const response = await fetch(`${API_BASE}/setups/${id}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        fetchSetups(); showSuccess(isDraft ? 'Draft deleted' : 'Published setup deleted');
      } else {
        const data = await response.json().catch(() => null);
        showError(data?.error || data?.message || 'Failed to delete setup');
        fetchSetups();
      }
    } catch { showError('Something went wrong. Please try again.'); fetchSetups(); }
    finally { setDeleteTarget(null); }
  };

  const handleOpenModal = () => { setNewTitle(""); setTitleError(false); setShowModal(true); };
  const handleCloseModal = () => { setShowModal(false); setNewTitle(""); setTitleError(false); };
  const handleKeyDown = (e) => { if (e.key === "Enter") handleCreateSetup(); if (e.key === "Escape") handleCloseModal(); };

  const filteredDrafts = fuzzyFilter(drafts, search, (s) => [s.name, s.description]);
  const filteredPublished = fuzzyFilter(published, search, (s) => [s.name, s.description]);

  const deviceCount = (setup) => setup.deviceCount ?? setup.deviceIds?.length ?? 0;

  const renderSetupCard = (setup, isDraft = false) => (
    <div key={setup.id} className="article-card">
      {setup.thumbnailUrl && (
        <div style={{ marginBottom: '12px', borderRadius: '8px', overflow: 'hidden', aspectRatio: '16 / 9', background: '#f3f4f8' }}>
          <img
            src={setup.thumbnailUrl}
            alt={setup.name}
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
      )}
      <div className="article-content">
        <h3 className="article-title">{setup.name}</h3>
        {setup.description && (
          <p className="article-preview">
            {setup.description.substring(0, 150)}{setup.description.length > 150 ? '...' : ''}
          </p>
        )}
        {setup.tags && setup.tags.length > 0 && (
          <div className="my-article-tags">
            {setup.tags.map((tag) => <span key={tag} className="my-article-tag">{tag}</span>)}
          </div>
        )}
        <div className="article-meta">
          <span className="meta-item"><Home size={14} /> {deviceCount(setup)} devices</span>
          <span className="meta-item">
            <span className="label">Likes:</span> {setup.likeCount || 0}
          </span>
          <span className="meta-item">
            <span className="label">Comments:</span> {setup.commentCount || 0}
          </span>
          <span className={`status-badge ${isDraft ? 'draft' : 'published'} created-at`}>
            {isDraft ? 'Draft' : 'Published'}
          </span>
        </div>
        {isDraft && setup.copiedFromId && (
          <div className="copied-from-banner">
            <ExternalLink size={12} />
            <span>Copied from another setup</span>
          </div>
        )}
      </div>
      <div className="card-buttons">
        {isDraft ? (
          <>
            <button className="btn-edit" onClick={() => navigate(`/builder?setupId=${setup.id}`)} title="Edit in builder">
              <Edit3 size={14} /> Edit
            </button>
            {setup.copiedFromId && (
              <button className="btn-view" onClick={() => navigate(`/setups/${setup.copiedFromId}`)} title="See the original">
                <Eye size={14} /> View original
              </button>
            )}
            <button
              className="btn-publish"
              onClick={() => {
                setPublishTarget({ id: setup.id, name: setup.name });
                setPublishDescription(setup.description || '');
                setPublishSelectedTags(setup.tags || []);
              }}
            >
              Publish
            </button>
          </>
        ) : (
          <button className="btn-view" onClick={() => navigate(`/setups/${setup.id}`)}>
            <Eye size={14} /> View
          </button>
        )}
        <button
          className="btn-delete"
          onClick={() => setDeleteTarget({ id: setup.id, isDraft, name: setup.name })}
          title={isDraft ? 'Delete this draft' : 'Delete this published setup'}
          aria-label={isDraft ? 'Delete draft' : 'Delete published setup'}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );

  const activeList = activeTab === 'drafts' ? filteredDrafts : filteredPublished;
  const emptyCopy = activeTab === 'drafts' ? 'No drafts yet.' : 'No published setups yet.';

  return (
    <div className={`my-articles-container mysetups-container ${isDark ? 'dark' : 'light'}`}>
      <div className="articles-header">
        <h2>My Setups</h2>
        <button className="create-btn" onClick={handleOpenModal}>
          <Plus size={18} /> New Setup
        </button>
      </div>

      <div className="search-bar">
        <Tag size={18} className="search-icon" />
        <input type="text" placeholder="Search for a setup" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="articles-tabs">
        <button
          type="button"
          className={`articles-tab ${activeTab === 'drafts' ? 'active' : ''}`}
          onClick={() => setActiveTab('drafts')}
          aria-pressed={activeTab === 'drafts'}
        >
          Drafts {drafts.length > 0 && <span className="tab-count">{drafts.length}</span>}
        </button>
        <button
          type="button"
          className={`articles-tab ${activeTab === 'published' ? 'active' : ''}`}
          onClick={() => setActiveTab('published')}
          aria-pressed={activeTab === 'published'}
        >
          Published {published.length > 0 && <span className="tab-count">{published.length}</span>}
        </button>
      </div>

      {loading ? (
        <p>Loading setups...</p>
      ) : activeList.length === 0 ? (
        <div className="empty-state"><p>{emptyCopy}</p></div>
      ) : (
        <>
          <div className="articles-list">
            {activeList.map((s) => renderSetupCard(s, activeTab === 'drafts'))}
          </div>
          {!search && activeTab === 'drafts' && (
            <Pagination currentPage={draftsPage} totalPages={draftsTotalPages} onPageChange={setDraftsPage} />
          )}
          {!search && activeTab === 'published' && (
            <Pagination currentPage={publishedPage} totalPages={publishedTotalPages} onPageChange={setPublishedPage} />
          )}
        </>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal} onKeyDown={(e) => { if (e.key === 'Escape') handleCloseModal(); }} role="button" tabIndex={0} aria-label="Close modal">
          <div className="modal" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} role="dialog" tabIndex={-1}>
            <div className="modal-header">
              <h2 className="modal-title">Setup nou</h2>
              <button className="modal-close" onClick={handleCloseModal}><X size={20} /></button>
            </div>
            <p className="modal-subtitle">Introdu un titlu pentru noul tău setup. Îl vei putea completa mai târziu.</p>
            <div className="modal-field">
              <label className="modal-label">Titlu setup</label>
              <input className={`modal-input ${titleError ? "input-error" : ""}`} type="text" placeholder="ex: Dormitor Automatizat" value={newTitle} onChange={(e) => { setNewTitle(e.target.value); if (titleError) setTitleError(false); }} onKeyDown={handleKeyDown} autoFocus />
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

      {/* Publish Modal */}
      {publishTarget && (
        <div className="modal-overlay" onClick={() => setPublishTarget(null)} role="button" tabIndex={0} aria-label="Close publish modal">
          <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" tabIndex={-1} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Publică setup-ul</h2>
              <button className="modal-close" onClick={() => setPublishTarget(null)}><X size={20} /></button>
            </div>
            <p className="modal-subtitle">
              <strong>{publishTarget.name}</strong> va apărea pe pagina Community și în profilul tău la secțiunea Published.
            </p>
            <div className="modal-field">
              <label className="modal-label">Descriere</label>
              <textarea
                className="modal-input"
                placeholder="Descrie setup-ul tău: ce dispozitive ai ales, pentru ce cameră..."
                value={publishDescription}
                onChange={e => setPublishDescription(e.target.value)}
                rows={4}
                style={{ resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>
            <div className="modal-field">
              <label className="modal-label">Taguri <span style={{ fontWeight: 400, opacity: 0.7 }}>({publishSelectedTags.length} selectate)</span></label>
              <div style={{ maxHeight: '220px', overflowY: 'auto', padding: '4px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '12px' }}>
                {SETUP_TAG_GROUPS.map(group => (
                  <div key={group.label} style={{ padding: '4px 8px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', opacity: 0.6, marginBottom: '6px', textTransform: 'uppercase' }}>{group.label}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {group.tags.map(tag => {
                        const selected = publishSelectedTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => setPublishSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                            style={{
                              padding: '6px 12px', borderRadius: '999px',
                              border: selected ? '2px solid #5092ce' : '2px solid rgba(0,0,0,0.12)',
                              background: selected ? '#5092ce' : 'transparent',
                              color: selected ? '#fff' : 'inherit',
                              fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s'
                            }}
                          >
                            {selected ? '✓ ' : ''}{tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button className="modal-btn-cancel" onClick={() => setPublishTarget(null)}>Anulează</button>
              <button className="modal-btn-create" onClick={handlePublishConfirm} disabled={isPublishing}>
                {isPublishing ? 'Se publică...' : '🚀 Publică'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)} role="button" tabIndex={0} aria-label="Close delete modal">
          <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" tabIndex={-1} style={{ maxWidth: '440px' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid rgba(239,68,68,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertTriangle size={20} style={{ color: '#ef4444', flexShrink: 0 }} />
                <h2 className="modal-title" style={{ color: '#ef4444' }}>
                  {deleteTarget.isDraft ? 'Șterge draft-ul' : 'Șterge setup-ul publicat'}
                </h2>
              </div>
              <button className="modal-close" onClick={() => setDeleteTarget(null)}><X size={20} /></button>
            </div>
            <div style={{ padding: '20px 0 8px 0' }}>
              {deleteTarget.isDraft ? (
                <p className="modal-subtitle">
                  Ești sigur că vrei să ștergi draft-ul <strong>"{deleteTarget.name}"</strong>? Această acțiune nu poate fi anulată.
                </p>
              ) : (
                <>
                  <p className="modal-subtitle">
                    Setup-ul <strong>"{deleteTarget.name}"</strong> va fi eliminat din feed-ul community și toate comentariile și like-urile asociate vor fi șterse.
                  </p>
                  <div style={{ marginTop: '12px', padding: '12px 16px', borderRadius: '12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', fontSize: '12px', color: '#ef4444', fontWeight: 500 }}>
                    ⚠ Această acțiune este ireversibilă.
                  </div>
                </>
              )}
            </div>
            <div className="modal-actions" style={{ marginTop: '8px' }}>
              <button className="modal-btn-cancel" onClick={() => setDeleteTarget(null)}>Anulează</button>
              <button
                onClick={handleDeleteConfirm}
                style={{ padding: '10px 24px', borderRadius: '999px', border: 'none', background: '#ef4444', color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                {deleteTarget.isDraft ? 'Da, șterge draft-ul' : 'Da, șterge tot'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
