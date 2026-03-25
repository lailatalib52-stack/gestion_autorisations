import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { notifService } from '../../services/api.js';
import {
  LayoutDashboard, FileText, Users, Bell, User, LogOut,
  ClipboardList, Menu, History,
} from 'lucide-react';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifCount, setNotifCount] = useState(0);

  const updateCount = () => {
    notifService.nonLues()
      .then(res => setNotifCount(res.data.count))
      .catch(() => { });
  };

  useEffect(() => {
    updateCount();
    window.addEventListener('notifications-updated', updateCount);
    const interval = setInterval(updateCount, 30000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('notifications-updated', updateCount);
    };
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
    { to: '/manager/historique', icon: History, label: 'Historique', roles: ['manager', 'admin'] },
    { to: '/admin/utilisateurs', icon: Users, label: 'Utilisateurs', roles: ['manager', 'admin'] },
    { to: '/notifications', icon: Bell, label: 'Notifications', roles: ['employe', 'manager', 'admin'] },
    { to: '/profil', icon: User, label: 'Mon Profil', roles: ['employe', 'manager', 'admin'] },
  ].filter(item => item.roles.includes(user?.role));

  const roleLabel = { admin: 'Administrateur', manager: 'Manager', employe: 'Employé' };
  const roleColor = { admin: '#f59e0b', manager: '#3b82f6', employe: '#10b981' };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-inner">
            <div className="sidebar-logo-icon">GA</div>
            {!sidebarCollapsed && (
              <div>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: 14, lineHeight: 1.2 }}>Gestion</div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>Autorisations</div>
              </div>
            )}
          </div>
        </div>

        {/* User profile section in sidebar */}
        <div className="sidebar-user">
          <div className="sidebar-user-inner">
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: `linear-gradient(135deg, ${roleColor[user?.role]}33, ${roleColor[user?.role]}66)`,
              border: `1.5px solid ${roleColor[user?.role]}55`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: roleColor[user?.role], fontWeight: 700, fontSize: 14, flexShrink: 0,
            }}>
              {getInitials(user?.name)}
            </div>
            {!sidebarCollapsed && (
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
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ padding: '12px', flex: 1, overflowY: 'auto' }}>
          {navItems.map(item => (
            <NavLink
              key={item.to + item.label}
              to={item.to}
              className="nav-link"
              title={sidebarCollapsed ? item.label : ''}
            >
              {({ isActive }) => (
                <>
                  {isActive && !sidebarCollapsed && <div className="nav-link-indicator" />}
                  <item.icon size={18} />
                  {!sidebarCollapsed && <span style={{ flex: 1 }}>{item.label}</span>}
                  {!sidebarCollapsed && item.label === 'Notifications' && notifCount > 0 && (
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
            title={sidebarCollapsed ? 'Déconnexion' : ''}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', 
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              gap: sidebarCollapsed ? 0 : 10, color: 'rgba(255,255,255,0.5)', 
              background: 'transparent', padding: '10px 12px', fontSize: 14, 
              fontWeight: 500, borderRadius: 10, border: 'none', cursor: 'pointer'
            }}
          >
            <LogOut size={17} />
            {!sidebarCollapsed && 'Déconnexion'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`main-content ${sidebarCollapsed ? 'expanded' : ''}`}>
        <header className="top-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              <Menu size={20} />
            </button>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Dashboard</h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <NavLink to="/notifications" style={{ position: 'relative', padding: 8, borderRadius: 10, color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bell size={20} />
              {notifCount > 0 && (
                <span style={{ position: 'absolute', top: 4, right: 4, background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 700, padding: '1px 4px', borderRadius: 99, minWidth: 16, textAlign: 'center', lineHeight: '14px' }}>
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
            </NavLink>

            <NavLink to="/profil" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', borderRadius: 10, color: '#334155' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>{user?.name}</div>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'capitalize' }}>{user?.role}</div>
              </div>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: roleColor[user?.role] || '#4F46E5',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 800, fontSize: 13,
              }}>
                {getInitials(user?.name)}
              </div>
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