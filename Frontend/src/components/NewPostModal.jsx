import { X, Layout, FileText } from "lucide-react";
import { useEffect } from "react";
import "./NewPostModal.css";

export default function NewPostModal({ isOpen, onClose, onChooseSetup, onChooseArticle, darkMode }) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={`new-post-modal-overlay ${darkMode ? "dark" : "light"}`} onClick={onClose}>
      <div
        className="new-post-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="new-post-title"
      >
        <button className="new-post-close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        <h2 id="new-post-title" className="new-post-title">Ce vrei sa creezi?</h2>
        <p className="new-post-subtitle">Choose the type of post you'd like to share with the community.</p>

        <div className="new-post-options">
          <button className="new-post-option setup" onClick={onChooseSetup}>
            <div className="option-icon">
              <Layout size={36} />
            </div>
            <h3>New Setup</h3>
            <p>Build a smart home configuration with the visual builder.</p>
          </button>

          <button className="new-post-option article" onClick={onChooseArticle}>
            <div className="option-icon">
              <FileText size={36} />
            </div>
            <h3>New Article</h3>
            <p>Write a guide, review, or tutorial to share what you've learned.</p>
          </button>
        </div>
      </div>
    </div>
  );
}
