import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { issuesAPI } from "@/lib/api";

/* ─── helpers ─────────────────────────────────────────────────────── */
const statusMeta: Record<string, { label: string; color: string; bg: string; step: number }> = {
  reported: { label: "Reported",    color: "#d97706", bg: "#fef3c7", step: 1 },
  progress: { label: "In Progress", color: "#2563eb", bg: "#dbeafe", step: 2 },
  resolved: { label: "Resolved",   color: "#059669", bg: "#d1fae5", step: 3 },
};

const priorityMeta: Record<string, { label: string; color: string; bg: string }> = {
  urgent: { label: "Urgent", color: "#dc2626", bg: "#fef2f2" },
  high:   { label: "High",   color: "#ea580c", bg: "#fff7ed" },
  medium: { label: "Medium", color: "#d97706", bg: "#fef3c7" },
  low:    { label: "Low",    color: "#059669", bg: "#d1fae5" },
};

/* ─── component ───────────────────────────────────────────────────── */
export default function AdminIssueDetail() {
  const { id } = useParams();
  const [issue, setIssue] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchIssue = async () => {
      try {
        const data = await issuesAPI.getIssue(id!);
        setIssue(data);
        setTimeout(() => setLoaded(true), 60);
      } catch (err) {
        console.error("Error loading issue", err);
      }
    };
    fetchIssue();
  }, [id]);

  if (!issue) {
    return (
      <div style={styles.loadingWrap}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Fetching issue details…</p>
      </div>
    );
  }

  const st  = statusMeta[issue.status]                        ?? statusMeta.reported;
  const pri = priorityMeta[issue.ai_priority?.toLowerCase()] ?? priorityMeta.medium;

  const steps = [
    { label: "Reported",    step: 1 },
    { label: "In Progress", step: 2 },
    { label: "Resolved",    step: 3 },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,600;0,700;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .aid-root {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: #f5f7fa;
          min-height: 100vh;
          color: #1e293b;
          padding: 40px 24px 80px;
          opacity: 0;
          transform: translateY(14px);
          transition: opacity .5s ease, transform .5s ease;
        }
        .aid-root.visible { opacity: 1; transform: translateY(0); }
        .aid-inner { max-width: 980px; margin: 0 auto; }

        /* ── top bar ── */
        .topbar {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 32px;
        }
        .back-btn {
          display: inline-flex; align-items: center; gap: 7px;
          font-size: 13px; color: #64748b; background: #fff;
          border: 1px solid #e2e8f0; border-radius: 10px;
          padding: 8px 16px; cursor: pointer; font-weight: 500;
          transition: all .2s; text-decoration: none;
          font-family: 'Plus Jakarta Sans', sans-serif;
          letter-spacing: .01em;
        }
        .back-btn:hover { background: #f8fafc; border-color: #cbd5e1; color: #334155; }
        .back-btn svg { transition: transform .2s; }
        .back-btn:hover svg { transform: translateX(-3px); }

        /* ── header card ── */
        .header-section {
          background: #fff;
          border: 1px solid #e8edf3;
          border-radius: 24px;
          padding: 36px 40px;
          margin-bottom: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,.04), 0 8px 32px rgba(0,0,0,.04);
        }
        .dept-eyebrow {
          font-size: 11px; letter-spacing: .12em; text-transform: uppercase;
          color: #6366f1; font-weight: 600; margin-bottom: 10px;
        }
        .issue-title {
          font-family: 'Fraunces', serif;
          font-size: clamp(26px, 4vw, 40px);
          line-height: 1.2; color: #0f172a;
          margin-bottom: 20px; max-width: 720px;
        }
        .badges-row { display: flex; gap: 8px; flex-wrap: wrap; }
        .badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 13px; border-radius: 999px; font-size: 12px;
          font-weight: 600; letter-spacing: .02em;
        }
        .badge-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

        /* ── hero image ── */
        .hero-img {
          width: 100%; height: 380px; object-fit: cover;
          border-radius: 20px; display: block;
          margin-bottom: 20px;
          box-shadow: 0 4px 6px rgba(0,0,0,.04), 0 20px 50px rgba(0,0,0,.08);
          transition: transform .4s ease;
        }
        .hero-img:hover { transform: scale(1.003); }
        .hero-placeholder {
          width: 100%; height: 380px; border-radius: 20px;
          background: linear-gradient(135deg,#e0e7ff 0%,#f0fdf4 100%);
          display: flex; align-items: center; justify-content: center;
          font-size: 56px; margin-bottom: 20px;
          border: 1px solid #e8edf3;
        }

        /* ── stepper card ── */
        .stepper-card {
          background: #fff; border: 1px solid #e8edf3;
          border-radius: 20px; padding: 28px 36px;
          margin-bottom: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,.04);
        }
        .section-label {
          font-size: 11px; letter-spacing: .1em; text-transform: uppercase;
          color: #94a3b8; font-weight: 600; margin-bottom: 22px;
        }
        .stepper { display: flex; align-items: flex-start; }
        .step-item { display: flex; flex-direction: column; align-items: center; flex: 1; position: relative; }
        .step-circle {
          width: 36px; height: 36px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700; z-index: 1;
          border: 2px solid transparent; transition: all .35s;
        }
        .step-name {
          font-size: 11px; margin-top: 9px; font-weight: 600;
          letter-spacing: .03em; text-align: center;
        }
        .step-connector {
          position: absolute; top: 17px; left: calc(50% + 18px);
          height: 2px; width: calc(100% - 36px);
          border-radius: 2px;
        }
        .step-item:last-child .step-connector { display: none; }

        /* ── info grid ── */
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
        @media (max-width: 600px) { .info-grid { grid-template-columns: 1fr; } }

        .info-card {
          background: #fff; border: 1px solid #e8edf3;
          border-radius: 18px; padding: 24px 26px;
          box-shadow: 0 1px 3px rgba(0,0,0,.04);
          transition: box-shadow .25s, transform .25s;
        }
        .info-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,.08); transform: translateY(-2px); }

        .card-icon { font-size: 20px; margin-bottom: 10px; }
        .card-label {
          font-size: 11px; letter-spacing: .1em; text-transform: uppercase;
          color: #94a3b8; font-weight: 600; margin-bottom: 5px;
        }
        .card-value { font-size: 15px; color: #475569; line-height: 1.5; }
        .card-value-big {
          font-family: 'Fraunces', serif;
          font-size: 34px; color: #0f172a; line-height: 1;
          margin-top: 4px;
        }
        .card-value-unit { font-size: 14px; color: #94a3b8; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 400; }

        /* accent cards */
        .card-indigo {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          border: none !important;
        }
        .card-indigo .card-label { color: rgba(255,255,255,.6) !important; }
        .card-indigo .card-value-big { color: #fff !important; }
        .card-indigo .card-value-unit { color: rgba(255,255,255,.55) !important; }
        .card-indigo .card-icon { filter: grayscale(0); }

        .card-green {
          background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
          border: 1px solid #a7f3d0 !important;
        }
        .card-green .card-label { color: #6ee7b7 !important; }
        .card-green .card-value-big { color: #065f46 !important; }
        .card-green .card-value-unit { color: #34d399 !important; }

        /* map */
        .map-card {
          grid-column: span 2;
          border-radius: 18px; overflow: hidden;
          border: 1px solid #e8edf3; height: 260px;
          box-shadow: 0 1px 3px rgba(0,0,0,.04);
        }
        @media (max-width: 600px) { .map-card { grid-column: span 1; } }
        .map-card iframe { width: 100%; height: 100%; border: 0; display: block; }

        /* description */
        .desc-card {
          background: #fff; border: 1px solid #e8edf3;
          border-radius: 20px; padding: 30px 32px;
          box-shadow: 0 1px 3px rgba(0,0,0,.04);
        }
        .desc-text {
          font-size: 15px; line-height: 1.85; color: #64748b;
          margin-top: 12px;
        }

        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className={`aid-root${loaded ? " visible" : ""}`}>
        <div className="aid-inner">

          {/* ── topbar ── */}
          <div className="topbar">
            <button className="back-btn" onClick={() => window.history.back()}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              Back to Issues
            </button>
          </div>

          {/* ── header ── */}
          <div className="header-section">
            <p className="dept-eyebrow">{issue.department ?? "Infrastructure"}</p>
            <h1 className="issue-title">{issue.title}</h1>
            <div className="badges-row">
              <span className="badge" style={{ background: st.bg, color: st.color }}>
                <span className="badge-dot" style={{ background: st.color }} />
                {st.label}
              </span>
              <span className="badge" style={{ background: pri.bg, color: pri.color }}>
                {pri.label} Priority
              </span>

              {issue.flags > 0 && (
                <span
                  className="badge"
                  style={{ background: "#fee2e2", color: "#dc2626" }}
                >
                  🚩 {issue.flags} Reports
                </span>
              )}
              {issue.ai_workers && (
                <span className="badge" style={{ background: "#f1f5f9", color: "#475569" }}>
                  👷 {issue.ai_workers} workers
                </span>
              )}
              {issue.ai_time_required && (
                <span className="badge" style={{ background: "#f1f5f9", color: "#475569" }}>
                  ⏱ {issue.ai_time_required}
                </span>
              )}

              
            </div>
            {/* Reporter info in header */}
<div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 10 }}>
  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14 }}>
    {(issue.reported_by?.username?.[0] ?? issue.reporter_name?.[0] ?? "U").toUpperCase()}
  </div>
  <div>
    <p style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
      {issue.is_anonymous ? "Anonymous" : (issue.reported_by?.username ?? issue.reporter_name ?? "Unknown")}
    </p>
    <p style={{ fontSize: 11, color: "#94a3b8" }}>Reported by</p>
  </div>
</div>
          </div>
          

          {/* ── hero ── */}
          {issue.primary_photo ? (
            <img src={issue.primary_photo} alt={issue.title} className="hero-img" />
          ) : (
            <div className="hero-placeholder">🏗️</div>
          )}

          {/* ── stepper ── */}
          <div className="stepper-card">
            <p className="section-label">Resolution Progress</p>
            <div className="stepper">
              {steps.map((s) => {
                const done    = st.step >= s.step;
                const current = st.step === s.step;
                return (
                  <div key={s.step} className="step-item">
                    <div
                      className="step-circle"
                      style={{
                        background: done ? st.color : "#f1f5f9",
                        borderColor: done ? st.color : "#e2e8f0",
                        color: done ? "#fff" : "#94a3b8",
                        boxShadow: current ? `0 0 0 5px ${st.color}22` : "none",
                      }}
                    >
                      {done && !current ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      ) : s.step}
                    </div>
                    <span className="step-name" style={{ color: done ? st.color : "#94a3b8" }}>
                      {s.label}
                    </span>
                    <div
                      className="step-connector"
                      style={{ background: st.step > s.step ? st.color : "#e2e8f0" }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── info grid ── */}
          <div className="info-grid">
            <div className="info-card">
              <div className="card-icon">📍</div>
              <p className="card-label">Location</p>
              <p className="card-value">{issue.location}</p>
            </div>

            <div className="info-card">
              <div className="card-icon">🏢</div>
              <p className="card-label">Department</p>
              <p className="card-value">{issue.department}</p>
            </div>

            <div className="info-card card-indigo">
  <div className="card-icon">👷</div>
  <p className="card-label">Workers Required</p>
  <p className="card-value-big">
    {issue.ai_workers}
    <span className="card-value-unit"> people</span>
  </p>
</div>

<div className="info-card" style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e293b 100%)", border: "none" }}>
  <div className="card-icon">🚛</div>
  <p className="card-label" style={{ color: "rgba(255,255,255,.5)" }}>Trucks Required</p>
  <p className="card-value-big" style={{ color: "#fff" }}>
    {issue.ai_trucks ?? 0}
    <span className="card-value-unit" style={{ color: "rgba(255,255,255,.4)" }}> trucks</span>
  </p>
</div>

<div className="info-card card-green">
  <div className="card-icon">⏱</div>
  <p className="card-label">Estimated Time</p>
  <p className="card-value-big">
    {issue.ai_time_required}
    <span className="card-value-unit"> hrs</span>
  </p>
</div>

<div className="info-card" style={{ background: "linear-gradient(135deg,#fef3c7 0%,#fde68a 100%)", border: "1px solid #fcd34d" }}>
  <div className="card-icon">💰</div>
  <p className="card-label" style={{ color: "#92400e" }}>Estimated Cost</p>
  <p className="card-value-big" style={{ color: "#78350f", fontSize: 28 }}>
    ₹{(issue.ai_cost ?? 0).toLocaleString()}
    <span className="card-value-unit" style={{ color: "#a16207" }}> INR</span>
  </p>
</div>

            {issue.latitude && issue.longitude && (
              <div className="map-card">
                <iframe
                  loading="lazy"
                  title="Issue Location"
                  src={`https://maps.google.com/maps?q=${issue.latitude},${issue.longitude}&z=15&output=embed`}
                />
              </div>
            )}
          </div>

          {/* ── description ── */}
          <div className="desc-card">
            <p className="section-label">📝 Description</p>
            <p className="desc-text">{issue.description}</p>
          </div>

          {/* ── user information ── */}
{!issue.is_anonymous && (
  <div className="desc-card" style={{ marginTop: 20 }}>
    <p className="section-label">👤 User Information</p>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
      <div style={{ padding: "16px 20px", background: "#f8fafc", borderRadius: 14, border: "1px solid #e8edf3" }}>
        <p style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>Username</p>
        <p style={{ fontSize: 15, color: "#0f172a", fontWeight: 600 }}>
          {issue.reported_by?.username ?? issue.reporter_name ?? "N/A"}
        </p>
      </div>
      <div style={{ padding: "16px 20px", background: "#f8fafc", borderRadius: 14, border: "1px solid #e8edf3" }}>
        <p style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>Email</p>
        <p style={{ fontSize: 15, color: "#0f172a", fontWeight: 600 }}>
          {issue.reported_by?.email ?? "Not provided"}
        </p>
      </div>
      <div style={{ padding: "16px 20px", background: "#f8fafc", borderRadius: 14, border: "1px solid #e8edf3" }}>
        <p style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>Phone</p>
        <p style={{ fontSize: 15, color: "#0f172a", fontWeight: 600 }}>
          {issue.reported_by?.phone_number ?? "Not provided"}
        </p>
      </div>
      <div style={{ padding: "16px 20px", background: "#f8fafc", borderRadius: 14, border: "1px solid #e8edf3" }}>
        <p style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>Address</p>
        <p style={{ fontSize: 15, color: "#0f172a", fontWeight: 600 }}>
          {issue.reported_by?.address ?? "Not provided"}
        </p>
      </div>
    </div>
  </div>
)}

        </div>
      </div>
    </>
  );
}

/* ─── loading styles ──────────────────────────────────────────────── */
const styles: Record<string, React.CSSProperties> = {
  loadingWrap: {
    minHeight: "100vh",
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    background: "#f5f7fa", gap: 14,
  },
  spinner: {
    width: 34, height: 34,
    border: "3px solid #e2e8f0",
    borderTop: "3px solid #6366f1",
    borderRadius: "50%",
    animation: "spin 0.75s linear infinite",
  },
  loadingText: {
    color: "#94a3b8", fontSize: 14,
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
};