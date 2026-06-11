import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, LayoutGrid, AlertTriangle, Clock, CheckCircle, TrendingUp, FileText } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { Header } from "@/components/Header";
import { IssueCard, Issue } from "@/components/IssueCard";

export default function MyIssues() {
  const navigate = useNavigate();

  // ── All state — 100% original ──
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [issues, setIssues] = useState<Issue[]>([]);

  // ── Original useEffects — untouched ──
  useEffect(() => {
    const userData = localStorage.getItem('civictrack_user');
    if (userData) {
      const userObj = JSON.parse(userData);
      setUser(userObj);
      setIsAdmin(userObj.isAdmin || false);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    const fetchMyIssues = async () => {
      try {
        const userData = localStorage.getItem("civictrack_user");
        if (!userData) return;
        const user = JSON.parse(userData);
        console.log("USER:", user);
        const res = await fetch(`http://127.0.0.1:8000/api/issues/`);
        const data = await res.json();
        console.log("API DATA:", data.results);
        const filtered = data.results.filter(
          (i: any) => i.reporter_name === user.username
        );
        console.log("FILTERED:", filtered);
        const formatted = filtered.map((item: any) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          category: item.category?.name,
          status: item.status,
          location: item.location,
          reportedBy: item.reporter_name || "You",
          reportedAt: new Date(item.reported_at).toDateString(),
          image: `http://127.0.0.1:8000${item.primary_photo}`,
          flags: item.flags,
          has_flagged: item.has_flagged,
        }));
        setIssues(formatted);
      } catch (err) {
        console.error("Error fetching my issues:", err);
      }
    };
    fetchMyIssues();
    const interval = setInterval(() => { fetchMyIssues(); }, 5000);
    return () => clearInterval(interval);
  }, []);

  // ── Original filter logic — untouched ──
  const getFilteredIssues = () => {
    switch (activeTab) {
      case 'reported': return issues.filter(issue => issue.status === 'reported');
      case 'progress':  return issues.filter(issue => issue.status === 'progress');
      case 'resolved':  return issues.filter(issue => issue.status === 'resolved');
      default:          return issues;
    }
  };

  // ── Original handler — untouched ──
  const handleIssueClick = (issue: Issue) => {
    navigate(`/issue/${issue.id}`, { state: { issue } });
  };

  // Derived counts (styling only)
  const reportedCount  = issues.filter(i => i.status === 'reported').length;
  const progressCount  = issues.filter(i => i.status === 'progress').length;
  const resolvedCount  = issues.filter(i => i.status === 'resolved').length;
  const filtered       = getFilteredIssues();

  if (!user) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f6f7f9' }}>
      <div style={spinnerStyle} />
      <style>{`@keyframes mi-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // Tab definitions
  const tabs = [
    { value: 'all',      label: 'All',         count: issues.length },
    { value: 'reported', label: 'Reported',     count: reportedCount },
    { value: 'progress', label: 'In Progress',  count: progressCount },
    { value: 'resolved', label: 'Resolved',     count: resolvedCount },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        /* ── Page ── */
        .mi-page { font-family: 'DM Sans', sans-serif; background: #f6f7f9; min-height: 100vh; }

        /* ── Hero Banner ── */
        .mi-hero {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
          padding: 48px 0 100px;
          position: relative;
          overflow: hidden;
        }
        /* decorative circles */
        .mi-hero::before {
          content: '';
          position: absolute;
          width: 500px; height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(99,102,241,.15) 0%, transparent 70%);
          top: -150px; right: -100px;
          pointer-events: none;
        }
        .mi-hero::after {
          content: '';
          position: absolute;
          width: 300px; height: 300px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(16,185,129,.08) 0%, transparent 70%);
          bottom: -80px; left: 80px;
          pointer-events: none;
        }

        .mi-hero-inner {
          max-width: 1160px; margin: 0 auto; padding: 0 24px;
          position: relative; z-index: 1;
        }

        .mi-hero-top {
          display: flex; align-items: flex-start; justify-content: space-between;
          flex-wrap: wrap; gap: 20px; margin-bottom: 36px;
        }

        .mi-back-wrap { margin-bottom: 10px; }
        /* Override BackButton to look good on dark */
        .mi-back-wrap a,
        .mi-back-wrap button {
          color: rgba(255,255,255,.65) !important;
          font-size: 13px !important;
        }
        .mi-back-wrap a:hover,
        .mi-back-wrap button:hover { color: #fff !important; }

        .mi-hero-title {
          font-family: 'Sora', sans-serif;
          font-size: clamp(26px, 4vw, 36px);
          font-weight: 800; color: #fff;
          margin: 0 0 8px; line-height: 1.2;
        }
        .mi-hero-sub { font-size: 14px; color: rgba(255,255,255,.55); margin: 0; }

        .mi-report-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 12px 24px; border-radius: 14px;
          font-size: 14px; font-weight: 700;
          cursor: pointer; border: none;
          font-family: 'Sora', sans-serif;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #fff;
          box-shadow: 0 4px 18px rgba(99,102,241,.45);
          transition: all .22s; letter-spacing: .02em;
          white-space: nowrap;
        }
        .mi-report-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(99,102,241,.55);
        }

        /* ── Stat Cards in hero ── */
        .mi-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }
        @media(max-width: 768px){ .mi-stats{ grid-template-columns: 1fr 1fr; } }
        @media(max-width: 480px){ .mi-stats{ grid-template-columns: 1fr; } }

        .mi-stat {
          background: rgba(255,255,255,.07);
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 18px; padding: 20px 22px;
          backdrop-filter: blur(10px);
          transition: transform .22s, background .22s;
          opacity: 0; transform: translateY(14px);
          animation: miFadeUp .4s forwards;
        }
        .mi-stat:nth-child(1){ animation-delay:.05s }
        .mi-stat:nth-child(2){ animation-delay:.10s }
        .mi-stat:nth-child(3){ animation-delay:.15s }
        .mi-stat:nth-child(4){ animation-delay:.20s }
        .mi-stat:hover { background: rgba(255,255,255,.12); transform: translateY(-2px); }

        .mi-stat-icon { width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; margin-bottom:12px; }
        .mi-stat-label { font-size:11px; color:rgba(255,255,255,.5); font-weight:500; letter-spacing:.05em; text-transform:uppercase; margin-bottom:6px; }
        .mi-stat-val   { font-family:'Sora',sans-serif; font-size:28px; font-weight:800; color:#fff; line-height:1; }

        /* ── Content area floating above hero ── */
        .mi-content {
          max-width: 1160px; margin: -52px auto 0;
          padding: 0 24px 80px;
          position: relative; z-index: 2;
        }
        @media(max-width: 600px){ .mi-content{ margin: -28px auto 0; padding: 0 14px 60px; } }

        /* ── Tab bar ── */
        .mi-tab-card {
          background: #fff; border: 1px solid #e8edf4;
          border-radius: 20px; padding: 6px;
          box-shadow: 0 2px 12px rgba(0,0,0,.07);
          display: inline-flex; gap: 4px;
          margin-bottom: 24px; flex-wrap: wrap;
        }

        .mi-tab {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 10px 20px; border-radius: 14px;
          font-size: 13px; font-weight: 600;
          cursor: pointer; border: none; background: transparent; color: #64748b;
          font-family: 'DM Sans', sans-serif; transition: all .2s;
          white-space: nowrap;
        }
        .mi-tab:hover { background: #f1f5f9; color: #334155; }
        .mi-tab.active {
          background: #0f172a; color: #fff;
          box-shadow: 0 2px 10px rgba(15,23,42,.2);
        }
        .mi-tab .mi-count {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 20px; height: 20px; padding: 0 6px;
          border-radius: 999px; font-size: 10px; font-weight: 700;
          background: rgba(255,255,255,.2); color: inherit;
          transition: all .2s;
        }
        .mi-tab:not(.active) .mi-count {
          background: #f1f5f9; color: #64748b;
        }

        /* ── Issues table card ── */
        .mi-table-card {
          background: #fff; border: 1px solid #e8edf4;
          border-radius: 20px; box-shadow: 0 2px 8px rgba(0,0,0,.05);
          overflow: hidden;
          opacity: 0; transform: translateY(16px);
          animation: miFadeUp .4s .15s forwards;
        }
        .mi-table-head {
          padding: 18px 24px 14px; border-bottom: 1px solid #f1f5f9;
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 10px;
        }
        .mi-table-title { font-family:'Sora',sans-serif; font-size:15px; font-weight:600; color:#0f172a; }
        .mi-table-count { font-size:12px; color:#94a3b8; background:#f8fafc; border:1px solid #e8edf4; border-radius:20px; padding:3px 10px; }

        /* ── Issues grid ── */
        .mi-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; padding:20px; }
        @media(max-width:1000px){ .mi-grid{ grid-template-columns:repeat(2,1fr); } }
        @media(max-width:600px) { .mi-grid{ grid-template-columns:1fr; } }

        /* ── Skeleton loader ── */
        .mi-skel-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; padding:20px; }
        @media(max-width:1000px){ .mi-skel-grid{ grid-template-columns:1fr 1fr; } }
        @media(max-width:600px) { .mi-skel-grid{ grid-template-columns:1fr; } }
        .mi-skel { border-radius:16px; overflow:hidden; border:1px solid #e8edf4; }
        .mi-skel-img  { height:148px; background:linear-gradient(90deg,#f1f5f9 25%,#e8edf4 50%,#f1f5f9 75%); background-size:200% 100%; animation:miShimmer 1.4s infinite; }
        .mi-skel-body { background:#fff; padding:16px; }
        .mi-skel-line { height:12px; background:linear-gradient(90deg,#f1f5f9 25%,#e8edf4 50%,#f1f5f9 75%); background-size:200% 100%; animation:miShimmer 1.4s infinite; border-radius:6px; margin-bottom:10px; }

        /* ── Empty state ── */
        .mi-empty { text-align:center; padding:72px 24px; }
        .mi-empty-icon { width:72px; height:72px; border-radius:50%; background:#f1f5f9; display:flex; align-items:center; justify-content:center; margin:0 auto 20px; }
        .mi-empty-title { font-family:'Sora',sans-serif; font-size:17px; font-weight:700; color:#0f172a; margin-bottom:8px; }
        .mi-empty-sub   { font-size:14px; color:#94a3b8; margin-bottom:24px; line-height:1.6; }
        .mi-cta-btn {
          display:inline-flex; align-items:center; gap:7px;
          padding:11px 24px; border-radius:13px; font-size:13px; font-weight:700;
          cursor:pointer; border:none; font-family:'Sora',sans-serif;
          background:#0f172a; color:#fff;
          box-shadow:0 2px 10px rgba(15,23,42,.2);
          transition:all .2s;
        }
        .mi-cta-btn:hover { background:#1e293b; transform:translateY(-2px); box-shadow:0 5px 16px rgba(15,23,42,.28); }

        /* ── Animations ── */
        @keyframes miFadeUp  { to{ opacity:1; transform:translateY(0); } }
        @keyframes miShimmer { to{ background-position:-200% 0; } }
        @keyframes mi-spin   { to{ transform:rotate(360deg); } }
      `}</style>

      <div className="mi-page">
        <Header isLoggedIn={true} userName={user?.username} isAdmin={isAdmin} />

        {/* ── HERO BANNER ── */}
        <div className="mi-hero">
          <div className="mi-hero-inner">

            {/* Top row: back + title + button */}
            <div className="mi-hero-top">
              <div>
                <div className="mi-back-wrap">
                  {/* original BackButton — untouched */}
                  <BackButton fallback="/home" theme="dark" />
                </div>
                <h1 className="mi-hero-title">My Issues</h1>
                <p className="mi-hero-sub">Track and manage all your reported civic issues</p>
              </div>

              {/* original navigate('/report') */}
              <button className="mi-report-btn" onClick={() => navigate('/report')}>
                <Plus size={16} /> Report New Issue
              </button>
            </div>

            {/* Stat cards */}
            <div className="mi-stats">
              <div className="mi-stat">
                <div className="mi-stat-icon" style={{ background:'rgba(99,102,241,.2)' }}>
                  <LayoutGrid size={17} color="#a5b4fc" />
                </div>
                <p className="mi-stat-label">Total</p>
                <p className="mi-stat-val">{issues.length}</p>
              </div>
              <div className="mi-stat">
                <div className="mi-stat-icon" style={{ background:'rgba(220,38,38,.2)' }}>
                  <AlertTriangle size={17} color="#fca5a5" />
                </div>
                <p className="mi-stat-label">Reported</p>
                <p className="mi-stat-val" style={{ color:'#fca5a5' }}>{reportedCount}</p>
              </div>
              <div className="mi-stat">
                <div className="mi-stat-icon" style={{ background:'rgba(37,99,235,.2)' }}>
                  <TrendingUp size={17} color="#93c5fd" />
                </div>
                <p className="mi-stat-label">In Progress</p>
                <p className="mi-stat-val" style={{ color:'#93c5fd' }}>{progressCount}</p>
              </div>
              <div className="mi-stat">
                <div className="mi-stat-icon" style={{ background:'rgba(22,163,74,.2)' }}>
                  <CheckCircle size={17} color="#86efac" />
                </div>
                <p className="mi-stat-label">Resolved</p>
                <p className="mi-stat-val" style={{ color:'#86efac' }}>{resolvedCount}</p>
              </div>
            </div>

          </div>
        </div>

        {/* ── CONTENT (floats over hero) ── */}
        <div className="mi-content">

          {/* Tab bar — original Tabs value/onValueChange kept via activeTab state */}
          <div className="mi-tab-card">
            {tabs.map(t => (
              <button
                key={t.value}
                className={`mi-tab${activeTab === t.value ? ' active' : ''}`}
                onClick={() => setActiveTab(t.value)}   // same as original onValueChange
              >
                {t.label}
                <span className="mi-count">{t.count}</span>
              </button>
            ))}
          </div>

          {/* Issues table card — wraps original TabsContent logic */}
          {/* We keep the original Tabs component under the hood for compat */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="hidden" /> {/* hidden — our custom tab bar above handles UI */}

            <TabsContent value={activeTab} className="mt-0">
              <div className="mi-table-card">
                <div className="mi-table-head">
                  <span className="mi-table-title">
                    {activeTab === 'all'      ? 'All Issues' :
                     activeTab === 'reported' ? 'Reported Issues' :
                     activeTab === 'progress' ? 'In Progress' :
                     'Resolved Issues'}
                  </span>
                  <span className="mi-table-count">{filtered.length} issue{filtered.length !== 1 ? 's' : ''}</span>
                </div>

                {/* Original conditional render — only wrapper classNames changed */}
                {filtered.length > 0 ? (
                  <div className="mi-grid">
                    {/* original IssueCard + handleIssueClick — untouched */}
                    {filtered.map((issue) => (
                      <IssueCard
                        key={issue.id}
                        issue={issue}
                        isAdmin={isAdmin}
                        onClick={() => handleIssueClick(issue)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="mi-empty">
                    <div className="mi-empty-icon">
                      <FileText size={28} color="#cbd5e1" />
                    </div>
                    <p className="mi-empty-title">No issues found</p>
                    <p className="mi-empty-sub">
                      {activeTab === 'all'
                        ? "You haven't reported any issues yet."
                        : `No ${activeTab === 'progress' ? 'in-progress' : activeTab} issues found.`}
                    </p>
                    {/* original navigate('/report') */}
                    <button className="mi-cta-btn" onClick={() => navigate('/report')}>
                      <Plus size={14} /> Report Your First Issue
                    </button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

        </div>
      </div>
    </>
  );
}

const spinnerStyle: React.CSSProperties = {
  width: 36, height: 36,
  border: '3px solid #e2e8f0',
  borderTop: '3px solid #6366f1',
  borderRadius: '50%',
  animation: 'mi-spin .75s linear infinite',
};