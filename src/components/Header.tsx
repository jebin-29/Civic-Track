import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate, useLocation } from "react-router-dom";
import {
  User, Settings, LogOut, Home, FileText, Plus,
  Building2, Shield, AlertCircle, Bell, ChevronDown,
} from "lucide-react";

// ── Interface — original, untouched ──
interface HeaderProps {
  onLoginClick?: () => void;
  isLoggedIn?: boolean;
  userName?: string;
  isAdmin?: boolean;
}

export function Header({ onLoginClick, isLoggedIn = false, userName, isAdmin = false }: HeaderProps) {
  const navigate   = useNavigate();
  const location   = useLocation();

  // ── Original computed booleans — untouched ──
  const isProfilePage = location.pathname.startsWith("/profile");
  const isAuthPage    = location.pathname === "/login" || location.pathname === "/register";
  const isHomePage    = location.pathname === "/home";

  // ── Original handler — untouched ──
  const handleLogout = () => {
    localStorage.removeItem('civictrack_user');
    navigate("/login");
    window.location.reload();
  };

  // Avatar initials helper (styling only)
  const initials = userName ? userName.charAt(0).toUpperCase() : "U";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

        /* ── Header shell ── */
        .hdr {
          position: sticky; top: 0; z-index: 999;
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid #e8edf4;
          box-shadow: 0 1px 0 rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.04);
          font-family: 'DM Sans', sans-serif;
        }

        .hdr-inner {
          max-width: 1200px; margin: 0 auto;
          padding: 0 24px;
          height: 62px;
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px;
        }

        /* ── Logo ── */
        .hdr-logo {
          display: inline-flex; align-items: center; gap: 9px;
          cursor: pointer; text-decoration: none; flex-shrink: 0;
        }
        .hdr-logo-icon {
          width: 34px; height: 34px; border-radius: 10px;
          background: linear-gradient(135deg, #0f172a, #1e293b);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(15,23,42,.2);
        }
        .hdr-logo-text {
          font-family: 'Sora', sans-serif;
          font-size: 17px; font-weight: 700; color: #0f172a;
          letter-spacing: -.02em;
        }
        .hdr-admin-badge {
          display: inline-flex; align-items: center;
          padding: 2px 9px; border-radius: 999px; font-size: 10px;
          font-weight: 700; letter-spacing: .06em; text-transform: uppercase;
          background: linear-gradient(135deg, #7c3aed, #6366f1);
          color: #fff; box-shadow: 0 2px 8px rgba(99,102,241,.35);
        }

        /* ── Nav right ── */
        .hdr-nav { display: flex; align-items: center; gap: 8px; }

        /* ── Pill nav buttons ── */
        .hdr-nav-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 16px; border-radius: 12px;
          font-size: 13px; font-weight: 600;
          cursor: pointer; border: 1.5px solid #e2e8f0;
          background: #fff; color: #475569;
          font-family: 'DM Sans', sans-serif; transition: all .2s;
          white-space: nowrap; text-decoration: none;
        }
        .hdr-nav-btn:hover { background: #f8fafc; border-color: #cbd5e1; color: #334155; }

        .hdr-nav-btn-primary {
          border: none; background: #0f172a; color: #fff;
          box-shadow: 0 2px 8px rgba(15,23,42,.2);
        }
        .hdr-nav-btn-primary:hover {
          background: #1e293b;
          box-shadow: 0 4px 14px rgba(15,23,42,.28);
          transform: translateY(-1px);
        }

        .hdr-nav-btn-ghost {
          border: 1.5px solid #e8edf4; background: transparent; color: #64748b;
        }
        .hdr-nav-btn-ghost:hover { background: #f8fafc; border-color: #cbd5e1; color: #0f172a; }

        /* ── Avatar trigger ── */
        .hdr-avatar-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 5px 12px 5px 5px; border-radius: 999px;
          border: 1.5px solid #e8edf4; background: #fff;
          cursor: pointer; transition: all .2s;
          box-shadow: 0 1px 3px rgba(0,0,0,.05);
        }
        .hdr-avatar-btn:hover { border-color: #cbd5e1; box-shadow: 0 2px 8px rgba(0,0,0,.08); }

        .hdr-avatar-ring {
          width: 30px; height: 30px; border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Sora', sans-serif; font-size: 12px;
          font-weight: 700; color: #fff; flex-shrink: 0;
        }
        .hdr-avatar-name {
          font-size: 13px; font-weight: 600; color: #0f172a;
          max-width: 100px; overflow: hidden; text-overflow: ellipsis;
          white-space: nowrap;
          font-family: 'DM Sans', sans-serif;
        }

        /* ── Dropdown overrides ── */
        .hdr-drop-header { padding: 14px 16px 10px; border-bottom: 1px solid #f1f5f9; }
        .hdr-drop-name  { font-family:'Sora',sans-serif; font-size:14px; font-weight:700; color:#0f172a; margin-bottom:2px; }
        .hdr-drop-email { font-size:12px; color:#94a3b8; margin-bottom:0; }
        .hdr-drop-role  { display:inline-flex; align-items:center; margin-top:6px; padding:2px 8px; border-radius:999px; font-size:10px; font-weight:700; letter-spacing:.05em; background:#f5f3ff; color:#7c3aed; border:1px solid #e9d5ff; }

        /* hide on mobile when not needed */
        @media(max-width: 640px){
          .hdr-hide-sm { display: none !important; }
        }
      `}</style>

      <header className="hdr">
        <div className="hdr-inner">

          {/* Logo */}
          <div
            className="text-xl font-bold text-blue-600 cursor-pointer flex items-center gap-2"
          >
            <Shield className="w-6 h-6 text-blue-600" />
            CivicTrack

            {isAdmin && (
              <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-purple-600 text-white rounded-full shadow">
                ADMIN
              </span>
            )}

          </div>

          {/* ── Navigation ── */}
          <div className="hdr-nav">
            {isLoggedIn ? (
              <>

                {/* My Issues — original condition: !isAdmin && isHomePage */}
                {!isAdmin && isHomePage && (
                  <button
                    className="hdr-nav-btn hdr-hide-sm"
                    onClick={() => navigate('/my-issues')}
                  >
                    <FileText size={14} /> My Issues
                  </button>
                )}

                {/* ── User Dropdown — original DropdownMenu fully preserved ── */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="hdr-avatar-btn">
                      <div className="hdr-avatar-ring">{initials}</div>
                      <span className="hdr-avatar-name hdr-hide-sm">{userName}</span>
                      <ChevronDown size={13} color="#94a3b8" />
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    className="w-60 rounded-2xl border border-[#e8edf4] shadow-xl p-0 overflow-hidden"
                    align="end"
                    forceMount
                  >
                    {/* User info header */}
                    <div className="hdr-drop-header">
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div className="hdr-avatar-ring" style={{ width:38, height:38, fontSize:15 }}>{initials}</div>
                        <div>
                          <p className="hdr-drop-name">{userName}</p>
                          <p className="hdr-drop-email">{userName ? `${userName}@example.com` : ''}</p>
                          {/* original isAdmin condition */}
                          {isAdmin && <span className="hdr-drop-role">Administrator</span>}
                        </div>
                      </div>
                    </div>

                    <div style={{ padding:'6px' }}>
                      {/* Report Issue for mobile — original condition */}
                      {isHomePage && (
                        <DropdownMenuItem
                          onClick={() => navigate('/report')}
                          className="rounded-xl text-[13px] font-medium px-3 py-2.5 md:hidden"
                        >
                          <AlertCircle className="mr-2 h-4 w-4" />
                          <span>Report Issue</span>
                        </DropdownMenuItem>
                      )}

                      {/* Profile — original condition */}
                      {!isProfilePage && (
                        <DropdownMenuItem
                          onClick={() => navigate('/profile')}
                          className="rounded-xl text-[13px] font-medium px-3 py-2.5"
                        >
                          <User className="mr-2 h-4 w-4" />
                          <span>Profile</span>
                        </DropdownMenuItem>
                      )}

                      {/* Security — original condition */}
                      {!isProfilePage && (
                        <DropdownMenuItem
                          onClick={() => navigate('/profile?tab=security')}
                          className="rounded-xl text-[13px] font-medium px-3 py-2.5"
                        >
                          <Shield className="mr-2 h-4 w-4" />
                          <span>Security</span>
                        </DropdownMenuItem>
                      )}

                      {/* Notifications — original condition */}
                      {!isProfilePage && (
                        <DropdownMenuItem
                          onClick={() => navigate('/profile?tab=notifications')}
                          className="rounded-xl text-[13px] font-medium px-3 py-2.5"
                        >
                          <Bell className="mr-2 h-4 w-4" />
                          <span>Notifications</span>
                        </DropdownMenuItem>
                      )}

                      {/* Privacy — original condition: !isAdmin && !isProfilePage */}
                      {!isAdmin && !isProfilePage && (
                        <DropdownMenuItem
                          onClick={() => navigate('/profile?tab=privacy')}
                          className="rounded-xl text-[13px] font-medium px-3 py-2.5"
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Privacy</span>
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuSeparator className="my-1 mx-1" />

                      {/* Logout — original handleLogout */}
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="rounded-xl text-[13px] font-medium px-3 py-2.5 text-red-600 focus:text-red-600 focus:bg-red-50"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                {/* Not logged in — original isAuthPage condition */}
                {!isAuthPage && (
                  <>
                    <button className="hdr-nav-btn hdr-nav-btn-ghost" onClick={() => navigate('/')}>
                      <Home size={14} /> Home
                    </button>
                    <button className="hdr-nav-btn hdr-nav-btn-primary" onClick={() => navigate('/login')}>
                      <User size={14} /> Login
                    </button>
                  </>
                )}
              </>
            )}
          </div>

        </div>
      </header>
    </>
  );
}