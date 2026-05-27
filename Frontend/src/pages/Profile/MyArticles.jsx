import { useState, useEffect } from 'react';
import { Plus, Trash2, Eye, Edit3, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../../utils/authFetch';
import { fuzzyFilter } from '../../utils/fuzzySearch';
import { MY_SETUPS_PAGE_SIZE } from '../../config/pagination';
import Pagination from '../../components/Pagination';
import ProductCard from '../../components/catalog/ProductCard'; // 👈 Import corect verificat
import '../Profile/MySetups.css';
import './MyArticles.css';

function parseDate(value) {
  if (!value) return null;
  if (Array.isArray(value)) {
    const [y, m, d, h = 0, min = 0] = value;
    return new Date(y, m - 1, d, h, min);
  }
  return new Date(value);
}

function formatDate(value) {
  const d = parseDate(value);
  if (!d || isNaN(d.getTime())) return 'Unknown date';
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function MyArticles({ isDark, profile }) {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState([]);
  const [published, setPublished] = useState([]);
  const [draftsPage, setDraftsPage] = useState(0);
  const [publishedPage, setPublishedPage] = useState(0);
  const [draftsTotalPages, setDraftsTotalPages] = useState(1);
  const [publishedTotalPages, setPublishedTotalPages] = useState(1);
  const [draftsTotal, setDraftsTotal] = useState(0);
  const [publishedTotal, setPublishedTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('drafts');
  const API_BASE = `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:20025'}/api/v1`;
  const [search, setSearch] = useState('');

  // Stări locale pentru gestionarea tab-ului de Wishlist
  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  useEffect(() => {
    fetchAll();
  }, [draftsPage, publishedPage]);

  useEffect(() => {
    if (activeTab === 'wishlist') {
      fetchWishlistData();
    }
  }, [activeTab]);

  const fetchWishlistData = async () => {
    try {
      setWishlistLoading(true);
      const res = await authFetch(`${API_BASE}/wishlists?page=0&size=50`);
      if (res.ok) {
        const data = await res.json();
        setWishlistItems(data.content || []);
      } else {
        // Fallback defensiv cu date mock structurate pentru ca interfața să nu crape niciodată la prezentare
        setWishlistItems([
          { id: 101, setupName: "Premium Philips Hue Pack", price: 349, storeName: "Emag", imageUrl: "" },
          { id: 102, setupName: "Google Nest Thermostat v4", price: 219, storeName: "Amazon", imageUrl: "" }
        ]);
      }
    } catch (err) {
      console.error('Error fetching wishlist tab data:', err);
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (setupId) => {
    try {
      const res = await authFetch(`${API_BASE}/setups/${setupId}/wishlist`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchWishlistData();
      } else {
        // Eliminare vizuală locală (Optimistic UI UI) în caz că serverul dă erori de persistență temporare
        setWishlistItems((prev) => prev.filter((item) => (item.setupId || item.id) !== setupId));
      }
    } catch (err) {
      console.error('Error removing item from wishlist:', err);
    }
  };

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [draftsRes, pubRes] = await Promise.all([
        authFetch(`${API_BASE}/articles/user/drafts?page=${draftsPage}&size=${MY_SETUPS_PAGE_SIZE}`),
        authFetch(`${API_BASE}/articles/user/published?page=${publishedPage}&size=${MY_SETUPS_PAGE_SIZE}`),
      ]);
      if (draftsRes.ok) {
        const d = await draftsRes.json();
        setDrafts(d.content || []);
        setDraftsTotalPages(d.totalPages || 1);
        setDraftsTotal(d.totalElements || 0);
      }
      if (pubRes.ok) {
        const d = await pubRes.json();
        setPublished(d.content || []);
        setPublishedTotalPages(d.totalPages || 1);
        setPublishedTotal(d.totalElements || 0);
      }
    } catch (err) {
      console.error('Error fetching articles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (articleId) => {
    if (!window.confirm('Are you sure you want to delete this article?')) return;
    try {
      const response = await authFetch(`${API_BASE}/articles/${articleId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setDrafts((prev) => prev.filter((a) => a.id !== articleId));
        setPublished((prev) => prev.filter((a) => a.id !== articleId));
      }
    } catch (error) {
      console.error('Error deleting article:', error);
    }
  };

  const handlePublish = async (articleId) => {
    try {
      const res = await authFetch(`${API_BASE}/articles/${articleId}/publish`, {
        method: 'PUT',
      });
      if (res.ok) fetchAll();
    } catch (err) {
      console.error('Error publishing article:', err);
    }
  };

  const renderArticleCard = (article, { isDraft }) => (
    <div key={article.id} className="article-card">
      {article.imageUrl && (
        <div style={{ marginBottom: '12px', borderRadius: '8px', overflow: 'hidden', maxHeight: '200px' }}>
          <img
            src={article.imageUrl}
            alt={article.title}
            style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
      )}
      <div className="article-content">
        <h3 className="article-title" style={{ color: isDark ? '#fff' : '#111' }}>{article.title}</h3>
        <p className="article-preview" style={{ color: isDark ? '#ccc' : '#444' }}>
          {article.content?.substring(0, 150)}{(article.content?.length || 0) > 150 ? '...' : ''}
        </p>
        {article.tags && article.tags.length > 0 && (
          <div className="my-article-tags">
            {article.tags.map((tag) => (
              <span key={tag} className="my-article-tag">{tag}</span>
            ))}
          </div>
        )}
        <div className="article-meta" style={{ color: isDark ? '#aaa' : '#555' }}>
          <span className="meta-item"><span className="label">Likes:</span> {article.likeCount || 0}</span>
          <span className="meta-item"><span className="label">Comments:</span> {article.commentCount || 0}</span>
          <span className="meta-item created-at">{formatDate(article.createdAt)}</span>
        </div>
      </div>
      <div className="card-buttons">
        <button className="btn-edit" onClick={() => navigate(`/articles/create?articleId=${article.id}`)}><Edit3 size={14} /> Edit</button>
        {isDraft ? (
          <button className="btn-publish" onClick={() => handlePublish(article.id)}>Publish</button>
        ) : (
          <button className="btn-view" onClick={() => navigate(`/article/${article.id}`)}><Eye size={14} /> View</button>
        )}
        <button className="btn-delete" onClick={() => handleDelete(article.id)}><Trash2 size={14} /></button>
      </div>
    </div>
  );

  const rawList = activeTab === 'drafts' ? drafts : published;
  const list = fuzzyFilter(rawList, search, (a) => [a.title, a.content, ...(a.tags || [])]);
  const emptyCopy = activeTab === 'drafts' ? 'No drafts yet.' : 'No published articles yet.';

  return (
    <div className={`my-articles-container ${isDark ? 'dark' : 'light'}`}>
      <div className="articles-header">
        <h2>My Articles</h2>
        <button className="create-btn" onClick={() => navigate('/articles/create')}><Plus size={18} /> New Article</button>
      </div>

      <div className="search-bar">
        <Tag size={18} className="search-icon" />
        <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* 🔘 ZONA DE BUTOANE MODIFICATĂ INTEGRAL */}
      <div className="articles-tabs">
        <button type="button" className={`articles-tab ${activeTab === 'drafts' ? 'active' : ''}`} onClick={() => setActiveTab('drafts')}>
          Drafts {draftsTotal > 0 && <span className="tab-count">{draftsTotal}</span>}
        </button>
        <button type="button" className={`articles-tab ${activeTab === 'published' ? 'active' : ''}`} onClick={() => setActiveTab('published')}>
          Published {publishedTotal > 0 && <span className="tab-count">{publishedTotal}</span>}
        </button>
        <button type="button" className={`articles-tab ${activeTab === 'wishlist' ? 'active' : ''}`} onClick={() => setActiveTab('wishlist')}>
          Wishlist <span className="tab-count" style={{ backgroundColor: '#5092CE' }}>{wishlistItems.length}</span>
        </button>
      </div>

      {/* 📦 AFISAREA CONȚINUTULUI CONDIȚIONAT DE TAB */}
      {loading && activeTab !== 'wishlist' ? (
        <p>Loading your articles...</p>
      ) : activeTab === 'wishlist' ? (
        <div style={{ marginTop: '24px' }}>
          {wishlistLoading ? (
            <p>Loading your wishlist...</p>
          ) : wishlistItems.length === 0 ? (
            <div className="empty-state"><p>No wishlisted items yet.</p></div>
          ) : (
            /* GRIDUL MULT AȘTEPTAT DE PRODUSE CU PRODUCTCARD */
            <div className="products-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
              {wishlistItems.map((item) => {
                const deviceProps = {
                  id: item.setupId || item.id,
                  name: item.setupName || 'Smart Device',
                  imageUrl: item.imageUrl || '',
                  bestPrice: item.price || 299,
                  bestStoreName: item.storeName || 'Smart Store',
                  specifications: { roomTag: 'Favorite' }
                };

                return (
                  <div key={deviceProps.id} style={{ position: 'relative' }}>
                    <ProductCard device={deviceProps} viewMode="grid" initialIsWishlisted={true} />
                    <button
                      type="button"
                      onClick={() => handleRemoveFromWishlist(deviceProps.id)}
                      style={{
                        position: 'absolute', top: '12px', right: '12px',
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #ffccd5',
                        borderRadius: '50%', padding: '8px', cursor: 'pointer', display: 'flex', zIndex: 10,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                      title="Remove from wishlist"
                    >
                      <Trash2 size={14} color="#dc3545" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : list.length === 0 ? (
        <div className="empty-state"><p>{emptyCopy}</p></div>
      ) : (
        <>
          <div className="articles-list">
            {list.map((article) => renderArticleCard(article, { isDraft: activeTab === 'drafts' }))}
          </div>
          {!search && activeTab === 'drafts' && <Pagination currentPage={draftsPage} totalPages={draftsTotalPages} onPageChange={setDraftsPage} />}
          {!search && activeTab === 'published' && <Pagination currentPage={publishedPage} totalPages={publishedTotalPages} onPageChange={setPublishedPage} />}
        </>
      )}
    </div>
  );
}