import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { normalizeRole } from '../utils/roles';

const ROLE_ALIASES = {
  SuperAdmin: 'Admin',
  ContentManager: 'Technical',
  Instructor: 'Teacher',
};

export default function RoleRoute({ children, roles = [] }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <div className="container py-5 text-center">در حال بارگذاری...</div>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const userRole = normalizeRole(user?.role);
  const allowed = roles.map((r) => ROLE_ALIASES[r] || r);
  if (userRole === 'Admin') allowed.push('Admin');

  if (!allowed.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
