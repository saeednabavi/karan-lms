import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  createAdminArticle,
  deleteAdminArticle,
  getAdminArticles,
  getAdminSummary,
  updateAdminArticle,
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  getAuthRoles,
  getMe,
} from '../api';

const emptyArticleForm = {
  title: '',
  slug: '',
  excerpt: '',
  body: '',
  image_url: '',
};

const emptyUserForm = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  username: '',
  role_id: '',
  password: '',
};

const ROLE_NAMES = {
  Admin: 'مدیر',
  Technical: 'مسئول فنی',
  Student: 'دانش‌آموز',
  Parent: 'والدین',
  Teacher: 'مدرس',
};

export default function ManagerPanel() {
  const { user: currentUser, setUser } = useAuth();
  const [tab, setTab] = useState('articles'); // 'articles' | 'users'
  const [summary, setSummary] = useState(null);
  const [articles, setArticles] = useState([]);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [articleForm, setArticleForm] = useState(emptyArticleForm);
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [editingArticleId, setEditingArticleId] = useState(null);
  const [editingUserId, setEditingUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const isEditingArticle = useMemo(() => Boolean(editingArticleId), [editingArticleId]);
  const isEditingUser = useMemo(() => Boolean(editingUserId), [editingUserId]);
  const canCreateUser = currentUser?.role === 'Admin' || currentUser?.role === 'Technical';

  const loadSummary = async () => {
    try {
      const sum = await getAdminSummary();
      setSummary(sum);
    } catch {
      setSummary(null);
    }
  };

  const loadArticles = async () => {
    try {
      const rows = await getAdminArticles();
      setArticles(rows || []);
    } catch {
      setArticles([]);
    }
  };

  const loadUsers = async () => {
    try {
      const rows = await getAdminUsers();
      setUsers(rows || []);
    } catch {
      setUsers([]);
    }
  };

  const loadRoles = async () => {
    try {
      const list = await getAuthRoles();
      setRoles(list || []);
      if (list?.length && !userForm.role_id) setUserForm((f) => ({ ...f, role_id: String(list[0].id) }));
    } catch {
      setRoles([]);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      await loadSummary();
      if (tab === 'articles') {
        await loadArticles();
      } else {
        await Promise.all([loadUsers(), loadRoles()]);
      }
    } catch (err) {
      setError(err.message || 'خطا در دریافت اطلاعات پنل');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tab]);

  const resetArticleForm = () => {
    setArticleForm(emptyArticleForm);
    setEditingArticleId(null);
  };

  const resetUserForm = () => {
    setUserForm(emptyUserForm);
    setEditingUserId(null);
    if (roles.length) setUserForm((f) => ({ ...f, role_id: String(roles[0].id) }));
  };

  const handleArticleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      if (isEditingArticle) {
        await updateAdminArticle(editingArticleId, articleForm);
        setMessage('مطلب با موفقیت ویرایش شد.');
      } else {
        await createAdminArticle(articleForm);
        setMessage('مطلب جدید با موفقیت ثبت شد.');
      }
      resetArticleForm();
      await loadSummary();
      await loadArticles();
    } catch (err) {
      setError(err.message || 'خطا در ذخیره مطلب');
    } finally {
      setSaving(false);
    }
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const payload = {
        first_name: userForm.first_name.trim(),
        last_name: userForm.last_name.trim(),
        email: userForm.email.trim() || undefined,
        phone: userForm.phone.replace(/\D/g, '') || undefined,
        username: userForm.username.trim() || undefined,
        role_id: userForm.role_id ? Number(userForm.role_id) : undefined,
      };
      if (userForm.password.trim()) payload.password = userForm.password;
      if (isEditingUser) {
        await updateAdminUser(editingUserId, payload);
        setMessage('کاربر با موفقیت ویرایش شد.');
        if (editingUserId === currentUser?.id) {
          const meData = await getMe();
          setUser(meData);
        }
      } else {
        if (!userForm.password || userForm.password.length < 8) {
          setError('رمز عبور حداقل ۸ کاراکتر باشد.');
          setSaving(false);
          return;
        }
        payload.password = userForm.password;
        await createAdminUser(payload);
        setMessage('کاربر جدید با موفقیت ثبت شد.');
      }
      resetUserForm();
      await loadSummary();
      await loadUsers();
    } catch (err) {
      setError(err.message || 'خطا در ذخیره کاربر');
    } finally {
      setSaving(false);
    }
  };

  const startEditArticle = (article) => {
    setEditingArticleId(article.id);
    setArticleForm({
      title: article.title || '',
      slug: article.slug || '',
      excerpt: article.excerpt || '',
      body: article.body || '',
      image_url: article.image_url || '',
    });
    setMessage('');
    setError('');
  };

  const startEditUser = (u) => {
    setEditingUserId(u.id);
    setUserForm({
      first_name: u.first_name || '',
      last_name: u.last_name || '',
      email: u.email || '',
      phone: u.phone || '',
      username: u.username || '',
      role_id: u.role_id ? String(u.role_id) : roles[0]?.id ? String(roles[0].id) : '',
      password: '',
    });
    setMessage('');
    setError('');
  };

  const removeArticle = async (id) => {
    setError('');
    setMessage('');
    try {
      await deleteAdminArticle(id);
      setMessage('مطلب حذف شد.');
      if (editingArticleId === id) resetArticleForm();
      await loadSummary();
      await loadArticles();
    } catch (err) {
      setError(err.message || 'خطا در حذف مطلب');
    }
  };

  return (
    <main className="container py-4" style={{ minHeight: '75vh' }}>
      <h1 className="fw-bold mb-4">پنل مدیریت</h1>

      {error && <div className="alert alert-danger">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      <ul className="nav nav-tabs mb-4" role="tablist">
        <li className="nav-item" role="presentation">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'articles'}
            className={`nav-link ${tab === 'articles' ? 'active' : ''}`}
            onClick={() => setTab('articles')}
          >
            مطالب
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'users'}
            className={`nav-link ${tab === 'users' ? 'active' : ''}`}
            onClick={() => setTab('users')}
          >
            مدیریت کاربران
          </button>
        </li>
      </ul>

      {loading ? (
        <div className="card p-4 text-center">در حال بارگذاری...</div>
      ) : (
        <>
          <section className="row g-3 mb-4">
            <div className="col-6 col-md-3">
              <div className="card p-3 shadow-sm">
                <small className="text-muted">مطالب</small>
                <strong className="fs-4">{summary?.articles ?? 0}</strong>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card p-3 shadow-sm">
                <small className="text-muted">کاربران</small>
                <strong className="fs-4">{summary?.users ?? 0}</strong>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card p-3 shadow-sm">
                <small className="text-muted">دوره‌ها</small>
                <strong className="fs-4">{summary?.courses ?? 0}</strong>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card p-3 shadow-sm">
                <small className="text-muted">اساتید</small>
                <strong className="fs-4">{summary?.teachers ?? 0}</strong>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card p-3 shadow-sm">
                <small className="text-muted">آزمون‌ها</small>
                <strong className="fs-4">{summary?.exams ?? 0}</strong>
              </div>
            </div>
          </section>

          {tab === 'articles' && (
            <>
              <section className="card p-4 shadow-sm mb-4">
                <h5 className="fw-bold mb-3">{isEditingArticle ? 'ویرایش مطلب' : 'ثبت مطلب جدید'}</h5>
                <form onSubmit={handleArticleSubmit}>
                  <div className="row g-2">
                    <div className="col-md-6">
                      <input
                        className="form-control"
                        placeholder="عنوان"
                        value={articleForm.title}
                        onChange={(e) => setArticleForm((s) => ({ ...s, title: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <input
                        className="form-control"
                        placeholder="slug"
                        value={articleForm.slug}
                        onChange={(e) => setArticleForm((s) => ({ ...s, slug: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="col-12">
                      <input
                        className="form-control"
                        placeholder="خلاصه مطلب"
                        value={articleForm.excerpt}
                        onChange={(e) => setArticleForm((s) => ({ ...s, excerpt: e.target.value }))}
                      />
                    </div>
                    <div className="col-12">
                      <input
                        className="form-control"
                        placeholder="لینک تصویر (اختیاری)"
                        value={articleForm.image_url}
                        onChange={(e) => setArticleForm((s) => ({ ...s, image_url: e.target.value }))}
                      />
                    </div>
                    <div className="col-12">
                      <textarea
                        className="form-control"
                        placeholder="متن کامل مطلب"
                        rows={5}
                        value={articleForm.body}
                        onChange={(e) => setArticleForm((s) => ({ ...s, body: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div className="d-flex gap-2 mt-3">
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? 'در حال ذخیره...' : (isEditingArticle ? 'ذخیره تغییرات' : 'ثبت مطلب')}
                    </button>
                    {isEditingArticle && (
                      <button type="button" className="btn btn-outline-secondary" onClick={resetArticleForm}>
                        انصراف
                      </button>
                    )}
                  </div>
                </form>
              </section>
              <section className="card p-4 shadow-sm">
                <h5 className="fw-bold mb-3">لیست مطالب</h5>
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead>
                      <tr>
                        <th>عنوان</th>
                        <th>slug</th>
                        <th>خلاصه</th>
                        <th className="text-center">عملیات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {articles.map((a) => (
                        <tr key={a.id}>
                          <td>{a.title}</td>
                          <td><code>{a.slug}</code></td>
                          <td>{a.excerpt || '-'}</td>
                          <td className="text-center">
                            <button className="btn btn-sm btn-outline-primary me-2" onClick={() => startEditArticle(a)}>
                              ویرایش
                            </button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => removeArticle(a.id)}>
                              حذف
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {tab === 'users' && (
            <>
              <h5 className="fw-bold mb-3 text-primary">مدیریت کاربران</h5>
              <section className="card p-4 shadow-sm mb-4">
                <h6 className="fw-bold mb-3">
                  {isEditingUser ? 'ویرایش کاربر' : 'ثبت کاربر جدید'}
                  {isEditingUser && editingUserId === currentUser?.id && <span className="text-muted ms-2">(خودم)</span>}
                </h6>
                <form onSubmit={handleUserSubmit}>
                  <div className="row g-2">
                    <div className="col-md-6">
                      <input
                        className="form-control"
                        placeholder="نام"
                        value={userForm.first_name}
                        onChange={(e) => setUserForm((s) => ({ ...s, first_name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <input
                        className="form-control"
                        placeholder="نام خانوادگی"
                        value={userForm.last_name}
                        onChange={(e) => setUserForm((s) => ({ ...s, last_name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <input
                        type="email"
                        className="form-control"
                        placeholder="ایمیل"
                        value={userForm.email}
                        onChange={(e) => setUserForm((s) => ({ ...s, email: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-6">
                      <input
                        type="tel"
                        className="form-control"
                        placeholder="شماره تماس"
                        value={userForm.phone}
                        onChange={(e) => setUserForm((s) => ({ ...s, phone: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-6">
                      <input
                        className="form-control"
                        placeholder="نام کاربری (اختیاری)"
                        value={userForm.username}
                        onChange={(e) => setUserForm((s) => ({ ...s, username: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-6">
                      <select
                        className="form-select"
                        value={userForm.role_id}
                        onChange={(e) => setUserForm((s) => ({ ...s, role_id: e.target.value }))}
                      >
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>{ROLE_NAMES[r.name] || r.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <input
                        type="password"
                        className="form-control"
                        placeholder={isEditingUser ? 'رمز عبور (خالی = بدون تغییر)' : 'رمز عبور (حداقل ۸ کاراکتر)'}
                        value={userForm.password}
                        onChange={(e) => setUserForm((s) => ({ ...s, password: e.target.value }))}
                        required={!isEditingUser}
                        minLength={isEditingUser ? undefined : 8}
                      />
                    </div>
                  </div>
                  <div className="d-flex gap-2 mt-3">
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? 'در حال ذخیره...' : (isEditingUser ? 'ذخیره تغییرات' : 'ثبت کاربر')}
                    </button>
                    {isEditingUser && (
                      <button type="button" className="btn btn-outline-secondary" onClick={resetUserForm}>
                        انصراف
                      </button>
                    )}
                  </div>
                </form>
              </section>
              <section className="card p-4 shadow-sm">
                <h5 className="fw-bold mb-3">لیست کاربران</h5>
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead>
                      <tr>
                        <th>نام</th>
                        <th>ایمیل</th>
                        <th>شماره</th>
                        <th>نقش</th>
                        <th className="text-center">عملیات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id}>
                          <td>{u.full_name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || '-'}</td>
                          <td>{u.email || '-'}</td>
                          <td>{u.phone || '-'}</td>
                          <td>{ROLE_NAMES[u.role] || u.role}</td>
                          <td className="text-center">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => startEditUser(u)}
                            >
                              ویرایش
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </>
      )}
    </main>
  );
}