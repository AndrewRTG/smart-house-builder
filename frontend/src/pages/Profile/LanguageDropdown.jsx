import { useState, useRef, useEffect } from "react";
import "./LanguageDropdown.css";

const languages = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "ro", label: "Română", flag: "🇷🇴" },
];

export default function LanguageDropdown({ language, setLanguage }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = languages.find((l) => l.code === language) || languages[0];

  // Închide dropdown-ul când dai click în afara lui
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="lang-dropdown" ref={ref}>
      <button className="lang-btn" onClick={() => setOpen(!open)}>
        <span>{current.flag}</span>
        <span>{current.label}</span>
        <span className={`lang-arrow ${open ? "open" : ""}`}>▾</span>
      </button>

      {open && (
        <div className="lang-menu">
          {languages.map((lang) => (
            <div
              key={lang.code}
              className={`lang-option ${language === lang.code ? "active" : ""}`}
              onClick={() => { setLanguage(lang.code); setOpen(false); }}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
              {language === lang.code && <span className="lang-check">✓</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
