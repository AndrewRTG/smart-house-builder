import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, X, Image as ImageIcon, Tag } from "lucide-react";
import { authFetch } from "../utils/authFetch";
import "../styles/CreateArticlePage.css";

const MOCK_UPLOAD = true;

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

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleImageSelect = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (PNG, JPG, GIF).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be smaller than 10MB.");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      if (MOCK_UPLOAD) {
        const localUrl = URL.createObjectURL(file);
        await new Promise((r) => setTimeout(r, 300));
        setImageUrl(localUrl);
      } else {
        const formData = new FormData();
        formData.append("file", file);
        const res = await authFetch("/api/v1/images/upload", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error("Image upload failed");
        const data = await res.json();
        setImageUrl(data.url);
      }
    } catch (e) {
      setError(e.message || "Could not upload image.");
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
      const safeImageUrl =
        MOCK_UPLOAD && imageUrl.startsWith("blob:") ? "" : imageUrl;

      const res = await authFetch("/api/v1/articles", {
        method: "POST",
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
        throw new Error(data.message || data.error || "Failed to publish article.");
      }

      const article = await res.json();
      navigate(`/articles/${article.id}`);
    } catch (e) {
      setError(e.message || "Could not publish article.");
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
        <h1 className="page-title">Create Article</h1>

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
            {submitting ? "Publishing..." : "Publish"}
          </button>
        </div>

        {MOCK_UPLOAD && (
          <p className="mock-banner">
            <ImageIcon size={14} /> Image upload is in mock mode — preview only,
            real S3 upload pending Florentina's endpoint.
          </p>
        )}
      </div>
    </div>
  );
}
