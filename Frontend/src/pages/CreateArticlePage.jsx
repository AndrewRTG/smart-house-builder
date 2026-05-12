import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Upload, X, Tag } from "lucide-react";
import { authFetch } from "../utils/authFetch";
import "../styles/CreateArticlePage.css";

const SUGGESTED_TAGS = [
  "Confort",
  "Securitate",
  "Energie",
  "Entertainment",
  "Tutorial",
  "Recenzie",
  "Iluminare",
  "Audio",
  "Gaming",
  "Smart Hub",
];

export default function CreateArticlePage({ darkMode }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [searchParams] = useSearchParams();
  const articleId = searchParams.get("articleId");
  const isEditing = Boolean(articleId);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(isEditing);

  // When ?articleId=... is in the URL, pull the existing article and pre-fill
  // the form. If the fetch fails (deleted, not owned, etc.) we surface the
  // error in the same banner the create flow uses.
  useEffect(() => {
    if (!isEditing) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await authFetch(`/api/v1/articles/${articleId}`);
        if (!res.ok) {
          throw new Error(`Failed to load article (${res.status})`);
        }
        const data = await res.json();
        if (cancelled) return;
        setTitle(data.title || "");
        setContent(data.content || "");
        setImageUrl(data.imageUrl || "");
        setTags(Array.isArray(data.tags) ? data.tags : []);
      } catch (e) {
        if (!cancelled) setError(e.message || "Could not load article.");
      } finally {
        if (!cancelled) setLoadingExisting(false);
      }
    })();
    return () => { cancelled = true; };
  }, [articleId, isEditing]);

  const handleImageSelect = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (PNG, JPG, GIF).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB.");
      return;
    }

    setError(null);
    setUploading(true);

    // Arată preview local imediat
    const localPreview = URL.createObjectURL(file);
    setImageUrl(localPreview);

    try {
      const formData = new FormData();
      formData.append("file", file);
      // Nu seta Content-Type — browser-ul îl setează automat cu boundary
      const res = await authFetch("http://localhost:20025/api/v1/images/articles", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || `Upload eșuat (${res.status || "network error"})`);
      }
      const data = await res.json();
      // Înlocuiește blob URL cu URL-ul real S3
      URL.revokeObjectURL(localPreview);
      setImageUrl(data.url);
    } catch (e) {
      // Upload eșuat — ștergem preview-ul și blocăm Publish
      URL.revokeObjectURL(localPreview);
      setImageUrl("");
      setError("Upload imagine eșuat: " + (e.message || "verifică că backend-ul rulează"));
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageSelect(file);
  };

  const removeImage = () => {
    if (imageUrl && imageUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imageUrl);
    }
    setImageUrl("");
  };

  const addTag = (tag) => {
    const cleaned = tag.trim();
    if (!cleaned) return;
    if (tags.length >= 5) {
      setError("You can add up to 5 tags.");
      return;
    }
    if (cleaned.length > 20) {
      setError("Tags must be 20 characters or fewer.");
      return;
    }
    if (tags.some((t) => t.toLowerCase() === cleaned.toLowerCase())) return;
    setTags([...tags, cleaned]);
    setTagInput("");
    setError(null);
  };

  const removeTag = (tag) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };

  const handlePublish = async () => {
    if (!title.trim() || title.trim().length < 5) {
      setError("Title must be at least 5 characters.");
      return;
    }
    if (!content.trim() || content.trim().length < 10) {
      setError("Content must be at least 10 characters.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const safeImageUrl = imageUrl.startsWith("blob:") ? "" : imageUrl;

      const endpoint = isEditing ? `/api/v1/articles/${articleId}` : "/api/v1/articles";
      const method = isEditing ? "PUT" : "POST";

      const res = await authFetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          imageUrl: safeImageUrl,
          deviceIds: [],
          tags,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.message
          || data.error
          || (isEditing ? "Failed to update article." : "Failed to publish article.")
        );
      }

      const article = await res.json();
      navigate(`/articles/${article.id}`);
    } catch (e) {
      setError(e.message || (isEditing ? "Could not update article." : "Could not publish article."));
    } finally {
      setSubmitting(false);
    }
  };

  const canPublish =
    title.trim().length >= 5 &&
    content.trim().length >= 10 &&
    !uploading &&
    !submitting;

  return (
    <div className={`create-article-page ${darkMode ? "dark" : "light"}`}>
      <div className="create-article-container">
        <h1 className="page-title">{isEditing ? "Edit Article" : "Create Article"}</h1>
        {loadingExisting && <p style={{ opacity: 0.7 }}>Loading article...</p>}

        {/* Image upload */}
        <div className="image-section">
          {imageUrl ? (
            <div className="image-preview">
              <img src={imageUrl} alt="Article cover preview" />
              <button
                type="button"
                className="remove-image"
                onClick={removeImage}
                aria-label="Remove image"
              >
                <X size={20} />
              </button>
            </div>
          ) : (
            <div
              className={`image-upload-box ${dragActive ? "drag-active" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
            >
              {uploading ? (
                <>
                  <div className="spinner" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload size={48} />
                  <span className="upload-title">
                    Click to upload or drag and drop
                  </span>
                  <p className="upload-hint">PNG, JPG, GIF up to 10MB (optional)</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageSelect(e.target.files?.[0])}
                hidden
              />
            </div>
          )}
        </div>

        {/* Title */}
        <input
          type="text"
          className="title-input"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
        />
        <div className="char-count">{title.length} / 200</div>

        {/* Tags */}
        <div className="tags-section">
          <label className="tags-label">
            <Tag size={16} /> Tags <span className="tags-hint">(up to 5, helps people discover your article)</span>
          </label>

          <div className="tags-input-wrapper">
            {tags.map((tag) => (
              <span key={tag} className="tag-chip">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  aria-label={`Remove tag ${tag}`}
                >
                  <X size={14} />
                </button>
              </span>
            ))}
            {tags.length < 5 && (
              <input
                type="text"
                className="tag-input"
                placeholder={tags.length === 0 ? "Add a tag and press Enter..." : "Add another tag..."}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={() => tagInput && addTag(tagInput)}
                maxLength={20}
              />
            )}
          </div>

          <div className="suggested-tags">
            <span className="suggested-label">Suggestions:</span>
            {SUGGESTED_TAGS.filter((t) => !tags.includes(t)).slice(0, 6).map((tag) => (
              <button
                key={tag}
                type="button"
                className="suggested-tag"
                onClick={() => addTag(tag)}
                disabled={tags.length >= 5}
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <textarea
          className="content-input"
          placeholder="Write your article here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={14}
        />

        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}

        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate(-1)}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handlePublish}
            disabled={!canPublish}
          >
            {submitting
              ? (isEditing ? "Saving..." : "Publishing...")
              : (isEditing ? "Save Changes" : "Publish")}
          </button>
        </div>

      </div>
    </div>
  );
}