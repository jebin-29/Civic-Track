import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Shield,
} from "lucide-react";


export default function Landing() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  /* ── unchanged logic ── */
  // useEffect(() => {
  //   const user = localStorage.getItem("civictrack_user");
  //   if (user) navigate("/home");
  // }, []);

  useEffect(() => { setTimeout(() => setMounted(true), 80); }, []);

  const features = [
    { icon: "📸", title: "Report in Seconds",     desc: "Snap a photo, drop a pin, and submit. Done in under 30 seconds." },
    { icon: "🤖", title: "AI-Powered Analysis",   desc: "Our AI classifies severity, assigns priority, and estimates resolution time instantly." },
    { icon: "📍", title: "Live Location Mapping", desc: "Every issue is geo-tagged and displayed on a real-time community map." },
    { icon: "🔔", title: "Status Updates",         desc: "Get notified as authorities progress from reported → in progress → resolved." },
    { icon: "📊", title: "Community Analytics",   desc: "Transparent dashboards show your city's issue trends and resolution rates." },
    { icon: "🛡️", title: "Report Anonymously",    desc: "Choose to stay anonymous. Your identity is always protected." },
  ];

  const [stats, setStats] = useState([
  { value: "...", label: "Issues Resolved" },
  { value: "...", label: "Resolution Rate" },
  { value: "...", label: "Avg. Response Time" },
  { value: "...", label: "Active Citizens" },
]);

useEffect(() => {
  fetch("http://127.0.0.1:8000/api/stats/")
    .then(res => res.json())
    .then(data => {
      setStats([
        { value: `${data.issues_resolved}`, label: "Issues Resolved" },
        { value: `${data.resolution_rate}%`, label: "Resolution Rate" },
        { value: data.avg_response_time, label: "Avg. Response Time" },
        { value: `${data.active_citizens}`, label: "Active Citizens" },
      ]);
    })
    .catch(err => console.error("Stats error:", err));
}, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        html { scroll-behavior:smooth; }

        body, .lp-root {
          font-family:'DM Sans',sans-serif;
          background:#fafafa; color:#1e293b;
          overflow-x:hidden;
        }

        /* ─── NAV ─── */
        .lp-nav {
          position:fixed; top:0; left:0; right:0; z-index:50;
          display:flex; align-items:center; justify-content:space-between;
          padding:0 48px; height:64px;
          background:rgba(250,250,250,.85);
          backdrop-filter:blur(16px);
          border-bottom:1px solid rgba(226,232,240,.6);
          transition:all .3s;
        }
        .nav-logo {
          font-family:'Sora',sans-serif; font-size:17px; font-weight:700;
          color:#0f172a; display:flex; align-items:center; gap:8px;
        }
        .nav-logo-dot {
          width:8px; height:8px; border-radius:50%;
          background:linear-gradient(135deg,#6366f1,#8b5cf6);
          box-shadow:0 0 8px rgba(99,102,241,.5);
        }
        .nav-btns { display:flex; gap:10px; align-items:center; }
        .btn-ghost {
          padding:8px 20px; border-radius:10px; font-size:14px; font-weight:500;
          font-family:'DM Sans',sans-serif; cursor:pointer;
          border:1.5px solid #e2e8f0; background:transparent; color:#475569;
          transition:all .2s;
        }
        .btn-ghost:hover { background:#f1f5f9; border-color:#cbd5e1; color:#334155; }
        .btn-solid {
          padding:8px 22px; border-radius:10px; font-size:14px; font-weight:600;
          font-family:'Sora',sans-serif; cursor:pointer;
          border:none; background:linear-gradient(135deg,#6366f1,#8b5cf6);
          color:#fff; letter-spacing:.01em;
          box-shadow:0 2px 10px rgba(99,102,241,.3);
          transition:all .22s;
        }
        .btn-solid:hover { transform:translateY(-1px); box-shadow:0 6px 18px rgba(99,102,241,.4); }

        /* ─── HERO ─── */
        .hero {
          min-height:100vh;
          display:flex; flex-direction:column;
          align-items:center; justify-content:center;
          text-align:center;
          padding:100px 24px 60px;
          position:relative; overflow:hidden;
        }

        /* mesh gradient background */
        .hero::before {
          content:'';
          position:absolute; inset:0; z-index:0;
          background:
            radial-gradient(ellipse 80% 60% at 20% 10%,  rgba(199,210,254,.55) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 80% 15%,  rgba(233,213,255,.45) 0%, transparent 55%),
            radial-gradient(ellipse 70% 60% at 50% 100%, rgba(224,242,254,.5)  0%, transparent 60%),
            #fafafa;
        }
        /* floating grid lines */
        .hero::after {
          content:'';
          position:absolute; inset:0; z-index:0;
          background-image:
            linear-gradient(rgba(99,102,241,.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,.04) 1px, transparent 1px);
          background-size:56px 56px;
          mask-image:radial-gradient(ellipse 80% 80% at 50% 50%, black, transparent);
        }

        .hero-content {
          position:relative; z-index:1;
          opacity:0; transform:translateY(24px);
          transition:opacity .7s ease, transform .7s ease;
        }
        .hero-content.vis { opacity:1; transform:translateY(0); }

        .hero-badge {
          display:inline-flex; align-items:center; gap:7px;
          background:#fff; border:1px solid #e0e7ff;
          border-radius:999px; padding:6px 16px;
          font-size:12px; font-weight:600; color:#6366f1;
          letter-spacing:.05em; text-transform:uppercase;
          box-shadow:0 2px 8px rgba(99,102,241,.12);
          margin-bottom:28px;
        }
        .hero-badge-dot {
          width:6px; height:6px; border-radius:50%;
          background:#6366f1;
          animation:pulse 2s infinite;
        }
        @keyframes pulse {
          0%,100%{ box-shadow:0 0 0 0 rgba(99,102,241,.5); }
          50%     { box-shadow:0 0 0 5px rgba(99,102,241,.0); }
        }

        .hero-title {
          font-family:'Sora',sans-serif;
          font-size:clamp(38px,7vw,72px);
          font-weight:800; line-height:1.08;
          color:#0f172a; max-width:820px; margin:0 auto 24px;
          letter-spacing:-.02em;
        }
        .hero-title .accent {
          background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#a78bfa 100%);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent;
          background-clip:text;
        }

        .hero-sub {
          font-size:clamp(16px,2.2vw,20px); color:#64748b;
          max-width:560px; margin:0 auto 44px;
          line-height:1.7; font-weight:400;
        }

        .hero-cta { display:flex; gap:14px; justify-content:center; flex-wrap:wrap; }

        .cta-primary {
          display:inline-flex; align-items:center; gap:8px;
          padding:15px 34px; border-radius:14px;
          font-size:16px; font-weight:600; font-family:'Sora',sans-serif;
          border:none; cursor:pointer; color:#fff; letter-spacing:.01em;
          background:linear-gradient(135deg,#6366f1,#8b5cf6);
          box-shadow:0 6px 20px rgba(99,102,241,.4);
          transition:all .25s;
        }
        .cta-primary:hover { transform:translateY(-3px); box-shadow:0 12px 30px rgba(99,102,241,.5); }

        .cta-secondary {
          display:inline-flex; align-items:center; gap:8px;
          padding:15px 34px; border-radius:14px;
          font-size:16px; font-weight:600; font-family:'Sora',sans-serif;
          cursor:pointer; color:#475569;
          border:1.5px solid #e2e8f0; background:#fff;
          box-shadow:0 2px 8px rgba(0,0,0,.05);
          transition:all .25s;
        }
        .cta-secondary:hover { border-color:#a5b4fc; color:#6366f1; transform:translateY(-2px); box-shadow:0 6px 18px rgba(0,0,0,.08); }

        /* hero visual card */
        .hero-visual {
          margin-top:64px; position:relative; z-index:1;
          display:flex; justify-content:center;
          opacity:0; transform:translateY(32px);
          transition:opacity .8s ease .25s, transform .8s ease .25s;
        }
        .hero-visual.vis { opacity:1; transform:translateY(0); }

        .mock-card {
          background:#fff; border:1px solid #e8edf4;
          border-radius:24px; padding:24px 28px;
          box-shadow:0 8px 40px rgba(0,0,0,.1), 0 1px 3px rgba(0,0,0,.05);
          max-width:480px; width:100%; text-align:left;
        }
        .mock-header { display:flex; align-items:center; gap:10px; margin-bottom:16px; }
        .mock-avatar { width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg,#6366f1,#8b5cf6); }
        .mock-title-block {}
        .mock-name { font-family:'Sora',sans-serif; font-size:13px; font-weight:600; color:#0f172a; }
        .mock-time { font-size:11px; color:#94a3b8; }
        .mock-img {
          width:100%; height:160px; border-radius:14px;
          background:linear-gradient(135deg,#e0e7ff 0%,#dbeafe 100%);
          margin-bottom:14px; overflow:hidden; position:relative;
          display:flex; align-items:center; justify-content:center; font-size:48px;
        }
        .mock-tags { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:14px; }
        .mock-tag {
          padding:4px 12px; border-radius:999px; font-size:11px; font-weight:600;
        }
        .mock-progress-label { font-size:12px; color:#64748b; margin-bottom:6px; font-weight:500; }
        .mock-bar { height:6px; background:#f1f5f9; border-radius:999px; overflow:hidden; }
        .mock-bar-fill { height:100%; border-radius:999px; background:linear-gradient(90deg,#6366f1,#8b5cf6); width:68%; }

        /* floating badges */
        .float-badge {
          position:absolute; background:#fff;
          border:1px solid #e8edf4; border-radius:12px;
          padding:8px 14px; font-size:12px; font-weight:600; color:#0f172a;
          box-shadow:0 4px 16px rgba(0,0,0,.1);
          display:flex; align-items:center; gap:7px;
          white-space:nowrap;
        }
        .fb-1 { top:-18px; right:-32px; animation:float1 4s ease-in-out infinite; }
        .fb-2 { bottom:20px; left:-36px; animation:float2 5s ease-in-out infinite; }
        @keyframes float1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes float2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(6px)} }

        /* ─── STATS ─── */
        .stats-band {
          background:#0f172a; padding:56px 48px;
          display:grid; grid-template-columns:repeat(4,1fr); gap:24px;
        }
        @media(max-width:768px){ .stats-band{ grid-template-columns:1fr 1fr; padding:40px 24px; } }
        .stat-item { text-align:center; }
        .stat-num {
          font-family:'Sora',sans-serif; font-size:clamp(28px,4vw,42px);
          font-weight:800; color:#fff;
          background:linear-gradient(135deg,#a5b4fc,#c4b5fd);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent;
          background-clip:text;
        }
        .stat-lbl { font-size:13px; color:#64748b; margin-top:4px; font-weight:500; }

        /* ─── FEATURES ─── */
        .features-section { padding:96px 48px; background:#fafafa; }
        @media(max-width:768px){ .features-section{ padding:64px 24px; } }

        .section-eyebrow {
          text-align:center; font-size:11px; font-weight:700;
          letter-spacing:.12em; text-transform:uppercase;
          color:#6366f1; margin-bottom:14px;
        }
        .section-title {
          font-family:'Sora',sans-serif; font-size:clamp(28px,4vw,40px);
          font-weight:700; color:#0f172a; text-align:center;
          margin-bottom:14px; letter-spacing:-.02em;
        }
        .section-sub {
          text-align:center; font-size:16px; color:#64748b;
          max-width:520px; margin:0 auto 56px; line-height:1.7;
        }

        .features-grid {
          display:grid; grid-template-columns:repeat(3,1fr); gap:20px;
          max-width:1100px; margin:0 auto;
        }
        @media(max-width:900px){ .features-grid{ grid-template-columns:1fr 1fr; } }
        @media(max-width:580px){ .features-grid{ grid-template-columns:1fr; } }

        .feat-card {
          background:#fff; border:1px solid #e8edf4;
          border-radius:20px; padding:28px 26px;
          box-shadow:0 1px 3px rgba(0,0,0,.04);
          transition:transform .25s, box-shadow .25s, border-color .25s;
        }
        .feat-card:hover {
          transform:translateY(-4px);
          box-shadow:0 12px 32px rgba(0,0,0,.08);
          border-color:#c7d2fe;
        }
        .feat-icon {
          font-size:28px; width:52px; height:52px;
          background:linear-gradient(135deg,#f0f1ff,#e0e7ff);
          border-radius:14px; display:flex; align-items:center; justify-content:center;
          margin-bottom:16px;
        }
        .feat-title {
          font-family:'Sora',sans-serif; font-size:15px;
          font-weight:600; color:#0f172a; margin-bottom:8px;
        }
        .feat-desc { font-size:14px; color:#64748b; line-height:1.65; }

        /* ─── HOW IT WORKS ─── */
        .how-section {
          padding:96px 48px;
          background:linear-gradient(135deg,#f8f7ff 0%,#fafbff 100%);
          border-top:1px solid #e8edf4; border-bottom:1px solid #e8edf4;
        }
        @media(max-width:768px){ .how-section{ padding:64px 24px; } }

        .steps-row {
          display:grid; grid-template-columns:repeat(3,1fr);
          gap:0; max-width:900px; margin:0 auto;
          position:relative;
        }
        @media(max-width:640px){ .steps-row{ grid-template-columns:1fr; gap:24px; } }
        .steps-row::before {
          content:'';
          position:absolute; top:28px; left:calc(16.67% + 16px); right:calc(16.67% + 16px);
          height:2px; background:linear-gradient(90deg,#c7d2fe,#ddd6fe);
          z-index:0;
        }
        @media(max-width:640px){ .steps-row::before{ display:none; } }

        .how-step { text-align:center; padding:0 16px; position:relative; z-index:1; }
        .how-num {
          width:56px; height:56px; border-radius:50%;
          background:linear-gradient(135deg,#6366f1,#8b5cf6);
          font-family:'Sora',sans-serif; font-size:20px; font-weight:700; color:#fff;
          display:flex; align-items:center; justify-content:center;
          margin:0 auto 18px;
          box-shadow:0 4px 16px rgba(99,102,241,.35);
        }
        .how-title { font-family:'Sora',sans-serif; font-size:15px; font-weight:600; color:#0f172a; margin-bottom:8px; }
        .how-desc { font-size:13px; color:#64748b; line-height:1.6; }

        /* ─── CTA SECTION ─── */
        .cta-section {
          padding:96px 48px; background:#0f172a; text-align:center;
          position:relative; overflow:hidden;
        }
        .cta-section::before {
          content:''; position:absolute; inset:0;
          background:radial-gradient(ellipse 70% 70% at 50% 0%, rgba(99,102,241,.25), transparent);
          pointer-events:none;
        }
        .cta-title {
          font-family:'Sora',sans-serif;
          font-size:clamp(28px,5vw,48px); font-weight:800;
          color:#fff; margin-bottom:16px; letter-spacing:-.02em;
          position:relative;
        }
        .cta-sub { font-size:17px; color:#64748b; margin-bottom:40px; position:relative; }
        .cta-btns { display:flex; gap:14px; justify-content:center; flex-wrap:wrap; position:relative; }

        .cta-btn-primary {
          display:inline-flex; align-items:center; gap:8px;
          padding:15px 36px; border-radius:14px;
          font-size:16px; font-weight:600; font-family:'Sora',sans-serif;
          border:none; cursor:pointer; color:#fff;
          background:linear-gradient(135deg,#6366f1,#8b5cf6);
          box-shadow:0 4px 18px rgba(99,102,241,.5);
          transition:all .25s;
        }
        .cta-btn-primary:hover { transform:translateY(-2px); box-shadow:0 10px 28px rgba(99,102,241,.6); }

        .cta-btn-secondary {
          display:inline-flex; align-items:center; gap:8px;
          padding:15px 36px; border-radius:14px;
          font-size:16px; font-weight:600; font-family:'Sora',sans-serif;
          cursor:pointer; color:#94a3b8;
          border:1.5px solid rgba(255,255,255,.12); background:rgba(255,255,255,.05);
          transition:all .25s;
        }
        .cta-btn-secondary:hover { border-color:rgba(255,255,255,.25); color:#fff; }

        /* ─── FOOTER ─── */
        .lp-footer {
          background:#080e1a; padding:28px 48px;
          display:flex; align-items:center; justify-content:space-between;
          flex-wrap:wrap; gap:12px;
          border-top:1px solid rgba(255,255,255,.05);
        }
        .footer-logo {
          font-family:'Sora',sans-serif; font-size:14px;
          font-weight:700; color:#475569;
          display:flex; align-items:center; gap:7px;
        }
        .footer-copy { font-size:12px; color:#334155; }
      `}</style>

      <div className="lp-root">

        {/* ── NAV ── */}
        <nav className="lp-nav">
          {/* Logo */}
          <div
            className="text-xl font-bold text-blue-600 cursor-pointer flex items-center gap-2"
          >
            <Shield className="w-6 h-6 text-blue-600" />
            CivicTrack

          </div>
          <div className="nav-btns">
            <button className="btn-ghost" onClick={() => navigate("/login")}>Sign In</button>
            <button className="btn-solid" onClick={() => navigate("/register")}>Get Started →</button>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section className="hero">
          <div className={`hero-content${mounted ? " vis" : ""}`}>
            <div className="hero-badge">
              <div className="hero-badge-dot"/>
              AI-Powered Civic Platform
            </div>

            <h1 className="hero-title">
              Report Issues.<br/>
              <span className="accent">Let AI Do the Rest.</span>
            </h1>

            <p className="hero-sub">
              CivicTrack empowers citizens to report local problems instantly while
              AI automatically analyses severity, routes to the right department,
              and tracks resolution in real time.
            </p>

            <div className="hero-cta">
              <button className="cta-primary" onClick={() => navigate("/register")}>
                Start Reporting Now →
              </button>
              <button className="cta-secondary" onClick={() => navigate("/login")}>
                Sign In
              </button>
            </div>
          </div>

          {/* mock issue card */}
          <div className={`hero-visual${mounted ? " vis" : ""}`}>
            <div style={{ position:"relative", display:"inline-block" }}>

              {/* floating badges */}
              <div className="float-badge fb-1">
                🤖 AI Priority: <span style={{ color:"#dc2626" }}>Urgent</span>
              </div>
              <div className="float-badge fb-2">
                ✅ Resolved in 2h 14m
              </div>

              <div className="mock-card">
                <div className="mock-header">
                  <div className="mock-avatar"/>
                  <div className="mock-title-block">
                    <p className="mock-name">Broken Streetlight – Saravanampatti</p>
                    <p className="mock-time">Reported 12 min ago · Coimbatore</p>
                  </div>
                </div>
                <div className="mock-img"><img src="https://media.istockphoto.com/id/2163757100/photo/low-angle-view-of-broken-lamppost.jpg?s=612x612&w=0&k=20&c=IZHBYMyrXAZWZ-AU1skjnNYVXz-sSBdY8hIJ4ma7eJU=" alt="" /></div>
                <div className="mock-tags">
                  <span className="mock-tag" style={{ background:"#fef2f2", color:"#dc2626" }}>🚨 Urgent</span>
                  <span className="mock-tag" style={{ background:"#eff6ff", color:"#2563eb" }}>⏳ In Progress</span>
                  <span className="mock-tag" style={{ background:"#f0f1ff", color:"#6366f1" }}>👷 3 Workers</span>
                </div>
                <p className="mock-progress-label">Resolution Progress — 68%</p>
                <div className="mock-bar"><div className="mock-bar-fill"/></div>
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS BAND ── */}
        <div className="stats-band">
          {stats.map(s => (
            <div key={s.label} className="stat-item">
              <p className="stat-num">{s.value}</p>
              <p className="stat-lbl">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── FEATURES ── */}
        <section className="features-section">
          <p className="section-eyebrow">Platform Features</p>
          <h2 className="section-title">Everything you need to<br/>fix your city faster</h2>
          <p className="section-sub">
            From AI triage to live status tracking — CivicTrack handles
            the complexity so citizens and authorities can focus on what matters.
          </p>
          <div className="features-grid">
            {features.map(f => (
              <div key={f.title} className="feat-card">
                <div className="feat-icon">{f.icon}</div>
                <p className="feat-title">{f.title}</p>
                <p className="feat-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="how-section">
          <p className="section-eyebrow">How It Works</p>
          <h2 className="section-title">Three steps to a better city</h2>
          <p className="section-sub" style={{ marginBottom:56 }}>
            No training required. Any citizen can report an issue in under a minute.
          </p>
          <div className="steps-row">
            {[
              { n:"1", title:"Snap & Submit",     desc:"Take a photo, confirm your location, and hit submit. Your report is live instantly." },
              { n:"2", title:"AI Analyses",       desc:"Our AI classifies the issue type, severity, and estimated cost — automatically." },
              { n:"3", title:"Authorities Act",   desc:"The right department gets notified, workers are assigned, and you get real-time updates." },
            ].map(s => (
              <div key={s.n} className="how-step">
                <div className="how-num">{s.n}</div>
                <p className="how-title">{s.title}</p>
                <p className="how-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA SECTION ── */}
        <section className="cta-section">
          <h2 className="cta-title">Your city needs your eyes.</h2>
          <p className="cta-sub">Join thousands of citizens already making a difference.</p>
          <div className="cta-btns">
            <button className="cta-btn-primary" onClick={() => navigate("/register")}>
              Create Account
            </button>
            <button className="cta-btn-secondary" onClick={() => navigate("/login")}>
              Already have an account →
            </button>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="lp-footer">
          <div className="footer-logo">
            <div style={{ width:7,height:7,borderRadius:"50%",background:"#6366f1" }}/>
            CivicTrack
          </div>
          {/* <p className="footer-copy">© {new Date().getFullYear()} CivicTrack. Smart Civic Intelligence Platform.</p> */}
        </footer>

      </div>
    </>
  );
}