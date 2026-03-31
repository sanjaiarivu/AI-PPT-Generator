// ============================================================
// GeneratePage.jsx — Redesigned PPT Generation Page
// ============================================================

import { useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "/api";
const MIN_SLIDES = 1;
const MAX_SLIDES = 20;

// Slide count quick-pick options
const SLIDE_PRESETS = [5, 8, 10, 12, 15, 20];

// ── Floating orb background (pure CSS animated) ──────────────
function AnimatedBg() {
  return (
    <div className="gp-bg" aria-hidden="true">
      <div className="gp-orb gp-orb-1" />
      <div className="gp-orb gp-orb-2" />
      <div className="gp-orb gp-orb-3" />
      <div className="gp-grid-overlay" />
    </div>
  );
}

// ── Left panel: Presentation preview mockup ──────────────────
function PreviewPanel({ topic, numSlides, theme }) {
  const displayTopic = topic.trim() || "Your Presentation";
  const isDark = theme === "dark";

  return (
    <div className="gp-preview-panel">
      <AnimatedBg />

      <div className="gp-preview-content">
        <div className="gp-preview-label">Live Preview</div>

        {/* Main slide mockup */}
        <div className={`gp-slide-mock ${isDark ? "gp-slide-mock--dark" : ""}`}>
          <div className="gp-slide-header">
            <div className="gp-slide-dots">
              <span /><span /><span />
            </div>
          </div>
          <div className="gp-slide-body">
            <div className={`gp-slide-cover ${isDark ? "gp-slide-cover--dark" : ""}`}>
              <div className="gp-slide-cover-icon">✨</div>
              <div className="gp-slide-cover-title">{displayTopic}</div>
              <div className="gp-slide-cover-sub">AI Generated Presentation</div>
              <div className="gp-slide-cover-bar" />
            </div>
          </div>
        </div>

        {/* Slide thumbnails row */}
        <div className="gp-thumbnails">
          {Array.from({ length: Math.min(numSlides, 6) }).map((_, i) => (
            <div
              key={i}
              className={`gp-thumb ${isDark ? "gp-thumb--dark" : ""} ${i === 0 ? "gp-thumb--active" : ""}`}
            >
              <div className="gp-thumb-line" />
              <div className="gp-thumb-line gp-thumb-line--short" />
              <div className="gp-thumb-line gp-thumb-line--shorter" />
            </div>
          ))}
          {numSlides > 6 && (
            <div className="gp-thumb-more">+{numSlides - 6}</div>
          )}
        </div>

        {/* Stats */}
        <div className="gp-preview-stats">
          <div className="gp-stat">
            <span className="gp-stat-val">{numSlides + 1}</span>
            <span className="gp-stat-label">Slides</span>
          </div>
          <div className="gp-stat-divider" />
          <div className="gp-stat">
            <span className="gp-stat-val">{isDark ? "🌙" : "☀️"}</span>
            <span className="gp-stat-label">{isDark ? "Dark" : "Light"} Theme</span>
          </div>
          <div className="gp-stat-divider" />
          <div className="gp-stat">
            <span className="gp-stat-val">AI</span>
            <span className="gp-stat-label">Gemini Pro</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function GeneratePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [topic, setTopic] = useState(searchParams.get("topic") || "");
  const [numSlides, setNumSlides] = useState(8);
  const [theme, setTheme] = useState("light");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleGenerate = useCallback(
    async (e) => {
      e.preventDefault();
      setError("");
      setSuccess("");

      if (!topic.trim()) {
        setError("Please enter a presentation topic.");
        return;
      }

      setLoading(true);
      try {
        const response = await axios.post(
          `${API_BASE}/generate`,
          { topic: topic.trim(), numSlides, theme },
          { responseType: "blob", timeout: 90000 }
        );

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;

        const disposition = response.headers["content-disposition"];
        let filename = `${topic.replace(/\s+/g, "_")}_presentation.pptx`;
        if (disposition) {
          const match = disposition.match(/filename="?([^";]+)"?/);
          if (match) filename = match[1];
        }

        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        setSuccess(`"${filename}" is ready!`);
      } catch (err) {
        if (err.response) {
          if (err.response.data instanceof Blob) {
            try {
              const text = await err.response.data.text();
              const parsed = JSON.parse(text);
              setError(parsed.error || "Server error. Please try again.");
            } catch {
              setError(`Server error (${err.response.status}). Please try again.`);
            }
          } else {
            setError(err.response.data?.error || "Server error. Please try again.");
          }
        } else if (err.code === "ECONNABORTED") {
          setError("Request timed out. Please try again.");
        } else {
          setError("Could not connect to server. Make sure the backend is running.");
        }
      } finally {
        setLoading(false);
      }
    },
    [topic, numSlides, theme]
  );

  return (
    <div className="gp-root">
      {/* ── Left: Preview Panel ── */}
      <PreviewPanel topic={topic} numSlides={numSlides} theme={theme} />

      {/* ── Right: Form Panel ── */}
      <div className="gp-form-panel">
        {/* Back button */}
        <button
          id="btn-back-home"
          className="gp-back-btn"
          onClick={() => navigate("/")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Heading */}
        <div className="gp-form-heading">
          <div className="gp-form-badge">
            <span className="gp-badge-dot" />
            AI Powered
          </div>
          <h1 className="gp-form-title">
            Create your<br />
            <span className="gp-form-title-accent">Presentation</span>
          </h1>
          <p className="gp-form-sub">
            Describe your topic and let Gemini AI build a stunning deck in seconds.
          </p>
        </div>

        {/* Form */}
        <form className="gp-form" onSubmit={handleGenerate} noValidate>

          {/* Topic */}
          <div className="gp-field">
            <label className="gp-label" htmlFor="gp-topic">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              What's your topic?
            </label>
            <div className="gp-input-wrap">
              <input
                id="gp-topic"
                type="text"
                className="gp-input"
                placeholder="e.g. The Future of Artificial Intelligence"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={loading}
                maxLength={200}
                autoFocus
              />
              {topic && (
                <button
                  type="button"
                  className="gp-input-clear"
                  onClick={() => setTopic("")}
                  tabIndex={-1}
                  aria-label="Clear topic"
                >×</button>
              )}
            </div>
          </div>

          {/* Slide Count */}
          <div className="gp-field">
            <label className="gp-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
              </svg>
              Number of Slides
            </label>

            {/* Preset chips */}
            <div className="gp-slide-presets">
              {SLIDE_PRESETS.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`gp-preset-chip ${numSlides === n ? "gp-preset-chip--active" : ""}`}
                  onClick={() => setNumSlides(n)}
                  disabled={loading}
                >
                  {n}
                </button>
              ))}
            </div>

            {/* Custom slider */}
            <div className="gp-slider-row">
              <span className="gp-slider-val">{numSlides}</span>
              <input
                type="range"
                className="gp-slider"
                min={MIN_SLIDES}
                max={MAX_SLIDES}
                value={numSlides}
                style={{ "--pct": `${((numSlides - MIN_SLIDES) / (MAX_SLIDES - MIN_SLIDES)) * 100}%` }}
                onChange={(e) => setNumSlides(parseInt(e.target.value))}
                disabled={loading}
                aria-label="Slide count"
              />
              <span className="gp-slider-max">{MAX_SLIDES}</span>
            </div>
            <p className="gp-field-hint">{numSlides} content slides + 1 cover slide</p>
          </div>

          {/* Theme */}
          <div className="gp-field">
            <label className="gp-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
              Slide Theme
            </label>
            <div className="gp-theme-cards" role="radiogroup">
              {/* Light */}
              <label className={`gp-theme-card ${theme === "light" ? "gp-theme-card--active" : ""}`} htmlFor="gp-theme-light">
                <input type="radio" id="gp-theme-light" name="gp-theme" value="light" checked={theme === "light"} onChange={() => setTheme("light")} disabled={loading} />
                <div className="gp-theme-preview gp-theme-preview--light">
                  <div className="gtp-bar gtp-bar--title" />
                  <div className="gtp-bar" />
                  <div className="gtp-bar gtp-bar--short" />
                </div>
                <div className="gp-theme-card-info">
                  <span className="gp-theme-icon">☀️</span>
                  <span className="gp-theme-name">Light</span>
                </div>
                <div className="gp-theme-check">✓</div>
              </label>

              {/* Dark */}
              <label className={`gp-theme-card ${theme === "dark" ? "gp-theme-card--active" : ""}`} htmlFor="gp-theme-dark">
                <input type="radio" id="gp-theme-dark" name="gp-theme" value="dark" checked={theme === "dark"} onChange={() => setTheme("dark")} disabled={loading} />
                <div className="gp-theme-preview gp-theme-preview--dark">
                  <div className="gtp-bar gtp-bar--title gtp-bar--white" />
                  <div className="gtp-bar gtp-bar--white" />
                  <div className="gtp-bar gtp-bar--short gtp-bar--white" />
                </div>
                <div className="gp-theme-card-info">
                  <span className="gp-theme-icon">🌙</span>
                  <span className="gp-theme-name">Dark</span>
                </div>
                <div className="gp-theme-check">✓</div>
              </label>
            </div>
          </div>

          {/* Error / Success */}
          {error && (
            <div className="gp-alert gp-alert--error" role="alert">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="gp-alert gp-alert--success" role="status">
              <span>🎉</span>
              <span>{success}</span>
            </div>
          )}

          {/* CTA Button */}
          <button
            type="submit"
            id="btn-generate-ppt"
            className="gp-cta"
            disabled={loading}
          >
            {loading ? (
              <span className="gp-cta-inner">
                <span className="gp-spinner" />
                <span>Generating your presentation…</span>
              </span>
            ) : (
              <span className="gp-cta-inner">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                <span>Generate Presentation</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </span>
            )}
          </button>

          {/* Power badges */}
          <div className="gp-power-row">
            {["🤖 Gemini AI", "📊 PptxGenJS", "⚡ Instant .pptx"].map((t) => (
              <span key={t} className="gp-power-badge">{t}</span>
            ))}
          </div>

        </form>
      </div>
    </div>
  );
}
