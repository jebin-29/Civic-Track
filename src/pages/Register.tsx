import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2, UserPlus, CheckCircle, Eye, EyeOff,
  Mail, Phone, User, Lock, ArrowRight, Sparkles
} from "lucide-react";
import { Header } from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import { authAPI } from "@/lib/api";

export default function Register() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading,             setLoading]             = useState(false);
  const [showPassword,        setShowPassword]        = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep,         setCurrentStep]         = useState(1);
  const [mounted,             setMounted]             = useState(false);

  const [formData, setFormData] = useState({
    username: "", email: "", phone: "", address: "",
    password: "", confirmPassword: "",
  });

  const [validation, setValidation] = useState({
    username:        { valid: false, message: "" },
    email:           { valid: false, message: "" },
    phone:           { valid: false, message: "" },
    password:        { valid: false, message: "" },
    confirmPassword: { valid: false, message: "" },
  });

  /* ── mount animation ── */
  useEffect(() => { setMounted(true); }, []);

  /* ── live validation triggers (unchanged) ── */
  useEffect(() => { validateUsername(formData.username);                             }, [formData.username]);
  useEffect(() => { validateEmail(formData.email);                                   }, [formData.email]);
  useEffect(() => { validatePhone(formData.phone);                                   }, [formData.phone]);
  useEffect(() => { validatePassword(formData.password);                             }, [formData.password]);
  useEffect(() => { validateConfirmPassword(formData.confirmPassword, formData.password); }, [formData.confirmPassword, formData.password]);

  useEffect(() => {
    if (formData.password.length > 0) { setShowConfirmPassword(true); }
    else {
      setShowConfirmPassword(false);
      setFormData(prev => ({ ...prev, confirmPassword: "" }));
    }
  }, [formData.password]);

  /* ── step tracker ── */
  useEffect(() => {
    let step = 1;
    if (validation.username.valid) step = 2;
    if (validation.username.valid && validation.email.valid) step = 3;
    if (validation.username.valid && validation.email.valid && validation.password.valid) step = 4;
    if (validation.username.valid && validation.email.valid && validation.password.valid && validation.confirmPassword.valid) step = 4;
    setCurrentStep(step);
  }, [validation]);

  /* ── validators (unchanged) ── */
  const validateUsername = (u: string) => {
    if (!u)                          setValidation(p => ({ ...p, username: { valid:false, message:"" } }));
    else if (u.length < 3)           setValidation(p => ({ ...p, username: { valid:false, message:"Username must be at least 3 characters" } }));
    else if (!/^[a-zA-Z0-9_]+$/.test(u)) setValidation(p => ({ ...p, username: { valid:false, message:"Only letters, numbers, and underscores" } }));
    else                             setValidation(p => ({ ...p, username: { valid:true,  message:"Username looks good!" } }));
  };
  const validateEmail = (e: string) => {
    if (!e)                                          setValidation(p => ({ ...p, email: { valid:false, message:"" } }));
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) setValidation(p => ({ ...p, email: { valid:false, message:"Please enter a valid email address" } }));
    else                                             setValidation(p => ({ ...p, email: { valid:true,  message:"Email format is valid!" } }));
  };
  const validatePhone = (ph: string) => {
    if (!ph)                                                        setValidation(p => ({ ...p, phone: { valid:false, message:"" } }));
    else if (!/^[\+]?[1-9][\d]{0,15}$/.test(ph.replace(/\s/g,""))) setValidation(p => ({ ...p, phone: { valid:false, message:"Please enter a valid phone number" } }));
    else                                                            setValidation(p => ({ ...p, phone: { valid:true,  message:"Phone number looks good!" } }));
  };
  const validatePassword = (pw: string) => {
    if (!pw)              setValidation(p => ({ ...p, password: { valid:false, message:"" } }));
    else if (pw.length<6) setValidation(p => ({ ...p, password: { valid:false, message:"Password must be at least 6 characters" } }));
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(pw)) setValidation(p => ({ ...p, password: { valid:false, message:"Must contain uppercase, lowercase, and a number" } }));
    else                  setValidation(p => ({ ...p, password: { valid:true,  message:"Strong password!" } }));
  };
  const validateConfirmPassword = (cp: string, pw: string) => {
    if (!cp)        setValidation(p => ({ ...p, confirmPassword: { valid:false, message:"" } }));
    else if (cp!==pw) setValidation(p => ({ ...p, confirmPassword: { valid:false, message:"Passwords do not match" } }));
    else            setValidation(p => ({ ...p, confirmPassword: { valid:true,  message:"Passwords match!" } }));
  };

  const getPasswordStrength = (pw: string) => {
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 6) s += 25;
    if (pw.length >= 8) s += 25;
    if (/[a-z]/.test(pw)) s += 25;
    if (/[A-Z]/.test(pw)) s += 25;
    if (/\d/.test(pw))    s += 25;
    if (/[^A-Za-z0-9]/.test(pw)) s += 25;
    return Math.min(s, 100);
  };

  /* ── submit (unchanged) ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.email || !formData.password) {
      toast({ title:"Missing Information", description:"Please fill in all required fields", variant:"destructive" });
      return;
    }
    if (!validation.username.valid || !validation.email.valid || !validation.password.valid) {
      toast({ title:"Validation Error", description:"Please fix the validation errors before submitting", variant:"destructive" });
      return;
    }
    setLoading(true);
    try {
      const response = await authAPI.register({
        username:         formData.username,
        email:            formData.email,
        password:         formData.password,
        confirm_password: formData.confirmPassword,
        phone:            formData.phone || undefined,
      });

      // Save phone and address to backend profile
      await fetch("http://127.0.0.1:8000/api/profile/update/", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${response.token}`,
        },
        body: JSON.stringify({
          phone_number: formData.phone,
          address: formData.address,
        }),
      });

      localStorage.setItem("civictrack_user", JSON.stringify({
        ...response.user,
        token:      response.token,
        isLoggedIn: true,
        isAdmin:    response.user.is_staff || false,
        role:       response.user.is_staff ? "admin" : "user",
      }));

      toast({ title:"Registration Successful", description:`Welcome to CivicTrack, ${response.user.username}!` });
      navigate("/home");
    } catch (error: any) {
      toast({ title:"Registration Failed", description: error.message || "Failed to create account. Please try again.", variant:"destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const isFormValid = validation.username.valid && validation.email.valid &&
                      validation.phone.valid && validation.password.valid && 
                      validation.confirmPassword.valid && formData.address.trim().length > 5;

  /* ── password strength colour ── */
  const strength   = getPasswordStrength(formData.password);
  const strColor   = strength > 75 ? "#22c55e" : strength > 50 ? "#f59e0b" : "#ef4444";
  const strLabel   = strength > 75 ? "Strong"  : strength > 50 ? "Fair"    : "Weak";

  /* ── step labels ── */
  const steps = ["Account", "Contact", "Security", "Done"];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

        .reg-page {
          font-family:'DM Sans',sans-serif;
          min-height:100vh; background:#f6f7f9; color:#1e293b;
        }

        .reg-outer {
          display:flex; align-items:flex-start; justify-content:center;
          min-height:calc(100vh - 64px);
          padding:36px 20px 60px;
        }

        /* ── card ── */
        .reg-card {
          width:100%; max-width:500px;
          background:#fff; border:1px solid #e8edf4;
          border-radius:28px;
          box-shadow:0 4px 6px rgba(0,0,0,.04), 0 24px 60px rgba(0,0,0,.07);
          overflow:hidden;
          opacity:0; transform:translateY(20px) scale(.98);
          transition:opacity .55s ease, transform .55s ease;
        }
        .reg-card.vis { opacity:1; transform:translateY(0) scale(1); }

        /* ── banner ── */
        .reg-banner {
          padding:32px 36px 26px;
          border-bottom:1px solid #f1f5f9;
          background:linear-gradient(135deg,#f0f1ff 0%,#fafbff 100%);
          text-align:center;
        }
        .reg-icon-wrap {
          width:64px; height:64px; border-radius:20px;
          background:linear-gradient(135deg,#6366f1,#8b5cf6);
          display:flex; align-items:center; justify-content:center;
          margin:0 auto 16px;
          box-shadow:0 4px 14px rgba(99,102,241,.3);
        }
        .reg-title {
          font-family:'Sora',sans-serif; font-size:22px;
          font-weight:700; color:#0f172a; margin-bottom:4px;
        }
        .reg-sub { font-size:13px; color:#94a3b8; }

        /* ── step dots ── */
        .step-track { display:flex; align-items:center; justify-content:center; gap:0; margin-top:22px; }
        .step-node {
          display:flex; flex-direction:column; align-items:center; gap:5px;
          position:relative;
        }
        .step-circle {
          width:28px; height:28px; border-radius:50%;
          display:flex; align-items:center; justify-content:center;
          font-size:11px; font-weight:700;
          border:2px solid transparent; transition:all .3s; z-index:1;
        }
        .step-circle.done    { background:#6366f1; border-color:#6366f1; color:#fff; }
        .step-circle.current { background:#fff; border-color:#6366f1; color:#6366f1; box-shadow:0 0 0 4px rgba(99,102,241,.15); }
        .step-circle.future  { background:#f8fafc; border-color:#e2e8f0; color:#cbd5e1; }
        .step-lbl { font-size:10px; color:#94a3b8; font-weight:500; white-space:nowrap; }
        .step-lbl.active-lbl { color:#6366f1; font-weight:600; }
        .step-line { width:48px; height:2px; margin:0 4px; margin-bottom:14px; border-radius:2px; transition:background .3s; }

        /* ── form body ── */
        .reg-body { padding:26px 36px 32px; }

        .field-wrap { margin-bottom:16px; }
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
          width:100%; padding:12px 44px 12px 40px;
          border:1.5px solid #e2e8f0; border-radius:12px;
          font-size:14px; font-family:'DM Sans',sans-serif;
          color:#1e293b; background:#fff; outline:none;
          transition:border-color .2s, box-shadow .2s;
        }
        .field-input.no-prefix { padding-left:16px; }
        .field-input:focus    { border-color:#6366f1; box-shadow:0 0 0 3px rgba(99,102,241,.1); }
        .field-input.valid    { border-color:#22c55e; }
        .field-input.invalid  { border-color:#ef4444; }
        .field-input::placeholder { color:#cbd5e1; }

        .field-right {
          position:absolute; right:12px; top:50%; transform:translateY(-50%);
          display:flex; align-items:center; gap:6px;
        }
        .eye-btn {
          background:none; border:none; cursor:pointer;
          color:#94a3b8; display:flex; padding:0;
          transition:color .2s;
        }
        .eye-btn:hover { color:#475569; }

        .field-msg {
          font-size:11px; margin-top:5px; font-weight:500;
          display:flex; align-items:center; gap:4px;
        }
        .field-msg.ok  { color:#16a34a; }
        .field-msg.err { color:#dc2626; }

        /* ── password strength ── */
        .strength-wrap { margin-top:8px; }
        .strength-row {
          display:flex; justify-content:space-between;
          font-size:11px; color:#94a3b8; margin-bottom:5px;
          font-weight:500;
        }
        .strength-track {
          height:4px; background:#f1f5f9; border-radius:999px; overflow:hidden;
        }
        .strength-fill {
          height:100%; border-radius:999px; transition:width .4s ease, background .4s ease;
        }

        /* ── confirm reveal ── */
        .confirm-reveal {
          animation: slideDown .28s ease forwards;
          overflow:hidden;
        }
        @keyframes slideDown {
          from { opacity:0; transform:translateY(-6px); }
          to   { opacity:1; transform:translateY(0); }
        }

        /* ── submit ── */
        .submit-btn {
          width:100%; padding:15px 24px;
          border:none; border-radius:14px;
          font-size:15px; font-weight:600;
          font-family:'Sora',sans-serif;
          color:#fff; cursor:pointer;
          display:flex; align-items:center; justify-content:center; gap:8px;
          letter-spacing:.02em; margin-top:20px;
          transition:all .25s;
          background:linear-gradient(135deg,#6366f1,#8b5cf6);
          box-shadow:0 4px 16px rgba(99,102,241,.35);
        }
        .submit-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 24px rgba(99,102,241,.45); }
        .submit-btn:disabled { background:#e2e8f0; color:#94a3b8; box-shadow:none; cursor:not-allowed; }

        /* ── divider / login link ── */
        .divider { display:flex; align-items:center; gap:12px; margin:20px 0; }
        .divider-line { flex:1; height:1px; background:#f1f5f9; }
        .divider-text { font-size:12px; color:#cbd5e1; font-weight:500; }
        .login-row { text-align:center; font-size:13px; color:#94a3b8; }
        .login-link {
          color:#6366f1; font-weight:600; cursor:pointer;
          background:none; border:none; font-family:inherit; font-size:inherit;
          transition:color .2s;
        }
        .login-link:hover { color:#4f46e5; }

        /* ── blobs ── */
        .blob-a, .blob-b {
          position:fixed; border-radius:50%;
          filter:blur(80px); pointer-events:none; z-index:0; opacity:.35;
        }
        .blob-a { width:400px; height:400px; background:#e0e7ff; top:-100px; right:-100px; }
        .blob-b { width:300px; height:300px; background:#fce7f3; bottom:-80px; left:-80px; }

        @keyframes spin { to{ transform:rotate(360deg); } }
      `}</style>

      <div className="reg-page">
        <div className="blob-a"/><div className="blob-b"/>
        <Header />

        <div className="reg-outer" style={{ position:"relative", zIndex:1 }}>
          <div className={`reg-card${mounted ? " vis" : ""}`}>

            {/* ── banner ── */}
            <div className="reg-banner">
              <div className="reg-icon-wrap">
                <UserPlus size={28} color="#fff"/>
              </div>
              <p className="reg-title">Create Account</p>
              <p className="reg-sub">Join CivicTrack and help improve your community</p>

              {/* step track */}
              <div className="step-track">
                {steps.map((s, i) => {
                  const idx    = i + 1;
                  const isDone = currentStep > idx;
                  const isCur  = currentStep === idx;
                  return (
                    <div key={s} style={{ display:"flex", alignItems:"center" }}>
                      <div className="step-node">
                        <div className={`step-circle ${isDone ? "done" : isCur ? "current" : "future"}`}>
                          {isDone ? "✓" : idx}
                        </div>
                        <span className={`step-lbl${isCur ? " active-lbl" : ""}`}>{s}</span>
                      </div>
                      {i < steps.length - 1 && (
                        <div
                          className="step-line"
                          style={{ background: currentStep > idx ? "#6366f1" : "#e2e8f0" }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── form ── */}
            <div className="reg-body">
              <form onSubmit={handleSubmit}>

                {/* username */}
                <div className="field-wrap">
                  <label className="field-label">Username *</label>
                  <div className="field-rel">
                    <span className="field-prefix"><User size={15}/></span>
                    <input
                      name="username" type="text"
                      className={`field-input${validation.username.valid ? " valid" : validation.username.message ? " invalid" : ""}`}
                      placeholder="Choose a username"
                      value={formData.username} onChange={handleInputChange} required
                      autoComplete="username"
                    />
                    {validation.username.valid && (
                      <span className="field-right"><CheckCircle size={15} color="#22c55e"/></span>
                    )}
                  </div>
                  {validation.username.message && (
                    <p className={`field-msg${validation.username.valid ? " ok" : " err"}`}>
                      {validation.username.valid ? <CheckCircle size={10}/> : "⚠"} {validation.username.message}
                    </p>
                  )}
                </div>

                {/* email */}
                <div className="field-wrap">
                  <label className="field-label">Email Address *</label>
                  <div className="field-rel">
                    <span className="field-prefix"><Mail size={15}/></span>
                    <input
                      name="email" type="email"
                      className={`field-input${validation.email.valid ? " valid" : validation.email.message ? " invalid" : ""}`}
                      placeholder="you@example.com"
                      value={formData.email} onChange={handleInputChange} required
                      autoComplete="email"
                    />
                    {validation.email.valid && (
                      <span className="field-right"><CheckCircle size={15} color="#22c55e"/></span>
                    )}
                  </div>
                  {validation.email.message && (
                    <p className={`field-msg${validation.email.valid ? " ok" : " err"}`}>
                      {validation.email.valid ? <CheckCircle size={10}/> : "⚠"} {validation.email.message}
                    </p>
                  )}
                </div>

                {/* phone */}
                <div className="field-wrap">
                  <label className="field-label">Phone Number *</label>
                  <div className="field-rel">
                    <span className="field-prefix"><Phone size={15}/></span>
                    <input
                      name="phone" type="tel"
                      className={`field-input${validation.phone.valid ? " valid" : validation.phone.message ? " invalid" : ""}`}
                      placeholder="+91 98765 43210"
                      value={formData.phone} onChange={handleInputChange}
                      autoComplete="tel"
                    />
                    {validation.phone.valid && (
                      <span className="field-right"><CheckCircle size={15} color="#22c55e"/></span>
                    )}
                  </div>
                  {validation.phone.message && (
                    <p className={`field-msg${validation.phone.valid ? " ok" : " err"}`}>
                      {validation.phone.valid ? <CheckCircle size={10}/> : "⚠"} {validation.phone.message}
                    </p>
                  )}
                </div>

                {/* address */}
                <div className="field-wrap">
                  <label className="field-label">Address *</label>
                  <div className="field-rel">
                    <span className="field-prefix" style={{ top: 14, transform: "none" }}>📍</span>
                    <textarea
                      name="address"
                      className="field-input"
                      placeholder="Enter your full address"
                      value={formData.address || ""}
                      onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      rows={3}
                      style={{ paddingLeft: 38, resize: "none", lineHeight: 1.6 }}
                    />
                  </div>
                </div>

                {/* password */}
                <div className="field-wrap">
                  <label className="field-label">Password *</label>
                  <div className="field-rel">
                    <span className="field-prefix"><Lock size={15}/></span>
                    <input
                      name="password" type={showPassword ? "text" : "password"}
                      className={`field-input${validation.password.valid ? " valid" : validation.password.message ? " invalid" : ""}`}
                      placeholder="Create a strong password"
                      value={formData.password} onChange={handleInputChange} required
                      autoComplete="new-password"
                    />
                    <span className="field-right">
                      {validation.password.valid && <CheckCircle size={15} color="#22c55e"/>}
                      <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff size={15}/> : <Eye size={15}/>}
                      </button>
                    </span>
                  </div>

                  {/* strength bar */}
                  {formData.password && (
                    <div className="strength-wrap">
                      <div className="strength-row">
                        <span>Password strength</span>
                        <span style={{ color: strColor, fontWeight:600 }}>{strLabel} · {strength}%</span>
                      </div>
                      <div className="strength-track">
                        <div className="strength-fill" style={{ width:`${strength}%`, background: strColor }}/>
                      </div>
                    </div>
                  )}

                  {validation.password.message && (
                    <p className={`field-msg${validation.password.valid ? " ok" : " err"}`}>
                      {validation.password.valid ? <CheckCircle size={10}/> : "⚠"} {validation.password.message}
                    </p>
                  )}
                </div>

                {/* confirm password – reveals when password typed */}
                {showConfirmPassword && (
                  <div className="field-wrap confirm-reveal">
                    <label className="field-label">Confirm Password *</label>
                    <div className="field-rel">
                      <span className="field-prefix"><Lock size={15}/></span>
                      <input
                        name="confirmPassword" type={showPassword ? "text" : "password"}
                        className={`field-input${validation.confirmPassword.valid ? " valid" : validation.confirmPassword.message ? " invalid" : ""}`}
                        placeholder="Re-enter your password"
                        value={formData.confirmPassword} onChange={handleInputChange} required
                        autoComplete="new-password"
                      />
                      <span className="field-right">
                        {validation.confirmPassword.valid && <CheckCircle size={15} color="#22c55e"/>}
                        <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <EyeOff size={15}/> : <Eye size={15}/>}
                        </button>
                      </span>
                    </div>
                    {validation.confirmPassword.message && (
                      <p className={`field-msg${validation.confirmPassword.valid ? " ok" : " err"}`}>
                        {validation.confirmPassword.valid ? <CheckCircle size={10}/> : "⚠"} {validation.confirmPassword.message}
                      </p>
                    )}
                  </div>
                )}

                {/* submit */}
                <button type="submit" className="submit-btn" disabled={loading || !isFormValid}>
                  {loading ? (
                    <>
                      <div style={{ width:17,height:17,border:"2px solid rgba(255,255,255,.35)",borderTop:"2px solid #fff",borderRadius:"50%",animation:"spin .7s linear infinite" }}/>
                      Creating Account…
                    </>
                  ) : (
                    <>
                      <Sparkles size={16}/>
                      Create Account
                      <ArrowRight size={16}/>
                    </>
                  )}
                </button>
              </form>

              {/* divider + login */}
              <div className="divider">
                <div className="divider-line"/>
                <span className="divider-text">or</span>
                <div className="divider-line"/>
              </div>
              <p className="login-row">
                Already have an account?{" "}
                <button className="login-link" onClick={() => navigate("/login")}>
                  Sign in
                </button>
              </p>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}