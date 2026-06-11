import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, MapPin, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Header } from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import { BackButton } from "@/components/BackButton";
import { PhotoUpload } from "@/components/PhotoUpload";
import { LocationPicker } from "@/components/LocationPicker";
import { issuesAPI, categoriesAPI, type Category } from "@/lib/api";

/* ─── category icon map ───────────────────────────────────────────── */
const categoryIcons: Record<string, string> = {
  "Road":               "🛣️",
  "Drainage":           "🌊",
  "Garbage Collection": "🗑️",
  "Streetlight":        "💡",
};

export default function ReportIssue() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [user,               setUser]               = useState<any>(null);
  const [isAdmin,            setIsAdmin]            = useState(false);
  const [submitting,         setSubmitting]         = useState(false);
  const [categories,         setCategories]         = useState<Category[]>([]);
  const [loadingCategories,  setLoadingCategories]  = useState(true);
  const [loaded,             setLoaded]             = useState(false);

  const [formData, setFormData] = useState({
    title:       "",
    category_id: "",
    description: "",
    anonymous:   false,
  });

  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number; lng: number; address: string;
  } | null>(null);

  const [uploadedPhotos, setUploadedPhotos] = useState<File[]>([]);

  /* ── auth + categories ── */
  useEffect(() => {
    const userData = localStorage.getItem("civictrack_user");
    if (userData) {
      const userObj = JSON.parse(userData);
      setUser(userObj);
      setIsAdmin(userObj.isAdmin || false);
      setFormData(prev => ({ ...prev, anonymous: userObj.privacy?.anonymousReports || false }));
    } else {
      navigate("/login");
    }

    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const apiCategories = await categoriesAPI.getCategories();
        const allowed = ["Road", "Drainage", "Garbage Collection", "Streetlight"];
        setCategories(apiCategories.filter(c => allowed.includes(c.name)));
      } catch (error: any) {
        toast({
          title: "Submission Failed",
          description: JSON.stringify(error?.errors || error?.message, null, 2),
          variant: "destructive",
        });
      } finally {
        setLoadingCategories(false);
        setTimeout(() => setLoaded(true), 80);
      }
    };
    fetchCategories();
  }, [navigate, toast]);

  /* ── submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.category_id || !formData.description) {
      toast({ title: "Missing Information", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    if (!selectedLocation) {
      toast({ title: "Location Required", description: "Please select a location for the issue", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const submitData = new FormData();
      submitData.append("title",       formData.title);
      submitData.append("description", formData.description);
      submitData.append("category_id", formData.category_id);
      submitData.append("priority",    "medium");
      submitData.append("location",    selectedLocation.address || "Near main road");
      submitData.append("latitude",    String(selectedLocation.lat));
      submitData.append("longitude",   String(selectedLocation.lng));
      submitData.append("is_anonymous",String(formData.anonymous));
      uploadedPhotos.forEach(f => submitData.append("photos", f));

      await issuesAPI.createIssue(submitData);

      toast({ title: "Issue Reported Successfully", description: "Your issue has been submitted and will be reviewed by authorities" });

      setTimeout(() => {
        if (isAdmin) { navigate("/admin"); window.location.reload(); }
        else navigate("/home");
      }, 1500);
    } catch (error: any) {
      console.error("FULL ERROR:", error);
      toast({
        title: "Submission Failed",
        description: JSON.stringify(error?.errors || error?.message || "Unknown error", null, 2),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  /* ── handlers (unchanged) ── */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSelectChange = (value: string) => {
    if (!isNaN(Number(value))) setFormData(prev => ({ ...prev, category_id: value }));
  };

  const handleAnonymousChange = (checked: boolean) =>
    setFormData(prev => ({ ...prev, anonymous: checked }));

  const handleLocationChange = (loc: { lat: number; lng: number; address: string }) =>
    setSelectedLocation(loc);

  const handlePhotosChange = (photos: File[]) => setUploadedPhotos(photos);

  /* ── progress dots ── */
  const steps = [
    { label: "Title & Category", done: !!(formData.title && formData.category_id) },
    { label: "Photo & Location", done: uploadedPhotos.length > 0 || !!selectedLocation },
    { label: "Description",      done: !!formData.description },
  ];
  const completedSteps = steps.filter(s => s.done).length;
  const progressPct    = Math.round((completedSteps / steps.length) * 100);

  if (!user) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#f6f7f9" }}>
      <div style={spinStyle} />
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

        .ri-wrap {
          font-family:'DM Sans',sans-serif;
          background:#f6f7f9;
          min-height:100vh;
          color:#1e293b;
          padding-bottom:80px;
        }

        .ri-body {
          max-width:680px;
          margin:0 auto;
          padding:36px 20px;
          opacity:0; transform:translateY(14px);
          transition:opacity .5s ease, transform .5s ease;
        }
        .ri-body.vis { opacity:1; transform:translateY(0); }

        /* ── page header ── */
        .ri-page-head { margin-bottom:28px; }
        .ri-eyebrow {
          font-size:11px; letter-spacing:.12em; text-transform:uppercase;
          color:#6366f1; font-weight:600; margin-bottom:8px;
        }
        .ri-page-title {
          font-family:'Sora',sans-serif;
          font-size:26px; font-weight:700; color:#0f172a;
          margin-bottom:6px;
        }
        .ri-page-sub { font-size:14px; color:#94a3b8; }

        /* ── progress bar ── */
        .progress-wrap { margin-bottom:32px; }
        .progress-steps { display:flex; justify-content:space-between; margin-bottom:10px; }
        .progress-step { display:flex; align-items:center; gap:6px; font-size:12px; font-weight:500; }
        .progress-check { width:18px; height:18px; border-radius:50%; border:1.5px solid #e2e8f0; display:flex; align-items:center; justify-content:center; font-size:9px; transition:all .3s; flex-shrink:0; }
        .progress-check.done { background:#6366f1; border-color:#6366f1; color:#fff; }
        .progress-track { height:5px; background:#e8edf4; border-radius:999px; overflow:hidden; }
        .progress-fill { height:100%; border-radius:999px; background:linear-gradient(90deg,#6366f1,#8b5cf6); transition:width .5s ease; }

        /* ── section card ── */
        .ri-section {
          background:#fff; border:1px solid #e8edf4;
          border-radius:20px; padding:28px 28px;
          margin-bottom:16px;
          box-shadow:0 1px 3px rgba(0,0,0,.04);
          transition:box-shadow .25s;
        }
        .ri-section:focus-within { box-shadow:0 4px 20px rgba(99,102,241,.1); border-color:#c7d2fe; }

        .section-head { display:flex; align-items:center; gap:10px; margin-bottom:22px; }
        .section-num {
          width:28px; height:28px; border-radius:50%;
          background:#f0f1ff; color:#6366f1; font-size:12px;
          font-weight:700; display:flex; align-items:center; justify-content:center;
          flex-shrink:0;
        }
        .section-title { font-family:'Sora',sans-serif; font-size:15px; font-weight:600; color:#0f172a; }

        /* ── category grid ── */
        .cat-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        .cat-item {
          border:1.5px solid #e8edf4; border-radius:14px;
          padding:18px 16px; cursor:pointer; text-align:center;
          transition:all .2s; background:#fafbfc;
        }
        .cat-item:hover { border-color:#a5b4fc; background:#f5f3ff; }
        .cat-item.selected { border-color:#6366f1; background:#f0f1ff; box-shadow:0 0 0 3px rgba(99,102,241,.12); }
        .cat-icon { font-size:26px; margin-bottom:8px; }
        .cat-name { font-size:13px; font-weight:600; color:#334155; }
        .cat-item.selected .cat-name { color:#4f46e5; }

        /* ── form fields ── */
        .field-label {
          display:block; font-size:12px; font-weight:600; color:#64748b;
          letter-spacing:.05em; text-transform:uppercase; margin-bottom:8px;
        }
        .field-input {
          width:100%; padding:12px 16px;
          border:1.5px solid #e2e8f0; border-radius:12px;
          font-size:14px; font-family:'DM Sans',sans-serif;
          color:#1e293b; background:#fff; outline:none;
          transition:border-color .2s, box-shadow .2s;
        }
        .field-input:focus { border-color:#6366f1; box-shadow:0 0 0 3px rgba(99,102,241,.1); }
        .field-input::placeholder { color:#cbd5e1; }

        .field-textarea {
          resize:vertical; min-height:110px; line-height:1.65;
        }

        .field-group { margin-bottom:20px; }
        .field-group:last-child { margin-bottom:0; }

        /* ── anonymous toggle ── */
        .anon-row {
          display:flex; align-items:center; gap:12px;
          padding:14px 18px; border-radius:12px;
          background:#f8fafc; border:1.5px solid #e8edf4;
          cursor:pointer; transition:all .2s; margin-top:4px;
          user-select:none;
        }
        .anon-row:hover { border-color:#c7d2fe; background:#f5f3ff; }
        .anon-row.on { border-color:#6366f1; background:#f0f1ff; }
        .anon-switch {
          width:38px; height:22px; border-radius:999px;
          background:#e2e8f0; position:relative;
          transition:background .25s; flex-shrink:0;
        }
        .anon-switch.on { background:#6366f1; }
        .anon-knob {
          width:16px; height:16px; border-radius:50%;
          background:#fff; position:absolute; top:3px; left:3px;
          transition:left .25s; box-shadow:0 1px 3px rgba(0,0,0,.2);
        }
        .anon-switch.on .anon-knob { left:19px; }
        .anon-text { flex:1; }
        .anon-label { font-size:14px; font-weight:500; color:#334155; }
        .anon-sub { font-size:12px; color:#94a3b8; margin-top:2px; }

        /* ── submit button ── */
        .submit-btn {
          width:100%; padding:16px 24px;
          background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);
          color:#fff; border:none; border-radius:16px;
          font-size:16px; font-weight:600; font-family:'Sora',sans-serif;
          cursor:pointer; letter-spacing:.02em;
          box-shadow:0 4px 14px rgba(99,102,241,.35);
          transition:all .25s; display:flex; align-items:center; justify-content:center; gap:8px;
          margin-top:8px;
        }
        .submit-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 24px rgba(99,102,241,.45); }
        .submit-btn:active:not(:disabled){ transform:translateY(0); }
        .submit-btn:disabled { opacity:.6; cursor:not-allowed; }

        /* ── tip banner ── */
        .tip-banner {
          background:linear-gradient(135deg,#eff6ff,#f0f9ff);
          border:1px solid #bfdbfe; border-radius:14px;
          padding:14px 18px; margin-bottom:20px;
          display:flex; gap:10px; align-items:flex-start;
        }
        .tip-icon { font-size:18px; flex-shrink:0; margin-top:1px; }
        .tip-text { font-size:13px; color:#2563eb; line-height:1.55; }
        .tip-text strong { font-weight:600; }

        @keyframes spin { to{ transform:rotate(360deg); } }
        @keyframes spin-loader { to{ transform:rotate(360deg); } }
      `}</style>

      <div className="ri-wrap">
        <Header isLoggedIn={true} userName={user?.username} isAdmin={isAdmin} />

        <div className={`ri-body${loaded ? " vis" : ""}`}>
          <BackButton theme="light"/>

          {/* ── page heading ── */}
          <div className="ri-page-head">
            <p className="ri-eyebrow">Community Platform</p>
            <h1 className="ri-page-title">Report an Issue</h1>
            <p className="ri-page-sub">Help improve your neighbourhood by flagging local problems</p>
          </div>

          {/* ── progress ── */}
          <div className="progress-wrap">
            <div className="progress-steps">
              {steps.map((s, i) => (
                <div key={i} className="progress-step" style={{ color: s.done ? "#6366f1" : "#94a3b8" }}>
                  <div className={`progress-check${s.done ? " done" : ""}`}>
                    {s.done ? "✓" : i + 1}
                  </div>
                  <span style={{ display:"none" }}>{s.label}</span>
                </div>
              ))}
              <span style={{ fontSize:12, color:"#94a3b8", marginLeft:"auto" }}>
                {completedSteps}/{steps.length} completed
              </span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width:`${progressPct}%` }} />
            </div>
          </div>

          {/* ── tip ── */}
          <div className="tip-banner">
            <span className="tip-icon">💡</span>
            <p className="tip-text">
              <strong>Better reports get resolved faster.</strong>{" "}
              Clear photos and an accurate location help authorities act quickly.
            </p>
          </div>

          <form onSubmit={handleSubmit}>

            {/* ── section 1: title + category ── */}
            <div className="ri-section">
              <div className="section-head">
                <span className="section-num">1</span>
                <span className="section-title">Issue Title &amp; Category</span>
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="title">Issue Title *</label>
                <input
                  id="title" name="title" className="field-input"
                  placeholder="e.g. Broken streetlight near bus stop"
                  value={formData.title} onChange={handleInputChange} required
                />
              </div>

              <div className="field-group" style={{ marginBottom:0 }}>
                <label className="field-label">Category *</label>
                {loadingCategories ? (
                  <div style={{ display:"flex", alignItems:"center", gap:10, color:"#94a3b8", fontSize:14 }}>
                    <div style={{ ...spinStyle, width:20, height:20, borderWidth:2 }} />
                    Loading categories…
                  </div>
                ) : (
                  <div className="cat-grid">
                    {categories.map(cat => (
                      <div
                        key={cat.id}
                        className={`cat-item${formData.category_id === String(cat.id) ? " selected" : ""}`}
                        onClick={() => handleSelectChange(String(cat.id))}
                      >
                        <div className="cat-icon">{categoryIcons[cat.name] ?? "📋"}</div>
                        <p className="cat-name">{cat.name}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── section 2: photo + location ── */}
            <div className="ri-section">
              <div className="section-head">
                <span className="section-num">2</span>
                <span className="section-title">Photo &amp; Location</span>
              </div>

              <div style={{ marginBottom:20 }}>
                <PhotoUpload maxPhotos={5} maxFileSize={10} onPhotosChange={handlePhotosChange} />
              </div>

              <LocationPicker onLocationChange={handleLocationChange} />
            </div>

            {/* ── section 3: description + anonymous ── */}
            <div className="ri-section">
              <div className="section-head">
                <span className="section-num">3</span>
                <span className="section-title">Description &amp; Visibility</span>
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="description">Description *</label>
                <textarea
                  id="description" name="description"
                  className={`field-input field-textarea`}
                  placeholder="Describe the issue in detail — when you noticed it, how severe it is, any safety concerns…"
                  value={formData.description} onChange={handleInputChange} required
                />
              </div>

              {/* anonymous toggle */}
              <label>
                <div
                  className={`anon-row${formData.anonymous ? " on" : ""}`}
                  onClick={() => handleAnonymousChange(!formData.anonymous)}
                >
                  <div className={`anon-switch${formData.anonymous ? " on" : ""}`}>
                    <div className="anon-knob" />
                  </div>
                  <div className="anon-text">
                    <p className="anon-label">Report Anonymously</p>
                    <p className="anon-sub">Your name won't be visible to the public</p>
                  </div>
                  {formData.anonymous
                    ? <EyeOff size={16} color="#6366f1" />
                    : <Eye    size={16} color="#94a3b8" />
                  }
                </div>
              </label>
            </div>

            {/* ── submit ── */}
            <button type="submit" className="submit-btn" disabled={submitting || loadingCategories}>
              {submitting ? (
                <>
                  <Loader2 size={18} style={{ animation:"spin-loader .75s linear infinite" }} />
                  Submitting…
                </>
              ) : (
                <>
                  <Camera size={18} />
                  Submit Report
                </>
              )}
            </button>

          </form>
        </div>
      </div>
    </>
  );
}

const spinStyle: React.CSSProperties = {
  width:34, height:34,
  border:"3px solid #e2e8f0",
  borderTop:"3px solid #6366f1",
  borderRadius:"50%",
  animation:"spin .75s linear infinite",
  flexShrink:0,
};