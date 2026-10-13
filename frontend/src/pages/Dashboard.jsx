import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPanelPath, normalizeRole } from '../utils/roles';

export default function Dashboard() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <main className="container py-5 text-center">در حال بارگذاری...</main>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const path = getPanelPath(normalizeRole(user?.role));
  return <Navigate to={path} replace />;
}
