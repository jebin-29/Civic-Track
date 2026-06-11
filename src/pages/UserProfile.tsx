import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  User, Mail, Phone, Shield, Camera, Save,
  Bell, Lock, CheckCircle, Eye, EyeOff
} from "lucide-react";
import { Header } from "@/components/Header";
import { BackButton } from "@/components/BackButton";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  username: string; email: string; phone: string; address?: string; avatar?: string;
  notifications: { email: boolean; push: boolean; sms: boolean; };
  privacy:       { showEmail: boolean; showPhone: boolean; anonymousReports: boolean; };
}

/* ── reusable toggle ────────────────────────────────────────────── */
function Toggle({ on, onChange, accent }: { on: boolean; onChange: () => void; accent: AccentConfig }) {
  return (
    <div
      onClick={onChange}
      style={{
        width:44, height:26, borderRadius:999, cursor:"pointer",
        background: on ? accent.gradient : "#e2e8f0",
        position:"relative", transition:"background .25s", flexShrink:0,
        boxShadow: on ? `0 0 0 3px ${accent.ring}` : "none",
      }}
    >
      <div style={{
        width:20, height:20, borderRadius:"50%", background:"#fff",
        position:"absolute", top:3, left: on ? 21 : 3,
        transition:"left .25s", boxShadow:"0 1px 4px rgba(0,0,0,.2)",
      }}/>
    </div>
  );
}

/* ── setting row ────────────────────────────────────────────────── */
function SettingRow({
  icon, title, desc, on, onChange, accent
}: { icon: React.ReactNode; title: string; desc: string; on: boolean; onChange: () => void; accent: AccentConfig }) {
  return (
    <div className="setting-row">
      <div className="setting-icon-wrap" style={{ background: accent.soft, color: accent.color }}>{icon}</div>
      <div className="setting-text">
        <p className="setting-title">{title}</p>
        <p className="setting-desc">{desc}</p>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <span style={{ fontSize:12, fontWeight:600, color: on ? accent.color : "#94a3b8" }}>
          {on ? "On" : "Off"}
        </span>
        <Toggle on={on} onChange={onChange} accent={accent}/>
      </div>
    </div>
  );
}

/* ── accent config ──────────────────────────────────────────────── */
interface AccentConfig {
  color: string; gradient: string; ring: string;
  soft: string; border: string; shadow: string;
}
const ACCENTS: Record<"admin"|"user", AccentConfig> = {
  admin: {
    color:    "#ea580c",
    gradient: "linear-gradient(135deg,#ea580c,#f97316)",
    ring:     "rgba(234,88,12,.15)",
    soft:     "#fff7ed",
    border:   "#fed7aa",
    shadow:   "rgba(234,88,12,.3)",
  },
  user: {
    color:    "#6366f1",
    gradient: "linear-gradient(135deg,#6366f1,#8b5cf6)",
    ring:     "rgba(99,102,241,.15)",
    soft:     "#f0f1ff",
    border:   "#c7d2fe",
    shadow:   "rgba(99,102,241,.3)",
  },
};

export default function UserProfile() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { toast } = useToast();

  const [user,        setUser]        = useState<any>(null);
  const [isAdmin,     setIsAdmin]     = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [activeTab,   setActiveTab]   = useState("profile");
  const [mounted,     setMounted]     = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [profile, setProfile] = useState<UserProfile>({
    username: "", email: "", phone: "",
    notifications: { email: true,  push: true,  sms: false  },
    privacy:       { showEmail: false, showPhone: false, anonymousReports: false },
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "", newPassword: "", confirmPassword: "",
  });

  const [avatarFile,    setAvatarFile]    = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");

  /* ── auth (unchanged) ── */
  useEffect(() => {
  const userData = localStorage.getItem("civictrack_user");
  if (userData) {
    const u = JSON.parse(userData);
    setUser(u);
    setIsAdmin(u.isAdmin || false);

    // Fetch latest profile from Django backend
    fetch("http://127.0.0.1:8000/api/current-user/", {
      headers: { "Authorization": `Token ${u.token}` }
    })
    .then(r => r.json())
    .then(data => {
      setProfile({
        username: data.username || "",
        email: data.email || "",
        phone: data.phone_number || "",
        address: data.address || "",
        avatar: u.avatar,
        notifications: u.notifications || { email:true, push:true, sms:false },
        privacy: u.privacy || { showEmail:false, showPhone:false, anonymousReports:false },
      });
    })
    .catch(() => {
      setProfile({
        username: u.username || "", email: u.email || "", phone: u.phone || "", address: u.address || "",
        avatar: u.avatar,
        notifications: u.notifications || { email:true, push:true, sms:false },
        privacy: u.privacy || { showEmail:false, showPhone:false, anonymousReports:false },
      });
    });

    setTimeout(() => setMounted(true), 80);
  } else { navigate("/login"); }
}, [navigate]);

  useEffect(() => {
  const tab = new URLSearchParams(location.search).get("tab");

    if (tab === "privacy" && isAdmin) {
      setActiveTab("profile"); // redirect
    } else if (tab) {
      setActiveTab(tab);
    }
  }, [location, isAdmin]);

  /* ── handlers (unchanged) ── */
  const handleProfileUpdate = async () => {
  setLoading(true);
  try {
    const token = user.token;
    
    // Save to Django backend
    await fetch("http://127.0.0.1:8000/api/profile/update/", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token ${token}`,
      },
      body: JSON.stringify({
        phone_number: profile.phone,
        address: profile.address,
        first_name: profile.username,
      }),
    });

    // Also save to localStorage
    const updated = { ...user, ...profile, avatar: avatarPreview || user.avatar };
    localStorage.setItem("civictrack_user", JSON.stringify(updated));
    setUser(updated);
    toast({ title:"Profile Updated", description:"Your profile has been successfully updated." });
  } catch {
    toast({ title:"Update Failed", description:"Failed to update profile. Please try again.", variant:"destructive" });
  } finally { setLoading(false); }
};

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title:"Password Mismatch", description:"New password and confirm password do not match.", variant:"destructive" }); return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast({ title:"Password Too Short", description:"Password must be at least 6 characters long.", variant:"destructive" }); return;
    }
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 1000));
      toast({ title:"Password Changed", description:"Your password has been successfully changed." });
      setPasswordForm({ currentPassword:"", newPassword:"", confirmPassword:"" });
    } catch {
      toast({ title:"Password Change Failed", description:"Failed to change password. Please try again.", variant:"destructive" });
    } finally { setLoading(false); }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title:"File Too Large", description:"Avatar image must be less than 5MB.", variant:"destructive" }); return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleNotificationChange = (k: keyof typeof profile.notifications) =>
    setProfile(p => ({ ...p, notifications: { ...p.notifications, [k]: !p.notifications[k] } }));

  const handlePrivacyChange = (k: keyof typeof profile.privacy) =>
    setProfile(p => ({ ...p, privacy: { ...p.privacy, [k]: !p.privacy[k] } }));

  const handleLogout = () => {
  localStorage.removeItem("civictrack_user");
  navigate("/login");
};

const handleDeleteAccount = async () => {
  setDeleteLoading(true);
  try {
    const token = user.token;
    const response = await fetch("http://127.0.0.1:8000/api/auth/delete-account/", {
      method: "DELETE",
      headers: { "Authorization": `Token ${token}` },
    });
    if (response.ok) {
      localStorage.removeItem("civictrack_user");
      toast({ title: "Account Deleted", description: "Your account has been permanently deleted." });
      setTimeout(() => navigate("/login"), 800);
    } else {
      toast({ title: "Error", description: "Failed to delete account.", variant: "destructive" });
    }
  } catch {
    toast({ title: "Error", description: "Network error.", variant: "destructive" });
  } finally { setDeleteLoading(false); setShowDeleteModal(false); }
};

  if (!user) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#f6f7f9" }}>
      <div style={spinStyle}/>
    </div>
  );

  const ac = ACCENTS[isAdmin ? "admin" : "user"];

  const tabs = [
    { id:"profile",       label:"Profile",       icon:<User    size={14}/> },
    { id:"security",      label:"Security",      icon:<Shield  size={14}/> },
    { id:"notifications", label:"Notifications", icon:<Bell    size={14}/> },
    ...(!isAdmin ? [
      { id:"privacy", label:"Privacy", icon:<Lock size={14}/> }
    ] : [])

  ];

  const initials = profile.username?.charAt(0).toUpperCase() || "U";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

        .up-wrap {
          font-family:'DM Sans',sans-serif;
          background:#f6f7f9; min-height:100vh; color:#1e293b;
          padding-bottom:80px;
        }
        .up-body {
          max-width:860px; margin:0 auto; padding:36px 20px;
          opacity:0; transform:translateY(14px);
          transition:opacity .5s ease, transform .5s ease;
        }
        .up-body.vis { opacity:1; transform:translateY(0); }

        /* ── page head ── */
        .up-head { margin-bottom:28px; }
        .up-eyebrow { font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:#6366f1; font-weight:600; margin-bottom:8px; }
        .up-title   { font-family:'Sora',sans-serif; font-size:26px; font-weight:700; color:#0f172a; margin-bottom:4px; }
        .up-sub     { font-size:14px; color:#94a3b8; }

        /* ── profile hero card ── */
        .profile-hero {
          background:#fff; border:1px solid #e8edf4;
          border-radius:22px; padding:28px 32px;
          margin-bottom:20px;
          box-shadow:0 1px 3px rgba(0,0,0,.04);
          display:flex; align-items:center; gap:24px; flex-wrap:wrap;
        }
        .avatar-wrap { position:relative; flex-shrink:0; }
        .avatar-circle {
          width:80px; height:80px; border-radius:50%;
          background:linear-gradient(135deg,#6366f1,#8b5cf6);
          display:flex; align-items:center; justify-content:center;
          font-family:'Sora',sans-serif; font-size:28px; font-weight:700; color:#fff;
          overflow:hidden; border:3px solid #fff;
          box-shadow:0 4px 14px rgba(99,102,241,.3);
        }
        .avatar-circle img { width:100%; height:100%; object-fit:cover; }
        .avatar-cam {
          position:absolute; bottom:-2px; right:-2px;
          width:28px; height:28px; border-radius:50%;
          background:#fff; border:1.5px solid #e8edf4;
          display:flex; align-items:center; justify-content:center;
          cursor:pointer; box-shadow:0 2px 6px rgba(0,0,0,.1);
          transition:all .2s;
        }
        .avatar-cam:hover { background:#f0f1ff; border-color:#a5b4fc; }

        .hero-info { flex:1; }
        .hero-name  { font-family:'Sora',sans-serif; font-size:20px; font-weight:700; color:#0f172a; margin-bottom:4px; }
        .hero-email { font-size:13px; color:#94a3b8; margin-bottom:12px; }
        .hero-badges { display:flex; gap:8px; flex-wrap:wrap; }
        .hero-badge {
          display:inline-flex; align-items:center; gap:5px;
          padding:4px 12px; border-radius:999px; font-size:11px; font-weight:600;
          border:1px solid transparent;
        }

        /* ── tab bar ── */
        .tab-bar {
          display:inline-flex; gap:4px; background:#fff;
          border:1px solid #e8edf4; border-radius:14px;
          padding:5px; margin-bottom:20px;
          box-shadow:0 1px 3px rgba(0,0,0,.04);
          flex-wrap:wrap;
        }
        .tab-btn {
          display:inline-flex; align-items:center; gap:7px;
          padding:9px 18px; border-radius:10px;
          font-size:13px; font-weight:500; cursor:pointer;
          border:none; background:transparent; color:#64748b;
          font-family:'DM Sans',sans-serif; transition:all .2s;
        }
        .tab-btn:hover  { background:#f1f5f9; color:#334155; }
        .tab-btn.active { background:#0f172a; color:#fff; box-shadow:0 2px 8px rgba(15,23,42,.18); }
        /* ── section card ── */
        .section-card {
          background:#fff; border:1px solid #e8edf4;
          border-radius:20px; overflow:hidden;
          box-shadow:0 1px 3px rgba(0,0,0,.04);
          margin-bottom:16px;
        }
        .section-head {
          padding:20px 28px 16px;
          border-bottom:1px solid #f8fafc;
          display:flex; align-items:center; gap:10px;
        }
        .section-head-icon {
          width:34px; height:34px; border-radius:10px;
          background:#f0f1ff; display:flex; align-items:center; justify-content:center;
        }
        .section-head-title { font-family:'Sora',sans-serif; font-size:15px; font-weight:600; color:#0f172a; }
        .section-body { padding:24px 28px; }

        /* ── form grid ── */
        .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:24px; }
        @media(max-width:580px){ .form-grid{ grid-template-columns:1fr; } }

        .field-wrap { }
        .field-label {
          display:block; font-size:11px; font-weight:700;
          letter-spacing:.08em; text-transform:uppercase;
          color:#64748b; margin-bottom:7px;
        }
        .field-rel { position:relative; }
        .field-prefix {
          position:absolute; left:13px; top:50%; transform:translateY(-50%);
          color:#cbd5e1; pointer-events:none; display:flex;
        }
        .field-input {
          width:100%; padding:11px 14px 11px 38px;
          border:1.5px solid #e2e8f0; border-radius:12px;
          font-size:14px; font-family:'DM Sans',sans-serif;
          color:#1e293b; background:#fff; outline:none;
          transition:border-color .2s, box-shadow .2s;
        }
        .field-input:focus { border-color:#6366f1; box-shadow:0 0 0 3px rgba(99,102,241,.1); }
        .field-input::placeholder { color:#cbd5e1; }
        .field-input.no-icon { padding-left:14px; }
        .field-eye {
          position:absolute; right:12px; top:50%; transform:translateY(-50%);
          background:none; border:none; cursor:pointer; color:#94a3b8;
          display:flex; transition:color .2s;
        }
        .field-eye:hover { color:#475569; }

        /* ── save button ── */
        .save-row { display:flex; justify-content:flex-end; margin-top:4px; }
        .save-btn {
          display:inline-flex; align-items:center; gap:8px;
          padding:11px 24px; border-radius:12px;
          font-size:14px; font-weight:600; font-family:'Sora',sans-serif;
          border:none; cursor:pointer; color:#fff;
          background:linear-gradient(135deg,#6366f1,#8b5cf6);
          box-shadow:0 4px 12px rgba(99,102,241,.3);
          transition:all .22s;
        }
        .save-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 20px rgba(99,102,241,.4); }
        .save-btn:disabled { background:#e2e8f0; color:#94a3b8; box-shadow:none; cursor:not-allowed; }

        /* ── password fields ── */
        .pw-fields { display:flex; flex-direction:column; gap:16px; margin-bottom:24px; }

        /* ── setting rows ── */
        .setting-row {
          display:flex; align-items:center; gap:14px;
          padding:16px 20px; border-radius:14px;
          background:#fafbfc; border:1.5px solid #f1f5f9;
          margin-bottom:10px; transition:border-color .2s;
        }
        .setting-row:last-child { margin-bottom:0; }
        .setting-row:hover { border-color:#e0e7ff; }
        .setting-icon-wrap {
          width:38px; height:38px; border-radius:11px;
          background:#f0f1ff; display:flex; align-items:center; justify-content:center;
          flex-shrink:0; color:#6366f1;
        }
        .setting-text { flex:1; }
        .setting-title { font-size:14px; font-weight:600; color:#0f172a; margin-bottom:2px; }
        .setting-desc  { font-size:12px; color:#94a3b8; }

        /* ── divider ── */
        .up-divider { height:1px; background:#f8fafc; margin:20px 0; }

        @keyframes spin { to{ transform:rotate(360deg); } }
      `}</style>

      <div className="up-wrap">
        <Header isLoggedIn={true} userName={user?.username} isAdmin={isAdmin}/>

        <div className={`up-body${mounted ? " vis" : ""}`}>
          <BackButton theme="light"/>

          {/* ── heading ── */}
          <div className="up-head">
            <p className="up-eyebrow" style={{ color: ac.color }}>Account</p>
            <h1 className="up-title">Your Profile</h1>
            <p className="up-sub">Manage your account settings and preferences</p>
          </div>

          {/* ── profile hero ── */}
          <div className="profile-hero">
            <div className="avatar-wrap">
              <div className="avatar-circle" style={{ background: ac.gradient, boxShadow:`0 4px 14px ${ac.shadow}` }}>
                {avatarPreview || profile.avatar
                  ? <img src={avatarPreview || profile.avatar} alt="avatar"/>
                  : initials
                }
              </div>
              <div className="avatar-cam" onClick={() => document.getElementById("avatar-input")?.click()}>
                <Camera size={13} color={ac.color}/>
              </div>
              <input id="avatar-input" type="file" accept="image/*" onChange={handleAvatarChange} style={{ display:"none" }}/>
            </div>

            <div className="hero-info">
              <p className="hero-name">{profile.username || "Your Name"}</p>
              <p className="hero-email">{profile.email || "—"}</p>
              <div className="hero-badges">
                <span className="hero-badge" style={{ background: ac.soft, color: ac.color, borderColor: ac.border }}>
                  <User size={10}/> {isAdmin ? "Admin" : "Citizen"}
                </span>
                {profile.privacy.anonymousReports && (
                  <span className="hero-badge" style={{ background:"#f0fdf4", color:"#16a34a", borderColor:"#bbf7d0" }}>
                    🛡️ Anonymous by default
                  </span>
                )}
              </div>
            </div>

            {/* ── hero action buttons ── */}
            <div style={{ display:"flex", flexDirection:"column", gap:8, alignItems:"flex-end" }}>
              <button
                onClick={handleLogout}
                style={{
                  display:"inline-flex", alignItems:"center", gap:7,
                  padding:"9px 18px", borderRadius:12, fontSize:13, fontWeight:600,
                  border:"1.5px solid #e2e8f0", background:"#fff", color:"#64748b",
                  cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all .2s",
                }}
                onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.background="#f8fafc"; }}
                onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.background="#fff"; }}
              >
                Logout
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                style={{
                  display:"inline-flex", alignItems:"center", gap:7,
                  padding:"9px 18px", borderRadius:12, fontSize:13, fontWeight:600,
                  border:"1.5px solid #fecaca", background:"#fff5f5", color:"#dc2626",
                  cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all .2s",
                }}
              >
                Delete Account
              </button>
            </div>
          </div>

          {/* ── tab bar ── */}
          <div className="tab-bar">
            {tabs.map(t => (
              <button
                key={t.id}
                className={`tab-btn${activeTab === t.id ? " active" : ""}`}
                onClick={() => setActiveTab(t.id)}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* ════ PROFILE TAB ════ */}
          {activeTab === "profile" && (
            <div className="section-card">
              <div className="section-head">
                <div className="section-head-icon" style={{ background: ac.soft }}><User size={16} color={ac.color}/></div>
                <span className="section-head-title">Profile Information</span>
              </div>
              <div className="section-body">
                <div className="form-grid">
                  <div className="field-wrap">
                    <label className="field-label">Username</label>
                    <div className="field-rel">
                      <span className="field-prefix"><User size={14}/></span>
                      <input
                        className="field-input"
                        placeholder="Enter username"
                        value={profile.username}
                        onChange={e => setProfile(p => ({ ...p, username: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="field-wrap">
                    <label className="field-label">Email Address</label>
                    <div className="field-rel">
                      <span className="field-prefix"><Mail size={14}/></span>
                      <input
                        type="email" className="field-input"
                        placeholder="Enter email"
                        value={profile.email}
                        onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="field-wrap">
                    <label className="field-label">Phone Number</label>
                    <div className="field-rel">
                      <span className="field-prefix"><Phone size={14}/></span>
                      <input
                        type="tel" className="field-input"
                        placeholder="Enter phone number"
                        value={profile.phone}
                        onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="field-wrap" style={{ gridColumn: "span 2" }}>
                    <label className="field-label">Address</label>
                    <div className="field-rel">
                      <span className="field-prefix" style={{ top: 14, transform: "none" }}>
                        📍
                      </span>
                      <textarea
                        className="field-input"
                        placeholder="Enter your address"
                        value={profile.address || ""}
                        onChange={e => setProfile(p => ({ ...p, address: e.target.value }))}
                        rows={3}
                        style={{ paddingLeft: 38, resize: "none", lineHeight: 1.6 }}
                      />
                    </div>
                  </div>
                </div>

                <div className="save-row">
                  <button className="save-btn" style={{ background: ac.gradient, boxShadow:`0 4px 12px ${ac.shadow}` }}
                    onClick={handleProfileUpdate} disabled={loading}>
                    {loading ? <div style={spinStyle}/> : <Save size={15}/>}
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ════ SECURITY TAB ════ */}
          {activeTab === "security" && (
            <div className="section-card">
              <div className="section-head">
                <div className="section-head-icon" style={{ background: ac.soft }}><Shield size={16} color={ac.color}/></div>
                <span className="section-head-title">Change Password</span>
              </div>
              <div className="section-body">
                <div className="pw-fields">
                  <div className="field-wrap">
                    <label className="field-label">Current Password</label>
                    <div className="field-rel">
                      <span className="field-prefix"><Lock size={14}/></span>
                      <input
                        type={showCurrent ? "text" : "password"}
                        className="field-input"
                        placeholder="Enter current password"
                        value={passwordForm.currentPassword}
                        onChange={e => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))}
                      />
                      <button type="button" className="field-eye" onClick={() => setShowCurrent(!showCurrent)}>
                        {showCurrent ? <EyeOff size={15}/> : <Eye size={15}/>}
                      </button>
                    </div>
                  </div>

                  <div className="field-wrap">
                    <label className="field-label">New Password</label>
                    <div className="field-rel">
                      <span className="field-prefix"><Lock size={14}/></span>
                      <input
                        type={showNew ? "text" : "password"}
                        className="field-input"
                        placeholder="Enter new password"
                        value={passwordForm.newPassword}
                        onChange={e => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                      />
                      <button type="button" className="field-eye" onClick={() => setShowNew(!showNew)}>
                        {showNew ? <EyeOff size={15}/> : <Eye size={15}/>}
                      </button>
                    </div>
                  </div>

                  <div className="field-wrap">
                    <label className="field-label">Confirm New Password</label>
                    <div className="field-rel">
                      <span className="field-prefix"><Lock size={14}/></span>
                      <input
                        type={showNew ? "text" : "password"}
                        className="field-input"
                        placeholder="Confirm new password"
                        value={passwordForm.confirmPassword}
                        onChange={e => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))}
                        style={{
                          borderColor: passwordForm.confirmPassword
                            ? passwordForm.confirmPassword === passwordForm.newPassword ? "#22c55e" : "#ef4444"
                            : undefined
                        }}
                      />
                      {passwordForm.confirmPassword && passwordForm.confirmPassword === passwordForm.newPassword && (
                        <span style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)" }}>
                          <CheckCircle size={15} color="#22c55e"/>
                        </span>
                      )}
                    </div>
                    {passwordForm.confirmPassword && passwordForm.confirmPassword !== passwordForm.newPassword && (
                      <p style={{ fontSize:11, color:"#dc2626", marginTop:5, fontWeight:500 }}>⚠ Passwords do not match</p>
                    )}
                  </div>
                </div>

                <div className="save-row">
                  <button className="save-btn" style={{ background: ac.gradient, boxShadow:`0 4px 12px ${ac.shadow}` }}
                    onClick={handlePasswordChange} disabled={loading}>
                    {loading ? <div style={spinStyle}/> : <Shield size={15}/>}
                    Update Password
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ════ NOTIFICATIONS TAB ════ */}
          {activeTab === "notifications" && (
            <div className="section-card">
              <div className="section-head">
                <div className="section-head-icon" style={{ background: ac.soft }}><Bell size={16} color={ac.color}/></div>
                <span className="section-head-title">Notification Preferences</span>
              </div>
              <div className="section-body">
                <SettingRow icon={<Mail size={16}/>} accent={ac}
                  title="Email Notifications" desc="Receive issue updates and alerts via email"
                  on={profile.notifications.email} onChange={() => handleNotificationChange("email")}/>
                <SettingRow icon={<Bell size={16}/>} accent={ac}
                  title="Push Notifications" desc="Get real-time browser notifications"
                  on={profile.notifications.push} onChange={() => handleNotificationChange("push")}/>
                <SettingRow icon={<Phone size={16}/>} accent={ac}
                  title="SMS Notifications" desc="Receive status updates via text message"
                  on={profile.notifications.sms} onChange={() => handleNotificationChange("sms")}/>
              </div>
            </div>
          )}

          {/* ════ PRIVACY TAB ════ */}
          {!isAdmin && activeTab === "privacy" && (
            <div className="section-card">
              <div className="section-head">
                <div className="section-head-icon" style={{ background: ac.soft }}><Lock size={16} color={ac.color}/></div>
                <span className="section-head-title">Privacy Settings</span>
              </div>
              <div className="section-body">
                <SettingRow icon={<Mail size={16}/>} accent={ac}
                  title="Show Email Publicly" desc="Allow other community members to see your email"
                  on={profile.privacy.showEmail} onChange={() => handlePrivacyChange("showEmail")}/>
                <SettingRow icon={<Phone size={16}/>} accent={ac}
                  title="Show Phone Publicly" desc="Allow other community members to see your phone number"
                  on={profile.privacy.showPhone} onChange={() => handlePrivacyChange("showPhone")}/>
                <SettingRow icon={<User size={16}/>} accent={ac}
                  title="Anonymous Reports by Default" desc="Submit all future reports without your name attached"
                  on={profile.privacy.anonymousReports} onChange={() => handlePrivacyChange("anonymousReports")}/>
              </div>
            </div>
          )}

        </div>
      </div>
      {/* ── Delete Account Modal ── */}
{showDeleteModal && (
  <div style={{
    position:"fixed", inset:0, zIndex:9999,
    background:"rgba(15,23,42,.55)", backdropFilter:"blur(4px)",
    display:"flex", alignItems:"center", justifyContent:"center", padding:20,
  }} onClick={() => setShowDeleteModal(false)}>
    <div style={{
      background:"#fff", borderRadius:24, padding:"36px 32px 28px",
      maxWidth:420, width:"100%",
      boxShadow:"0 24px 60px rgba(0,0,0,.18)",
    }} onClick={e => e.stopPropagation()}>
      <div style={{ width:64, height:64, borderRadius:"50%", background:"#fef2f2", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", fontSize:28 }}>⚠️</div>
      <p style={{ fontFamily:"'Sora',sans-serif", fontSize:20, fontWeight:700, color:"#0f172a", textAlign:"center", marginBottom:8 }}>Delete your account?</p>
      <p style={{ fontSize:14, color:"#64748b", textAlign:"center", lineHeight:1.6, marginBottom:28 }}>
        This action <strong style={{ color:"#ef4444" }}>cannot be undone</strong>. All your issues, data, and account will be permanently removed.
      </p>
      <div style={{ display:"flex", gap:12 }}>
        <button onClick={() => setShowDeleteModal(false)}
          style={{ flex:1, padding:13, border:"1.5px solid #e2e8f0", borderRadius:14, background:"#f8fafc", color:"#475569", fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
          Cancel
        </button>
        <button onClick={handleDeleteAccount} disabled={deleteLoading}
          style={{ flex:1, padding:13, border:"none", borderRadius:14, background:"linear-gradient(135deg,#ef4444,#dc2626)", color:"#fff", fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", opacity: deleteLoading ? 0.65 : 1 }}>
          {deleteLoading ? "Deleting…" : "Delete Account"}
        </button>
      </div>
    </div>
  </div>
)}
    </>
  );
}

const spinStyle: React.CSSProperties = {
  width:16, height:16,
  border:"2px solid rgba(255,255,255,.35)",
  borderTop:"2px solid #fff",
  borderRadius:"50%",
  animation:"spin .7s linear infinite",
  flexShrink:0,
};