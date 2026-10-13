import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPanelPath, normalizeRole, isStaffRole, isTeacherRole } from '../utils/roles';

export default function Header() {
  const loc = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const role = normalizeRole(user?.role);
  const panelPath = user ? getPanelPath(role) : null;
  const isActive = (path) => loc.pathname === path || (path !== '/' && loc.pathname.startsWith(path));

  const panelLabel = {
    Admin: 'پنل مدیر',
    Technical: 'پنل فنی',
    Teacher: 'پنل استاد',
    Pupil: 'پنل دانش‌آموز',
    Student: 'پنل دانشجو',
    Parent: 'پنل والدین',
  }[role] || 'داشبورد';

  return (
    <header className="sticky-top">
      <nav className="navbar navbar-expand-lg navbar-light bg-white z-3 shadow-sm">
        <div className="container-fluid pt-1">
          <Link className="navbar-brand fw-bold text-primary" to="/">کران بالا</Link>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon" />
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/courses') ? 'active ac_under' : ''}`} to="/courses">دوره آموزشی</Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/exams') ? 'active ac_under' : ''}`} to="/exams">آزمون‌ها</Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/teachers') ? 'active ac_under' : ''}`} to="/teachers">اساتید</Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/articles') ? 'active ac_under' : ''}`} to="/articles">مقالات</Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/about') ? 'active ac_under' : ''}`} to="/about">درباره ما</Link>
              </li>
              {isAuthenticated && panelPath && (isStaffRole(role) || isTeacherRole(role) || ['Pupil', 'Student', 'Parent'].includes(role)) ? (
                <li className="nav-item">
                  <Link className={`nav-link ${isActive('/panel') ? 'active ac_under' : ''}`} to={panelPath}>{panelLabel}</Link>
                </li>
              ) : null}
            </ul>
            <div className="d-flex align-items-center gap-2">
              {isAuthenticated ? (
                <>
                  <Link to={panelPath || '/dashboard'} className="btn btn-outline-primary me-2">داشبورد</Link>
                  <span className="small text-muted d-none d-lg-inline">{user?.full_name || user?.email}</span>
                  <button type="button" className="btn btn-info" onClick={logout}>خروج</button>
                </>
              ) : (
                <Link to="/login" className="btn btn-info">ورود/عضویت</Link>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
