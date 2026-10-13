import { useEffect, useState } from 'react';
import {
  getAdminSummary,
  getAdminReportsOverview,
  getAdminReportsEnrollments,
  getAdminReportsCourses,
  getAdminReportsUsers,
  getAdminArticles,
  createAdminArticle,
  updateAdminArticle,
  deleteAdminArticle,
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  getAdminCourses,
  createAdminCourse,
  deleteAdminCourse,
  getAdminExams,
  createAdminExam,
  getAuthRoles,
} from '../../api';
import { ROLE_LABELS } from '../../utils/roles';

const API_BASE = '/api/v1';

export default function AdminPanel() {
  const [tab, setTab] = useState('reports');
  const [summary, setSummary] = useState(null);
  const [overview, setOverview] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [courseReport, setCourseReport] = useState([]);
  const [userReport, setUserReport] = useState([]);
  const [articles, setArticles] = useState([]);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [exams, setExams] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [articleForm, setArticleForm] = useState({ title: '', slug: '', excerpt: '', body: '', image_url: '' });
  const [userForm, setUserForm] = useState({ first_name: '', last_name: '', email: '', role_id: '', password: '' });
  const [courseForm, setCourseForm] = useState({ title: '', slug: '', description: '', audience_type: 'all', price: 0, is_free: false });
  const [examForm, setExamForm] = useState({ title: '', slug: '', level: '', duration_minutes: 30, tag: 'school' });

  const load = async () => {
    setLoading(true);
    try {
      const [sum, ov, rolesList] = await Promise.all([
        getAdminSummary(),
        getAdminReportsOverview(),
        getAuthRoles(),
      ]);
      setSummary(sum);
      setOverview(ov);
      setRoles(rolesList);
      if (tab === 'reports') {
        const [enr, cr, ur] = await Promise.all([
          getAdminReportsEnrollments(),
          getAdminReportsCourses(),
          getAdminReportsUsers(),
        ]);
        setEnrollments(enr);
        setCourseReport(cr);
        setUserReport(ur);
      } else if (tab === 'articles') setArticles(await getAdminArticles());
      else if (tab === 'users') setUsers(await getAdminUsers());
      else if (tab === 'courses') setCourses(await getAdminCourses());
      else if (tab === 'exams') setExams(await getAdminExams());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [tab]);

  const downloadCsv = () => {
    const token = localStorage.getItem('access_token');
    window.open(`${API_BASE}/admin/reports/export/enrollments.csv`, '_blank');
    fetch(`${API_BASE}/admin/reports/export/enrollments.csv`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.blob()).then((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'enrollments.csv';
      a.click();
    });
  };

  const tabs = [
    ['reports', 'گزارش‌ها'],
    ['articles', 'مقالات'],
    ['users', 'کاربران'],
    ['courses', 'دوره‌ها'],
    ['exams', 'آزمون‌ها'],
  ];

  return (
    <main className="container py-4" style={{ minHeight: '75vh' }}>
      <h1 className="fw-bold mb-4">پنل مدیر</h1>
      {error && <div className="alert alert-danger">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      <ul className="nav nav-tabs mb-4 flex-wrap">
        {tabs.map(([k, label]) => (
          <li key={k} className="nav-item">
            <button type="button" className={`nav-link ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>
              {label}
            </button>
          </li>
        ))}
      </ul>

      {loading ? (
        <div className="card p-4 text-center">در حال بارگذاری...</div>
      ) : (
        <>
          <section className="row g-3 mb-4">
            {[
              ['کاربران', overview?.users ?? summary?.users],
              ['دوره‌ها', overview?.courses ?? summary?.courses],
              ['ثبت‌نام', overview?.enrollments ?? summary?.enrollments],
              ['ثبت‌نام ۳۰ روز', overview?.enrollments_30d],
            ].map(([label, val]) => (
              <div key={label} className="col-6 col-md-3">
                <div className="card p-3 shadow-sm">
                  <small className="text-muted">{label}</small>
                  <strong className="fs-4">{val ?? 0}</strong>
                </div>
              </div>
            ))}
          </section>

          {tab === 'reports' && (
            <>
              <div className="mb-3">
                <button type="button" className="btn btn-outline-success btn-sm" onClick={downloadCsv}>
                  دانلود CSV ثبت‌نام‌ها
                </button>
              </div>
              <div className="row g-3">
                <div className="col-lg-6">
                  <div className="card p-3 shadow-sm">
                    <h6 className="fw-bold">آخرین ثبت‌نام‌ها</h6>
                    <div className="table-responsive">
                      <table className="table table-sm">
                        <thead><tr><th>کاربر</th><th>دوره</th></tr></thead>
                        <tbody>
                          {enrollments.slice(0, 10).map((e) => (
                            <tr key={e.id}><td>{e.user}</td><td>{e.course}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="card p-3 shadow-sm">
                    <h6 className="fw-bold">محبوب‌ترین دوره‌ها</h6>
                    <ul className="list-group list-group-flush">
                      {courseReport.slice(0, 8).map((c) => (
                        <li key={c.id} className="list-group-item d-flex justify-content-between">
                          <span>{c.title}</span>
                          <span className="badge bg-primary">{c.enrollments} نفر</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}

          {tab === 'articles' && (
            <div className="card p-4 shadow-sm">
              <h6 className="fw-bold mb-3">ثبت مقاله</h6>
              <form onSubmit={async (e) => {
                e.preventDefault();
                await createAdminArticle(articleForm);
                setMessage('مقاله ثبت شد');
                setArticleForm({ title: '', slug: '', excerpt: '', body: '', image_url: '' });
                setArticles(await getAdminArticles());
              }}>
                <div className="row g-2 mb-3">
                  <div className="col-md-6"><input className="form-control" placeholder="عنوان" value={articleForm.title} onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })} required /></div>
                  <div className="col-md-6"><input className="form-control" placeholder="slug" value={articleForm.slug} onChange={(e) => setArticleForm({ ...articleForm, slug: e.target.value })} required /></div>
                  <div className="col-12"><textarea className="form-control" rows={4} placeholder="متن" value={articleForm.body} onChange={(e) => setArticleForm({ ...articleForm, body: e.target.value })} required /></div>
                </div>
                <button type="submit" className="btn btn-primary btn-sm">ثبت</button>
              </form>
              <hr />
              {articles.map((a) => (
                <div key={a.id} className="d-flex justify-content-between align-items-center border-bottom py-2">
                  <span>{a.title}</span>
                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={async () => { await deleteAdminArticle(a.id); setArticles(await getAdminArticles()); }}>حذف</button>
                </div>
              ))}
            </div>
          )}

          {tab === 'users' && (
            <div className="card p-4 shadow-sm">
              <form onSubmit={async (e) => {
                e.preventDefault();
                await createAdminUser({ ...userForm, role_id: Number(userForm.role_id) });
                setMessage('کاربر ایجاد شد');
                setUsers(await getAdminUsers());
              }}>
                <div className="row g-2 mb-3">
                  <div className="col-md-4"><input className="form-control" placeholder="نام" value={userForm.first_name} onChange={(e) => setUserForm({ ...userForm, first_name: e.target.value })} required /></div>
                  <div className="col-md-4"><input className="form-control" placeholder="نام خانوادگی" value={userForm.last_name} onChange={(e) => setUserForm({ ...userForm, last_name: e.target.value })} required /></div>
                  <div className="col-md-4"><input className="form-control" type="email" placeholder="ایمیل" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} required /></div>
                  <div className="col-md-4"><input className="form-control" type="password" placeholder="رمز" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} required minLength={8} /></div>
                  <div className="col-md-4">
                    <select className="form-select" value={userForm.role_id} onChange={(e) => setUserForm({ ...userForm, role_id: e.target.value })}>
                      <option value="">نقش</option>
                      {roles.map((r) => <option key={r.id} value={r.id}>{ROLE_LABELS[r.name] || r.name}</option>)}
                    </select>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary btn-sm">ثبت کاربر</button>
              </form>
              <hr />
              <table className="table table-sm">
                <thead><tr><th>نام</th><th>ایمیل</th><th>نقش</th></tr></thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}><td>{u.full_name}</td><td>{u.email}</td><td>{ROLE_LABELS[u.role] || u.role}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'courses' && (
            <div className="card p-4 shadow-sm">
              <form onSubmit={async (e) => {
                e.preventDefault();
                await createAdminCourse(courseForm);
                setMessage('دوره ایجاد شد');
                setCourses(await getAdminCourses());
              }}>
                <div className="row g-2 mb-3">
                  <div className="col-md-4"><input className="form-control" placeholder="عنوان" value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} required /></div>
                  <div className="col-md-4"><input className="form-control" placeholder="slug" value={courseForm.slug} onChange={(e) => setCourseForm({ ...courseForm, slug: e.target.value })} required /></div>
                  <div className="col-md-4">
                    <select className="form-select" value={courseForm.audience_type} onChange={(e) => setCourseForm({ ...courseForm, audience_type: e.target.value })}>
                      <option value="all">همه</option>
                      <option value="pupil">دانش‌آموز</option>
                      <option value="student">دانشجو</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary btn-sm">ثبت دوره</button>
              </form>
              <hr />
              {courses.map((c) => (
                <div key={c.id} className="d-flex justify-content-between py-2 border-bottom">
                  <span>{c.title} <small className="text-muted">({c.audience_type})</small></span>
                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={async () => { await deleteAdminCourse(c.id); setCourses(await getAdminCourses()); }}>حذف</button>
                </div>
              ))}
            </div>
          )}

          {tab === 'exams' && (
            <div className="card p-4 shadow-sm">
              <form onSubmit={async (e) => {
                e.preventDefault();
                await createAdminExam(examForm);
                setMessage('آزمون ایجاد شد');
                setExams(await getAdminExams());
              }}>
                <div className="row g-2 mb-3">
                  <div className="col-md-4"><input className="form-control" placeholder="عنوان" value={examForm.title} onChange={(e) => setExamForm({ ...examForm, title: e.target.value })} required /></div>
                  <div className="col-md-4"><input className="form-control" placeholder="slug" value={examForm.slug} onChange={(e) => setExamForm({ ...examForm, slug: e.target.value })} required /></div>
                  <div className="col-md-4"><input className="form-control" placeholder="سطح" value={examForm.level} onChange={(e) => setExamForm({ ...examForm, level: e.target.value })} /></div>
                </div>
                <button type="submit" className="btn btn-primary btn-sm">ثبت آزمون</button>
              </form>
              <hr />
              {exams.map((ex) => (
                <div key={ex.id} className="py-2 border-bottom">{ex.title}</div>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
