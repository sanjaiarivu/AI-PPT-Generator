// ============================================================
// HomePage.jsx — Landing page with creation options
// ============================================================

import { useNavigate } from "react-router-dom";

const creationOptions = [
  {
    id: "generate",
    icon: "✨",
    title: "Generate",
    description: "Create from a one-line prompt in a few seconds",
    badge: null,
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f64f59 100%)",
    route: "/generate",
    primary: true,
  },
  {
    id: "paste-text",
    icon: "📝",
    title: "Paste in text",
    description: "Create from notes, an outline, or existing content",
    badge: "COMING SOON",
    gradient: "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
    route: null,

  },
  {
    id: "template",
    icon: "🗂️",
    title: "Create from template",
    description: "Create using the structure or layouts from a template",
    badge: "COMING SOON",
    gradient: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
    route: null,
  },
  {
    id: "import",
    icon: "📤",
    title: "Import file or URL",
    description: "Enhance existing docs, presentations, or webpages",
    badge: "COMING SOON",
    gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    route: null,
  },
];



export default function HomePage() {
  const navigate = useNavigate();

  const handleCardClick = (option) => {
    if (option.route) {
      navigate(option.route);
    }
  };

  return (
    <div className="home-page">
      {/* ── Navbar ── */}
      <nav className="home-nav">
        <div className="nav-logo">
          <span className="nav-logo-icon">⚡</span>
          <span className="nav-logo-text">SlideAI</span>
        </div>
        <div className="nav-actions">
          <button className="nav-btn-outline" onClick={() => navigate("/generate")}>
            🎯 Quick Generate
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div className="home-hero">
        <div className="hero-glow" />
        <div className="hero-badge">
          <span className="badge-dot" />
          Powered by Gemini AI
        </div>
        <h1 className="hero-title">Create with AI</h1>
        <p className="hero-subtitle">
          Transform any idea into a stunning presentation in seconds
        </p>
      </div>

      {/* ── Option Cards ── */}
      <div className="options-grid">
        {creationOptions.map((opt) => (
          <div
            key={opt.id}
            id={`card-${opt.id}`}
            className={`option-card ${opt.primary ? "option-card--primary" : ""} ${!opt.route ? "option-card--disabled" : ""}`}
            onClick={() => handleCardClick(opt)}
            role="button"
            tabIndex={opt.route ? 0 : -1}
            onKeyDown={(e) => e.key === "Enter" && handleCardClick(opt)}
          >
            {/* Card Preview Illustration */}
            <div className="card-preview" style={{ background: opt.gradient }}>
              <span className="card-preview-icon">{opt.icon}</span>
              {opt.primary && (
                <div className="card-preview-sparkles">
                  <span className="sparkle s1">✦</span>
                  <span className="sparkle s2">✦</span>
                  <span className="sparkle s3">✦</span>
                </div>
              )}
            </div>

            {/* Card Content */}
            <div className="card-content">
              <div className="card-title-row">
                <h3 className="card-title">{opt.title}</h3>
                {opt.badge && (
                  <span className="card-badge">{opt.badge}</span>
                )}
                {opt.primary && (
                  <span className="card-badge card-badge--primary">✨ AI</span>
                )}
              </div>
              <p className="card-desc">{opt.description}</p>
            </div>

            {opt.primary && (
              <div className="card-arrow">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Footer ── */}
      <footer className="home-footer">
        Built with React + Express + Gemini AI &nbsp;•&nbsp; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
