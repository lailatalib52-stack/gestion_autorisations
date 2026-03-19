import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { notifService } from '../../services/api.js';
import {
  LayoutDashboard, FileText, Users, Bell, User, LogOut,
  ClipboardList, Menu, X, ChevronRight, Settings,
} from 'lucide-react';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    notifService.nonLues()
      .then(res => setNotifCount(res.data.count))
      .catch(() => { });
    const interval = setInterval(() => {
      notifService.nonLues().then(res => setNotifCount(res.data.count)).catch(() => { });
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord', roles: ['employe', 'manager', 'admin'] },
    { to: '/demandes', icon: FileText, label: 'Mes Demandes', roles: ['employe'] },
    { to: '/demandes/nouvelle', icon: ClipboardList, label: 'Nouvelle Demande', roles: ['employe'] },
    { to: '/demandes', icon: FileText, label: 'Toutes les Demandes', roles: ['admin'] },
    { to: '/manager/demandes', icon: ClipboardList, label: 'Demandes à Traiter', roles: ['manager', 'admin'] },
    { to: '/admin/utilisateurs', icon: Users, label: 'Utilisateurs', roles: ['admin'] },
    { to: '/notifications', icon: Bell, label: 'Notifications', roles: ['employe', 'manager', 'admin'] },
    { to: '/profil', icon: User, label: 'Mon Profil', roles: ['employe', 'manager', 'admin'] },
  ].filter(item => item.roles.includes(user?.role));

  const roleLabel = { admin: 'Administrateur', manager: 'Manager', employe: 'Employé' };
  const roleColor = { admin: '#f59e0b', manager: '#3b82f6', employe: '#10b981' };

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: 'linear-gradient(135deg, #f59e0b, #f97316)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: 18, color: '#fff', flexShrink: 0,
            }}>GA</div>
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 14, lineHeight: 1.2 }}>Gestion</div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>Autorisations</div>
            </div>
          </div>
        </div>

        {/* User info */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: `linear-gradient(135deg, ${roleColor[user?.role]}33, ${roleColor[user?.role]}66)`,
              border: `1.5px solid ${roleColor[user?.role]}55`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: roleColor[user?.role], fontWeight: 700, fontSize: 14, flexShrink: 0,
            }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '1px 7px', borderRadius: 99, fontSize: 10, fontWeight: 700,
                background: `${roleColor[user?.role]}22`, color: roleColor[user?.role],
                marginTop: 2,
              }}>
                {roleLabel[user?.role]}
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '12px 12px', flex: 1, overflowY: 'auto' }}>
          {navItems.map(item => (
            <NavLink
              key={item.to + item.label}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10,
                color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                fontWeight: isActive ? 600 : 500,
                fontSize: 14, marginBottom: 2,
                transition: 'all 0.15s',
                textDecoration: 'none',
                position: 'relative',
              })}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 20, background: '#f59e0b', borderRadius: 2 }} />
                  )}
                  <item.icon size={17} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.label === 'Notifications' && notifCount > 0 && (
                    <span style={{ background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99, minWidth: 18, textAlign: 'center' }}>
                      {notifCount > 99 ? '99+' : notifCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={handleLogout}
            className="btn"
            style={{
              width: '100%', justifyContent: 'flex-start', gap: 10,
              color: 'rgba(255,255,255,0.5)', background: 'transparent',
              padding: '10px 12px', fontSize: 14, fontWeight: 500,
              borderRadius: 10,
            }}
          >
            <LogOut size={17} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        {/* Top header */}
        <header className="top-header">
          <button
            className="btn btn-ghost btn-icon"
            style={{ display: 'none' }}
            onClick={() => setSidebarOpen(true)}
            id="menu-toggle"
          >
            <Menu size={20} />
          </button>
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setSidebarOpen(true)}
            style={{ display: 'flex' }}
          >
            <Menu size={20} />
          </button>

          <div style={{ flex: 1 }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <NavLink to="/notifications" style={{ position: 'relative', padding: 8, borderRadius: 10, color: 'var(--gray-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-100)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Bell size={20} />
              {notifCount > 0 && (
                <span style={{ position: 'absolute', top: 4, right: 4, background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 700, padding: '1px 4px', borderRadius: 99, minWidth: 16, textAlign: 'center', lineHeight: '14px' }}>
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
            </NavLink>

            <NavLink to="/profil" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 10, transition: 'background 0.15s', color: 'var(--gray-700)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-100)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: `linear-gradient(135deg, ${roleColor[user?.role]}33, ${roleColor[user?.role]}66)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: roleColor[user?.role], fontWeight: 700, fontSize: 13,
              }}>
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{user?.name}</span>
            </NavLink>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
