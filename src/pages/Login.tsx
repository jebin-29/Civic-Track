import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, Shield, User, Building2, Loader2,
  Eye, EyeOff, ArrowRight, Sparkles, CheckCircle
} from "lucide-react";
import { Header } from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import { authAPI } from "@/lib/api";

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loginType,    setLoginType]    = useState<"user" | "admin">("user");
  const [loading,      setLoading]      = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted,      setMounted]      = useState(false);

  const [formData, setFormData] = useState({ username: "", password: "" });
  const [validation, setValidation] = useState({
    username: { valid: false, message: "" },
    password: { valid: false, message: "" },
  });

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { validateUsername(formData.username); }, [formData.username]);
  useEffect(() => { validatePassword(formData.password); }, [formData.password]);

  /* ── validation (unchanged) ── */
  const validateUsername = (u: string) => {
    if (!u)          setValidation(p => ({ ...p, username: { valid: false, message: "" } }));
    else if (u.length < 2) setValidation(p => ({ ...p, username: { valid: false, message: "Username must be at least 2 characters" } }));
    else             setValidation(p => ({ ...p, username: { valid: true,  message: "Username looks good!" } }));
  };
  const validatePassword = (pw: string) => {
    if (!pw)           setValidation(p => ({ ...p, password: { valid: false, message: "" } }));
    else if (pw.length < 3) setValidation(p => ({ ...p, password: { valid: false, message: "Password must be at least 3 characters" } }));
    else               setValidation(p => ({ ...p, password: { valid: true,  message: "Password looks good!" } }));
  };

  /* ── submit (unchanged) ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      toast({ title: "Missing Information", description: "Please enter both username and password", variant: "destructive" });
      return;
    }
    if (!validation.username.valid || !validation.password.valid) {
      toast({ title: "Validation Error", description: "Please fix the validation errors before submitting", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const response = await authAPI.login({ username: formData.username, password: formData.password });
      localStorage.setItem("civictrack_user", JSON.stringify({
        ...response.user,
        token:     response.token,
        isLoggedIn: true,
        isAdmin:   response.user.is_staff || loginType === "admin",
        role:      response.user.is_staff ? "admin" : "user",
      }));
      toast({ title: "Login Successful", description: `Welcome back, ${response.user.username}!` });
      if (response.user.is_staff || loginType === "admin") navigate("/admin");
      else navigate("/home");
    } catch (error: any) {
  const errorMsg = error.message || "";
  
  if (errorMsg.toLowerCase().includes("disabled") || errorMsg.toLowerCase().includes("banned")) {
    toast({
      title: "🚫 Account Suspended",
      description: "Your account has been banned due to spam or policy violations. Please contact support.",
      variant: "destructive",
    });
  } else {
    toast({
      title: "Login Failed",
      description: "Invalid username or password. Please try again.",
      variant: "destructive",
    });
  }
} finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleQuickLogin = (type: "user" | "admin") => {
    const creds = type === "admin"
      ? { username: "admin", password: "admin123" }
      : { username: "user",  password: "user123"  };
    setFormData(creds);
    setLoginType(type);
  };

  const isFormValid = validation.username.valid && validation.password.valid;
  const isAdmin     = loginType === "admin";

  /* ── accent colours per role ── */
  const accent = isAdmin
    ? { color: "#ea580c", light: "#fff7ed", border: "#fed7aa", gradient: "linear-gradient(135deg,#ea580c,#dc2626)" }
    : { color: "#6366f1", light: "#f0f1ff", border: "#c7d2fe", gradient: "linear-gradient(135deg,#6366f1,#8b5cf6)" };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

        .login-page {
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          background: #f6f7f9;
          color: #1e293b;
        }

        /* ── split layout ── */
        .login-outer {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: calc(100vh - 64px);
          padding: 32px 20px;
        }

        .login-card {
          width: 100%;
          max-width: 480px;
          background: #fff;
          border: 1px solid #e8edf4;
          border-radius: 28px;
          box-shadow: 0 4px 6px rgba(0,0,0,.04), 0 24px 60px rgba(0,0,0,.07);
          overflow: hidden;
          opacity: 0;
          transform: translateY(20px) scale(.98);
          transition: opacity .55s ease, transform .55s ease;
        }
        .login-card.vis {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        /* ── card top banner ── */
        .card-banner {
          padding: 32px 36px 28px;
          border-bottom: 1px solid #f1f5f9;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .card-banner::before {
          content:'';
          position:absolute; inset:0;
          background: var(--banner-bg, linear-gradient(135deg,#f0f1ff 0%,#fafbff 100%));
          z-index:0;
        }
        .card-banner > * { position:relative; z-index:1; }

        .brand-icon-wrap {
          width: 64px; height: 64px; border-radius: 20px;
          display: flex; align-items:center; justify-content:center;
          margin: 0 auto 16px;
          box-shadow: 0 4px 14px rgba(0,0,0,.1);
          transition: background .4s;
        }
        .brand-title {
          font-family:'Sora', sans-serif;
          font-size: 22px; font-weight: 700;
          color: #0f172a; margin-bottom: 4px;
        }
        .brand-sub { font-size: 13px; color: #94a3b8; }

        /* ── role switcher ── */
        .role-switch {
          display: flex; gap: 8px;
          padding: 28px 36px 0;
        }
        .role-btn {
          flex: 1; display:flex; align-items:center; justify-content:center; gap:7px;
          padding: 11px 16px; border-radius: 12px;
          font-size: 13px; font-weight: 600;
          cursor: pointer; border: 1.5px solid #e2e8f0;
          background: #f8fafc; color: #64748b;
          font-family:'DM Sans',sans-serif;
          transition: all .25s;
          letter-spacing:.01em;
        }
        .role-btn:hover { border-color:#c7d2fe; background:#f5f3ff; color:#6366f1; }
        .role-btn.active-user  { background:#f0f1ff; border-color:#a5b4fc; color:#4f46e5; box-shadow:0 0 0 3px rgba(99,102,241,.1); }
        .role-btn.active-admin { background:#fff7ed; border-color:#fdba74; color:#ea580c; box-shadow:0 0 0 3px rgba(234,88,12,.1); }

        /* ── form body ── */
        .form-body { padding: 24px 36px 32px; }

        .field-wrap { margin-bottom: 18px; }
        .field-label {
          display:block; font-size:11px; font-weight:700;
          letter-spacing:.08em; text-transform:uppercase;
          color:#64748b; margin-bottom:8px;
        }
        .field-rel { position:relative; }
        .field-input {
          width:100%; padding:12px 44px 12px 16px;
          border:1.5px solid #e2e8f0; border-radius:12px;
          font-size:14px; font-family:'DM Sans',sans-serif;
          color:#1e293b; background:#fff; outline:none;
          transition:border-color .2s, box-shadow .2s;
        }
        .field-input:focus {
          border-color: var(--field-focus, #6366f1);
          box-shadow: 0 0 0 3px var(--field-ring, rgba(99,102,241,.1));
        }
        .field-input.valid   { border-color:#22c55e; }
        .field-input.invalid { border-color:#ef4444; }
        .field-input::placeholder { color:#cbd5e1; }

        .field-icon-right {
          position:absolute; right:13px; top:50%; transform:translateY(-50%);
          display:flex; align-items:center; gap:4px;
        }

        .field-msg {
          font-size:11px; margin-top:5px; font-weight:500;
          display:flex; align-items:center; gap:4px;
        }
        .field-msg.ok  { color:#16a34a; }
        .field-msg.err { color:#dc2626; }

        /* ── submit button ── */
        .submit-btn {
          width:100%; padding:15px 24px;
          border:none; border-radius:14px;
          font-size:15px; font-weight:600;
          font-family:'Sora',sans-serif;
          color:#fff; cursor:pointer;
          display:flex; align-items:center; justify-content:center; gap:8px;
          letter-spacing:.02em;
          transition:all .25s; margin-top:8px;
        }
        .submit-btn:hover:not(:disabled) { transform:translateY(-2px); filter:brightness(1.06); }
        .submit-btn:disabled { opacity:.55; cursor:not-allowed; }

        /* ── quick login ── */
        .quick-btn {
          width:100%; padding:11px 16px;
          background:#fafbfc; border:1.5px dashed #e2e8f0;
          border-radius:12px; font-size:13px; font-weight:500;
          font-family:'DM Sans',sans-serif; color:#64748b;
          cursor:pointer; transition:all .2s; margin-top:10px;
          display:flex; align-items:center; justify-content:center; gap:6px;
        }
        .quick-btn:hover { background:#f5f3ff; border-color:#a5b4fc; color:#6366f1; }
        .quick-btn.admin:hover { background:#fff7ed; border-color:#fdba74; color:#ea580c; }

        /* ── divider ── */
        .divider { display:flex; align-items:center; gap:12px; margin:20px 0; }
        .divider-line { flex:1; height:1px; background:#f1f5f9; }
        .divider-text { font-size:12px; color:#cbd5e1; font-weight:500; }

        /* ── register link ── */
        .register-row {
          text-align:center; font-size:13px; color:#94a3b8; margin-top:18px;
        }
        .register-link {
          color:#6366f1; font-weight:600; cursor:pointer;
          background:none; border:none; font-family:inherit; font-size:inherit;
          text-decoration:none; transition:color .2s;
        }
        .register-link:hover { color:#4f46e5; }

        /* ── admin notice ── */
        .admin-notice {
          background:#fff7ed; border:1px solid #fed7aa;
          border-radius:12px; padding:12px 16px;
          font-size:12px; color:#9a3412; margin-top:16px;
          display:flex; gap:8px; align-items:flex-start; line-height:1.5;
        }

        /* ── decorative blob ── */
        .blob-1, .blob-2 {
          position:fixed; border-radius:50%;
          filter:blur(80px); pointer-events:none; z-index:0;
          opacity:.35;
        }
        .blob-1 { width:400px; height:400px; background:#e0e7ff; top:-100px; right:-100px; }
        .blob-2 { width:300px; height:300px; background:#fce7f3; bottom:-80px; left:-80px; }

        @keyframes spin { to{ transform:rotate(360deg); } }
      `}</style>

      <div className="login-page">
        {/* subtle background blobs */}
        <div className="blob-1" />
        <div className="blob-2" />

        <Header />

        <div className="login-outer" style={{ position:"relative", zIndex:1 }}>
          <div className={`login-card${mounted ? " vis" : ""}`}>

            {/* ── banner ── */}
            <div
              className="card-banner"
              style={{ "--banner-bg": isAdmin
                ? "linear-gradient(135deg,#fff7ed 0%,#fffbf5 100%)"
                : "linear-gradient(135deg,#f0f1ff 0%,#fafbff 100%)" } as any}
            >
              <div
                className="brand-icon-wrap"
                style={{ background: accent.gradient }}
              >
                {isAdmin
                  ? <Building2 size={28} color="#fff" />
                  : <Shield    size={28} color="#fff" />
                }
              </div>
              <p className="brand-title">CivicTrack</p>
              <p className="brand-sub">
                {isAdmin ? "Administrator Portal" : "Community Platform"}
              </p>
            </div>

            {/* ── role switcher ── */}
            <div className="role-switch">
              <button
                className={`role-btn${loginType === "user" ? " active-user" : ""}`}
                onClick={() => setLoginType("user")}
              >
                <User size={15} /> Citizen
              </button>
              <button
                className={`role-btn${loginType === "admin" ? " active-admin" : ""}`}
                onClick={() => setLoginType("admin")}
              >
                <Building2 size={15} /> Admin
              </button>
            </div>

            {/* ── form ── */}
            <div className="form-body">
              <form onSubmit={handleSubmit}>

                {/* username */}
                <div className="field-wrap">
                  <label className="field-label">
                    {isAdmin ? "Admin Username" : "Username"}
                  </label>
                  <div className="field-rel">
                    <input
                      name="username"
                      type="text"
                      className={`field-input${
                        validation.username.valid   ? " valid"
                        : validation.username.message ? " invalid" : ""
                      }`}
                      style={{
                        "--field-focus": accent.color,
                        "--field-ring":  `${accent.color}1a`,
                      } as any}
                      placeholder={isAdmin ? "Enter admin username" : "Enter your username"}
                      value={formData.username}
                      onChange={handleInputChange}
                      required
                      autoComplete="username"
                    />
                    {validation.username.valid && (
                      <span className="field-icon-right">
                        <CheckCircle size={16} color="#22c55e" />
                      </span>
                    )}
                  </div>
                  {validation.username.message && (
                    <p className={`field-msg${validation.username.valid ? " ok" : " err"}`}>
                      {validation.username.valid ? <CheckCircle size={11}/> : "⚠"}
                      {validation.username.message}
                    </p>
                  )}
                </div>

                {/* password */}
                <div className="field-wrap">
                  <label className="field-label">Password</label>
                  <div className="field-rel">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      className={`field-input${
                        validation.password.valid    ? " valid"
                        : validation.password.message ? " invalid" : ""
                      }`}
                      style={{
                        "--field-focus": accent.color,
                        "--field-ring":  `${accent.color}1a`,
                      } as any}
                      placeholder={isAdmin ? "Enter admin password" : "Enter your password"}
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      autoComplete="current-password"
                    />
                    <span className="field-icon-right" style={{ gap:8 }}>
                      {validation.password.valid && <CheckCircle size={16} color="#22c55e"/>}
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ background:"none", border:"none", cursor:"pointer", color:"#94a3b8", display:"flex", padding:0 }}
                      >
                        {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                      </button>
                    </span>
                  </div>
                  {validation.password.message && (
                    <p className={`field-msg${validation.password.valid ? " ok" : " err"}`}>
                      {validation.password.valid ? <CheckCircle size={11}/> : "⚠"}
                      {validation.password.message}
                    </p>
                  )}
                </div>

                {/* submit */}
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={loading || !isFormValid}
                  style={{
                    background: isFormValid ? accent.gradient : "#e2e8f0",
                    color:      isFormValid ? "#fff"          : "#94a3b8",
                    boxShadow:  isFormValid ? `0 4px 16px ${accent.color}40` : "none",
                  }}
                >
                  {loading ? (
                    <>
                      <div style={{ width:18,height:18,border:"2px solid rgba(255,255,255,.4)",borderTop:"2px solid #fff",borderRadius:"50%",animation:"spin .7s linear infinite" }}/>
                      Signing in…
                    </>
                  ) : (
                    <>
                      <Sparkles size={16}/>
                      Sign in as {isAdmin ? "Admin" : "Citizen"}
                      <ArrowRight size={16}/>
                    </>
                  )}
                </button>
              </form>

              {/* divider */}
              <div className="divider">
                <div className="divider-line"/>
                <span className="divider-text">or</span>
                <div className="divider-line"/>
              </div>

              {/* quick login */}
              {/* <button
                className={`quick-btn${isAdmin ? " admin" : ""}`}
                onClick={() => handleQuickLogin(loginType)}
              >
                ⚡ Quick Login &nbsp;
                <span style={{ opacity:.6 }}>
                  ({isAdmin ? "admin / admin123" : "user / user123"})
                </span>
              </button> */}

              {/* admin notice */}
              {isAdmin && (
                <div className="admin-notice">
                  🔐 <span><strong>Admin access:</strong> Full control over issues, users, and system analytics.</span>
                </div>
              )}

              {/* register */}
              {!isAdmin && (
                <p className="register-row">
                  Don't have an account?{" "}
                  <button className="register-link" onClick={() => navigate("/register")}>
                    Create account
                  </button>
                </p>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}