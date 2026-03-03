// ============================================================
// App.jsx — AI PPT Generator Frontend
// Main component: topic form → API call → .pptx download
// ============================================================

import { useState, useCallback } from "react";
import axios from "axios";

// ─── Constants ────────────────────────────────────────────────
// During development, the Vite proxy forwards /api → localhost:5000
// In production (after deployment), set VITE_API_URL in .env
const API_BASE = import.meta.env.VITE_API_URL || "/api";

const MIN_SLIDES = 1;
const MAX_SLIDES = 20;

// ─── Icon Components (inline SVG — no icon lib needed) ────────
const IconPresentation = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
        <path d="M9 8l3 3 3-3" />
    </svg>
);

const IconDownload = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
);

// ─── Main App Component ────────────────────────────────────────
export default function App() {
    // ── State ───────────────────────────────────────────────────
    const [topic, setTopic] = useState("");
    const [numSlides, setNumSlides] = useState(5);
    const [theme, setTheme] = useState("light");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // ── Computed: slider track fill percentage ─────────────────
    const rangePct = ((numSlides - MIN_SLIDES) / (MAX_SLIDES - MIN_SLIDES)) * 100;

    // ── Handle Generate ────────────────────────────────────────
    const handleGenerate = useCallback(
        async (e) => {
            e.preventDefault();
            setError("");
            setSuccess("");

            // Client-side validation
            if (!topic.trim()) {
                setError("Please enter a presentation topic.");
                return;
            }

            setLoading(true);

            try {
                // POST request to backend
                // responseType: "blob" ensures axios treats the response as binary (for file download)
                const response = await axios.post(
                    `${API_BASE}/generate`,
                    { topic: topic.trim(), numSlides, theme },
                    { responseType: "blob", timeout: 90000 } // 90s timeout for AI + PPT gen
                );

                // ── Trigger Browser File Download ──────────────────
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement("a");
                link.href = url;

                // Try to get filename from Content-Disposition header
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

                setSuccess(`✅ "${filename}" downloaded successfully!`);
            } catch (err) {
                // Handle different error shapes from axios
                if (err.response) {
                    // Server responded with an error status (4xx / 5xx)
                    // Since response is a blob, we need to parse it as text first
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
                    setError("Request timed out. The AI is taking too long. Please try again.");
                } else {
                    setError("Could not connect to the server. Make sure the backend is running.");
                }
            } finally {
                setLoading(false);
            }
        },
        [topic, numSlides, theme]
    );

    // ── Render ─────────────────────────────────────────────────
    return (
        <div className="app">
            {/* ── Header ──────────────────────────────────────── */}
            <header className="app-header">
                <div className="header-badge">✨ Powered by Gemini AI</div>
                <h1>AI PPT Generator</h1>
                <p>
                    Turn any topic into a professional PowerPoint presentation in seconds.
                </p>
            </header>

            {/* ── Card / Form ─────────────────────────────────── */}
            <main>
                <div className="card">
                    <form className="form" onSubmit={handleGenerate}>

                        {/* Topic Input */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="topic">
                                <span className="label-icon">📌</span>
                                Presentation Topic
                            </label>
                            <input
                                id="topic"
                                type="text"
                                className="form-input"
                                placeholder="e.g. The Future of Artificial Intelligence"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                disabled={loading}
                                maxLength={200}
                                autoFocus
                            />
                        </div>

                        {/* Number of Slides */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="numSlides">
                                <span className="label-icon">🗂️</span>
                                Number of Slides
                            </label>
                            <div className="slide-row">
                                <input
                                    id="numSlides"
                                    type="number"
                                    className="form-input slide-number"
                                    min={MIN_SLIDES}
                                    max={MAX_SLIDES}
                                    value={numSlides}
                                    onChange={(e) => {
                                        const val = Math.min(
                                            MAX_SLIDES,
                                            Math.max(MIN_SLIDES, parseInt(e.target.value) || MIN_SLIDES)
                                        );
                                        setNumSlides(val);
                                    }}
                                    disabled={loading}
                                />
                                {/* Range slider for visual slide count control */}
                                <input
                                    type="range"
                                    className="form-range"
                                    min={MIN_SLIDES}
                                    max={MAX_SLIDES}
                                    value={numSlides}
                                    style={{ "--range-pct": `${rangePct}%` }}
                                    onChange={(e) => setNumSlides(parseInt(e.target.value))}
                                    disabled={loading}
                                    aria-label="Number of slides slider"
                                />
                            </div>
                            <span className="slide-hint">
                                {numSlides} slide{numSlides !== 1 ? "s" : ""} + 1 cover slide
                            </span>
                        </div>

                        {/* Theme Selector */}
                        <div className="form-group">
                            <span className="form-label">
                                <span className="label-icon">🎨</span>
                                Theme
                            </span>
                            <div className="theme-toggle" role="radiogroup" aria-label="Presentation theme">
                                {/* Light Theme */}
                                <div className="theme-option">
                                    <input
                                        type="radio"
                                        id="theme-light"
                                        name="theme"
                                        value="light"
                                        checked={theme === "light"}
                                        onChange={() => setTheme("light")}
                                        disabled={loading}
                                    />
                                    <label className="theme-label" htmlFor="theme-light">
                                        ☀️ Light
                                    </label>
                                </div>

                                {/* Dark Theme */}
                                <div className="theme-option">
                                    <input
                                        type="radio"
                                        id="theme-dark"
                                        name="theme"
                                        value="dark"
                                        checked={theme === "dark"}
                                        onChange={() => setTheme("dark")}
                                        disabled={loading}
                                    />
                                    <label className="theme-label theme-label-dark" htmlFor="theme-dark">
                                        🌙 Dark
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="status-box error" role="alert" aria-live="assertive">
                                <span className="status-icon">⚠️</span>
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Success Message */}
                        {success && (
                            <div className="status-box success" role="status" aria-live="polite">
                                <span className="status-icon">✅</span>
                                <span>{success}</span>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="btn-generate"
                            disabled={loading}
                            aria-busy={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner" aria-hidden="true" />
                                    <span>Generating Presentation…</span>
                                </>
                            ) : (
                                <>
                                    <IconPresentation />
                                    <span>Generate & Download PPT</span>
                                    <IconDownload />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* ── Feature Chips ──────────────────────────────── */}
                <div className="features" aria-label="Features">
                    {[
                        { icon: "🤖", label: "Gemini AI Content" },
                        { icon: "📊", label: "PptxGenJS Engine" },
                        { icon: "🎨", label: "Light & Dark Themes" },
                        { icon: "⚡", label: "Instant Download" },
                    ].map(({ icon, label }) => (
                        <div key={label} className="feature-chip">
                            <span className="chip-icon">{icon}</span>
                            {label}
                        </div>
                    ))}
                </div>
            </main>

            {/* ── Footer ──────────────────────────────────────── */}
            <footer className="app-footer">
                Built with React + Express + Gemini AI &nbsp;•&nbsp; {new Date().getFullYear()}
            </footer>
        </div>
    );
}
