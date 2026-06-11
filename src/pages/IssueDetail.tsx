import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, MapPin, Edit, Trash2, Flag, ChevronLeft, ChevronRight, AlertTriangle, X, Clock, User } from "lucide-react";
import { Header } from "@/components/Header";
import { getImageForCategory } from "@/lib/imageMapping";
import { Issue } from "@/components/IssueCard";
import { MapView } from "@/components/MapView";
import { useToast } from "@/hooks/use-toast";

/* ─── Delete Confirmation Modal — original logic 100% kept ──────── */
function DeleteModal({
  isOpen,
  onConfirm,
  onCancel,
  deleting,
}: {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        @keyframes modal-backdrop-in { from{opacity:0} to{opacity:1} }
        @keyframes modal-card-in { from{opacity:0;transform:scale(.94) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
        .modal-backdrop {
          position:fixed; inset:0; z-index:9999;
          background:rgba(15,23,42,.55); backdrop-filter:blur(4px);
          display:flex; align-items:center; justify-content:center; padding:20px;
          animation:modal-backdrop-in .18s ease;
        }
        .modal-card {
          background:#fff; border-radius:24px; padding:36px 32px 28px;
          max-width:420px; width:100%;
          box-shadow:0 24px 60px rgba(0,0,0,.18),0 4px 12px rgba(0,0,0,.08);
          animation:modal-card-in .22s cubic-bezier(.34,1.26,.64,1); position:relative;
        }
        .modal-icon-ring {
          width:64px; height:64px; border-radius:50%; background:#fef2f2;
          display:flex; align-items:center; justify-content:center;
          margin:0 auto 20px; box-shadow:0 0 0 8px #fff3f3;
        }
        .modal-title { font-family:'Sora',sans-serif; font-size:20px; font-weight:700; color:#0f172a; text-align:center; margin-bottom:8px; }
        .modal-body  { font-size:14px; color:#64748b; text-align:center; line-height:1.6; margin-bottom:28px; font-family:'DM Sans',sans-serif; }
        .modal-body strong { color:#ef4444; }
        .modal-actions { display:flex; gap:12px; }
        .modal-btn-cancel {
          flex:1; padding:13px; border:1.5px solid #e2e8f0; border-radius:14px;
          background:#f8fafc; color:#475569; font-size:14px; font-weight:600;
          cursor:pointer; transition:all .2s; font-family:'DM Sans',sans-serif;
        }
        .modal-btn-cancel:hover { background:#f1f5f9; border-color:#cbd5e1; }
        .modal-btn-delete {
          flex:1; padding:13px; border:none; border-radius:14px;
          background:linear-gradient(135deg,#ef4444,#dc2626); color:#fff;
          font-size:14px; font-weight:600; cursor:pointer;
          box-shadow:0 4px 14px rgba(239,68,68,.35); transition:all .25s;
          display:flex; align-items:center; justify-content:center; gap:6px;
          font-family:'DM Sans',sans-serif;
        }
        .modal-btn-delete:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 8px 20px rgba(239,68,68,.45); }
        .modal-btn-delete:disabled { opacity:.65; cursor:not-allowed; }
        .modal-close {
          position:absolute; top:16px; right:16px; width:32px; height:32px;
          border-radius:50%; background:#f1f5f9; border:none; cursor:pointer;
          display:flex; align-items:center; justify-content:center;
          color:#94a3b8; transition:all .2s;
        }
        .modal-close:hover { background:#e2e8f0; color:#475569; }
        @keyframes spin-del { to{transform:rotate(360deg)} }
        .del-spinner { width:16px; height:16px; border-radius:50%; border:2px solid rgba(255,255,255,.4); border-top-color:#fff; animation:spin-del .65s linear infinite; }
      `}</style>

      <div className="modal-backdrop" onClick={onCancel}>
        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={onCancel}><X size={14} /></button>
          <div className="modal-icon-ring"><AlertTriangle size={28} color="#ef4444" strokeWidth={2.2} /></div>
          <p className="modal-title">Delete this issue?</p>
          <p className="modal-body">This action <strong>cannot be undone</strong>. The issue and all its photos will be permanently removed.</p>
          <div className="modal-actions">
            <button className="modal-btn-cancel" onClick={onCancel} disabled={deleting}>Cancel</button>
            <button className="modal-btn-delete" onClick={onConfirm} disabled={deleting}>
              {deleting ? <><div className="del-spinner" /> Deleting…</> : <><Trash2 size={14} /> Delete</>}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────── */
export default function IssueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // ── All state — original ──
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [issue, setIssue] = useState<Issue | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ── All helpers — original ──
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  const getAuthHeader = () => {
    const user = JSON.parse(localStorage.getItem("civictrack_user") || "{}");
    return {
      "Content-Type": "application/json",
      "Authorization": user.token ? `Token ${user.token}` : "",
    };
  };

  const fetchIssue = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/issues/${id}/`, { headers: getAuthHeader() });
      if (response.ok) {
        const data = await response.json();
        setIssue({
          id: data.id,
          title: data.title,
          description: data.description,
          category: data.category?.name || data.category,
          status: data.status,
          location: data.location,
          reportedBy: data.reporter_name,
          reportedAt: data.reported_at,
          reported_by: data.reported_by?.id ?? data.reported_by,
          image: data.primary_photo ? data.primary_photo : getImageForCategory(data.category),
          coordinates: data.latitude && data.longitude
            ? { lat: Number(data.latitude), lng: Number(data.longitude) }
            : undefined,
          flags: data.flags,
          has_flagged: data.has_flagged,
        });
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    const userData = localStorage.getItem('civictrack_user');
    if (userData) {
      const userObj = JSON.parse(userData);
      setUser(userObj);
      setIsAdmin(userObj.isAdmin || false);
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.error("Location error:", err)
    );
    fetchIssue();
  }, [id, location.state]);

  // ── All handlers — original ──
  const handleDeleteClick = () => setShowDeleteModal(true);

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/issues/${issue!.id}/delete/`, {
        method: "DELETE", headers: getAuthHeader(),
      });
      if (res.ok) {
        setShowDeleteModal(false);
        toast({ title: "Issue Deleted", description: "The issue has been permanently removed." });
        setTimeout(() => navigate("/my-issues"), 600);
      } else { console.log(await res.json()); setDeleting(false); }
    } catch (err) { console.error(err); setDeleting(false); }
  };

  const handleReportSpam = async () => {
  try {
    const response = await fetch(`http://127.0.0.1:8000/api/issues/${issue!.id}/flag/`, {
      method: "POST", headers: getAuthHeader(), body: JSON.stringify({ reason: "spam" }),
    });
    if (response.ok) {
      toast({ title: "Reported", description: "Issue flagged as spam" });
      fetchIssue();
    } else { console.log(await response.json()); }
  } catch (error) { console.error(error); }
};

const handleUndoSpam = async () => {
  try {
    const response = await fetch(`http://127.0.0.1:8000/api/issues/${issue!.id}/unflag/`, {
      method: "DELETE", headers: getAuthHeader(),
    });
    if (response.ok) {
      toast({ title: "Report Removed", description: "Your spam report has been removed." });
      fetchIssue();
    } else { console.log(await response.json()); }
  } catch (error) { console.error(error); }
};

  // ── Original status helpers ──
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reported': return 'bg-status-reported text-status-reported-foreground';
      case 'progress': return 'bg-status-progress text-status-progress-foreground';
      case 'resolved': return 'bg-status-resolved text-status-resolved-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };
  const getStatusText = (status: string) => {
    switch (status) {
      case 'reported': return 'Reported';
      case 'progress': return 'In Progress';
      case 'resolved': return 'Resolved';
      default: return status;
    }
  };

  const mockActivityLog = [
    { date: 'Jun 02, 10:34 AM', action: 'Reported by user' },
    { date: 'July 26, 09:00 AM', action: 'Assigned to municipal worker' },
    { date: 'July 28, 04:15 PM', action: 'Marked "In Progress"' },
  ];

  const handlePreviousPhoto = () => { if (issue?.photos && currentPhotoIndex > 0) setCurrentPhotoIndex(currentPhotoIndex - 1); };
  const handleNextPhoto = () => { if (issue?.photos && currentPhotoIndex < issue.photos.length - 1) setCurrentPhotoIndex(currentPhotoIndex + 1); };

  // ── Theme-only helpers (no logic) ──
  const statusTheme: Record<string, { color: string; bg: string; border: string; label: string }> = {
    reported: { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: 'Reported'    },
    progress: { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', label: 'In Progress' },
    resolved: { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', label: 'Resolved'   },
  };

  if (!issue) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f6f7f9' }}>
      <div style={spinnerStyle} />
    </div>
  );

  const distance =
    userLocation && issue.coordinates
      ? calculateDistance(userLocation.lat, userLocation.lng, issue.coordinates.lat, issue.coordinates.lng).toFixed(1) + " km"
      : "Unknown";

  const isUserIssue = user && (
    issue.reported_by === user.id ||
    issue.reported_by?.id === user.id ||
    issue.reportedBy === user.username
  );
  const photos = issue.photos || [issue.image];
  const currentPhoto = photos[currentPhotoIndex];
  const st = statusTheme[issue.status] ?? statusTheme.reported;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

        .id-page  { font-family:'DM Sans',sans-serif; background:#f6f7f9; min-height:100vh; }
        .id-body  { max-width:1200px; margin:0 auto; padding:32px 24px 80px; }

        /* Back button */
        .id-back {
          display:inline-flex; align-items:center; gap:8px;
          font-size:13px; font-weight:600; color:#64748b;
          background:none; border:none; cursor:pointer;
          font-family:'DM Sans',sans-serif;
          padding:8px 14px 8px 10px; border-radius:10px;
          transition:all .18s; margin-bottom:28px;
        }
        .id-back:hover { background:#fff; color:#0f172a; box-shadow:0 1px 4px rgba(0,0,0,.08); }

        /* Main grid */
        .id-grid { display:grid; grid-template-columns:1fr 340px; gap:24px; align-items:start; }
        @media(max-width:900px){ .id-grid{ grid-template-columns:1fr; } }

        /* Section cards */
        .id-card {
          background:#fff; border:1px solid #e8edf4; border-radius:20px;
          box-shadow:0 1px 3px rgba(0,0,0,.04); overflow:hidden;
        }
        .id-card-body { padding:24px; }

        /* Title block */
        .id-title-block { margin-bottom:20px; }
        .id-pill-row { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:14px; }
        .id-pill {
          display:inline-flex; align-items:center; gap:5px;
          padding:4px 12px; border-radius:999px; font-size:12px;
          font-weight:600; border:1px solid transparent;
          font-family:'DM Sans',sans-serif; white-space:nowrap;
        }
        .id-title {
          font-family:'Sora',sans-serif; font-size:22px; font-weight:700;
          color:#0f172a; margin:0 0 6px; line-height:1.3;
        }
        .id-meta { font-size:13px; color:#94a3b8; }
        .id-meta strong { color:#64748b; font-weight:500; }

        /* Action buttons */
        .id-action-row { display:flex; gap:8px; flex-wrap:wrap; }
        .id-btn {
          display:inline-flex; align-items:center; gap:6px;
          padding:8px 16px; border-radius:11px; font-size:13px; font-weight:600;
          cursor:pointer; border:1.5px solid #e2e8f0; background:#fff; color:#475569;
          font-family:'DM Sans',sans-serif; transition:all .2s; white-space:nowrap;
        }
        .id-btn:hover { background:#f8fafc; border-color:#cbd5e1; color:#334155; }
        .id-btn-edit { border-color:#dbeafe; background:#eff6ff; color:#2563eb; }
        .id-btn-edit:hover { background:#dbeafe; border-color:#93c5fd; }
        .id-btn-delete { border-color:#fecaca; background:#fff; color:#dc2626; }
        .id-btn-delete:hover { background:#fef2f2; border-color:#f87171; }
        .id-btn-flag { border-color:#e2e8f0; color:#64748b; }
        .id-btn-flag:hover { background:#f8fafc; }
        .id-btn:disabled { opacity:.5; cursor:not-allowed; }

        /* Photo viewer */
        .id-photo-wrap { position:relative; width:100%; aspect-ratio:16/9; border-radius:16px; overflow:hidden; background:#f1f5f9; }
        .id-photo-main { width:100%; height:100%; object-fit:cover; display:block; }
        .id-photo-nav {
          position:absolute; top:50%; transform:translateY(-50%);
          width:36px; height:36px; border-radius:50%;
          background:rgba(255,255,255,.9); backdrop-filter:blur(4px);
          border:none; cursor:pointer; display:flex; align-items:center; justify-content:center;
          box-shadow:0 2px 8px rgba(0,0,0,.15); color:#0f172a; transition:all .18s;
        }
        .id-photo-nav:hover { background:#fff; box-shadow:0 4px 12px rgba(0,0,0,.2); }
        .id-photo-nav:disabled { opacity:.35; cursor:not-allowed; }
        .id-photo-nav-l { left:12px; }
        .id-photo-nav-r { right:12px; }
        .id-photo-counter {
          position:absolute; bottom:12px; right:12px;
          background:rgba(15,23,42,.7); color:#fff; font-size:11px; font-weight:600;
          padding:4px 10px; border-radius:999px; font-family:'Sora',sans-serif;
          backdrop-filter:blur(4px);
        }

        /* Thumbnails */
        .id-thumbs { display:flex; gap:8px; overflow-x:auto; padding-bottom:4px; }
        .id-thumb {
          flex-shrink:0; width:60px; height:60px; border-radius:10px; overflow:hidden;
          border:2px solid #e8edf4; cursor:pointer; transition:border-color .18s;
        }
        .id-thumb.active { border-color:#6366f1; box-shadow:0 0 0 2px rgba(99,102,241,.2); }
        .id-thumb img { width:100%; height:100%; object-fit:cover; display:block; }

        /* Section headings */
        .id-section-title {
          font-family:'Sora',sans-serif; font-size:14px; font-weight:600;
          color:#0f172a; margin:0 0 14px;
        }
        .id-section-head {
          padding:18px 24px 14px; border-bottom:1px solid #f1f5f9;
          display:flex; align-items:center; gap:8px;
        }

        /* Description */
        .id-desc { font-size:14px; color:#64748b; line-height:1.75; }

        /* Activity log */
        .id-activity-row {
          display:flex; align-items:center; justify-content:space-between;
          padding:12px 0; border-bottom:1px solid #f8fafc;
        }
        .id-activity-row:last-child { border-bottom:none; padding-bottom:0; }
        .id-activity-date { font-size:12px; color:#94a3b8; }
        .id-activity-action { font-size:13px; font-weight:500; color:#475569; }

        /* Details grid */
        .id-detail-row {
          display:flex; align-items:center; justify-content:space-between;
          padding:11px 0; border-bottom:1px solid #f8fafc;
        }
        .id-detail-row:last-child { border-bottom:none; padding-bottom:0; }
        .id-detail-key { font-size:13px; color:#94a3b8; }
        .id-detail-val { font-size:13px; font-weight:600; color:#334155; font-family:'Sora',sans-serif; text-align:right; }

        /* Spam badge */
        .id-spam-badge {
          display:inline-flex; align-items:center; gap:4px;
          padding:3px 10px; border-radius:999px; font-size:11px; font-weight:700;
          background:#fef2f2; color:#dc2626; border:1px solid #fecaca;
        }

        /* Map wrapper */
        .id-map-wrap { height:200px; border-radius:12px; overflow:hidden; }

        @keyframes id-spin { to{transform:rotate(360deg)} }
      `}</style>

      <div className="id-page">
        <Header isLoggedIn={!!user} userName={user?.username} isAdmin={isAdmin} />

        {/* Delete Modal — original component, zero changes */}
        <DeleteModal
          isOpen={showDeleteModal}
          onConfirm={handleDeleteConfirm}
          onCancel={() => !deleting && setShowDeleteModal(false)}
          deleting={deleting}
        />

        <div className="id-body">

          {/* Back button */}
          <button className="id-back" onClick={() => navigate(-1)}>
            <ArrowLeft size={15} /> Back
          </button>

          <div className="id-grid">

            {/* ── LEFT COLUMN ── */}
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

              {/* Title + Actions */}
              <div className="id-card">
                <div className="id-card-body">
                  <div className="id-title-block">

                    {/* Status pill + action buttons */}
                    <div className="id-pill-row">
                      {/* Status pill — original getStatusColor/getStatusText logic preserved via theme map */}
                      <span className="id-pill" style={{ color:st.color, background:st.bg, borderColor:st.border }}>
                        <span style={{ width:6, height:6, borderRadius:'50%', background:st.color, flexShrink:0 }} />
                        {st.label}
                      </span>

                      {/* Spam badge — original condition */}
                      {issue.flags > 0 && (
                        <span className="id-spam-badge">🚩 {issue.flags} report{issue.flags > 1 ? 's' : ''}</span>
                      )}
                    </div>

                    <h1 className="id-title">{issue.title}</h1>
                    <p className="id-meta">
                      Reported by <strong>{issue.reportedBy}</strong> &nbsp;·&nbsp; {issue.reportedAt}
                    </p>
                  </div>

                  {/* Action row — original onClick handlers kept */}
                  <div className="id-action-row">
                    {isUserIssue && (
                      <>
                        <button className="id-btn id-btn-edit" onClick={() => navigate(`/edit-issue/${issue.id}`)}>
                          <Edit size={13} /> Edit
                        </button>
                        <button className="id-btn id-btn-delete" onClick={handleDeleteClick}>
                          <Trash2 size={13} /> Delete
                        </button>
                      </>
                    )}
                    {!isUserIssue && !isAdmin && (
                      <>
                        {!issue?.has_flagged ? (
                          <button className="id-btn id-btn-flag" onClick={handleReportSpam}>
                            <Flag size={13} /> Report Spam
                          </button>
                        ) : (
                          <button className="id-btn" onClick={handleUndoSpam}
                            style={{ borderColor:"#fecaca", background:"#fef2f2", color:"#dc2626" }}>
                            <Flag size={13} /> Reported · Undo
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Photo Viewer — original state & handlers */}
              {currentPhoto && (
                <div className="id-card" style={{ overflow:'hidden' }}>
                  <div className="id-photo-wrap">
                    <img src={currentPhoto} alt={issue.title} className="id-photo-main" />
                    {photos.length > 1 && (
                      <>
                        <button className="id-photo-nav id-photo-nav-l" onClick={handlePreviousPhoto} disabled={currentPhotoIndex === 0}>
                          <ChevronLeft size={16} />
                        </button>
                        <button className="id-photo-nav id-photo-nav-r" onClick={handleNextPhoto} disabled={currentPhotoIndex === photos.length - 1}>
                          <ChevronRight size={16} />
                        </button>
                        <span className="id-photo-counter">{currentPhotoIndex + 1} / {photos.length}</span>
                      </>
                    )}
                  </div>

                  {/* Thumbnails — original onClick */}
                  {photos.length > 1 && (
                    <div style={{ padding:'14px 20px 18px' }}>
                      <div className="id-thumbs">
                        {photos.map((photo, index) => (
                          <div key={index} className={`id-thumb${index === currentPhotoIndex ? ' active' : ''}`} onClick={() => setCurrentPhotoIndex(index)}>
                            <img src={photo} alt={`Photo ${index + 1}`} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Description card */}
              <div className="id-card">
                <div className="id-section-head">
                  <p className="id-section-title" style={{ margin:0 }}>Description</p>
                </div>
                <div className="id-card-body" style={{ paddingTop:16 }}>
                  <p className="id-desc">{issue.description}</p>
                </div>
              </div>

              {/* Activity card — original mockActivityLog */}
              <div className="id-card">
                <div className="id-section-head">
                  <Clock size={15} color="#94a3b8" />
                  <p className="id-section-title" style={{ margin:0 }}>Activity</p>
                </div>
                <div className="id-card-body" style={{ paddingTop:8 }}>
                  {mockActivityLog.map((activity, index) => (
                    <div key={index} className="id-activity-row">
                      <span className="id-activity-date">{activity.date}</span>
                      <span className="id-activity-action">{activity.action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN ── */}
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

              {/* Location card — original MapView */}
              <div className="id-card">
                <div className="id-section-head">
                  <MapPin size={15} color="#6366f1" />
                  <p className="id-section-title" style={{ margin:0 }}>Location</p>
                </div>
                <div className="id-card-body" style={{ paddingTop:10 }}>
                  <p style={{ fontSize:13, color:'#64748b', marginBottom:14, lineHeight:1.5 }}>{issue.location}</p>
                  {issue.coordinates && (
                    <div className="id-map-wrap">
                      <MapView issues={[issue]} center={[issue.coordinates.lat, issue.coordinates.lng]} zoom={16} />
                    </div>
                  )}
                </div>
              </div>

              {/* Issue Details card — original data */}
              <div className="id-card">
                <div className="id-section-head">
                  <p className="id-section-title" style={{ margin:0 }}>Issue Details</p>
                </div>
                <div className="id-card-body" style={{ paddingTop:8 }}>

                  <div className="id-detail-row">
                    <span className="id-detail-key">Category</span>
                    <span className="id-detail-val">{typeof issue.category === 'string' ? issue.category : (issue.category as any).name}</span>
                  </div>

                  <div className="id-detail-row">
                    <span className="id-detail-key">Status</span>
                    {/* original getStatusColor / getStatusText preserved, styled with theme pill */}
                    <span className="id-pill" style={{ color:st.color, background:st.bg, borderColor:st.border, fontSize:11 }}>
                      {st.label}
                    </span>
                  </div>

                  <div className="id-detail-row">
                    <span className="id-detail-key">Reported</span>
                    <span className="id-detail-val">{issue.reportedAt}</span>
                  </div>

                  <div className="id-detail-row">
                    <span className="id-detail-key">Distance</span>
                    <span className="id-detail-val">{distance}</span>
                  </div>

                  {issue.coordinates && (
                    <div className="id-detail-row">
                      <span className="id-detail-key">Coordinates</span>
                      <span className="id-detail-val" style={{ fontSize:11 }}>
                        {issue.coordinates.lat.toFixed(5)}, {issue.coordinates.lng.toFixed(5)}
                      </span>
                    </div>
                  )}

                </div>
              </div>

            </div>
          </div>
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
  animation: 'id-spin .75s linear infinite',
};