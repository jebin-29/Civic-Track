import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { adminAPI } from "@/lib/api";
import {
  Ban, Eye, EyeOff, Flag, AlertTriangle, CheckCircle,
  Clock, Search, TrendingUp, Users, LayoutGrid, BarChart3,
  ChevronRight, Wallet,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Issue } from "@/components/IssueCard";

const priorityMeta: Record<string, { color: string; bg: string; border: string }> = {
  urgent: { color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  high:   { color: "#ea580c", bg: "#fff7ed", border: "#fed7aa" },
  medium: { color: "#ca8a04", bg: "#fefce8", border: "#fde68a" },
  low:    { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
};

const statusMeta: Record<string, { color: string; bg: string; border: string; label: string }> = {
  reported: { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", label: "Reported"    },
  progress: { color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", label: "In Progress" },
  resolved: { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", label: "Resolved"   },
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user,         setUser]         = useState<any>(null);
  const [issues,       setIssues]       = useState<Issue[]>([]);
  const [users,        setUsers]        = useState<any[]>([]);
  const [searchTerm,   setSearchTerm]   = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stats,        setStats]        = useState<any>(null);
  const [activeTab,    setActiveTab]    = useState("issues");
  const [loaded,       setLoaded]       = useState(false);
  const [hiddenIssues, setHiddenIssues] = useState<Issue[]>([]);
  const [deptFilter, setDeptFilter] = useState("all");

  const reportedCount = issues.filter(i => i.status === "reported").length;
  const progressCount = issues.filter(i => i.status === "progress").length;
  const resolvedCount = issues.filter(i => i.status === "resolved").length;
  const totalCost     = issues.reduce((s, i) => s + (i.ai_cost || 0), 0);

  useEffect(() => {
    const userData = localStorage.getItem("civictrack_user");
    if (userData) {
      const userObj = JSON.parse(userData);
      setUser(userObj);
      if (!userObj.isAdmin) navigate("/home");
    } else { navigate("/login"); }
  }, [navigate]);

  useEffect(() => {
    let interval: any;
    const fetchIssues = async () => {
      try {
        const data = await adminAPI.getIssues();
        setIssues(data.results || data);
        setLoaded(true);
      } catch (err) { console.error("Failed to fetch issues:", err); clearInterval(interval); }
    };
    const fetchStats = async () => {
      try { setStats(await adminAPI.getStatistics()); }
      catch (err) { console.error(err); }
    };
    const fetchUsers = async () => {
      try { const data = await adminAPI.getUsers(); setUsers(data.results || data); }
      catch (err) { console.error(err); }
    };
    fetchIssues(); fetchStats();
    if (activeTab === "users") fetchUsers();
    interval = setInterval(fetchIssues, 5000);
    return () => clearInterval(interval);
  }, [activeTab]);

  // const handleFlagIssue  = (id: string) =>
  //   setIssues(prev => prev.map(i => i.id === id ? { ...i, flags: (i.flags || 0) + 1 } : i));

  const handleHideIssue = async (id: string) => {
  try {
    await adminAPI.hideIssue(id);
    setIssues(prev => prev.filter(i => i.id !== id));
    setHiddenIssues(prev => [...prev, issues.find(i => i.id === id)!]);
  } catch (err) { console.error(err); }
};

const handleUnhideIssue = async (id: string) => {
  try {
    await adminAPI.hideIssue(id);
    setHiddenIssues(prev => prev.filter(i => i.id !== id));
  } catch (err) { console.error(err); }
};

  const handleStatusUpdate = async (id: string, status: "reported" | "progress" | "resolved") => {
    try { await adminAPI.updateIssueStatus(id, status); setIssues(prev => prev.map(i => i.id === id ? { ...i, status } : i)); }
    catch (err) { console.error(err); }
  };

  const handleBanUser = async (id: string) => {
  try {
    await adminAPI.toggleUserStatus(id);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: "banned", is_active: false } : u));
  } catch (err) { console.error(err); }
};

const handleUnbanUser = async (id: string) => {
  try {
    await adminAPI.toggleUserStatus(id);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: "active", is_active: true } : u));
  } catch (err) { console.error(err); }
};

  if (!user) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#fafaf9" }}>
      <div style={spinnerStyle} />
    </div>
  );

  const filteredIssues = [...issues]
    .filter(i => (statusFilter === "all" || i.status === statusFilter) &&
                  i.title.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      const order: Record<string,number> = { urgent:1, high:2, medium:3, low:4 };
      return (order[a.ai_priority] || 5) - (order[b.ai_priority] || 5);
    });

  const tabs = [
    { id:"issues",    label:"Issues",    icon:<LayoutGrid size={15}/> },
    { id:"hidden",    label:"Hidden",    icon:<EyeOff     size={15}/> },
    { id:"users",     label:"Users",     icon:<Users      size={15}/> },
    { id:"analytics", label:"Analytics", icon:<BarChart3  size={15}/> },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin:0; padding:0; }

        .adm-wrap { font-family:'DM Sans',sans-serif; background:#f6f7f9; min-height:100vh; color:#1e293b; }
        .adm-body { max-width:1200px; margin:0 auto; padding:36px 24px 80px; }

        .page-title { font-family:'Sora',sans-serif; font-size:26px; font-weight:700; color:#0f172a; margin-bottom:4px; }
        .page-sub   { font-size:14px; color:#94a3b8; font-weight:400; }

        .stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin:28px 0; }
        @media(max-width:768px){ .stats-grid{ grid-template-columns:1fr 1fr; } }
        @media(max-width:480px){ .stats-grid{ grid-template-columns:1fr; } }

        .stat-card {
          background:#fff; border:1px solid #e8edf4; border-radius:18px;
          padding:22px 24px; box-shadow:0 1px 3px rgba(0,0,0,.04);
          transition:transform .22s,box-shadow .22s;
          opacity:0; transform:translateY(12px); animation:fadeUp .45s forwards;
        }
        .stat-card:nth-child(1){ animation-delay:.05s }
        .stat-card:nth-child(2){ animation-delay:.1s  }
        .stat-card:nth-child(3){ animation-delay:.15s }
        .stat-card:nth-child(4){ animation-delay:.2s  }
        .stat-card:hover{ transform:translateY(-3px); box-shadow:0 8px 24px rgba(0,0,0,.08); }
        .stat-icon-wrap { width:38px; height:38px; border-radius:11px; display:flex; align-items:center; justify-content:center; margin-bottom:14px; }
        .stat-label { font-size:12px; color:#94a3b8; font-weight:500; letter-spacing:.04em; text-transform:uppercase; margin-bottom:6px; }
        .stat-value { font-family:'Sora',sans-serif; font-size:28px; font-weight:700; color:#0f172a; line-height:1; }

        .tab-bar { display:inline-flex; gap:4px; background:#fff; border:1px solid #e8edf4; border-radius:14px; padding:5px; margin-bottom:24px; box-shadow:0 1px 3px rgba(0,0,0,.04); }
        .tab-btn { display:inline-flex; align-items:center; gap:7px; padding:9px 20px; border-radius:10px; font-size:13px; font-weight:500; cursor:pointer; border:none; background:transparent; color:#64748b; font-family:'DM Sans',sans-serif; transition:all .2s; letter-spacing:.01em; }
        .tab-btn:hover { background:#f1f5f9; color:#334155; }
        .tab-btn.active { background:#0f172a; color:#fff; box-shadow:0 2px 8px rgba(15,23,42,.18); }

        .filter-bar { display:flex; gap:12px; margin-bottom:18px; flex-wrap:wrap; }
        .search-wrap { flex:1; position:relative; min-width:200px; }
        .search-icon { position:absolute; left:13px; top:50%; transform:translateY(-50%); color:#94a3b8; pointer-events:none; }
        .search-input { width:100%; padding:10px 14px 10px 38px; border:1px solid #e2e8f0; border-radius:12px; font-size:14px; background:#fff; font-family:'DM Sans',sans-serif; color:#1e293b; outline:none; transition:border-color .2s,box-shadow .2s; }
        .search-input:focus { border-color:#6366f1; box-shadow:0 0 0 3px rgba(99,102,241,.1); }
        .search-input::placeholder { color:#cbd5e1; }
        .filter-select { padding:10px 16px; border:1px solid #e2e8f0; border-radius:12px; font-size:14px; background:#fff; color:#1e293b; font-family:'DM Sans',sans-serif; outline:none; cursor:pointer; }

        .table-card { background:#fff; border:1px solid #e8edf4; border-radius:20px; box-shadow:0 1px 3px rgba(0,0,0,.04); overflow:hidden; }
        .table-head { padding:20px 28px 14px; border-bottom:1px solid #f1f5f9; display:flex; align-items:center; justify-content:space-between; }
        .table-title { font-family:'Sora',sans-serif; font-size:15px; font-weight:600; color:#0f172a; }
        .table-count { font-size:12px; color:#94a3b8; background:#f8fafc; border:1px solid #e8edf4; border-radius:20px; padding:3px 10px; }

        .issue-row { display:flex; align-items:flex-start; justify-content:space-between; padding:18px 28px; border-bottom:1px solid #f8fafc; cursor:pointer; transition:background .18s; gap:16px; }
        .issue-row:last-child { border-bottom:none; }
        .issue-row:hover { background:#fafbfc; }
        .issue-left { flex:1; min-width:0; }
        .issue-title-row { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:6px; }
        .issue-name { font-family:'Sora',sans-serif; font-size:14px; font-weight:600; color:#0f172a; }
        .pill { display:inline-flex; align-items:center; gap:4px; padding:3px 10px; border-radius:999px; font-size:11px; font-weight:600; letter-spacing:.03em; border:1px solid transparent; white-space:nowrap; }
        .issue-desc { font-size:13px; color:#94a3b8; line-height:1.5; margin-bottom:10px; display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; overflow:hidden; }
        .issue-meta { display:flex; gap:16px; flex-wrap:wrap; }
        .meta-item { display:flex; align-items:center; gap:4px; font-size:12px; color:#94a3b8; }
        .meta-item strong { color:#64748b; font-weight:500; }
        .meta-dot { width:3px; height:3px; border-radius:50%; background:#cbd5e1; }

        /* ── ACTION BUTTONS – redesigned ── */
        .issue-actions { display:flex; flex-direction:column; gap:6px; flex-shrink:0; align-items:flex-end; }

        .act-hide {
          display:inline-flex; align-items:center; gap:5px;
          padding:6px 12px; border-radius:8px; font-size:11px; font-weight:600;
          cursor:pointer; font-family:'DM Sans',sans-serif;
          border:1.5px solid #e2e8f0; background:#fff; color:#94a3b8;
          transition:all .18s; white-space:nowrap; letter-spacing:.02em;
        }
        .act-hide:hover { background:#fef2f2; border-color:#fecaca; color:#dc2626; }

        .act-progress {
          display:inline-flex; align-items:center; gap:6px;
          padding:8px 16px; border-radius:10px; font-size:12px; font-weight:600;
          cursor:pointer; border:none; font-family:'Sora',sans-serif;
          white-space:nowrap; letter-spacing:.02em;
          color:#2563eb;
          background:#eff6ff;
          border: 1.5px solid #bfdbfe;
          transition:all .2s;
        }
        .act-progress:hover {
          background:#dbeafe; border-color:#93c5fd;
          box-shadow:0 3px 10px rgba(37,99,235,.15);
          transform:translateY(-1px);
        }
        .act-progress .act-arrow {
          width:18px; height:18px; border-radius:50%;
          background:#2563eb; color:#fff;
          display:flex; align-items:center; justify-content:center; flex-shrink:0;
        }

        .act-resolve {
          display:inline-flex; align-items:center; gap:6px;
          padding:8px 16px; border-radius:10px; font-size:12px; font-weight:600;
          cursor:pointer; border:none; font-family:'Sora',sans-serif;
          white-space:nowrap; letter-spacing:.02em;
          color:#059669;
          background:#ecfdf5;
          border: 1.5px solid #a7f3d0;
          transition:all .2s;
        }
        .act-resolve:hover {
          background:#d1fae5; border-color:#6ee7b7;
          box-shadow:0 3px 10px rgba(5,150,105,.15);
          transform:translateY(-1px);
        }
        .act-resolve .act-check {
          width:18px; height:18px; border-radius:50%;
          background:#059669; color:#fff;
          display:flex; align-items:center; justify-content:center; flex-shrink:0;
        }

        .act-btn { display:inline-flex; align-items:center; gap:5px; padding:7px 13px; border-radius:10px; font-size:12px; font-weight:500; cursor:pointer; border:1px solid #e2e8f0; background:#fff; color:#475569; font-family:'DM Sans',sans-serif; transition:all .18s; white-space:nowrap; }
        .act-btn:hover { background:#f8fafc; border-color:#cbd5e1; color:#334155; }
        .act-btn-hide { border:1px solid #fecaca !important; background:#fff5f5 !important; color:#dc2626 !important; }
        .act-btn-hide:hover { background:#fee2e2 !important; border-color:#f87171 !important; color:#b91c1c !important; }
        .act-btn-primary { border:none; color:#fff; background:linear-gradient(135deg,#6366f1,#8b5cf6); box-shadow:0 2px 10px rgba(99,102,241,.3); padding:8px 16px; border-radius:10px; transition:all .2s; }
        .act-btn-primary:hover { transform:translateY(-1px); box-shadow:0 5px 16px rgba(99,102,241,.4); opacity:1; }
        .act-btn-green { border:none; color:#fff; background:linear-gradient(135deg,#059669,#10b981); box-shadow:0 2px 10px rgba(5,150,105,.25); padding:8px 16px; border-radius:10px; transition:all .2s; }
        .act-btn-green:hover { transform:translateY(-1px); box-shadow:0 5px 16px rgba(5,150,105,.35); }
        .act-completed { display:inline-flex; align-items:center; gap:5px; padding:7px 14px; border-radius:10px; font-size:12px; font-weight:600; color:#059669; background:#f0fdf4; border:1px solid #bbf7d0; white-space:nowrap; pointer-events:none; letter-spacing:.01em; }

        .user-row { display:flex; align-items:center; justify-content:space-between; padding:16px 28px; border-bottom:1px solid #f8fafc; transition:background .18s; }
        .user-row:last-child{ border-bottom:none; }
        .user-row:hover{ background:#fafbfc; }
        .user-avatar { width:38px; height:38px; border-radius:50%; background:linear-gradient(135deg,#e0e7ff,#dbeafe); display:flex; align-items:center; justify-content:center; font-weight:600; font-size:14px; color:#6366f1; flex-shrink:0; }
        .user-info { flex:1; margin-left:14px; }
        .user-name { font-size:14px; font-weight:600; color:#0f172a; font-family:'Sora',sans-serif; }
        .user-email { font-size:12px; color:#94a3b8; margin-top:2px; }

        .analytics-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
        @media(max-width:640px){ .analytics-grid{ grid-template-columns:1fr; } }
        .analytics-card { background:#fff; border:1px solid #e8edf4; border-radius:20px; padding:24px 28px; box-shadow:0 1px 3px rgba(0,0,0,.04); }
        .analytics-title { font-family:'Sora',sans-serif; font-size:14px; font-weight:600; color:#0f172a; margin-bottom:20px; }
        .analytics-row { display:flex; align-items:center; justify-content:space-between; padding:10px 0; border-bottom:1px solid #f8fafc; }
        .analytics-row:last-child{ border-bottom:none; }
        .analytics-row-left { display:flex; align-items:center; gap:10px; font-size:14px; color:#475569; }
        .analytics-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
        .analytics-val { font-family:'Sora',sans-serif; font-size:18px; font-weight:700; color:#0f172a; }

        .empty-state { text-align:center; padding:48px 24px; color:#94a3b8; }
        .empty-icon { font-size:40px; margin-bottom:12px; }
        .empty-text { font-size:14px; }

        @keyframes fadeUp { to { opacity:1; transform:translateY(0); } }
        @keyframes spin   { to { transform:rotate(360deg); } }
      `}</style>

      <div className="adm-wrap">
        <Header isLoggedIn={true} userName={user?.username} isAdmin={true} />
        <div className="adm-body">

          <p className="page-title">Admin Dashboard</p>
          <p className="page-sub">Manage issues, monitor activity, and keep the community running</p>

          {/* stat cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon-wrap" style={{ background:"#eff6ff" }}><LayoutGrid size={18} color="#2563eb"/></div>
              <p className="stat-label">Total Issues</p>
              <p className="stat-value">{issues.length}</p>
            </div>
            <div className="stat-card">
              <div className="stat-icon-wrap" style={{ background:"#fef2f2" }}><AlertTriangle size={18} color="#dc2626"/></div>
              <p className="stat-label">Urgent</p>
              <p className="stat-value" style={{ color:"#dc2626" }}>{issues.filter(i => i.ai_priority === "urgent").length}</p>
            </div>
            <div className="stat-card">
              <div className="stat-icon-wrap" style={{ background:"#fff7ed" }}><TrendingUp size={18} color="#ea580c"/></div>
              <p className="stat-label">High Severity</p>
              <p className="stat-value" style={{ color:"#ea580c" }}>{issues.filter(i => i.ai_severity === "high").length}</p>
            </div>
            <div className="stat-card">
              <div className="stat-icon-wrap" style={{ background:"#f0fdf4" }}><Wallet size={18} color="#16a34a"/></div>
              <p className="stat-label">Total Cost</p>
              <p className="stat-value" style={{ color:"#16a34a", fontSize:"22px" }}>₹{totalCost.toLocaleString()}</p>
            </div>
          </div>

          {/* tab bar */}
          <div className="tab-bar">
            {tabs.map(t => (
              <button key={t.id} className={`tab-btn${activeTab === t.id ? " active" : ""}`} onClick={() => setActiveTab(t.id)}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {activeTab === "issues" && (
  <>
    {/* search bar only — select moves into the IIFE below */}
    {/* <div className="filter-bar">
      <div className="search-wrap">
        <Search size={15} className="search-icon"/>
        <input className="search-input" placeholder="Search issues by title…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
      </div>
    </div> */}

    {(() => {
      const deptTabs = [
        { id: "all",         label: "All",         emoji: "📋" },
        { id: "road",        label: "Road",        emoji: "🛣️" },
        { id: "garbage",     label: "Garbage",     emoji: "🗑️" },
        { id: "drainage",    label: "Drainage",    emoji: "🚰" },
        { id: "streetlight", label: "Streetlight", emoji: "💡" },
        { id: "general",     label: "General",     emoji: "📌" },
      ];

      const getDeptKey = (issue: any) => {
        const t = (issue.ai_issue_type || "").toLowerCase();
        if (!t || t === "n/a" || t === "analyzing..." || t === "general issue") return "general";
        if (t.includes("pothole") || t.includes("road")) return "road";
        if (t.includes("garbage"))                        return "garbage";
        if (t.includes("sewage") || t.includes("drain") || t.includes("water")) return "drainage";
        if (t.includes("light"))                          return "streetlight";
        return "general";
      };

      // ── Issues matching search + dept, IGNORING status filter ──
      // These drive the dropdown counts so they reflect the active dept tab.
      const deptBaseIssues = issues
        .filter(i => i.title.toLowerCase().includes(searchTerm.toLowerCase()))
        .filter(i => deptFilter === "all" || getDeptKey(i) === deptFilter);

      const deptTotal    = deptBaseIssues.length;
      const deptReported = deptBaseIssues.filter(i => i.status === "reported").length;
      const deptProgress = deptBaseIssues.filter(i => i.status === "progress").length;
      const deptResolved = deptBaseIssues.filter(i => i.status === "resolved").length;

      // ── dept tab badge counts (unaffected by status filter) ──
      const deptCounts: Record<string, number> = {
        all:         issues.filter(i => i.title.toLowerCase().includes(searchTerm.toLowerCase())).length,
        road:        issues.filter(i => i.title.toLowerCase().includes(searchTerm.toLowerCase()) && getDeptKey(i) === "road").length,
        garbage:     issues.filter(i => i.title.toLowerCase().includes(searchTerm.toLowerCase()) && getDeptKey(i) === "garbage").length,
        drainage:    issues.filter(i => i.title.toLowerCase().includes(searchTerm.toLowerCase()) && getDeptKey(i) === "drainage").length,
        streetlight: issues.filter(i => i.title.toLowerCase().includes(searchTerm.toLowerCase()) && getDeptKey(i) === "streetlight").length,
        general:     issues.filter(i => i.title.toLowerCase().includes(searchTerm.toLowerCase()) && getDeptKey(i) === "general").length,
      };

      // ── Final list: dept + status + search all applied ──
      const deptFiltered = deptBaseIssues.filter(
        i => statusFilter === "all" || i.status === statusFilter
      ).sort((a, b) => {
        const order: Record<string, number> = { urgent:1, high:2, medium:3, low:4 };
        return (order[a.ai_priority] || 5) - (order[b.ai_priority] || 5);
      });

      return (
        <>
          {/* ── Dynamic status dropdown (dept-aware) ── */}
          {/* REMOVE the standalone filter-bar above the IIFE */}

 {/* Inside the IIFE, replace the two separate divs with this single row: */}
<div className="filter-bar" style={{ marginBottom: 14 }}>
  <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
    <option value="all">All Status ({deptTotal})</option>
    <option value="reported">Reported ({deptReported})</option>
    <option value="progress">In Progress ({deptProgress})</option>
    <option value="resolved">Resolved ({deptResolved})</option>
  </select>
  <div className="search-wrap">
    <Search size={15} className="search-icon"/>
    <input className="search-input" placeholder="Search issues by title…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
  </div>
</div>

          {/* ── Department sub-tabs ── */}
          <div style={{ display:"flex", gap:6, marginBottom:16, flexWrap:"wrap" }}>
            {deptTabs.map(t => (
              <button key={t.id} onClick={() => setDeptFilter(t.id)} style={{
                display:"inline-flex", alignItems:"center", gap:6,
                padding:"7px 14px", borderRadius:10, fontSize:12, fontWeight:600,
                cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all .18s",
                border: "1.5px solid",
                borderColor: deptFilter === t.id ? "#6366f1" : "#e2e8f0",
                background:  deptFilter === t.id ? "#f0f1ff" : "#fff",
                color:       deptFilter === t.id ? "#6366f1" : "#64748b",
                boxShadow:   deptFilter === t.id ? "0 0 0 3px rgba(99,102,241,.1)" : "none",
              }}>
                {t.emoji} {t.label}
                <span style={{
                  minWidth:18, height:18, borderRadius:999, fontSize:10, fontWeight:700,
                  display:"inline-flex", alignItems:"center", justifyContent:"center", padding:"0 5px",
                  background: deptFilter === t.id ? "#6366f1" : "#f1f5f9",
                  color:      deptFilter === t.id ? "#fff" : "#64748b",
                }}>
                  {deptCounts[t.id]}
                </span>
              </button>
            ))}
          </div>

          <div className="table-card">
            <div className="table-head">
              <span className="table-title">
                {deptTabs.find(t => t.id === deptFilter)?.emoji}{" "}
                {deptTabs.find(t => t.id === deptFilter)?.label} Issues
              </span>
              <span className="table-count">{deptFiltered.length} results</span>
            </div>
            {deptFiltered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">{deptTabs.find(t => t.id === deptFilter)?.emoji || "🗂️"}</div>
                <p className="empty-text">No {deptTabs.find(t => t.id === deptFilter)?.label} issues found</p>
              </div>
            ) : (
              deptFiltered.map(issue => {
                const sm = statusMeta[issue.status] ?? statusMeta.reported;
                const pm = priorityMeta[issue.ai_priority?.toLowerCase()] ?? priorityMeta.medium;
                return (
                  <div key={issue.id} className="issue-row" onClick={() => navigate(`/admin/issues/${issue.id}`)}>
                    <div className="issue-left">
                      <div className="issue-title-row">
                        <span className="issue-name">{issue.title}</span>
                        <span className="pill" style={{ color:sm.color, background:sm.bg, borderColor:sm.border }}>
                          {issue.status === "reported" && <AlertTriangle size={10}/>}
                          {issue.status === "progress" && <Clock size={10}/>}
                          {issue.status === "resolved" && <CheckCircle size={10}/>}
                          {sm.label}
                        </span>
                        {issue.ai_priority && (
                          <span className="pill" style={{ color:pm.color, background:pm.bg, borderColor:pm.border }}>
                            {issue.ai_priority.toUpperCase()}
                          </span>
                        )}
                        {issue.flags > 0 && (
                          <span className="pill" style={{ color:"#dc2626", background:"#fef2f2", borderColor:"#fecaca" }}>
                            <Flag size={10}/> {issue.flags} flags
                          </span>
                        )}
                      </div>
                      <p className="issue-desc">{issue.description}</p>
                      <div className="issue-meta">
                        <span className="meta-item"><span>Type:</span>&nbsp;<strong>{issue.ai_issue_type || "N/A"}</strong></span>
                        <span className="meta-dot"/>
                        <span className="meta-item"><span>Workers:</span>&nbsp;<strong>{issue.ai_workers || "–"}</strong></span>
                        <span className="meta-dot"/>
                        <span className="meta-item"><span>Time:</span>&nbsp;<strong>{issue.ai_time_required || "–"}</strong></span>
                        <span className="meta-dot"/>
                        <span className="meta-item"><span>Cost:</span>&nbsp;<strong>₹{issue.ai_cost || 0}</strong></span>
                        <span className="meta-dot"/>
                        <span className="meta-item">{issue.location}</span>
                      </div>
                    </div>
                    <div className="issue-actions" onClick={e => e.stopPropagation()}>
                      <div className="btn-row">
                        <button className="act-btn act-btn-hide" onClick={() => handleHideIssue(issue.id)}>
                          <EyeOff size={13}/> Hide
                        </button>
                      </div>
                      <div className="btn-row">
                        {issue.status === "reported" && (
                          <button className="act-btn act-btn-primary" onClick={() => handleStatusUpdate(issue.id, "progress")}>
                            ▶ Start Progress
                          </button>
                        )}
                        {issue.status === "progress" && (
                          <button className="act-btn act-btn-green" onClick={() => handleStatusUpdate(issue.id, "resolved")}>
                            <CheckCircle size={13}/> Mark Resolved
                          </button>
                        )}
                        {issue.status === "resolved" && (
                          <span className="act-completed">
                            <CheckCircle size={13}/> Completed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      );
    })()}
  </>
)}

          {/* ══ HIDDEN ISSUES ══ */}
          {activeTab === "hidden" && (
          <div className="table-card">
            <div className="table-head">
              <span className="table-title">Hidden Issues</span>
              <span className="table-count">{hiddenIssues.length} hidden</span>
            </div>
            {hiddenIssues.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">🙈</div><p className="empty-text">No hidden issues</p></div>
            ) : (
              hiddenIssues.map(issue => {
                const sm = statusMeta[issue.status] ?? statusMeta.reported;
                const pm = priorityMeta[issue.ai_priority?.toLowerCase()] ?? priorityMeta.medium;
                return (
                  <div key={issue.id} className="issue-row">
                    <div className="issue-left">
                      <div className="issue-title-row">
                        <span className="issue-name">{issue.title}</span>
                        <span className="pill" style={{ color:sm.color, background:sm.bg, borderColor:sm.border }}>{sm.label}</span>
                        {issue.ai_priority && (
                          <span className="pill" style={{ color:pm.color, background:pm.bg, borderColor:pm.border }}>
                            {issue.ai_priority.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <p className="issue-desc">{issue.description}</p>
                    </div>
                    <div className="issue-actions" onClick={e => e.stopPropagation()}>
                      <button className="act-btn" onClick={() => handleUnhideIssue(issue.id)}
                        style={{ color:"#16a34a", borderColor:"#bbf7d0" }}>
                        <Eye size={13}/> Unhide
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          )}

          {/* ══ USERS ══ */}
          {activeTab === "users" && (
            <div className="table-card">
              <div className="table-head">
                <span className="table-title">User Management</span>
                <span className="table-count">{users.length} users</span>
              </div>
              {users.length === 0 ? (
                <div className="empty-state"><div className="empty-icon">👤</div><p className="empty-text">No users found</p></div>
              ) : (
                users.map((u: any) => (
                  <div key={u.id} className="user-row">
                    <div className="user-avatar">{(u.username?.[0] ?? "U").toUpperCase()}</div>
                    <div className="user-info">
                      <p className="user-name">{u.username}</p>
                      <p className="user-email">{u.email}</p>
                      <div style={{ display:"flex", gap:12, marginTop:4 }}>
                        <span style={{ fontSize:12, color:"#94a3b8" }}>{u.reports} reports</span>
                        <span style={{ fontSize:12, color:"#94a3b8" }}>{u.flags} flags</span>
                      </div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <span className="pill" style={u.status === "active"
                        ? { color:"#16a34a", background:"#f0fdf4", borderColor:"#bbf7d0" }
                        : { color:"#dc2626", background:"#fef2f2", borderColor:"#fecaca" }}>
                        {u.status}
                      </span>
                      {u.status === "active" ? (
                        <button className="act-btn" style={{ color:"#dc2626", borderColor:"#fecaca" }} onClick={() => handleBanUser(u.id)}>
                          <Ban size={13}/> Ban
                        </button>
                      ) : (
                        <button className="act-btn act-btn-primary" onClick={() => handleUnbanUser(u.id)}>
                          <Eye size={13}/> Unban
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ══ ANALYTICS ══ */}
          {activeTab === "analytics" && (
            <div className="analytics-grid">
              <div className="analytics-card">
                <p className="analytics-title">Issue Status Distribution</p>
                {[
                  { label:"Reported",    dot:"#dc2626", val:reportedCount },
                  { label:"In Progress", dot:"#2563eb", val:progressCount },
                  { label:"Resolved",    dot:"#16a34a", val:resolvedCount },
                ].map(row => (
                  <div key={row.label} className="analytics-row">
                    <div className="analytics-row-left"><span className="analytics-dot" style={{ background:row.dot }}/>{row.label}</div>
                    <span className="analytics-val">{row.val}</span>
                  </div>
                ))}
              </div>
              <div className="analytics-card">
                <p className="analytics-title">User Statistics</p>
                {[
                  { label:"Total Users",  val:users.length },
                  { label:"Active Users", val:users.filter((u:any) => u.status === "active").length },
                  { label:"Banned Users", val:users.filter((u:any) => u.status === "banned").length },
                ].map(row => (
                  <div key={row.label} className="analytics-row">
                    <span style={{ fontSize:14, color:"#475569" }}>{row.label}</span>
                    <span className="analytics-val">{row.val}</span>
                  </div>
                ))}
              </div>
              <div className="analytics-card">
                <p className="analytics-title">Priority Breakdown</p>
                {["urgent","high","medium","low"].map(p => {
                  const pm = priorityMeta[p];
                  return (
                    <div key={p} className="analytics-row">
                      <div className="analytics-row-left"><span className="analytics-dot" style={{ background:pm.color }}/>{p.charAt(0).toUpperCase()+p.slice(1)}</div>
                      <span className="analytics-val" style={{ color:pm.color }}>{issues.filter(i => i.ai_priority === p).length}</span>
                    </div>
                  );
                })}
              </div>
              <div className="analytics-card" style={{ background:"linear-gradient(135deg,#f5f3ff,#ede9fe)", border:"1px solid #ddd6fe" }}>
                <p className="analytics-title" style={{ color:"#5b21b6" }}>Cost Overview</p>
                {[
                  { label:"Total Est. Cost", val:`₹${totalCost.toLocaleString()}` },
                  { label:"Avg. per Issue",  val:issues.length ? `₹${Math.round(totalCost/issues.length).toLocaleString()}` : "–" },
                  { label:"Unresolved Cost", val:`₹${issues.filter(i=>i.status!=="resolved").reduce((s,i)=>s+(i.ai_cost||0),0).toLocaleString()}` },
                ].map(row => (
                  <div key={row.label} className="analytics-row" style={{ borderColor:"#ddd6fe" }}>
                    <span style={{ fontSize:14, color:"#7c3aed" }}>{row.label}</span>
                    <span className="analytics-val" style={{ color:"#5b21b6" }}>{row.val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}

const spinnerStyle: React.CSSProperties = {
  width:36, height:36,
  border:"3px solid #e2e8f0",
  borderTop:"3px solid #6366f1",
  borderRadius:"50%",
  animation:"spin .75s linear infinite",
};