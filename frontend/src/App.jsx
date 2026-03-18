import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardLayout from './components/shared/DashboardLayout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import MesDemandes from './pages/MesDemandes.jsx';
import NouvelleDemande from './pages/NouvelleDemande.jsx';
import DetailDemande from './pages/DetailDemande.jsx';
import DemandesManager from './pages/DemandesManager.jsx';
import GestionUtilisateurs from './pages/GestionUtilisateurs.jsx';
import Notifications from './pages/Notifications.jsx';
import Profil from './pages/Profil.jsx';

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh'}}><div className="spinner" style={{width:36,height:36,borderWidth:3,color:'var(--primary)'}} /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />

      <Route path="/" element={
        <PrivateRoute>
          <DashboardLayout />
        </PrivateRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="demandes" element={<MesDemandes />} />
        <Route path="demandes/nouvelle" element={
          <PrivateRoute roles={['employe']}>
            <NouvelleDemande />
          </PrivateRoute>
        } />
        <Route path="demandes/:id" element={<DetailDemande />} />
        <Route path="demandes/:id/modifier" element={
          <PrivateRoute roles={['employe']}>
            <NouvelleDemande editMode />
          </PrivateRoute>
        } />
        <Route path="manager/demandes" element={
          <PrivateRoute roles={['manager', 'admin']}>
            <DemandesManager />
          </PrivateRoute>
        } />
        <Route path="admin/utilisateurs" element={
          <PrivateRoute roles={['admin']}>
            <GestionUtilisateurs />
          </PrivateRoute>
        } />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profil" element={<Profil />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
