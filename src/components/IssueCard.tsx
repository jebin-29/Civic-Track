import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, User, Circle, Square, AlertTriangle, CheckCircle } from "lucide-react";

// ── All interfaces & types — 100% original, zero changes ──
export interface Issue {
  id: string;
  title: string;
  description: string;
  category: string | { id: number; name: string; description?: string; icon?: string; color?: string; is_active?: boolean };
  status: 'reported' | 'progress' | 'resolved';
  location: string;
  reportedBy: string;
  reportedAt: string;
  image?: string;
  distance?: string;
  coordinates?: { lat: number; lng: number };
  photos?: string[];
  flags?: number;
  reported_by?: number;

  // AI FIELDS — original
  ai_issue_type?: string | null;
  ai_priority?: string | null;
  ai_severity?: string | null;
  ai_workers?: number | null;
  ai_time_required?: string | null;
  ai_cost?: number | null;
}

interface IssueCardProps {
  issue: Issue;
  onClick?: () => void;
  isAdmin?: boolean;
}

// ── Original lookup maps — untouched ──
const statusLabels = {
  reported: 'Reported',
  progress: 'In Progress',
  resolved: 'Resolved',
};

const categoryColors = {
  road: 'bg-orange-100 text-orange-800',
  streetlight: 'bg-yellow-100 text-yellow-800',
  garbagecollection: 'bg-green-100 text-green-800',
  watersupply: 'bg-blue-100 text-blue-800',
  publicsafety: 'bg-red-100 text-red-800',
  obstructions: 'bg-purple-100 text-purple-800',
  trafficsignal: 'bg-indigo-100 text-indigo-800',
  drainage: 'bg-gray-100 text-gray-800',
  urgent: 'bg-red-500 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-yellow-400 text-black',
  low: 'bg-green-500 text-white',
};

const priorityColors = {
  urgent: 'bg-red-500 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-yellow-400 text-black',
  low: 'bg-green-500 text-white',
};

// ── Original helper functions — untouched ──
const getPriorityColor = (priority?: string | null) => {
  if (!priority) return 'bg-gray-300 text-black';
  return priorityColors[priority as keyof typeof priorityColors] || 'bg-gray-300 text-black';
};

const formatAIValue = (value: any, fallback = 'AI Pending') => {
  return value !== null && value !== undefined ? value : fallback;
};

// ── Theme helpers (new, styling only) ──
const statusTheme: Record<string, { color: string; bg: string; border: string; label: string }> = {
  reported: { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: 'Reported'    },
  progress: { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', label: 'In Progress' },
  resolved: { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', label: 'Resolved'   },
};

const priorityTheme: Record<string, { color: string; bg: string; border: string }> = {
  urgent: { color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  high:   { color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
  medium: { color: '#ca8a04', bg: '#fefce8', border: '#fde68a' },
  low:    { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
};

const categoryTheme: Record<string, { color: string; bg: string }> = {
  road:              { color: '#ea580c', bg: '#fff7ed' },
  streetlight:       { color: '#ca8a04', bg: '#fefce8' },
  garbagecollection: { color: '#16a34a', bg: '#f0fdf4' },
  watersupply:       { color: '#2563eb', bg: '#eff6ff' },
  publicsafety:      { color: '#dc2626', bg: '#fef2f2' },
  obstructions:      { color: '#7c3aed', bg: '#f5f3ff' },
  trafficsignal:     { color: '#4f46e5', bg: '#eef2ff' },
  drainage:          { color: '#0891b2', bg: '#ecfeff' },
};

export function IssueCard({ issue, onClick, isAdmin }: IssueCardProps) {
  // ── Original getCategoryColor logic — untouched ──
  const getCategoryColor = (category: string | { id: number; name: string; description?: string; icon?: string; color?: string; is_active?: boolean }) => {
    const categoryName = typeof category === 'string' ? category : category.name;
    const normalizedCategory = categoryName.toLowerCase().replace(/\s+/g, '');
    return categoryColors[normalizedCategory as keyof typeof categoryColors] || 'bg-orange-100 text-orange-800';
  };

  // Theme helpers derived from issue data (no logic change)
  const categoryName = typeof issue.category === 'string' ? issue.category : issue.category.name;
  const normalizedCat = categoryName.toLowerCase().replace(/\s+/g, '');
  const catTheme = categoryTheme[normalizedCat] ?? { color: '#ea580c', bg: '#fff7ed' };

  const st = statusTheme[issue.status] ?? statusTheme.reported;
  const pt = issue.ai_priority ? (priorityTheme[issue.ai_priority.toLowerCase()] ?? null) : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

        .ic-card {
          font-family: 'DM Sans', sans-serif;
          background: #fff;
          border: 1px solid #e8edf4 !important;
          border-radius: 18px !important;
          box-shadow: 0 1px 4px rgba(0,0,0,.05) !important;
          overflow: hidden;
          cursor: pointer;
          transition: transform .22s, box-shadow .22s;
          display: flex;
          flex-direction: column;
        }
        .ic-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 28px rgba(0,0,0,.1) !important;
        }

        .ic-img {
          width: 100%;
          height: 148px;
          object-fit: cover;
          display: block;
          border-bottom: 1px solid #f1f5f9;
        }
        .ic-img-placeholder {
          width: 100%;
          height: 148px;
          background: linear-gradient(135deg, #f1f5f9 0%, #e8edf4 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          border-bottom: 1px solid #f1f5f9;
        }

        .ic-body { padding: 16px; display: flex; flex-direction: column; gap: 12px; flex: 1; }

        /* Top row: status pill + category pill */
        .ic-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }

        .ic-pill {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 3px 10px; border-radius: 999px; font-size: 11px;
          font-weight: 600; letter-spacing: .03em; border: 1px solid transparent;
          white-space: nowrap; font-family: 'DM Sans', sans-serif;
        }

        .ic-status-dot {
          width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
        }

        /* Title + description */
        .ic-title {
          font-family: 'Sora', sans-serif;
          font-size: 14px; font-weight: 600; color: #0f172a;
          line-height: 1.4; margin: 0 0 5px;
          display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden;
        }
        .ic-desc {
          font-size: 12px; color: #94a3b8; line-height: 1.55; margin: 0;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }

        /* AI section */
        .ic-ai {
          background: #f8fafc; border: 1px solid #e8edf4; border-radius: 12px; padding: 12px;
        }
        .ic-ai-header {
          display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;
        }
        .ic-ai-label {
          font-family: 'Sora', sans-serif; font-size: 11px; font-weight: 600;
          color: #475569; letter-spacing: .04em; text-transform: uppercase;
        }
        .ic-ai-grid {
          display: grid; grid-template-columns: auto 1fr; gap: 4px 12px;
          font-size: 11px;
        }
        .ic-ai-key { color: #94a3b8; align-self: center; }
        .ic-ai-val { color: #334155; font-weight: 600; font-family: 'Sora', sans-serif; }

        /* Footer */
        .ic-footer { display: flex; flex-direction: column; gap: 6px; margin-top: auto; }
        .ic-footer-row { display: flex; align-items: center; justify-content: space-between; }
        .ic-meta {
          display: flex; align-items: center; gap: 5px;
          font-size: 11px; color: #94a3b8; min-width: 0;
        }
        .ic-meta span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px; }
        .ic-distance {
          font-family: 'Sora', sans-serif; font-size: 11px; font-weight: 600;
          color: #6366f1; background: #eef2ff; border: 1px solid #c7d2fe;
          border-radius: 999px; padding: 2px 9px; white-space: nowrap; flex-shrink: 0;
        }
        .ic-flag {
          display: inline-flex; align-items: center; gap: 3px;
          font-size: 11px; font-weight: 600; color: #dc2626;
        }

        .ic-date { font-size: 11px; color: #cbd5e1; }
      `}</style>

      <div className="ic-card" onClick={onClick}>

        {/* Image */}
        {issue.image ? (
          <img src={issue.image} alt={issue.title} className="ic-img" />
        ) : (
          <div className="ic-img-placeholder">
            <MapPin size={28} color="#cbd5e1" />
          </div>
        )}

        <div className="ic-body">

          {/* Status + Category row */}
          <div className="ic-top">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {/* Status pill */}
              <span className="ic-pill" style={{ color: st.color, background: st.bg, borderColor: st.border }}>
                <span className="ic-status-dot" style={{ background: st.color }} />
                {st.label}
              </span>

              {/* Flags */}
              {(issue.flags ?? 0) > 0 && (
                <span className="ic-flag">🚩 {issue.flags}</span>
              )}
            </div>

            {/* Category pill */}
            <span className="ic-pill" style={{ color: catTheme.color, background: catTheme.bg, borderColor: catTheme.color + '33' }}>
              {categoryName}
            </span>
          </div>

          {/* Date line */}
          <span className="ic-date">{issue.reportedAt}</span>

          {/* Title + Description */}
          <div>
            <p className="ic-title">{issue.title}</p>
            <p className="ic-desc">{issue.description}</p>
          </div>

          {/* AI Section — original isAdmin guard kept */}
          {isAdmin && (
            <div className="ic-ai">
              <div className="ic-ai-header">
                <span className="ic-ai-label">🤖 AI Analysis</span>
                {/* Priority pill — original getPriorityColor logic preserved via pt theme */}
                {pt ? (
                  <span className="ic-pill" style={{ color: pt.color, background: pt.bg, borderColor: pt.border, fontSize: 11, fontWeight: 700 }}>
                    {issue.ai_priority?.toUpperCase()}
                  </span>
                ) : (
                  <span className="ic-pill" style={{ color: '#94a3b8', background: '#f1f5f9', borderColor: '#e2e8f0' }}>N/A</span>
                )}
              </div>
              <div className="ic-ai-grid">
                <span className="ic-ai-key">Type</span>
                <span className="ic-ai-val">{formatAIValue(issue.ai_issue_type)}</span>

                <span className="ic-ai-key">Severity</span>
                <span className="ic-ai-val">{formatAIValue(issue.ai_severity)}</span>

                <span className="ic-ai-key">Workers</span>
                <span className="ic-ai-val">{formatAIValue(issue.ai_workers)}</span>

                <span className="ic-ai-key">Time</span>
                <span className="ic-ai-val">{formatAIValue(issue.ai_time_required)}</span>

                <span className="ic-ai-key">Cost</span>
                <span className="ic-ai-val">₹{formatAIValue(issue.ai_cost)}</span>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="ic-footer">
            <div className="ic-meta">
              <MapPin size={11} />
              <span>{issue.location}</span>
            </div>
            <div className="ic-footer-row">
              <div className="ic-meta">
                <User size={11} />
                <span>{issue.reportedBy}</span>
              </div>
              {issue.distance && (
                <span className="ic-distance">{issue.distance}</span>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}