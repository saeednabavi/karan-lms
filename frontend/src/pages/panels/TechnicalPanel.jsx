import { useEffect, useState } from 'react';
import {
  getAdminSummary,
  getAdminUsers,
  createAdminUser,
  getAdminCourses,
  createAdminCourse,
  getTechnicalSettings,
  updateTechnicalSettings,
  getTechnicalFiles,
  getTechnicalUploadInfo,
  getAuthRoles,
} from '../../api';
import { ROLE_LABELS } from '../../utils/roles';

export default function TechnicalPanel() {
  const [tab, setTab] = useState('settings');
  const [summary, setSummary] = useState(null);
  const [settings, setSettings] = useState({});
  const [files, setFiles] = useState([]);
  const [uploadInfo, setUploadInfo] = useState(null);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const [userForm, setUserForm] = useState({ first_name: '', last_name: '', email: '', password: '', role_id: '' });
  const [courseForm, setCourseForm] = useState({ title: '', slug: '', audience_type: 'all' });

  useEffect(() => {
    setLoading(true);
    const load = async () => {
      const [sum, rolesList] = await Promise.all([getAdminSummary(), getAuthRoles()]);
      setSummary(sum);
      setRoles(rolesList);
      if (tab === 'settings') {
        setSettings(await getTechnicalSettings());
        setUploadInfo(await getTechnicalUploadInfo());
      } else if (tab === 'files') setFiles(await getTechnicalFiles());
      else if (tab === 'users') setUsers(await getAdminUsers());
      else if (tab === 'courses') setCourses(await getAdminCourses());
      setLoading(false);
    };
    load().catch(() => setLoading(false));
  }, [tab]);

  const tabs = [['settings', 'تنظیمات'], ['files', 'فایل‌ها'], ['users', 'کاربران'], ['courses', 'دوره‌ها']];

  return (
    <main className="container py-4" style={{ minHeight: '75vh' }}>
      <h1 className="fw-bold mb-4">پنل فنی</h1>
      {message && <div className="alert alert-success">{message}</div>}

      <ul className="nav nav-tabs mb-4 flex-wrap">
        {tabs.map(([k, label]) => (
          <li key={k} className="nav-item">
            <button type="button" className={`nav-link ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{label}</button>
          </li>
        ))}
      </ul>

      {loading ? (
        <div className="card p-4 text-center">در حال بارگذاری...</div>
      ) : (
        <>
          {tab === 'settings' && (
            <div className="card p-4 shadow-sm">
              <form onSubmit={async (e) => {
                e.preventDefault();
                await updateTechnicalSettings(settings);
                setMessage('تنظیمات ذخیره شد');
              }}>
                {Object.entries(settings).map(([key, val]) => (
                  <div key={key} className="mb-3">
                    <label className="form-label">{key}</label>
                    <input className="form-control" value={val || ''} onChange={(e) => setSettings({ ...settings, [key]: e.target.value })} />
                  </div>
                ))}
                <button type="submit" className="btn btn-primary">ذخیره تنظیمات</button>
              </form>
              {uploadInfo && (
                <div className="mt-4 p-3 bg-light rounded">
                  <small>پوشه آپلود: {uploadInfo.upload_folder}</small><br />
                  <small>تعداد فایل: {uploadInfo.file_count} — حجم: {(uploadInfo.total_size_bytes / 1024).toFixed(1)} KB</small>
                </div>
              )}
            </div>
          )}

          {tab === 'files' && (
            <div className="card p-4 shadow-sm">
              <table className="table table-sm">
                <thead><tr><th>عنوان</th><th>نوع</th><th>دوره</th><th>حجم</th></tr></thead>
                <tbody>
                  {files.map((f) => (
                    <tr key={f.id}>
                      <td>{f.title}</td>
                      <td>{f.source_type}</td>
                      <td>{f.course || '-'}</td>
                      <td>{f.size_bytes ? `${(f.size_bytes / 1024).toFixed(1)} KB` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                  <div className="col-md-3"><input className="form-control" placeholder="نام" value={userForm.first_name} onChange={(e) => setUserForm({ ...userForm, first_name: e.target.value })} required /></div>
                  <div className="col-md-3"><input className="form-control" placeholder="نام خانوادگی" value={userForm.last_name} onChange={(e) => setUserForm({ ...userForm, last_name: e.target.value })} required /></div>
                  <div className="col-md-3"><input className="form-control" type="email" placeholder="ایمیل" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} required /></div>
                  <div className="col-md-3"><input className="form-control" type="password" placeholder="رمز" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} required minLength={8} /></div>
                  <div className="col-md-3">
                    <select className="form-select" value={userForm.role_id} onChange={(e) => setUserForm({ ...userForm, role_id: e.target.value })} required>
                      <option value="">نقش</option>
                      {roles.map((r) => <option key={r.id} value={r.id}>{ROLE_LABELS[r.name] || r.name}</option>)}
                    </select>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary btn-sm">ثبت کاربر</button>
              </form>
              <hr />
              <p className="text-muted small">کل کاربران: {summary?.users ?? users.length}</p>
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
              {courses.map((c) => <div key={c.id} className="py-1">{c.title}</div>)}
            </div>
          )}
        </>
      )}
    </main>
  );
}
